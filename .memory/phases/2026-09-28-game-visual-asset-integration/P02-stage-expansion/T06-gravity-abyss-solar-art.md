# Task: T06 Gravity, Abyss, and Solar Art

## Status: pending

## Goal

Create the approved-reference raster asset packs for GRAVITY WELL, ABYSSAL BEAST, and SOLAR FORGE using the visual quality approved in P01.

## Decision Summary

- Preserve each already-approved stage identity and the P01 prototype's art scale, readability, and layering conventions.
- Keep all hazard/physics geometry in the engine; artwork must not define safe zones or collision openings.

## Implementation

### I01. Generate three stage packs

- Related Files:
  - `public/assets/game/stages/gravity-well/{background,boss-background,normal-wall,special-wall,boss,projectile,laser}.png` :: seven new assets.
  - `public/assets/game/stages/abyssal-beast/{background,boss-background,normal-wall,special-wall,boss,projectile,laser}.png` :: seven new assets.
  - `public/assets/game/stages/solar-forge/{background,boss-background,normal-wall,special-wall,boss,projectile,laser}.png` :: seven new assets.

#### Details

- GRAVITY WELL direction: dark violet full-screen gravitational environment; visually distinct wall/vertical blade; transparent crescent/black-hole boss, dark-violet orb projectile, thin lensing beam.
- ABYSSAL BEAST direction: restrained deep-space teal environment; distinct wall/tendril barrier; transparent organic leviathan/tentacle boss, cyan organic projectile, thin ripple beam.
- SOLAR FORGE direction: dark obsidian/amber environment; distinct mechanical wall/blade; transparent heavy solar-machine boss, angular molten projectile, thin heat-shimmer beam.
- Generate each of the 18 files as an individual asset with the previously shown images as references. Backgrounds are edge-to-edge with no empty center. All moving objects are separated and transparent; no generated HUD/text/logos.
- Wall texture must tile/crop to the exact existing wall-solid rectangles; beam texture may repeat along the long axis but never changes engine laser Y/thickness/safe-zone values.
- Inspect all images at native resolution and logical game scale; save only reviewed outputs to the listed stable project paths. If the historical references are unavailable to ImageGen, pause instead of silently designing substitutes.

## Acceptance Criteria

- [ ] All twenty-one assets exist and are non-empty.
- [ ] Three themes have distinct backgrounds, stage-specific boss/object silhouettes, and the approved restrained visual language.
- [ ] Transparent assets have clean edges and no nontransparent background rectangle.
- [ ] Visual safe-path and collision parameters remain entirely data-driven by the existing engine.

## Validation

- `Get-ChildItem public/assets/game/stages/gravity-well,public/assets/game/stages/abyssal-beast,public/assets/game/stages/solar-forge -File` — verify all eighteen expected paths.
- Open each generated asset and inspect representative full gameplay compositions at 960×540 — manual visual review.

## Commit Message

```text
feat(art): add gravity abyss and solar stage assets

Plan: 2026-09-28-game-visual-asset-integration
Phase: P02-stage-expansion
Task: T06-gravity-abyss-solar-art

- add Gravity Well and Abyssal Beast image layers
- add Solar Forge image layers
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
