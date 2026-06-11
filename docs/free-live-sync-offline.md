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
DEFAULT_APPS_SCRIPT_SYNC_TOKEN = "same-long-random-secret"
DEFAULT_WORLD_CUP_ESPN_DATES = ""
```

Replace the deployment URL and token with your real values. Leave `DEFAULT_WORLD_CUP_ESPN_DATES` blank to use today's UTC date automatically, or set it to a specific `YYYYMMDD` date if you need to backfill/test one matchday. Environment variables with the same names still override the script defaults if you use them later.

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

## Cron Wrapper

Create `scripts/run_worldcup_free_sync.sh`:

```bash
#!/bin/zsh
cd "/Users/avi/Documents/World Cup 2026" || exit 1

/usr/bin/python3 scripts/sync_worldcup_free.py >> logs/worldcup-free-sync.log 2>&1
```

Then:

```bash
chmod +x "scripts/run_worldcup_free_sync.sh"
crontab -e
```

Add:

```cron
* * * * * /Users/avi/Documents/World\ Cup\ 2026/scripts/run_worldcup_free_sync.sh
```

Run cron only during active match windows.

## Files That Matter

- `scripts/sync_worldcup_free.py`: free polling, local cache, hash check, Apps Script POST.
- `.worldcup-free-sync-state.json`: local match history and last posted hash.
- `.worldcup-free-sync.lock`: prevents overlapping minute runs.
- `apps-script/api.js`: receives the POST, preserves manual overrides, rebuilds scoring.
- `logs/worldcup-free-sync.log`: local cron output.

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
