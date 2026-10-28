# Plan: Cooldown, Speed and Boss Tuning

## Goal
Implement the [confirmed decisions](../decisions/2026-10-29-cooldown-speed-boss-tuning.md): fixed actual speed growth, small upper-left cooldown ring, .70s player firing, exact guidance, random3..6 wall-free projectiles and15% line-laser margins. Preserve scoring, hitboxes, boss lifecycle and mobile/desktop input.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | in_progress | Runtime tuning, UI and regression evidence | [P01](../phases/2026-10-29-cooldown-speed-boss-tuning/P01-runtime/phase.md) |

## Execution Order
1. T01 fixed speed and shared100-point cap; prove actual aircraft targets and future spacing.
2. T02 approved cooldown ring, .70s manual firing, descriptions and exact tutorial text.
3. T03 random3..6 wall-free signatures and interior15% line lasers.
4. T04 full integration suite, build/config, actual-screen evidence, README and memory closure.

## Scope and Safeguards
- Single phase: all changes belong to the existing game runtime and UI; no external integration gate.
- Each task is independently validated and committed before pointer advance.
- Preserve16x16 damage /56x36 special activation, Space.70s cooldown, recharge10s, scoring and boss factors. No DB/auth/deployment changes.
- Actual VELOCITY increment must be+10 after its movement factor. `getBaseSpeed` remains a pre-aircraft-multiplier value; normalize only the increment by the aircraft multiplier.
- Stage trajectory identity must survive count randomization; wall-flight remains one projectile.
- Final build must finish before `verify:config`, which reads dist.
- No unrelated adjacent issue has been identified during planning.
