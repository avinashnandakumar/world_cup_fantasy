# UI Panels and Interactivity

The frontend should use stable panel names so feedback can be precise. Each panel should be implemented as a named component and documented by that same name.

## Panel Inventory

| Panel Name | Purpose | Expected Interactions |
| --- | --- | --- |
| `League Pulse Header` | Shows league name, current phase, last update, and data health | Tap/click data health to inspect sync state |
| `Championship Race Board` | Main leaderboard | Expand manager rows, compare point gaps, show rank movement |
| `Manager Spotlight Panel` | Deep view for selected manager | Select manager, inspect roster countries and scoring breakdown |
| `Country Card Grid` | Visual country roster/status cards | Filter by manager/status/group, open country scoring detail |
| `Live Match Impact Rail` | Active match impact summary | Show managers affected by each live score change |
| `Scoring Ledger Drawer` | Audit log for point math | Search/filter by manager, team, match, category |
| `Roster Fate Tracker` | Alive/eliminated/qualified summary | Compare remaining upside by manager |
| `Rules Reference Panel` | Compact scoring rules | Expand notes for clean sheets and shootout exclusions |
| `Tournament Timeline Strip` | Tournament phase navigation | Jump to matches or scoring by stage |
| `Data Health Badge` | Persistent sync status | Surface fresh/stale/error/simulation states |

## Design Expectations

- Phone layouts should prioritize stacked cards and single-column reading.
- Desktop layouts can combine leaderboard, live matches, and manager detail in a denser dashboard.
- Use flags or `flagCode` placeholders consistently, but do not block development on final flag assets.
- Use manager `colorToken` values for identity accents.
- Keep every point total visibly traceable to the Scoring Ledger Drawer.
- Clearly label simulation data while test mode is active.

## Fast UI Modification Requirements

To make generated UI easy to adjust:

- Use named components matching the panel names above.
- Keep design tokens for colors, spacing, typography, borders, shadows, and motion.
- Keep status badge styles centralized.
- Avoid hard-coded panel copy in scattered components.
- Use sample data from `sample-data/dashboard-snapshot-8.json` for fast visual iteration.

## Expected First Screen

The first screen should feel like a live league dashboard, not a marketing page.

Recommended first-screen composition:

- `League Pulse Header` across the top.
- `Championship Race Board` as the main focus.
- `Live Match Impact Rail` beside it on desktop or directly below it on mobile.
- `Manager Spotlight Panel` below the leaderboard, defaulting to the current leader or selected manager.
- `Data Health Badge` visible at all times.

