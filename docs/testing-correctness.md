# Scoring Correctness and Simulation Testing

This project should prove the scoring system before the real World Cup starts. The goal is not just "the app loads"; it is "every visible point can be traced back to a correct Google Sheets ledger row."

## Test Data Strategy

Use the sample data in `sample-data/` as the first simulated tournament:

- `simulated-teams-48.json`: 48 fictional countries across 12 groups.
- `simulated-league-8.json`: full 8-manager draft with 6 countries each.
- `simulated-league-12.json`: starter 12-manager fixture for 4-country roster testing.
- `simulated-matches.json`: controlled match cases.
- `simulated-scoring-ledger-8.json`: expected point-by-point ledger.
- `simulated-standings-8.json`: expected manager totals.
- `dashboard-snapshot-8.json`: frontend smoke-test payload.

The sample data intentionally uses fictional teams so tests stay stable before the actual 2026 field/API feed is finalized.

## Apps Script Population Tests

Apps Script should include a simulation mode that can populate a blank Google Sheet from the repo fixtures.

Required checks:

- Creates every required tab from `schemas/google-sheets-schema.md`.
- Writes headers exactly once and in the documented order.
- Loads managers, rosters, teams, matches, and rules into their source tabs.
- Generates derived `MatchEvents`, `ScoringLedger`, `Standings`, and `SyncLog` rows.
- Marks the workbook or Settings tab with `mode=simulation`.
- Does not require any real API credentials in simulation mode.

Acceptance criteria:

- A blank workbook becomes a complete simulated league workbook after one setup run.
- Rerunning the setup produces the same source rows without duplicates.
- Apps Script can rebuild generated tabs from source tabs after those generated tabs are cleared.

## Scoring Math Tests

Every scoring rule should have at least one sample match or bonus row.

| Scenario | Fixture | Expected Behavior |
| --- | --- | --- |
| 2-1 group win | `match-001` | Winner gets win, goal scored, and goal allowed rows |
| Red card | `match-001` | Borealia receives `-1` |
| 0-0 group draw | `match-002` | Both teams get draw and clean sheet rows |
| 3-3 group draw | `match-003` | Both teams get draw, goals scored, and goals allowed rows |
| 1-0 clean sheet win | `match-004` | Galdor gets win, goal scored, clean sheet |
| Knockout penalties | `match-005` | Atlas gets win; no group draw; shootout goals excluded |
| Extra-time knockout win | `match-006` | Atlas gets win and normal goal scoring |
| Quarterfinal clean sheet | `match-007` | Ionia gets win, goal scored, clean sheet |
| Champion bonus | `match-008` plus champion event | Ionia gets tournament bonus only once |

Acceptance criteria:

- Summing `ScoringLedger.points` by manager equals `Standings.totalPoints`.
- Summing `ScoringLedger.points` by team equals the country totals shown by the frontend.
- `group_draw` rows only appear for `GROUP` matches.
- Shootout goals never appear as `goal_scored` quantities.
- Champion bonus has exactly one row for the tournament champion.

## Idempotent Sync Tests

Apps Script sync jobs must be safe to run repeatedly.

Required checks:

- Running the same simulated sync twice does not duplicate `Matches`, `MatchEvents`, or `ScoringLedger` rows.
- Deterministic IDs are used for generated rows.
- A ledger rebuild deletes/replaces generated ledger rows for the active league format, then writes the same expected rows.
- `SyncLog` is append-only and may gain one row per run.
- Manual override rows with `manualOverride=TRUE` are preserved.

Acceptance criteria:

- After two identical syncs, all generated tab row counts are stable except `SyncLog`.
- `Standings` totals remain identical after repeated syncs.
- The latest `SyncLog` row clearly reports success, warning, or error.

## Manual Override Tests

Manual overrides are the emergency brake for API errors.

Required checks:

- If a `Matches.manualOverride` value is true, Apps Script should not overwrite final score fields for that match.
- If a `MatchEvents.manualOverride` value is true, Apps Script should preserve that event while rebuilding derived events.
- Override-derived ledger rows should set `isOverride=true`.
- Override notes should appear in the scoring audit view.

Acceptance criteria:

- A manually corrected red card or score survives later syncs.
- The frontend can show an override indicator in the Scoring Ledger Drawer.
- Removing the override and rebuilding returns the workbook to API/simulation-derived values.

## Frontend Agreement Tests

The frontend should agree with Google Sheets and Apps Script output.

Required checks:

- Load `dashboard-snapshot-8.json` and render standings in exact rank order.
- Display total points with decimal values intact.
- Display a visible simulation/test-mode indicator.
- Country cards show alive/eliminated/champion status from the teams data.
- Scoring Ledger Drawer can filter by manager, team, match, and category.

Acceptance criteria:

- Standings totals match `simulated-standings-8.json`.
- Manager roster totals equal ledger totals by team.
- Every displayed scoring detail links back to one `ledgerId`.
- Mobile and desktop views show the same totals.

## Pre-Tournament Readiness Checklist

- Run at least three full simulated tournament rebuilds without scoring discrepancies.
- Run one manual override drill and confirm the UI makes it visible.
- Run one stale/error sync drill and confirm the Data Health Badge changes state.
- Confirm the selected API provider can be swapped into the same `Matches` and `MatchEvents` schema.
- Confirm the real Google Sheet has the same tab names and headers as `schemas/google-sheets-schema.md`.
- Confirm GitHub Pages reads only public JSON and contains no API keys.

