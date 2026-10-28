# Task: T01 Shorter Space Cooldown

## Status: done

## Goal
Space becomes available0.7s after activation; ring matches, no queued/held-key activations or reduced barrier spacing.

## Decision Summary
- User approved0.7s; preserve dash duration.6 and special spacing1.2.

## Implementation

### I01. Shared cooldown and documentation
- Related Files: src/game/constants.js :: DASH_COOLDOWN_SECONDS (modify); README.md :: dash instructions (modify); src/game/game-engine.js :: dash (read-only); src/game/renderer.js :: drawDashCooldown (read-only).
#### Details
- **Signature & schema**: exported numeric DASH_COOLDOWN_SECONDS=.7; player.dashCooldownRemainingSeconds:number retains existing API/default0.
- **Flow**: dash() initializes remaining from shared constant; advanceDash decrements active gameplay only; renderer divides remaining by same constant. Keep existing one-press guards and freeze/reset.
- **Errors & state**: blocked dash does not restart cooldown/effect. No external error handling or schema changes.
- README says0.7s; retain0.6s immunity and1.2s special spacing text.

### I02. Existing regression assertions
- Related Files: tests/game/game-engine.test.js :: cooldown boundary test (modify); tests/game/renderer.test.js :: ring progress test (modify); existing tests/game/barrier-flow.test.js and tests/integration/dash-boss-flow.test.js (run).
- Verify blocked before700ms and accepted at700ms, no refresh on blocked press, pause freeze/restart reset; half arc uses.35s remaining. Existing high-speed/VELOCITY cases retain at least1200ms required special passage separation. No new mirrored tests needed.

## Acceptance Criteria
- [x] Shared cooldown.7s, ring and documentation agree.
- [x] Existing focused physics/rendering/spacing tests and build pass.

## Validation
- npm test -- --run tests/game/game-engine.test.js tests/game/renderer.test.js tests/game/barrier-flow.test.js tests/integration/dash-boss-flow.test.js
- npm run build
- git diff --check

## Commit Message
```text
fix(game): shorten Space cooldown to0.7 seconds

Plan: 2026-10-28-dash-cooldown-tuning
Phase: P01-tuning
Task: T01-cooldown

- Preserve0.6s dash and1.2s special-wall passage spacing
- Align existing cooldown and recharge arc assertions and docs
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 86e460e

## Result
- Existing4 focused test files /128 tests passed; build and whitespace checks passed.
- Confirmed blocked at699ms and accepted at700ms; pause freeze and restart reset remain.
- Existing high-speed/VELOCITY spacing checks retain at least1200ms. No adjacent out-of-scope issue found.
