# Inspiration Asset Pack

This folder contains repo-safe visual direction assets for the World Cup fantasy dashboard. The saved SVGs are self-created placeholders intended to guide UI redesign; they do not copy official FIFA World Cup logos, mascots, broadcast packages, national federation crests, or protected marks.

## Saved Assets

| File | License/Source | UI Use |
| --- | --- | --- |
| `pitch-lines.svg` | Self-created for this repo | Full-bleed hero/dashboard background, faint panel texture, section dividers. |
| `stadium-light-bursts.svg` | Self-created for this repo | Night-match energy, live match header, top-of-page visual field. |
| `flag-ribbons.svg` | Self-created generic flag treatment | Direction for country color ribbons, roster chips, manager-country stacks. |
| `ball-glyph.svg` | Self-created for this repo | App icon placeholder, empty states, animated loading mark. |
| `tournament-trophy-abstract.svg` | Self-created for this repo | Champion badge direction without copying official trophy/World Cup marks. |
| `scoreboard-lower-third.svg` | Self-created for this repo | Broadcast-inspired live match card and fantasy swing strip direction. |

## Recommended External Sources

Use these as implementation references or dependencies after license review:

- Flags: [`lipis/flag-icons`](https://github.com/lipis/flag-icons), MIT licensed. Use ISO country codes in the UI and load only needed flags when possible.
- Emoji-style icons: [OpenMoji](https://github.com/hfg-gmuend/openmoji), CC BY-SA 4.0. Good for soccer ball/trophy/medal inspiration, but attribution and share-alike obligations must be respected.
- Pitch reference: [Wikimedia Commons Football pitch.svg](https://commons.wikimedia.org/wiki/File:Football_pitch.svg), CC BY-SA 4.0. Useful for field geometry reference; the saved pitch SVG here is self-created instead.
- Stadium photo mood: [Unsplash stadium lights photo](https://unsplash.com/photos/stadium-lights-illuminate-a-large-crowd-at-night-yc-mnCDQA-8), Unsplash License. Use as mood reference or manually download with photographer attribution if desired.
- Stadium light reference: [Pixabay stadium lights photo](https://pixabay.com/photos/stadium-lights-floodlight-6755749/), Pixabay Content License. Use as mood reference; check Pixabay restrictions before bundling.

## Do Not Copy

- Official FIFA World Cup 2026 logo, mascot, trophy renderings, type treatment, broadcast graphics, ticketing graphics, or federation crests.
- Exact scoreboard graphics from TV broadcasts.
- Sponsor, confederation, club, or tournament marks.

## Optional User-Provided Official Assets

If the user later provides official FIFA/World Cup logos, trophy imagery, or related brand assets, treat them as optional local references rather than generated project assets.

- Store user-provided official files separately from this inspiration pack, preferably under `assets/user-provided/official/`.
- Add a local README beside those files documenting who provided them, where they came from, when they were added, and the assumed use case.
- Keep the app able to run cleanly without those files; official assets should be optional accents or references, not required UI dependencies.
- Do not trace, redraw, recreate, simplify, or generate replacement versions of protected logos or trophy marks.
- Use official assets only in ways the user confirms are appropriate for their private league context.
- Keep generated design language abstract: colorful soccer atmosphere, trophy-like silhouettes, flag motion, pitch geometry, and matchday energy rather than copied brand marks.

## UI Direction Notes

- Use flags as small kinetic accents: thin ribbons, stacked cards, circular chips, and edge stripes. Do not let flags become noisy wallpaper.
- Use pitch lines as low-opacity structure behind content, not as a literal diagram under every card.
- Use stadium lights for depth and celebration moments: live matches, rank changes, champion state.
- Use broadcast lower-third language for data density: compact score, match status, fantasy delta, owned-by tags.
- Use subtle nods to World Cup/trophy visual language through abstract cup silhouettes, circular global forms, vertical ribbons, and gold celebration states.
- Add fun but purposeful motion: fluid scrolling, dynamic typed match headlines, rank-change animations, goal pulse effects, and flag ribbon transitions.
- Keep the interface colorful through contrast: grass green, electric cyan, warm gold, coral red, clean off-white, and ink-black. Avoid a single purple/blue gradient wash.
- Keep the home dashboard clean and simple: one dominant matchday scene, one clear standings race, one live impact area, and deeper details hidden behind drawers or secondary views.
