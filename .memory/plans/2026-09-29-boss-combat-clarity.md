# Plan: BOSS Combat Clarity

## Goal

Reduce BOSS entry speed spikes, preview the selected BOSS pattern before the encounter while play continues, make projectile and trajectory telegraphs readable and accurate, and explain the true BOSS clear condition before a run.

## Source Decisions
- [BOSS Combat Clarity](../decisions/2026-09-29-boss-combat-clarity.md)

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Tune BOSS pacing, telegraph projectiles accurately and clearly, and teach the clear rules. | [P01](../phases/2026-09-29-boss-combat-clarity/P01-boss-readability/phase.md) |

## Global Constraints
- Slow/fast BOSS speed multipliers are `0.75` and `1.25`; shift alternates them every two elapsed seconds. Aircraft multipliers, including VELOCITY's `2x`, remain applied afterward.
- Preview the chosen BOSS pattern for 1.5 seconds before the BOSS encounter activates. Gameplay continues at the pre-BOSS difficulty during this preview; do not freeze the run.
- Choose the BOSS pattern once and retain that exact pattern through preview and encounter activation.
- Render predicted trajectory points from the same direct/parabolic position formula and curve amplitude as the projectile's actual flight.
- Improve contrast without changing projectile speed, charge duration, reflection window, collision bounds, or BOSS damage rules.
- Tutorial says reflections reduce BOSS HP; BOSS 1–4 need 3 reflections, BOSS 5+ need 5; WASD challenge success does not deal damage.
- Keep all edits within the confirmed scope; no sound, balance, or BOSS attack frequency changes.

## Completion
- All three Task blueprints are done and committed; full `npm test -- --run`, `npm run build`, and `git diff --check` pass.
