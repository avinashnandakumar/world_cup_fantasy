# Offline Backend Setup Guide

This guide walks through setting up the Google Sheets + Google Apps Script backend for the World Cup Fantasy dashboard without needing to come back to Codex.

## What You Are Setting Up

The final data flow is:

```text
Google Sheet
  -> bound Google Apps Script backend
  -> Apps Script Web App JSON endpoint
  -> GitHub Pages frontend
```

GitHub Pages hosts the website. Google Sheets stores league data. Apps Script reads the sheet, calculates scoring, and publishes JSON for the site.

## Repo Files You Need

Frontend files used by GitHub Pages:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `assets/`
- `sample-data/`

Apps Script files to copy into Google Apps Script:

- `apps-script/Code.js`
- `apps-script/constants.js`
- `apps-script/sheets.js`
- `apps-script/scoring.js`
- `apps-script/snapshot.js`
- `apps-script/simulation.js`
- `apps-script/api.js`

Reference docs:

- `WorldCupScoringFormat.md`
- `schemas/google-sheets-schema.md`
- `schemas/json-contracts.md`
- `docs/testing-correctness.md`

## Part 1: Publish The Frontend On GitHub Pages

1. Commit and push the repo to GitHub.
2. In GitHub, open the repository.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, choose:
   - **Source:** Deploy from a branch
   - **Branch:** your main branch
   - **Folder:** `/root`
5. Save.
6. Wait for GitHub Pages to deploy.
7. Open the GitHub Pages URL.
8. Before backend setup, the page should show simulated sample data.

The root `index.html` is the production landing page. The older prototype versions remain in `design-concepts/` only for reference.

## Part 2: Create The Google Sheet

1. Go to Google Drive.
2. Create a new Google Sheet.
3. Name it something like:

```text
World Cup Fantasy League Backend
```

4. Do not manually create tabs yet. Apps Script will create them.
5. Keep the sheet open.

## Part 3: Create The Bound Apps Script Project

1. In the Google Sheet, click **Extensions > Apps Script**.
2. Rename the Apps Script project:

```text
World Cup Fantasy Backend
```

3. Apps Script starts with a default `Code.gs` file.
4. Replace `Code.gs` with the contents of:

```text
apps-script/Code.js
```

5. Create additional script files using the **+** button next to **Files**.
6. For each repo file, create a matching Apps Script file:

| Apps Script File Name | Copy From Repo |
| --- | --- |
| `constants.gs` | `apps-script/constants.js` |
| `sheets.gs` | `apps-script/sheets.js` |
| `scoring.gs` | `apps-script/scoring.js` |
| `snapshot.gs` | `apps-script/snapshot.js` |
| `simulation.gs` | `apps-script/simulation.js` |
| `api.gs` | `apps-script/api.js` |

Apps Script accepts `.gs` files. The repo uses `.js` so they are easier to inspect locally.

7. Save the Apps Script project.

## Part 4: Authorize And Create Sheet Tabs

1. In Apps Script, select the function:

```text
setupSheets
```

2. Click **Run**.
3. Google will ask for authorization.
4. Choose your Google account.
5. If you see an unverified app warning:
   - Click **Advanced**.
   - Click **Go to World Cup Fantasy Backend**.
6. Approve the requested permissions.
7. Return to the Google Sheet.
8. Confirm these tabs now exist:

```text
Settings
Managers
Rosters
Teams
Matches
MatchEvents
ScoringLedger
Standings
SyncLog
```

## Part 5: Load Simulation Data

Use simulation mode first. This proves the whole pipeline works before real World Cup API data exists.

1. Reload the Google Sheet browser tab.
2. You should see a top menu called:

```text
World Cup Fantasy
```

3. Click **World Cup Fantasy > Load simulation data**.
4. Click **World Cup Fantasy > Rebuild scoring outputs**.
5. Open the `Standings` tab.
6. Confirm rows appeared with ranks, managers, and total points.
7. Open the `ScoringLedger` tab.
8. Confirm detailed point rows appeared.
9. Open the `SyncLog` tab.
10. Confirm setup/rebuild log rows appeared.

## Part 6: Test The Snapshot Endpoint Inside Apps Script

1. In Apps Script, select:

```text
getSnapshotObject
```

2. Click **Run**.
3. Open **Executions** in the left sidebar.
4. Confirm the run completed without errors.

If this fails, check:

- Did all Apps Script files get copied?
- Did you save the project?
- Did `setupSheets` run successfully?
- Did `Load simulation data` run successfully?

## Part 7: Deploy Apps Script As A Web App

1. In Apps Script, click **Deploy > New deployment**.
2. Click the gear icon and choose:

```text
Web app
```

3. Set:

```text
Description: Initial dashboard JSON endpoint
Execute as: Me
Who has access: Anyone
```

4. Click **Deploy**.
5. Approve permissions if prompted.
6. Copy the Web App URL.

It will look similar to:

