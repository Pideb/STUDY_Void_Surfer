# Task: T01 Generate Stage Art Packs

## Status: done

## Goal

Create and save the 35 missing PNG assets for `industrial-void`, `signal-monoliths`, `gravity-well`, `abyssal-beast`, and `solar-forge`, matching the existing approved restrained sci-fi stage direction and preserving separate transparent gameplay sprites.

## Decision Summary

- Use one full-bleed normal background and one darker BOSS background per stage.
- Use separate normal-wall and special-wall textures; they are visual textures only and must not encode collision gaps.
- Use transparent side-view boss, projectile, and long-strip laser sprites with no text, logos, watermark, or generated UI.

## Implementation

### I01. Generate stage backgrounds

- Related Files:
  - `public/assets/game/stages/industrial-void/background.png` :: new normal full-screen industrial void environment.
  - `public/assets/game/stages/industrial-void/boss-background.png` :: new darker industrial BOSS environment.
  - `public/assets/game/stages/signal-monoliths/background.png` :: new normal full-screen signal monolith environment.
  - `public/assets/game/stages/signal-monoliths/boss-background.png` :: new darker signal BOSS environment.
  - `public/assets/game/stages/gravity-well/background.png` :: new normal full-screen gravity-well environment.
  - `public/assets/game/stages/gravity-well/boss-background.png` :: new darker gravity BOSS environment.
  - `public/assets/game/stages/abyssal-beast/background.png` :: new normal full-screen abyssal environment.
  - `public/assets/game/stages/abyssal-beast/boss-background.png` :: new darker abyssal BOSS environment.
  - `public/assets/game/stages/solar-forge/background.png` :: new normal full-screen solar-forge environment.
  - `public/assets/game/stages/solar-forge/boss-background.png` :: new darker solar BOSS environment.

#### Details

- Generate each file as its own 16:9 raster scene with the stage palette already declared in `src/game/stages.js` and `src/game/visual-theme.js`.
- Keep all gameplay lanes visually usable edge-to-edge; avoid a deliberately blank center and avoid high-frequency detail behind the player path.
- BOSS variants should feel urgent through lighting, scale, and atmosphere rather than text.

### I02. Generate solid and transparent gameplay art

- Related Files:
  - Each stage directory above plus `normal-wall.png`, `special-wall.png`, `boss.png`, `projectile.png`, `laser.png`.

#### Details

- Wall textures may be opaque and tileable; special walls must be visually narrow and approximately straight so the fixed collision geometry remains legible.
- Boss, projectile, and laser files must have genuine transparent backgrounds. Boss and projectile sprites face the player’s leftward approach; laser sprites are thin repeatable strips.
- Keep the six stage identities distinct: industrial metal/orange, signal violet/blue monolith, gravity violet/indigo lensing, abyssal teal organic, and solar orange furnace.

### I03. Validate generated files

- Related Files:
  - `scripts/` or PowerShell inspection commands :: read-only validation; no runtime code changes.

#### Details

- Confirm all 35 files exist, are non-zero PNGs, and have expected alpha for transparent sprites.
- Inspect representative backgrounds, walls, bosses, projectiles, and lasers at game size for readability and no text/watermarks.

## Acceptance Criteria

- [ ] All 35 missing files exist under `public/assets/game/stages/`.
- [ ] Every stage has seven files with distinct palette-consistent art.
- [ ] Transparent sprites retain alpha and walls do not imply collision gaps.

## Validation

- `Get-ChildItem public/assets/game/stages -Recurse -File | Select-Object FullName,Length`
- PNG alpha and representative visual inspection using the local image viewer.

## Commit Message

```text
feat(art): add remaining stage visual asset packs

Plan: 2026-09-28-game-visual-assets-and-flow-fixes
Phase: P01-asset-expansion
Task: T01-generate-stage-art-packs

- add normal and boss backgrounds for five stages
- add stage-specific walls, bosses, projectiles, and lasers
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending
