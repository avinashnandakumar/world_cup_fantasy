# Global Carnival UI Concept

This standalone concept explores a colorful, simple fantasy World Cup dashboard inspired by global tournament energy, pitch geometry, flag ribbons, and broadcast score bugs.

## Concept

- **First viewport:** one strong story: current leader, gap to second, live swing, and a typed headline.
- **Race Strip:** horizontal manager ranking with animated rise/gap treatment instead of a dense table.
- **Live Match Impact:** one broadcast-style score bug plus a compact list of fantasy swings.
- **Roster Flag Stack:** manager tabs and country cards using flags as interactive identity elements.
- **Hidden Audit Detail:** scoring rows live in a drawer so auditability is available without crowding the main screen.

## Files

- `index.html`
- `styles.css`
- `app.js`

## Data

The prototype tries to load:

- `../../sample-data/dashboard-snapshot-8.json`
- `../../sample-data/simulated-scoring-ledger-8.json`
- `../../sample-data/simulated-league-8.json`

It includes fallback display data so it can still render if opened directly from disk.

## Caveats

- This is a visual prototype, not the production frontend.
- Flags use emoji placeholders for now. Production can swap these for licensed flag assets.
- Motion is intentionally subtle, but the CSS includes reduced-motion handling.
