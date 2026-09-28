# Plan: Game Visual Assets and Flow Fixes

## Goal

Integrate image art for every existing stage and resolve the hangar, collision-guide, stage-transition, account-score, and score-submission issues so the live game consistently matches the approved visual direction and account flow.

## Source Decisions

- [Game Visual Assets and Flow Fixes](../decisions/2026-09-28-game-visual-assets-and-flow-fixes.md)
- Existing stage catalog and Crystal Gates prototype assets remain the source of gameplay dimensions and visual conventions.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Generate and wire the five missing stage art packs while preserving the Crystal Gates pack. | [P01](../phases/2026-09-28-game-visual-assets-and-flow-fixes/P01-asset-expansion/phase.md) |
| P02 | `pending` | Apply hangar previews, score-state reliability, guide visibility, and stage-owned obstacle rendering. | [P02](../phases/2026-09-28-game-visual-assets-and-flow-fixes/P02-flow-fixes/phase.md) |
| P03 | `pending` | Run full regression, build, asset-path, and manual visual checks. | [P03](../phases/2026-09-28-game-visual-assets-and-flow-fixes/P03-regression/phase.md) |

## Global Constraints

- Keep all gameplay collision geometry, timing, score rules, and RNG unchanged unless a task explicitly changes only visual ownership or asynchronous UI state.
- Use local PNG files only; no remote image URLs or runtime image-generation dependency.
- Keep backgrounds full-bleed and low-contrast enough for player, gaps, projectiles, and laser telegraphs to remain readable.
- Preserve the 960x540 logical canvas and the existing 1.5-second right-to-left transition with reduced-motion support.
- Preserve the existing first-five-special-wall timing guide; do not expose generic player/obstacle hitboxes.
