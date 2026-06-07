# Trophy Trail UI Concept

Trophy Trail is a standalone static prototype for the World Cup fantasy dashboard. It explores an elegant tournament journey direction: a scenic pitch/stadium background, an abstract trophy hero, country flags as path markers, a minimal leaderboard race, fluid scroll sections, a dynamic typing headline, and an audit drawer kept out of the primary view.

## Files

- `index.html`: prototype markup and named sections.
- `styles.css`: visual system, responsive layout, motion, and drawer styling.
- `app.js`: sample-data loading, rendering, typing headline, roster tabs, and audit drawer behavior.

## Data

The prototype reads from:

- `sample-data/dashboard-snapshot-8.json`
- `sample-data/simulated-league-8.json`
- `sample-data/simulated-teams-48.json`
- `sample-data/simulated-matches.json`
- `sample-data/simulated-scoring-ledger-8.json`

It also includes a small fallback data set so the page can still show the concept if fetches fail.

## Design Notes

- No external dependencies.
- No official FIFA or World Cup marks are copied.
- Inspiration assets are referenced from `assets/inspiration`.
- Flags are generated as abstract country-code chips for now; real open-license flag assets can replace them later.
- The audit view is intentionally hidden in a drawer to keep the main experience clean.

## Local Preview

From the repo root:

```bash
python3 -m http.server 8787
```

Then open:

```text
http://localhost:8787/design-concepts/trophy-trail/
```
