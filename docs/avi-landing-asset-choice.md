# Avi Landing Background Asset Recommendation

Author: Aarav, UI Design Expert

## Recommendation

Use `assets/avi_assets/1960x0.jpg.webp` as the primary landing page background.

This image gives the page the strongest mix of drama, soccer relevance, and readability. The trophy creates an immediate World Cup signal, the pitch supplies a rich green base, and the stadium/sky area gives enough negative space for overlays. It feels celebratory without being as visually noisy as the current SoFi stadium image or the flag collages.

## Ranked Top 3

1. `assets/avi_assets/1960x0.jpg.webp`
   - Best for a standings-first landing page.
   - Strong focal point, clean pitch texture, emotional tournament cue.
   - Crops acceptably on mobile if the trophy is shifted slightly right or kept center-bottom.
   - Needs a dark green/black overlay behind the standings table and a subtle top-to-bottom wash for text.

2. `assets/avi_assets/LKASMMMRZZBJNFPUMKZWGKH4IQ.jpg`
   - Best pure soccer/stadium atmosphere.
   - Great desktop depth, but the roof lines and center scoreboard compete with UI panels.
   - Mobile crop can become abstract roof/stands unless carefully positioned.
   - Better as a secondary section background or blurred layer than the main hero image.

3. `assets/avi_assets/81TJwjrHmdL._AC_UF894,1000_QL80_.jpg`
   - Best flag/worldwide participation energy.
   - Too busy directly behind standings, but very useful as a low-opacity accent or country-section texture.
   - Works well for flag ribbons, roster cards, or a masked background behind the countries-per-player section.

## Optional Accent Assets

- `assets/avi_assets/2026-fifa-world-cup-logo.jpg`
  - Use as a small brand chip in the header, not as a hero centerpiece.
  - Keep optional and avoid relying on it for layout.

- `assets/avi_assets/88433c208410777.Y3JvcCwyNzYxLDIxNjAsNTQwLDA.png`
  - Use as a colorful geometric accent strip or small decorative badge.
  - Strong nod to the 2026 brand palette without taking over the page.

- `assets/avi_assets/images.jpeg`
  - Use as a pitch texture for table headers, empty states, or subtle section dividers.
  - Low resolution, so do not stretch it as a full-width background.

- `assets/avi_assets/81TJwjrHmdL._AC_UF894,1000_QL80_.jpg`
  - Reuse as a cropped, blurred, or low-opacity texture for the country breakdown area.

## CSS and Layout Implications

- Hero background should use layered backgrounds:
  - `url("../../assets/avi_assets/1960x0.jpg.webp") center / cover`
  - dark left/right readability gradient
  - green bottom wash that blends into the page body

- Recommended desktop composition:
  - Keep the standings table as the dominant panel on the right.
  - Keep headline and live summary on the left.
  - Let the trophy sit visually between the copy and table, not directly behind table text.

- Recommended mobile composition:
  - Use `background-position: center top` or `center 30%`.
  - Place the standings panel below the headline with stronger glass/dark overlay.
  - Avoid putting small white text over the bright sky/stadium seating.

- Panel treatment:
  - Use fewer panels in the first viewport.
  - Standings table should feel like a premium soccer table: rank, manager, total, wins, goals, defense, bonuses, cards.
  - Countries and live games should scroll below the hero so the first screen stays clean.

- Image editing request for the photo-editing worker:
  - Create a darker, wider hero-safe derivative of `1960x0.jpg.webp`.
  - Extend or soften the left/right edges if possible.
  - Reduce brightness in the sky and stadium seats.
  - Preserve the trophy and pitch warmth.
  - Export a web-optimized derivative for the app, ideally around 1800px wide.

## Caveats

- Some assets appear to be official or third-party imagery. Keep them optional and avoid baking them into code paths that cannot be swapped.
- The PNG trophy asset includes visible watermark/checker artifacts and should not be used as a polished production element.
- The flag collage is colorful but too dense for a primary background behind live standings.
