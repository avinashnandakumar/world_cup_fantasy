# Live Score Poster Concept

Standalone UI prototype for the World Cup fantasy dashboard.

## Direction

This concept treats the dashboard like a live sports poster / broadcast scoreboard rather than a dense admin page. The first screen focuses on the leader, the current race, and a colorful soccer atmosphere. Details stay available, but they are pushed into cleaner lower sections and a hidden audit drawer.

## Visual Features

- Large poster-like hero with pitch geometry, stadium light energy, and an abstract trophy motif.
- Dynamic typing headline for matchday drama.
- Animated broadcast score-bug strip for live match impact.
- Country flag-style chips and ribbons using repo-safe generated flag treatments.
- Manager ranking cards with strong hierarchy and roster flag previews.
- Clean roster strips for scanning all managers without crowding the hero.
- Hidden scoring ledger drawer for correctness/audit details.

## Files

- `index.html`: static markup and panel structure.
- `styles.css`: full visual system, responsive layout, and animations.
- `app.js`: sample-data loading, fallback data, rendering, and interactions.

## Caveats

- No official FIFA or World Cup marks are copied. The trophy/field/scoreboard language is abstract and repo-safe.
- The flag visuals are stylized color chips, not official country flags. Real flag assets can be swapped in later if the project adopts a licensed flag package.
- The concept loads local `sample-data` JSON when served over a local web server. It includes fallback data so the page still renders if opened directly from disk.
