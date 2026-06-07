# World Cup Fantasy League

Fantasy football-style league for the 2026 FIFA World Cup. Managers draft countries, countries earn points from real match outcomes, and a GitHub Pages dashboard tracks standings, rosters, live match impact, and scoring audit details.

## Current Decisions

- **Scoring rules:** documented in `WorldCupScoringFormat.md`.
- **Architecture:** documented in `WebsiteArchitecturePlan.md`.
- **Frontend hosting:** GitHub Pages.
- **Backend worker:** Google Apps Script.
- **Data source of truth:** Google Sheets.
- **Pre-tournament testing:** simulated World Cup data in Google Sheets and local sample data.

## Target Data Flow

```text
World Cup API
  -> Google Apps Script sync/scoring worker
  -> Google Sheets tabs
  -> public dashboard JSON
  -> GitHub Pages website
```

The frontend should never contain API keys or Google credentials. Apps Script owns API calls, scoring calculations, sheet writes, audit rows, and snapshot publishing.

## Known Manual Setup Steps

These cannot be fully completed from the repo alone:

- Create or connect the real Google Sheet.
- Deploy the Apps Script code under the league owner's Google account.
- Add real API provider credentials if the selected World Cup API requires them.
- Enable GitHub Pages for the repository.

The implementation should still be fully testable before those steps by using simulated data.

## Planned Folders

- `apps-script/`: Apps Script source and setup notes.
- `frontend/`: static GitHub Pages dashboard.
- `schemas/`: Google Sheets and JSON contract definitions.
- `sample-data/`: simulated league and tournament data.
- `docs/`: setup, testing, API provider, and UI panel documentation.

