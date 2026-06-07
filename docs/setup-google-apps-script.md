# Google Apps Script Setup Plan

The Apps Script source will live in this repo, but the deployment will be connected manually to a Google Sheet.

## Target Responsibilities

Apps Script should:

- Create and validate the Google Sheets tab structure.
- Populate simulation data for testing.
- Pull live match data from the selected API provider.
- Normalize API data into `Matches` and `MatchEvents`.
- Rebuild `ScoringLedger` and `Standings`.
- Publish read-only JSON for GitHub Pages.
- Write a `SyncLog` row for each run.

## Suggested Module Layout

When implementation starts, store Apps Script files under `apps-script/`:

- `Code.gs`: entrypoints and web app routing.
- `Config.gs`: settings, constants, scoring keys.
- `Sheets.gs`: sheet lookup, header validation, row writing.
- `Simulation.gs`: sample-data loader and simulation setup.
- `ApiClient.gs`: provider fetch logic.
- `Normalize.gs`: provider-to-canonical match/event conversion.
- `Scoring.gs`: scoring engine and ledger rebuild.
- `Standings.gs`: manager totals and ranking.
- `Publish.gs`: JSON endpoint builders.
- `Sync.gs`: scheduled sync orchestration and logging.

## Manual Setup Steps

1. Create a Google Sheet for simulation testing.
2. Create an Apps Script project attached to that Sheet or connected as a standalone project.
3. Copy the repo Apps Script files into the Apps Script editor, or use `clasp` later if desired.
4. Set script properties for any API keys only after simulation mode passes.
5. Run the simulation setup entrypoint.
6. Confirm the workbook tabs match `schemas/google-sheets-schema.md`.
7. Deploy the script as a Web App with read-only JSON responses.
8. Configure GitHub Pages frontend to read the Web App URL.

## Trigger Strategy

- Simulation setup: manual run.
- Manual rebuild: manual run.
- Live sync: time-driven trigger, every 1 minute during live match windows.
- Off-day sync: slower cadence or disabled.

## Correctness Guardrails

- Validate headers before every write.
- Use deterministic row IDs for generated rows.
- Preserve manual override fields.
- Rebuild ledger and standings from canonical source rows.
- Do not publish a `fresh` data health status after a failed scoring rebuild.

## Setup Blockers to Resolve Later

- Final API provider and credential storage.
- Whether Apps Script will be attached to the Sheet or standalone.
- Whether repo-to-Apps-Script sync uses manual copy/paste or `clasp`.

