# Processed Landing Assets

Prepared by Priya for the `avi-landing` concept.

## Chosen Source

- Source image: `assets/avi_assets/LKASMMMRZZBJNFPUMKZWGKH4IQ.jpg`
- Reason: wide real-stadium composition, strong soccer context, usable center crop for mobile, and enough open visual structure to support a standings table overlay after darkening.

## Generated Assets

- `landing-background-desktop.jpg`
  - 1920 x 1080 wide crop for desktop/laptop landing views.
- `landing-background-mobile.jpg`
  - 1080 x 1920 portrait crop for phone-first landing views.
- `landing-background-overlay.svg`
  - Dark green stadium-readability overlay with subtle warm spotlight and table-clearance tint.

## Recommended CSS Treatment

```css
.landing-shell {
  background-image:
    url("../../assets/processed/landing-background-overlay.svg"),
    image-set(
      url("../../assets/processed/landing-background-desktop.jpg") 1x
    );
  background-size: cover;
  background-position: center;
}

@media (max-width: 760px) {
  .landing-shell {
    background-image:
      url("../../assets/processed/landing-background-overlay.svg"),
      image-set(
        url("../../assets/processed/landing-background-mobile.jpg") 1x
      );
    background-position: center top;
  }
}
```

Use an additional local panel treatment for the standings table, for example `rgba(255, 248, 230, 0.92)` plus a soft shadow, rather than relying on the background alone for contrast. For text placed directly over the image, keep it on the darker left/top zones created by the overlay.
