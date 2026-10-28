# Phase: P01 Runtime Refinements

## Tasks
| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | done | Dash cooldown, one-press input, projectile protection and offscreen lifetime | [T01](./T01-dash-projectiles.md) |
| T02 | done | Speed-aware mandatory barrier spacing | [T02](./T02-barrier-spacing.md) |
| T03 | done | Frequent dual lasers, distributed volleys and live roar | [T03](./T03-boss-scheduler.md) |
| T04 | done | Admin hitbox display and full-height fixed portal | [T04](./T04-debug-portal.md) |
| T05 | done | Integrated regression and actual renderer validation | [T05](./T05-final-verification.md) |

## Progress
- done: 5/5 (active: none)
- Completed 2026-10-28. Final verification `407ee14`; full suite41 files/556 tests, build/config and browser captures passed.

## Constraints
Execute sequentially with specified commits. The user authorizes plan plus execution. Projectiles may fire with special walls without a wall-type/timing gate. Preserve laser safety, score/aircraft/account contracts and approved assets.
