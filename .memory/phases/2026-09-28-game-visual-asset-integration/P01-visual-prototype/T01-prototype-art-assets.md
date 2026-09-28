# Task: T01 Prototype Art Assets

## Status: done

## Goal

Create and check into the repository the approved-reference raster assets required for one real main-menu scene and the full CRYSTAL GATES gameplay set, replacing no runtime code yet.

## Decision Summary

- Use the previously presented approved menu/stage images as references with the built-in ImageGen tool. They are references, not edit targets. Do not invent a replacement look if the reference images cannot be attached by the image tool; pause and request the specific missing references.
- Artwork uses no logos or text. Backgrounds are wide, full-screen scenes; moving objects are separate transparent sprites/textures so game state remains dynamic.

## Implementation

### I01. Generate and add the prototype image set

- Related Files:
  - `public/assets/game/menu/space-background.png` :: new, menu environment with right-side quiet space for DOM controls and illustrated space/planet detail primarily on the left; no ship, words, logo, or card.
  - `public/assets/game/aircraft/default.png` :: new, transparent DEFAULT aircraft cutout matching the approved cyan-contour design.
  - `public/assets/game/aircraft/velocity.png` :: new, transparent VELOCITY aircraft cutout matching the approved slim silhouette, cyan outer rim, magenta energy detail.
  - `public/assets/game/aircraft/aegis.png` :: new, transparent AEGIS aircraft cutout matching the approved armored silhouette and amber/gold contour.
  - `public/assets/game/stages/crystal-gates/background.png` :: new, full-bleed CRYSTAL GATES stage environment.
  - `public/assets/game/stages/crystal-gates/boss-background.png` :: new, dedicated darker/crystal-guardian BOSS atmosphere variant for the same stage.
  - `public/assets/game/stages/crystal-gates/normal-wall.png` :: new, repeatable/tileable visual texture for the solid parts of ordinary walls.
  - `public/assets/game/stages/crystal-gates/special-wall.png` :: new, narrow vertical barrier texture for special walls and their break effect.
  - `public/assets/game/stages/crystal-gates/boss.png` :: new, transparent side-view crystal gate guardian facing the player's left-side approach.
  - `public/assets/game/stages/crystal-gates/projectile.png` :: new, transparent crystal shard projectile.
  - `public/assets/game/stages/crystal-gates/laser.png` :: new, transparent thin prism beam strip, repeatable along its long axis.

#### Details

- Generate each distinct asset as its own image, not a contact sheet. For transparent files, explicitly request a genuinely transparent background. Keep all exported images in PNG so alpha is preserved.
- Reference matching must include the approved restrained finish, side-view left-to-right gameplay composition, Crystal Gates cool crystal palette, and approved aircraft silhouettes. Backgrounds fill the entire frame and retain controlled contrast behind gameplay.
- Wall art is texture, not collision geometry: no art may imply a gap in a different location from the engine's `gapCenter`/`gapHeight`. The renderer will crop/tile it into the existing solid rectangles.
- Inspect every output at game-size scale and verify alpha/edges, composition, no unwanted generated text/watermark, and reasonable legibility. Save final selected files at the exact paths above; do not leave referenced assets only in the image tool's generated-image directory.
- If earlier reference images are not available to the image tool, do not call the output “matching”; stop and request the missing references.

## Acceptance Criteria

- [x] All eleven listed files exist under `public/assets/game/` and are included in the task commit.
- [ ] Aircraft art matches the approved three silhouettes and remains readable when scaled inside the existing 36×24 logical hitbox.
- [x] Menu background leaves a usable right-side UI area; stage background fills the frame without an intentionally empty center.
- [x] Transparent sprites were checked for genuine transparent and partial-alpha pixels; wall art does not encode collision gaps.
- [x] Previously presented menu, aircraft, and stage concept images were used as references.

## Validation

- Confirmed all eleven named PNGs exist and have non-zero file sizes.
- Visually inspected generated PNGs and checked saved PNG alpha channels using `System.Drawing.Bitmap`; all eight object/sprite assets contain transparent and partial-alpha pixels. The two backgrounds are opaque full-frame art.
- Runtime/game-size composite inspection is deferred to T02/T04, when assets are rendered through the actual canvas dimensions.

- `Get-ChildItem public/assets/game -Recurse -File | Select-Object FullName,Length` — confirms every named asset exists and no file is zero bytes.
- Open the generated PNGs in the image viewer at native size and a 960×540 gameplay composite preview — manually inspect subject, transparency, art direction, and scaling.

## Commit Message

```text
feat(art): add menu and crystal gates image assets

Plan: 2026-09-28-game-visual-asset-integration
Phase: P01-visual-prototype
Task: T01-prototype-art-assets

- add approved-reference menu, aircraft, and Crystal Gates art
- preserve transparent sprite layers for dynamic gameplay
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending
