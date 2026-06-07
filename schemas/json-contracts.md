# Public JSON Contracts

Apps Script should expose read-only JSON for the static GitHub Pages frontend. The browser must never receive private API keys, Google credentials, or write-capable endpoints.

## Contract Rules

- Response timestamps use ISO 8601 strings.
- Numbers are returned as numbers, not formatted strings.
- Missing optional values may be `null`.
- IDs match Google Sheets IDs.
- `snapshot` is the preferred frontend payload because it reduces round trips.

## Common Envelope

Every endpoint should return this envelope:

```json
{
  "schemaVersion": "1.0.0",
  "mode": "simulation",
  "generatedAt": "2026-06-07T18:00:00Z",
  "dataHealth": {
    "status": "fresh",
    "lastSuccessfulSyncAt": "2026-06-07T17:59:40Z",
    "message": "Simulation data loaded"
  },
  "data": {}
}
```

Allowed `mode` values:

- `simulation`
- `live`
- `manual_rebuild`

Allowed `dataHealth.status` values:

- `fresh`
- `stale`
- `error`
- `setup_required`

## GET /rules

Returns scoring constants and concise display metadata.

```json
{
  "data": {
    "rules": [
      {
        "category": "win",
        "label": "Win",
        "scope": "All matches",
        "points": 1
      }
    ],
    "notes": [
      "Draw points apply in group-stage matches only.",
      "Penalty shootout goals do not count as goals scored."
    ]
  }
}
```

## GET /standings

```json
{
  "data": {
    "standings": [
      {
        "rank": 1,
        "previousRank": 2,
        "managerId": "mgr-blue-comets",
        "displayName": "Blue Comets",
        "shortName": "Comets",
        "colorToken": "blue",
        "totalPoints": 13,
        "countriesAlive": 2,
        "countriesEliminated": 4,
        "countriesQualified": 2,
        "groupWinners": 1,
        "championOwned": true
      }
    ]
  }
}
```

## GET /managers

```json
{
  "data": {
    "managers": [
      {
        "managerId": "mgr-blue-comets",
        "displayName": "Blue Comets",
        "shortName": "Comets",
        "colorToken": "blue",
        "draftSlot": 1,
        "roster": [
          {
            "teamId": "team-atlas",
            "name": "Atlas",
            "flagCode": "ATL",
            "group": "A",
            "status": "eliminated",
            "points": 6.75
          }
        ]
      }
    ]
  }
}
```

## GET /matches

```json
{
  "data": {
    "matches": [
      {
        "matchId": "match-001",
        "stage": "GROUP",
        "group": "A",
        "kickoffUtc": "2026-06-12T19:00:00Z",
        "status": "final",
        "homeTeamId": "team-atlas",
        "awayTeamId": "team-borealia",
        "homeGoals": 2,
        "awayGoals": 1,
        "winnerTeamId": "team-atlas",
        "decidedBy": "regulation",
        "fantasyImpact": [
          {
            "managerId": "mgr-blue-comets",
            "teamId": "team-atlas",
            "points": 1.75,
            "summary": "Atlas win, 2 goals scored, 1 goal allowed"
          }
        ]
      }
    ]
  }
}
```

## GET /ledger

```json
{
  "data": {
    "ledger": [
      {
        "ledgerId": "ledger-8-match-001-team-atlas-win",
        "createdAt": "2026-06-07T18:00:00Z",
        "leagueFormat": "8_MANAGER",
        "managerId": "mgr-blue-comets",
        "teamId": "team-atlas",
        "matchId": "match-001",
        "stage": "GROUP",
        "category": "win",
        "quantity": 1,
        "pointsPerUnit": 1,
        "points": 1,
        "explanation": "Atlas defeated Borealia in Group A."
      }
    ]
  }
}
```

## GET /snapshot

The `snapshot` endpoint combines the frontend dashboard payload:

```json
{
  "data": {
    "league": {
      "leagueId": "sim-8-manager",
      "name": "Simulated 8-Manager League",
      "format": "8_MANAGER",
      "currentPhase": "FINAL_COMPLETE"
    },
    "rules": [],
    "standings": [],
    "managers": [],
    "teams": [],
    "matches": [],
    "ledger": []
  }
}
```

The frontend should be able to render the full app from `/snapshot` alone.

