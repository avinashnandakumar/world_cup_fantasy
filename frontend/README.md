# World Cup Fantasy Frontend

Dependency-free static dashboard scaffold for the World Cup fantasy league. It is designed for GitHub Pages and can run without `npm install`.

## Files

- `index.html`: Dashboard shell with named panels from the architecture plan.
- `styles.css`: Mobile-first visual system, design tokens, and panel styles.
- `app.js`: Snapshot loading, embedded fallback data, and panel render functions.

## Run Locally

From the repo root:

```sh
python3 -m http.server 8080 -d frontend
```

Then open:

```text
http://localhost:8080
```

Opening `frontend/index.html` directly may work, but a static server better matches GitHub Pages and allows `fetch()` to load JSON.

## Data Contract

The frontend first tries to fetch:

```text
frontend/dashboard-snapshot.json
```

If that file is unavailable, it renders embedded simulated data from `app.js`.

The future Apps Script publisher can either place a compatible `dashboard-snapshot.json` in the deployed frontend path or expose the same snapshot shape through a public endpoint. The renderer expects these top-level keys:

- `meta`
- `timeline`
- `managers`
- `countries`
- `matches`
- `ledger`
- `rules`

## Named Panels

These panel names are stable in markup and render code so they can be referenced in future UI requests:

- League Pulse Header
- Championship Race Board
- Manager Spotlight Panel
- Country Card Grid
- Live Match Impact Rail
- Scoring Ledger Drawer
- Roster Fate Tracker
- Rules Reference Panel
- Tournament Timeline Strip
- Data Health Badge

## Integration Assumptions

- Browser code remains read-only and contains no API keys or Google write credentials.
- Apps Script or another publisher owns scoring correctness and JSON generation.
- Sample data is intentionally small and visual-first; scoring correctness test data should live outside this frontend scaffold.
