# Asset Direction for the Next UI Redesign

## Goal

The next dashboard should feel like a modern matchday companion: colorful, fast, soccer-native, and easy to read at a glance. It should drop the crowded "AI dashboard" feel and move toward one confident visual system with fewer panels, stronger hierarchy, richer motion, fluid scrolling, and dynamic typed match headlines.

## Visual System

- **Background language:** full-bleed pitch/stadium atmosphere using `assets/inspiration/pitch-lines.svg` and `assets/inspiration/stadium-light-bursts.svg` as direction. The background should be scenic but quiet enough that standings remain readable.
- **Country identity:** use `flag-icons` or equivalent open flag assets for actual country flags. Treat flags as chips, ribbons, avatar borders, and roster markers rather than large decorative blocks.
- **Score presentation:** use a broadcast lower-third model inspired by `assets/inspiration/scoreboard-lower-third.svg`: score, time/status, fantasy swing, owned managers, and point deltas in one compact strip.
- **Tournament motif:** use abstract trophy/cup shapes like `assets/inspiration/tournament-trophy-abstract.svg`; do not copy official World Cup marks.
- **Icon style:** use simple soccer ball and trophy glyphs sparingly for loading states, badges, and champion moments.
- **Motion language:** use animated flag ribbons, live goal pulses, rank-change slides, smooth scroll transitions, and a dynamic typing element in the hero. Motion should clarify what changed, not compete with the score.

## Recommended Palette

| Role | Color | Use |
| --- | --- | --- |
| Pitch green | `#0e7a4f` | Primary field background, positive movement. |
| Deep ink | `#101820` | Text, cards, navigation, contrast. |
| Electric cyan | `#22d3ee` | Live match highlights, links, motion trails. |
| Warm gold | `#facc15` | Leader, champion, group winner accents. |
| Coral red | `#ff4f7b` | Red cards, negative swings, alert states. |
| Off white | `#fffdf4` | Main surface color and readable text backgrounds. |

Avoid one-note purple/blue gradients. Use purple only as a small accent if a manager color requires it.

## Recommended Redesign Approach

1. **Simplify the information architecture.** First screen should show only the league leader/race, live match impact, and the user's clearest next interaction. Move audit details to a drawer or separate route.
2. **Use named panels with strong jobs.**
   - `Matchday Hero`: scenic top area with current live/final status and dynamic typed headline.
   - `Race Strip`: horizontal manager ranking with rank movement and point gaps.
   - `Live Swing Board`: active matches and fantasy point deltas.
   - `Roster Flag Stack`: manager roster view with flags, alive/eliminated state, and country points.
   - `Ledger Drawer`: hidden-by-default audit table for scoring math.
   - `Rules Pocket`: compact scoring reference.
3. **Make motion useful.** Animate rank movement, live score deltas, roster country state changes, and typed match headlines. Avoid constant decorative motion around dense data.
4. **Design mobile first.** On phones, use one strong column: hero, race strip, live swing board, roster stack. On desktop, let the race strip and live board sit side by side with generous whitespace.
5. **Keep data dense only where requested.** The scoring ledger can be detailed, but the home dashboard should feel glanceable in under 10 seconds.

## Optional User-Provided Official Assets

The generated app and asset pack must not recreate or provide official FIFA/World Cup logos, trophy renders, mascots, broadcast packages, or other protected marks. If the user personally provides official assets later, use this safe workflow:

- Put them in a separate folder such as `assets/user-provided/official/`, not in `assets/inspiration/`.
- Add a README in that folder documenting file names, source links or notes, date added, who provided them, and the user's assumed usage rights.
- Treat them as optional accents or references only. The UI must render correctly without them.
- Do not trace, redraw, simplify, recolor into a new derivative logo, or generate similar protected marks.
- When implementing the UI, provide a config flag or asset path map so official accents can be enabled/disabled without code rewrites.
- Keep default generated visuals abstract: soccer pitch geometry, stadium light atmosphere, country flags, trophy-like silhouettes, global circles, gold winner moments, and colorful matchday energy.

## License and Safety Notes

- The saved SVGs in `assets/inspiration/` are self-created placeholders for this repo.
- `flag-icons` is currently the recommended actual flag source because its GitHub repo lists an MIT license.
- OpenMoji and Wikimedia pitch assets are CC BY-SA; using them directly may create attribution/share-alike obligations.
- Unsplash and Pixabay photos can be useful references, but do not bundle photos until the exact file and license terms are reviewed.
- Official/protected World Cup references are inspiration only and must not be copied into the repo.
