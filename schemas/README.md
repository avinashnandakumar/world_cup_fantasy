# Schemas and Data Contracts

This directory defines the canonical data shapes shared by Google Sheets, Apps Script, sample data, and the GitHub Pages frontend.

## Files

- `google-sheets-schema.md`: tab-by-tab Google Sheets schema, including required columns and ownership rules.
- `json-contracts.md`: public JSON payloads exposed by Apps Script and consumed by the frontend.

## Contract Goals

- Keep Google Sheets as the source of truth for league data and scoring outputs.
- Make Apps Script writes deterministic and idempotent.
- Let the frontend render standings, rosters, live matches, and scoring audit details without private credentials.
- Make every fantasy point traceable to one row in `ScoringLedger`.

