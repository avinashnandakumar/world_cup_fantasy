# Free Live Match Sync Offline Runbook

Use this when you want your Mac to poll free match data and update Google Sheets only when data changed.

## Flow

```text
Mac cron or launchd
  -> scripts/sync_worldcup_free.py
  -> ESPN public scoreboard JSON
  -> Apps Script Web App doPost
  -> Matches + MatchEvents
  -> ScoringLedger + Standings
  -> website snapshot/dashboard
```

The Python script keeps a local state file, hashes the normalized full payload, and skips Google Sheets if the hash is unchanged.

## One-Time Apps Script Setup

1. Copy the repo's `apps-script` files into the bound Apps Script project for your Google Sheet.
2. Deploy as a Web App:
   - Execute as: **Me**
   - Who has access: **Anyone with the link**
3. Copy the Web App URL.
4. In Apps Script, set Script Property:

```text
EXTERNAL_SYNC_TOKEN = a-long-random-secret
```

## Local Setup

From `/Users/avi/Documents/World Cup 2026`:

```bash
python3 -m py_compile scripts/sync_worldcup_free.py
mkdir -p logs
```

Edit the self-contained config block near the top of `scripts/sync_worldcup_free.py`:

```python
DEFAULT_APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/DEPLOYMENT_ID/exec"
DEFAULT_APPS_SCRIPT_WEBAPP_URL_2 = ""
DEFAULT_APPS_SCRIPT_SYNC_TOKEN = "same-long-random-secret"
DEFAULT_APPS_SCRIPT_SYNC_TOKEN_2 = ""
DEFAULT_WORLD_CUP_ESPN_DATES = ""
```

Replace the deployment URL and token with your real values. If you run two leagues, paste the second Apps Script Web App URL into `DEFAULT_APPS_SCRIPT_WEBAPP_URL_2`. Leave `DEFAULT_APPS_SCRIPT_SYNC_TOKEN_2` blank if both Apps Script projects use the same token, or set it if the second Sheet has a different `EXTERNAL_SYNC_TOKEN`.

Leave `DEFAULT_WORLD_CUP_ESPN_DATES` blank to use today's local Mac date automatically, or set it to a specific `YYYYMMDD` date if you need to backfill/test one matchday. Environment variables with the same names still override the script defaults if you use them later.

Each run prints:

- ESPN fetch date.
- Local timestamp and UTC timestamp.
- Number of configured Google Sheet destinations.
- Whether each destination has new data to post or is already current.
- `No new data to post` when the normalized match/event payload did not change.
- A short list of new/changed matches or events before posting to Google Sheets.

Timestamp-only changes are ignored for hashing, so `lastUpdatedUtc` will not cause a post by itself.

Each Google Sheet destination tracks its own last-posted hash inside `.worldcup-free-sync-state.json`. That means one league can post while another skips, and a failure in one destination does not force already-updated destinations to post again on the next run.

Optional environment-variable format for two leagues:

```bash
export APPS_SCRIPT_WEBAPP_URLS="https://script.google.com/macros/s/FIRST/exec,https://script.google.com/macros/s/SECOND/exec"
export APPS_SCRIPT_SYNC_TOKENS="first-token,second-token"
```

## Test Commands

Dry run, no Google write:

```bash
python3 scripts/sync_worldcup_free.py --dry-run
```

Force one Google Sheets post:

```bash
python3 scripts/sync_worldcup_free.py --force
```

Normal run:

```bash
python3 scripts/sync_worldcup_free.py
```

If nothing changed, it exits with `No data change` and does not call Apps Script.
Normal runs fetch the current date only, but Apps Script merges that payload into the existing `Matches` and `MatchEvents` tabs. Previously loaded future scheduled matches and historical completed matches should remain in the sheet.

When a match is live, scoring updates from the current score: goals scored, goals allowed, and detected red cards count immediately. Win, draw, and clean-sheet points wait until the match is final.

Red-card scraping from ESPN summary details is enabled during regular runs because red cards are part of scoring. The detector only accepts event-like red-card entries with an id and minute/clock, but this is still free scraped data. If ESPN returns a false positive, remove that row from `MatchEvents` manually. Use `--no-fetch-details` only as a temporary troubleshooting option.

Audit Google Sheets against the normalized payload:

```bash
python3 scripts/sync_worldcup_free.py --verify-sheets --dry-run
```

Default verification is tolerant of extra rows already in Google Sheets, such as future scheduled matches not present in a today-only payload. It only flags rows that the current normalized payload expects but the sheet is missing or has changed.

Repair any sheet mismatch by posting the normalized payload to only destinations with mismatches:

```bash
python3 scripts/sync_worldcup_free.py --verify-sheets
```

Use strict verification only for full payload audits where extra sheet rows should be treated as mismatches:

```bash
python3 scripts/sync_worldcup_free.py --fetch-all-matches --dates 20260611 --verify-sheets --strict-verify-sheets --dry-run
```

This mode fetches the Apps Script `matches` and `events` endpoints for every configured league. It requires the Apps Script project to include the `endpoint=events` handler.

One-time fixture preload, from today's local date through the end of the group stage:

```bash
python3 scripts/sync_worldcup_free.py --fetch-all-matches --no-fetch-details
```

Use `--force` if you want to post the full known schedule even when a destination already has the same hash:

```bash
python3 scripts/sync_worldcup_free.py --fetch-all-matches --no-fetch-details --force
```

