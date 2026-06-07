# Flow Score UI Concept

Flow Score is a cleaner prototype for the World Cup fantasy dashboard. It keeps the useful product pieces from the current frontend, but collapses them into fewer, more memorable surfaces so the page feels fluid instead of busy.

## Design Direction

- Mobile-first sports dashboard with one dominant visual story: who is leading and how close the race is.
- Dark pitch-inspired stage, warm highlight colors, large type, and subtle motion for a premium matchday feel.
- Fewer visible panels: the main view focuses on the race, recent match impact, selected manager roster, and an audit affordance.
- Horizontal manager selection replaces a large standings table on small screens.
- Detailed scoring stays available, but moves into a quiet expandable receipt section instead of competing with the main dashboard.

## Named UI Sections

- `Matchday Masthead`: top identity and data health control.
- `Championship Flow`: oversized leader/race hero with top-three orbit and lead gap.
- `Manager Ribbon`: compact interactive ranking selector.
- `Live Impact Strip`: recent or live matches that changed fantasy points.
- `Manager Story`: selected manager summary plus six roster countries.
- `Ledger Peek`: expandable scoring receipts for quick correctness checks.

## What This Should Replace Or Simplify

- Replace the dense `Championship Race Board` table with `Championship Flow` plus `Manager Ribbon`.
- Replace separate `Manager Spotlight Panel`, `Country Card Grid`, and `Roster Fate Tracker` with the single `Manager Story`.
- Replace a full always-visible `Scoring Ledger Drawer` with `Ledger Peek`; the full audit view can still exist as a secondary route later.
- Keep `Data Health Badge` behavior, but express it as the smaller `sync-chip` in the masthead.
- Keep `Live Match Impact Rail`, but reduce it to a short `Live Impact Strip` that highlights only the matches currently shaping the race.

## Implementation Notes

- This prototype is plain HTML, CSS, and JS with no external dependencies.
- When served from the repo root or this folder with a local static server, it reads from `sample-data`.
- It also includes fallback data so the concept remains viewable if sample fetches are unavailable.
- The CSS is tokenized around a small set of colors, radii, and motion variables so the look can be adjusted quickly.
