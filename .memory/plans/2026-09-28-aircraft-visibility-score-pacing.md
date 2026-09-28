# Plan: Aircraft Visibility, Score, and Pace

## Goal

Apply the confirmed aircraft naming, visibility, handling, score, trail, special-wall, WARNING/BOSS cadence, and menu refinements. Difficulty progresses from unmultiplied run progress rather than elapsed time; pauses never reverse attained speed; VELOCITY's rounded final score is the score submitted and used for aircraft unlocks.

## Source Decisions
- [Aircraft Visibility, Score, and Pace](../decisions/2026-09-28-aircraft-visibility-score-pacing.md)

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Refactor score pacing, tune encounters and aircraft, and update game presentation. | [P01](../phases/2026-09-28-aircraft-visibility-score-pacing/P01-gameplay-and-aircraft/phase.md) |

## Global Constraints
- Keep the internal aircraft ID `default` stable for existing settings and leaderboard rows; present its name as NOVA.
- Keep all aircraft on the same logical player hitbox (36 x 24 game units, existing 3-unit front trim); only enlarge drawing, so visual overlap beyond hitbox is intentionally non-colliding.
- Preserve VELOCITY's 2x movement speed and 0.5x wall-spawn interval; change only its score reward to 1.5x at run end, rounded with `Math.round`.
- Keep live run score unmultiplied. Use a separate monotonic progression score for speed; pause penalties affect run score only.
- The rounded final score is submitted to Supabase, compared against account best, displayed as the final result, and used for unlock thresholds.
- Preserve boss attacks/challenges, boss-clear stage-transition rules, reduced-motion preference, and auth boundaries unless the decision explicitly changes them.
- Gap limits change only generated gap positions, not collision geometry or a moving gap's visible/collision correspondence.
- Keep title text as accessible DOM text `VOID SURFER`; implement the selected style natively, not as generated raster lettering.
- Do not apply remote Supabase migrations or write test/player records to the remote project.
- Keep commits scoped to one Task, run its focused tests, and use the exact commit message in its blueprint.

## Completion
- All four task blueprints are done and committed; full `npm test -- --run` (188 tests), `npm run build`, and `git diff --check` pass.
- Report runtime-only authenticated leaderboard/unlock checks separately if unavailable.
