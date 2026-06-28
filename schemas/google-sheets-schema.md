# Google Sheets Schema

Google Sheets is the canonical data store. Apps Script should create or validate these tabs before the first sync, then preserve column names exactly.

## Shared Conventions

- IDs are stable strings, not row numbers.
- Timestamps use ISO 8601 strings.
- Points are decimals and should be rounded only for display.
- Boolean values should be `TRUE` or `FALSE` in Sheets and booleans in JSON.
- Manual override columns are preserved by sync jobs.
- Apps Script may rebuild generated tabs from canonical inputs, but should not silently rewrite user-owned tabs.

## Tab Ownership

| Tab | Owner | Rebuildable? | Purpose |
| --- | --- | --- | --- |
| `Settings` | User + Apps Script | No | League config, scoring constants, API settings, mode flags |
| `Managers` | User | No | League participant profiles |
| `Rosters` | User | No | Drafted countries per manager |
| `Teams` | User + Apps Script | Partially | Country metadata and tournament status |
| `Matches` | Apps Script + overrides | Yes, preserving overrides | Canonical fixtures, scores, and match status |
| `MatchEvents` | Apps Script + overrides | Yes, preserving overrides | Goals, red cards, clean sheets, result facts |
| `ScoringLedger` | Apps Script | Yes | One row per scoring event |
| `Standings` | Apps Script | Yes | Current manager rankings |
| `SyncLog` | Apps Script | Append-only | Sync runs, errors, stale data warnings |

## Settings

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `key` | string | Yes | Stable setting key |
| `value` | string/number/boolean | Yes | Raw value used by Apps Script |
| `description` | string | No | Human-readable purpose |
| `updatedAt` | timestamp | No | Last edited timestamp |

Required scoring keys:

| Key | Value |
| --- | ---: |
| `points.win` | `1` |
| `points.groupDraw` | `0.5` |
| `points.goalScored` | `0.5` |
| `points.goalAllowed` | `-0.25` |
| `points.cleanSheet` | `0.5` |
| `points.redCard` | `-1` |
| `points.qualifyKnockouts` | `0.5` |
| `points.winGroup` | `1` |
| `points.champion` | `2` |
| `rules.shootoutGoalsCount` | `FALSE` |

## Managers

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `managerId` | string | Yes | Stable ID, e.g. `mgr-blue-comets` |
| `displayName` | string | Yes | Name shown on website |
| `shortName` | string | Yes | Compact mobile label |
| `colorToken` | string | Yes | Theme token or hex color |
| `avatarToken` | string | No | Icon/avatar identifier |
| `draftSlot` | number | Yes | Original draft order |
| `isActive` | boolean | Yes | Hidden if false |

## Rosters

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `rosterId` | string | Yes | Stable row ID |
| `leagueFormat` | string | Yes | `8_MANAGER` or `12_MANAGER` |
| `managerId` | string | Yes | References `Managers.managerId` |
| `teamId` | string | Yes | References `Teams.teamId` |
| `draftRound` | number | Yes | Draft round |
| `draftPick` | number | Yes | Overall pick number |
| `acquisitionType` | string | Yes | `draft`, `reverse_order_extra`, or `manual` |

## Teams

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `teamId` | string | Yes | Stable country/team ID |
| `name` | string | Yes | Country display name |
| `shortName` | string | Yes | Compact label |
| `flagCode` | string | No | ISO-like code or test flag token |
| `group` | string | Yes | Group letter |
| `seedTier` | number | No | Optional draft balance tier |
| `status` | string | Yes | `scheduled`, `live`, `qualified`, `eliminated`, `champion` |
| `groupRank` | number | No | Final group rank when known |
| `qualifiedForKnockouts` | boolean | Yes | Used for qualification bonus |
| `wonGroup` | boolean | Yes | Used for group winner bonus |
| `isChampion` | boolean | Yes | Used for tournament bonus |

