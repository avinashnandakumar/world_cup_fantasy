# Google Apps Script Backend

This folder contains an Apps Script-compatible backend skeleton for the World Cup fantasy league.

It is designed to be copied into a Google Apps Script project that is attached to the league Google Sheet. No npm dependencies are required.

## Files

- `Code.js`: menu actions, scoring rebuild entrypoint, sync trigger setup, and future API sync entrypoint.
- `api.js`: fake API payload, provider normalization helpers, and fake API sync entrypoint.
- `constants.js`: scoring rules, sheet names, headers, stages, statuses, and default settings.
- `scoring.js`: pure scoring and standings functions.
- `sheets.js`: Google Sheets setup, table reads/writes, settings, and sync logging.
- `snapshot.js`: dashboard JSON snapshot builder and `doGet` web app endpoint.
- `simulation.js`: simulated league data loader and self-check helper.
- `draft.js`: draft command center, team tiers, auction/sealed/snake helper tabs, anomaly checks, and draft-to-roster export.

## Manual Setup

1. Create or open the Google Sheet that will back the league.
2. Open **Extensions > Apps Script**.
3. Copy these files into the Apps Script project.
4. Save the project and reload the sheet.
5. Use the **World Cup Fantasy** menu:
   - **Set up sheets** creates the required tabs and headers.
   - **Load simulation data** fills the sheet with fake managers, rosters, teams, matches, events, scoring ledger, and standings.
   - **Sync fake API data** normalizes a fake provider payload into `Matches` and `MatchEvents`.
   - **Rebuild scoring outputs** recalculates `ScoringLedger` and `Standings` from canonical sheet data.
   - **Set up draft sheets** creates the draft command center and draft helper tabs.
   - **Refresh draft board** updates live budgets, team assignments, and anomalies.
   - **Record command center pick** records one pick from `DraftCommandCenter`.
   - **Resolve sealed bids** awards valid Tier C sealed bids from `DraftBids`.
   - **Generate snake draft order** creates the catch-up/snake order from current rosters and budgets.
   - **Export Command Center to league tabs** builds the scoring `Managers`, `Teams`, and `Rosters` tabs from the visible Command Center pick table.
   - **Install minute trigger** creates a 1-minute trigger for `syncFromConfiguredSource`.

## Web App Endpoint

Deploy the Apps Script project as a Web App when you are ready for the GitHub Pages frontend to read JSON.

Supported query parameter:

```text
?endpoint=snapshot
?endpoint=standings
?endpoint=managers
?endpoint=matches
?endpoint=events
?endpoint=ledger
?endpoint=roasts
?endpoint=rules
?endpoint=debug
```

The default endpoint is `snapshot`.

The Web App also supports `POST` from the local Python sync script. The request body must include:

```json
{
  "token": "same value as EXTERNAL_SYNC_TOKEN",
  "source": "api-football",
  "matches": [],
  "events": []
}
```

`doPost` writes `Matches` and `MatchEvents`, rebuilds scoring outputs, and appends `SyncLog`.

## Scoring Rules Implemented

- Win: `+1`
- Group-stage draw: `+0.5`
- Goal scored: `+0.5`
- Goal allowed: `-0.25`
- Clean sheet: `+0.5`
- Red card: `-1`
- Qualify for knockouts: `+0.5`
- Win group: `+1`
- Win World Cup: `+2`

Penalty shootout goals are intentionally excluded. The current canonical match schema stores only regulation/extra-time final scores.

## Integration Assumptions

- Google Sheets is the source of truth.
- `Matches` and `MatchEvents` are canonical after API normalization or manual override.
- `ScoringLedger` and `Standings` are generated outputs and can be safely rebuilt.
- `manualOverride` rows are reserved for the future API client so hand-edited matches are not overwritten.
- Real API provider code is intentionally stubbed until the API provider is selected.

## Local Correctness Strategy

Use `runSimulationScoringSelfCheck()` inside Apps Script to inspect the pure scoring path against the built-in simulated tournament data. Use `assertSimulationScoringSelfCheck()` when you want a pass/fail correctness check. Before the real tournament, the simulation set should be expanded to a full 48-team tournament with expected ledger and standings fixtures.
