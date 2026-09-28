# Task: T05 Industrial and Signal Art

## Status: pending

## Goal

Create the approved-reference raster asset packs for INDUSTRIAL VOID and SIGNAL MONOLITHS after the P01 visual gate is approved.

## Decision Summary

- Use the P01-reviewed asset quality, image dimensions, sprite scale, restrained finish, and previously presented images as references.
- Keep each stage's art distinct; do not reuse the Crystal palette/silhouettes with only recolored outlines.

## Implementation

### I01. Generate both stage packs

- Related Files:
  - `public/assets/game/stages/industrial-void/background.png` :: new full-screen industrial void scene.
  - `public/assets/game/stages/industrial-void/boss-background.png` :: new dedicated boss-atmosphere variant.
  - `public/assets/game/stages/industrial-void/normal-wall.png` :: new tileable industrial solid-wall texture.
  - `public/assets/game/stages/industrial-void/special-wall.png` :: new thin industrial blade/barrier texture.
  - `public/assets/game/stages/industrial-void/boss.png` :: new orbital factory/mech transparent sprite.
  - `public/assets/game/stages/industrial-void/projectile.png` :: new segmented bolt transparent sprite.
  - `public/assets/game/stages/industrial-void/laser.png` :: new thin industrial scan-beam strip.
  - `public/assets/game/stages/signal-monoliths/background.png` :: new full-screen signal monolith scene.
  - `public/assets/game/stages/signal-monoliths/boss-background.png` :: new dedicated boss-atmosphere variant.
  - `public/assets/game/stages/signal-monoliths/normal-wall.png` :: new tileable monolith solid-wall texture.
  - `public/assets/game/stages/signal-monoliths/special-wall.png` :: new thin monolith blade/barrier texture.
  - `public/assets/game/stages/signal-monoliths/boss.png` :: new signal sentinel transparent sprite.
  - `public/assets/game/stages/signal-monoliths/projectile.png` :: new geometric pulse transparent sprite.
  - `public/assets/game/stages/signal-monoliths/laser.png` :: new thin waveform scanline strip.

#### Details

- Create one image per file with built-in ImageGen; attach previous approved stage visuals as references. Backgrounds fill the whole 16:9 play field and contain no UI/text. Each moving object is a separate transparent sprite/texture.
- INDUSTRIAL VOID silhouette/material direction: dark industrial panels, restrained orange/amber, orbital-factory mechanical boss, segmented bolt, thin scan beam.
- SIGNAL MONOLITHS silhouette/material direction: dark violet signal architecture, restrained violet/blue, tall sentinel, geometric pulse, thin waveform laser.
- Preserve the P01-approved sprite dimensions/aspect strategy and keep all special/ordinary wall textures usable under clipping/tiling without implying a different hit gap.
- Inspect each output and save the final PNGs at the exact paths. If reference images cannot be used by ImageGen, pause and ask for them.

## Acceptance Criteria

- [ ] All fourteen files exist with no zero-byte assets.
- [ ] Two themes are immediately distinguishable by silhouette/material, not just hue.
- [ ] Backgrounds fill the view; transparent object assets contain clean alpha and no text/logo.
- [ ] Visual detail remains readable at the 960×540 logical game size.

## Validation

- `Get-ChildItem public/assets/game/stages/industrial-void,public/assets/game/stages/signal-monoliths -File` — verify all twelve expected paths.
- Open the images and compare an in-game-size composition with the P01-approved art quality — manual inspection.

## Commit Message

```text
feat(art): add industrial and signal stage assets

Plan: 2026-09-28-game-visual-asset-integration
Phase: P02-stage-expansion
Task: T05-industrial-signal-art

- add distinct Industrial Void image layers
- add distinct Signal Monoliths image layers
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