## Matches

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `matchId` | string | Yes | Stable match ID |
| `stage` | string | Yes | `GROUP`, `R32`, `R16`, `QF`, `SF`, `FINAL` |
| `group` | string | No | Required for group-stage matches |
| `kickoffUtc` | timestamp | Yes | Scheduled kickoff |
| `status` | string | Yes | `scheduled`, `live`, `final`, `postponed` |
| `homeTeamId` | string | Yes | References `Teams.teamId` |
| `awayTeamId` | string | Yes | References `Teams.teamId` |
| `homeGoals` | number | No | Regulation/extra-time goals only |
| `awayGoals` | number | No | Regulation/extra-time goals only |
| `winnerTeamId` | string | No | Required for final knockout matches |
| `decidedBy` | string | No | `regulation`, `extra_time`, `penalties`, or blank |
| `apiProvider` | string | No | Source provider name |
| `apiMatchId` | string | No | Provider match ID |
| `manualOverride` | boolean | Yes | If true, sync must preserve editable fields |
| `lastSyncedAt` | timestamp | No | Last successful sync for this row |

## MatchEvents

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `eventId` | string | Yes | Stable event ID |
| `matchId` | string | Yes | References `Matches.matchId` |
| `teamId` | string | Yes | Team receiving the event |
| `eventType` | string | Yes | `goal`, `goal_allowed`, `clean_sheet`, `red_card`, `result_win`, `result_draw`, `qualify_knockouts`, `win_group`, `champion` |
| `minute` | number | No | Match minute if available |
| `quantity` | number | Yes | Count for grouped events |
| `source` | string | Yes | `api`, `derived`, `manual`, `simulation` |
| `apiEventId` | string | No | Provider event ID if available |
| `manualOverride` | boolean | Yes | If true, sync must preserve event |
| `notes` | string | No | Explanation or dispute note |

## ScoringLedger

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `ledgerId` | string | Yes | Deterministic ID from match/team/category/manager |
| `createdAt` | timestamp | Yes | Ledger generation timestamp |
| `leagueFormat` | string | Yes | `8_MANAGER` or `12_MANAGER` |
| `managerId` | string | Yes | Manager receiving points |
| `teamId` | string | Yes | Country receiving points |
| `matchId` | string | No | Blank for tournament-level rows if needed |
| `stage` | string | Yes | Stage or `TOURNAMENT` |
| `category` | string | Yes | Scoring category |
| `quantity` | number | Yes | Event count |
| `pointsPerUnit` | number | Yes | Rule value |
| `points` | number | Yes | `quantity * pointsPerUnit` |
| `explanation` | string | Yes | Human-readable scoring reason |
| `sourceEventIds` | string | No | Comma-separated source events |
| `isOverride` | boolean | Yes | True when produced from manual override |

## Standings

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `rank` | number | Yes | Current rank |
| `previousRank` | number | No | Previous sync rank for movement display |
| `managerId` | string | Yes | References `Managers.managerId` |
| `displayName` | string | Yes | Denormalized for frontend speed |
| `totalPoints` | number | Yes | Sum of ledger points |
| `bonus` | number | Yes | Earned bonus points from qualified teams, group winners, and champion bonus |
| `countriesAlive` | number | Yes | Rostered teams not eliminated |
| `countriesEliminated` | number | Yes | Rostered teams eliminated |
| `countriesQualified` | number | Yes | Rostered teams qualified for knockouts |
| `groupWinners` | number | Yes | Rostered group winners |
| `championOwned` | boolean | Yes | True if manager owns champion |
| `lastUpdatedAt` | timestamp | Yes | Sync timestamp |

## SyncLog

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `syncId` | string | Yes | Unique sync run ID |
| `startedAt` | timestamp | Yes | Sync start |
| `finishedAt` | timestamp | No | Sync end |
| `mode` | string | Yes | `simulation`, `live`, or `manual_rebuild` |
| `status` | string | Yes | `success`, `warning`, `error` |
| `matchesFetched` | number | No | Provider matches read |
| `eventsFetched` | number | No | Provider events read |
| `ledgerRowsWritten` | number | No | Rows written after rebuild |
| `message` | string | No | Human-readable summary |
