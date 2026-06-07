# Stadium Night UI Concept

## Design Direction

`stadium-night` is a cleaner alternate prototype for the World Cup fantasy dashboard. It moves away from a crowded card grid and toward a premium live-sports broadcast surface: cinematic header, oversized leader moment, compact race ladder, horizontal match strip, focused manager view, roster radar, and a hidden audit drawer.

The visual intent is polished but still playful: night stadium lighting, bright scoreboard typography, strong contrast, and fewer simultaneous panels.

## Named UI Sections

- `Scoreboard Stage`: the full opening visual system.
- `Match Current`: league title, phase, and sync status.
- `Hero Race`: large leader/race composition.
- `Leader Lockup`: the dominant current-leader moment.
- `Race Ladder`: compact leaderboard with points and gap to first.
- `Live Strip`: thin match ticker for latest/live matches.
- `Manager Focus`: selected manager profile and high-level stats.
- `Roster Radar`: selected manager country status and points.
- `Moment Feed`: recent scoring events for the selected manager.
- `Audit Drawer`: off-canvas scoring ledger that stays out of the main view.

## What This Should Replace or Simplify

- Replace the current multi-card dashboard grid with the `Scoreboard Stage` as the first impression.
- Replace dense country-card browsing with `Roster Radar` for the selected manager and defer full audit detail to `Audit Drawer`.
- Keep the leaderboard visible, but make it a concise `Race Ladder` rather than a large table.
- Keep scoring transparency, but hide it behind `Audit Drawer` so casual users are not hit with spreadsheet-level detail immediately.
- Use the `Live Strip` for match context instead of several separate match cards.

## Implementation Notes

- This prototype is standalone plain HTML/CSS/JS with no external dependencies.
- It tries to fetch existing fixtures from `sample-data/` when served from the repo root or this folder.
- It includes embedded fallback demo data so the page still renders if opened directly.
- The drawer can be opened with the `Audit` button and closed with Escape, the close button, or the scrim.