By default the end date is `20260627`. Override it if needed:

```bash
python3 scripts/sync_worldcup_free.py --fetch-all-matches --tournament-end-date 20260719 --no-fetch-details
```

Run the same command again later with a later `--tournament-end-date` once knockout teams are known. If you do fetch future knockout games early, ESPN may return placeholder teams such as `group-a-2nd-place`; later sync runs should overwrite those match rows with real country IDs once the tournament bracket is known.

## Cron Wrapper

Use the embedded-schedule gate as the cron target. Cron can run every minute
for the whole tournament; `scripts/run_worldcup_live_sync.py` only invokes the
real sync script when a match is in its expected live window.

The embedded schedule includes all 72 group-stage matches and the 32 knockout
kickoff slots currently exposed by ESPN. Knockout participants are placeholders
until the bracket is known, but the local poll windows already work because they
only need kickoff times.

The wrapper starts polling at kickoff. It treats group-stage matches as normally
live for 150 minutes and knockout matches as normally live for 240 minutes, but
it does not stop just because that expected window elapsed. After each sync, it
reads `.worldcup-free-sync-state.json` and keeps polling the match every minute
until the synced match row has `status=final`.

As a guardrail, a match that never reaches final stops polling after 720 minutes
by default. Use `--max-poll-minutes=0` if you want the wrapper to poll
indefinitely until final.

Smoke test the gate without posting:

```bash
python3 scripts/run_worldcup_live_sync.py --dry-run --now 2026-06-18T19:15:00Z
python3 scripts/run_worldcup_live_sync.py --dry-run --now 2026-06-18T03:00:00Z
```

Then:

```bash
chmod +x scripts/run_worldcup_live_sync.py
mkdir -p logs
crontab -e
```

Add:

```cron
* * * * * cd /Users/avi/Documents/projects/world_cup_fantasy && /usr/bin/python3 scripts/run_worldcup_live_sync.py >> logs/worldcup-live-sync.log 2>&1
```

Optional: pass sync flags through the gate by repeating `--sync-arg`. For
example, this keeps the gate but disables ESPN summary detail calls:

```cron
* * * * * cd /Users/avi/Documents/projects/world_cup_fantasy && /usr/bin/python3 scripts/run_worldcup_live_sync.py --sync-arg=--no-fetch-details >> logs/worldcup-live-sync.log 2>&1
```

## Local Status Dashboard

For a quick sanity check from the terminal:

```bash
python3 scripts/worldcup_sync_status.py
```

To generate a tiny auto-refreshing HTML dashboard:

```bash
python3 scripts/worldcup_sync_status.py --html logs/worldcup-sync-status.html
```

Open `logs/worldcup-sync-status.html` in a browser. It shows the last real sync,
last posted change, last no-new-data result, known match/event counts, current
poll windows, recent changes, and recent errors or sheet mismatches.

To keep that HTML dashboard fresh from cron, append the status generation after
the live sync command:

```cron
* * * * * cd /Users/avi/Documents/projects/world_cup_fantasy && /usr/bin/python3 scripts/run_worldcup_live_sync.py --sync-arg=--verify-sheets >> logs/worldcup-live-sync.log 2>&1; /usr/bin/python3 scripts/worldcup_sync_status.py --html logs/worldcup-sync-status.html >/dev/null 2>&1
```

## Files That Matter

- `scripts/sync_worldcup_free.py`: free polling, local cache, hash check, Apps Script POST.
- `.worldcup-free-sync-state.json`: local match history and last posted hash.
- `.worldcup-free-sync.lock`: prevents overlapping minute runs.
- `apps-script/api.js`: receives the POST, preserves manual overrides, rebuilds scoring.
- `logs/worldcup-free-sync.log`: local cron output.
- `scripts/worldcup_sync_status.py`: local terminal/HTML dashboard for sync sanity checks.

## Important Notes

- Scores/status are free-source best effort.
- Red cards are best effort from ESPN summary data; manually add/fix `MatchEvents` rows with `source=manual` if needed.
- Do not delete `.worldcup-free-sync-state.json` during the tournament unless you want to rebuild cached match history.
- Apps Script preserves `Matches.manualOverride=TRUE` and manual `MatchEvents`.

## Common Error

If the Python script says:

```text
Script function not found: doPost
```

Your deployed Apps Script Web App does not include the repo's `apps-script/api.js` code yet, or the Web App was not redeployed after adding it.

Fix:

1. Open the Apps Script project bound to your Google Sheet.
2. Make sure the code from `apps-script/api.js` is copied into the project.
3. Confirm the project contains a top-level `function doPost(event)`.
4. Deploy a new Web App version.
5. Confirm the script URL in `DEFAULT_APPS_SCRIPT_WEBAPP_URL` is the latest `/exec` URL.

If the Python script says:

```text
Invalid external sync token.
```

The token in `DEFAULT_APPS_SCRIPT_SYNC_TOKEN` does not match the Apps Script backend.

Fix:

1. In Apps Script, open **Project Settings > Script Properties**.
2. Set `EXTERNAL_SYNC_TOKEN` to the exact same value as `DEFAULT_APPS_SCRIPT_SYNC_TOKEN`.
3. If you do not use Script Properties, set `externalSyncToken` in the Google Sheet `Settings` tab instead.
4. Prefer Script Properties because they are less visible while screen sharing.
