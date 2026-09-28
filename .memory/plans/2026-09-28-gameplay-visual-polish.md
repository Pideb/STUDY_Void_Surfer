# Plan: Gameplay and Visual Polish

## Goal

Implement the confirmed gameplay and presentation refinements: clarify and tune dash interactions, introduce special walls at score 10, advance stages only after boss clears and two further walls, add continuous stage-aware motion to backgrounds and ships, animate each boss distinctly, show the selected aircraft on the title screen, and verify account score retrieval/submission. Preserve the already-working per-run shuffled stage order and the stage ID recorded on each obstacle.

## Source Decisions
- [Gameplay and Visual Polish](../decisions/2026-09-28-gameplay-visual-polish.md)

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Update dash/collision/special-wall rules and boss-gated stage progression. | [P01](../phases/2026-09-28-gameplay-visual-polish/P01-gameplay-rules/phase.md) |
| P02 | `done` | Add ordinary-flight exhaust, continuously scrolling backgrounds, individual boss idle motion, and selected-aircraft title preview. | [P02](../phases/2026-09-28-gameplay-visual-polish/P02-visual-motion/phase.md) |
| P03 | `done` | Diagnose and harden account-best-score retrieval and game-over score submission. | [P03](../phases/2026-09-28-gameplay-visual-polish/P03-leaderboard-reliability/phase.md) |

## Global Constraints
- Preserve the common logical hitbox dimensions for all aircraft; only trim 3 px from its forward edge for collision checks.
- All dash windows increase by 20%: normal special wall 0.30 s, WARNING special wall 0.15 s, boss projectile reflection 0.18 s.
- Background motion and transition are presentation-only and must not alter wall motion, collision, scoring, or attack timing.
- Only a boss clear arms stage progression. Advance after two subsequent passed obstacles of either wall kind. Existing obstacles retain their creation-time `stageId`.
- Honor `prefers-reduced-motion` for newly added continuous visual motion.
- Keep user data and credentials out of logs/tests; do not run or apply remote Supabase migrations as part of this plan.
- Use the user's selected aircraft and its existing local image asset on the title screen; do not generate replacement artwork.
- Keep commits scoped to one Task and use the exact commit messages in each Task blueprint.

## Completion
- All Task blueprints have status `done`, focused tests and `npm run build` pass, and runtime-only account verification limitations (if any) are reported separately.
- Completed 2026-09-28. Full suite: 29 files / 176 tests passed. Production build passed. Runtime Supabase RPC behavior was not exercised against the remote project.
