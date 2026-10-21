# Current Context

## Active Plan
[Boss Flow and Speed Feedback](./plans/2026-10-21-boss-flow-speed-feedback.md)

## Active Phase
[P01 Boss Gameplay Feedback](./phases/2026-10-21-boss-flow-speed-feedback/P01-boss-gameplay-feedback/phase.md)

## Active Task
[T05 Boss Wave Wall Guarantee](./phases/2026-10-21-boss-flow-speed-feedback/P01-boss-gameplay-feedback/T05-boss-wave-wall-guarantee.md)

## Status
- T01 completed: focused-button WASD routing and boss wave integration tests passed.
- T02 completed: moving-gap cadence is 4.8s normal and 3.2s WARNING/BOSS; 43 related tests pass.
- T03 completed: boss base speed locks at encounter start and speed changes interpolate over one second; 47 engine/difficulty tests pass.
- T04 completed: top HUD shows `>> 가속` / `<< 감속` during one-second transitions; 44 HUD/engine tests and production build pass.
- Added T05 after a deterministic `rng: 0.4` reproduction showed all seven boss walls could be special, preventing the two-normal-wall attack cooldown from ever completing.

## Next Step (IMPORTANT)
Read T05 and guarantee enough normal walls per boss wave to enable the next projectile.
