# Plan: Gameplay Refinements

## Goal
Improve death feedback, aircraft balance, special-wall readability, and title/viewport presentation while preserving confirmed gameplay rules. Fill the desktop/mobile browser viewport and show the selected VOID SURFER title as a real image asset.

## Source Decisions
- [Gameplay Refinements](../decisions/2026-09-29-gameplay-refinements.md)

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Add brief death feedback and tune aircraft/special-wall readability. | [P01](../phases/2026-09-29-gameplay-refinements/P01-gameplay-feedback/phase.md) |
| P02 | `done` | Fill the browser viewport and integrate the selected title as an image asset. | [P02](../phases/2026-09-29-gameplay-refinements/P02-fullscreen-and-title-art/phase.md) |

## Global Constraints
- Death effect lasts about `0.5s`; freeze gameplay and controls after lethal damage, animate only the effect, then expose game-over and submit the final score exactly once.
- VELOCITY fast-BOSS and shift-fast phases target `2.2x` base speed. Other aircraft/patterns and VELOCITY scoring stay unchanged.
- AEGIS gravity changes to `1.5x`; lift remains `0.6x`.
- Special-wall guide depicts the existing judgment window exactly; do not change timing or collision logic. Keep the guide available until the first BOSS is cleared.
- Full viewport means browser viewport only (no Fullscreen API). Stretch the 960×540 scene and UI overlay to desktop/mobile dimensions without cropping or letterboxing; non-16:9 stretching is intentional.
- Title art is a transparent image at the existing menu title position, wide geometric sci-fi lettering with restrained cyan edge light and exact text `VOID SURFER`; preserve an accessible semantic heading.
- No unrelated sound, score, unlock, obstacle, BOSS-health, or leaderboard behavior changes.

## Completion
- All Tasks are done and committed; `npm test -- --run`, `npm run build`, and `git diff --check` pass.
