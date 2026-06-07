# API Provider Planning

The API provider is intentionally not finalized yet. The architecture should support swapping providers through the canonical `Matches` and `MatchEvents` schema.

## Provider Requirements

The selected provider should support:

- 2026 World Cup fixtures.
- Live match status.
- Final scores.
- Goal events.
- Red card events.
- Knockout winner including penalty-decided matches.
- Stable match and event IDs.
- Reasonable free or low-cost usage for a private league.

## Normalization Boundary

Provider-specific data should stop at `ApiClient` and `Normalize`.

Apps Script should normalize all provider responses into:

- `Matches`
- `MatchEvents`
- `SyncLog`

The scoring engine should not know which provider produced the data.

## Fields That Need Special Care

- Penalty shootout goals must not become `goal_scored` events.
- Knockout winners must populate `winnerTeamId`, even when `homeGoals` and `awayGoals` are tied.
- Red cards should be counted for the correct country.
- Manual overrides must beat provider data.
- Provider event IDs should be stored when available to support idempotency.

## Simulation Before Provider Lock

Until the provider is chosen, use `sample-data/simulated-matches.json` as the fake provider response. This lets Apps Script and frontend work proceed without external dependencies.

