# Plan: Gameplay Final Tweaks

## Goal
Apply the confirmed AEGIS tuning and tutorial copy, and fix viewport overflow so the existing landscape game view remains fully inside the browser viewport on desktop and mobile.

## Source Decisions
- [Gameplay Final Tweaks](../decisions/2026-09-29-gameplay-final-tweaks.md)

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Updated AEGIS balance and briefing copy, and constrained viewport layout without changing the established visual policy. | [P01](../phases/2026-09-29-gameplay-final-tweaks/P01-gameplay-and-viewport/phase.md) |

## Global Constraints
- Keep AEGIS gravity at `1.3` and lift at `0.7` multipliers.
- Keep mobile gameplay landscape; do not center or redesign UI content beyond correcting overflow.
- Preserve the 960x540 logical coordinate system, full viewport rendering, safe-area support, and current screen-specific horizontal placement.
- Do not change unrelated scoring, bosses, aircraft, obstacles, or login/leaderboard behavior.

## Completion
- All three tasks completed and validated. Test suite and production build pass.
