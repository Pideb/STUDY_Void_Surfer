# Plan: Game Visual Asset Integration

## Goal

Replace the current procedural-color look with the previously presented visual direction as actual game artwork. First deliver a reviewable main-menu + CRYSTAL GATES vertical slice using full-screen background art and separate transparent sprites, hide stage/aircraft identity labels during gameplay, and use a 1.5-second right-to-left scene push when stages change. Only expand to the other five stage art packs after the user approves the prototype.

## Source Decision

- [Game Visual Asset Integration](../decisions/2026-09-28-game-visual-asset-integration.md)
- Existing approved stage art references and aircraft designs are described in [Aircraft and Boss Gameplay](../decisions/2026-09-23-aircraft-boss-gameplay.md), D06, D26–D28.
- Existing menu direction is described in [Menu and Dash Feedback](../decisions/2026-09-22-menu-dash-feedback.md), D01/D05, and [Aircraft and Boss Gameplay](../decisions/2026-09-23-aircraft-boss-gameplay.md), D21–D23.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Create and integrate a complete main-menu + CRYSTAL GATES image-art prototype, remove in-play stage/aircraft labels, and verify the 1.5-second right-to-left transition. | [P01](../phases/2026-09-28-game-visual-asset-integration/P01-visual-prototype/phase.md) |
| P02 | `pending` | After explicit prototype approval, create and integrate image art for the remaining five stages and run cross-stage/performance QA. | [P02](../phases/2026-09-28-game-visual-asset-integration/P02-stage-expansion/phase.md) |

## Global Constraints

- Reuse the previously presented images as ImageGen references. If the built-in image tool cannot access the needed older conversation images, stop and ask for the missing references instead of silently substituting an unrelated style.
- Raster art is visual only. Keep engine obstacle/player/projectile coordinates, timing windows, hitboxes, score rules, and safe-path checks as the sole source of gameplay truth. Each stage gets both a normal full-screen background and its approved dedicated BOSS-atmosphere background.
- Draw stage backgrounds full-bleed across the existing 960×540 logical canvas; do not leave a specially empty center. Preserve contrast so the player, wall openings, projectile paths, and laser telegraphs remain readable.
- Keep the restrained approved visual language; avoid generic glowing outlines as the primary visual treatment, in-image lettering/logos, visual clutter, and artwork outside the relevant stage's palette/silhouette.
- The gameplay HUD must not visibly render the stage/region name or selected aircraft name. Score, mute/pause controls where applicable, WARNING/BOSS, boss health, attack cues, and challenge status remain.
- Incoming stage art enters from the right and pushes the current art left over 1.5 seconds. Use a smooth ease-in/ease-out curve. Do not pause or alter obstacle motion, collision geometry, scoring, or RNG to perform the visual transition.
- Respect `prefers-reduced-motion`; retain a short/non-spatial visual transition for reduced-motion users while keeping the new scene identifiable.

## Execution Gate

P02 must not start until the user has seen the integrated P01 menu/gameplay preview and explicitly approved its visual direction. If the user requests changes, record and implement those changes in P01 before advancing.
