# Avi Landing Concept

This concept uses the user-provided assets in `assets/avi_assets` and simplifies the product around the requested priority order:

1. **Live standings** are the main event.
2. **Countries per player** sit below the table with per-country scoring breakdowns.
3. **Live games** are supporting context near the bottom.

## Design Direction

- Super-simple landing page structure.
- Stadium photo background for the first viewport.
- Small official logo accent, not a giant brand billboard.
- Soccer-table inspired standings with columns for total, wins, goals, defense, bonuses, and cards.
- Flag-style country chips/ribbons used as UI elements.
- Dynamic typing line in the hero.
- Fluid scrolling and subtle animation without making the page feel busy.

## Files

- `index.html`
- `styles.css`
- `app.js`

## Data

The page reads the existing simulated data from `sample-data/` when served from the repo root. It includes a tiny fallback so it does not appear blank if fetches fail.

## Preview

From the repo root:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/design-concepts/avi-landing/
```