```text
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

7. Test it in a browser by opening:

```text
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?endpoint=snapshot
```

8. You should see JSON text.

## Part 8: Connect GitHub Pages To Apps Script

1. Open `config.js` in the repo.
2. Replace:

```js
snapshotUrl: null
```

with:

```js
snapshotUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?endpoint=snapshot"
```

3. Save the file.
4. Commit and push the change.
5. Wait for GitHub Pages to redeploy.
6. Open the GitHub Pages site.
7. Confirm the page still loads standings.

If the page breaks after adding the Apps Script URL:

1. Open the Apps Script URL directly in your browser.
2. Confirm JSON appears.
3. Check that the deployment access is **Anyone**.
4. Redeploy Apps Script after any code changes.
5. Temporarily set `snapshotUrl: null` to fall back to local sample data.

## Part 9: Recommended Pre-Tournament Test Routine

Run this before trusting the site for the real tournament.

1. In Google Sheets, click **World Cup Fantasy > Load simulation data**.
2. Click **World Cup Fantasy > Rebuild scoring outputs**.
3. Open `Standings`.
4. Confirm all managers have totals.
5. Open `ScoringLedger`.
6. Pick one manager and manually sum their rows.
7. Confirm the sum matches `Standings.totalPoints`.
8. Open the Apps Script snapshot URL.
9. Search the JSON for the same manager.
10. Confirm the total matches the sheet.
11. Open the GitHub Pages site.
12. Confirm the same total appears on the page.

Expected chain:

```text
ScoringLedger total = Standings total = Apps Script JSON total = Website total
```

## Part 10: Editing Real League Data

When you are ready to enter the real league:

### Managers Tab

Each row is one fantasy player.

Required columns:

```text
managerId
displayName
color
icon
active
```

Example:

```text
avi
Avi
blue
star
TRUE
```

Use simple lowercase IDs with no spaces.

### Teams Tab

Each row is one World Cup country.

Required columns:

```text
teamId
countryName
group
flagEmoji
status
qualifiedForKnockouts
wonGroup
isChampion
```

Example:

```text
argentina
Argentina
A
🇦🇷
scheduled
FALSE
FALSE
FALSE
```

### Rosters Tab

Each row assigns one country to one fantasy player.

Required columns:

```text
managerId
teamId
draftSlot
notes
```

Example:

```text
avi
argentina
1
Round 1 pick
```

### Matches Tab

Each row is one match.

Required columns:

```text
matchId
stage
group
homeTeamId
awayTeamId
homeScore
awayScore
status
winnerTeamId
decidedByPens
kickoffUtc
lastUpdatedUtc
manualOverride
```

Use `status = final` for completed matches.

Use regulation/extra-time goals only. Penalty shootout goals should not be added to `homeScore` or `awayScore`.

### MatchEvents Tab

Each row is a scoring event like a red card.

Required columns:

```text
eventId
matchId
teamId
eventType
minute
count
notes
source
```

Supported event types currently:

```text
goal
red_card
```

Goals can usually be inferred from `Matches.homeScore` and `Matches.awayScore`, so red cards are the most important manual event rows.

## Part 11: Scoring Rules Implemented

Current scoring:

| Event | Points |
| --- | ---: |
| Win | +1 |
| Group-stage draw | +0.5 |
| Goal scored | +0.5 |
| Goal allowed | -0.25 |
| Clean sheet | +0.5 |
| Red card | -1 |
| Qualify for knockouts | +0.5 |
| Win group | +1 |
| Win World Cup | +2 |

No knockout advancement bonus.

Penalty shootout goals do not count as goals scored.

## Part 12: Minute Trigger

The Apps Script code includes a 1-minute trigger, but the real API sync is still stubbed until you choose a real World Cup API provider.

To install the trigger:

1. Open the Google Sheet.
2. Click **World Cup Fantasy > Install minute trigger**.
3. Open Apps Script.
4. Click **Triggers** in the left sidebar.
5. Confirm `syncFromConfiguredSource` appears.

In simulation mode, this trigger only rebuilds scoring outputs.

Real API provider work still needs to be added later inside:

```text
apps-script/api.js
```

## Part 13: Deployment Checklist

Before tournament day:

- GitHub Pages opens successfully.
- `config.js` points to Apps Script snapshot URL.
- Apps Script Web App URL returns JSON.
- Google Sheet has real managers.
- Google Sheet has real teams.
- Google Sheet has real rosters.
- Simulation test passes end-to-end.
- Manual scoring spot-check matches the website.
- You know how to set `snapshotUrl: null` if you need to fall back to sample data.

## Troubleshooting

### Website shows sample data

Check `config.js`. If `snapshotUrl` is `null`, the site intentionally uses sample data.

### Website is blank

Open browser dev tools and check for:

- Bad `config.js` syntax.
- Apps Script URL typo.
- Apps Script deployment not public.
- Apps Script JSON error.

### Apps Script menu does not appear

Reload the Google Sheet. If it still does not appear, confirm `onOpen` exists in `Code.gs`.

### Standings are wrong

1. Rebuild scoring outputs.
2. Check `ScoringLedger`.
3. Check `Rosters`.
4. Check team IDs match exactly across `Teams`, `Rosters`, `Matches`, and `MatchEvents`.
5. Check penalty shootout goals were not included in match scores.

### A country has zero points unexpectedly

Check:

- The country exists in `Teams`.
- The manager-country assignment exists in `Rosters`.
- The `teamId` spelling matches across all tabs.
- The match status is `final`.
- The match winner is set correctly.

