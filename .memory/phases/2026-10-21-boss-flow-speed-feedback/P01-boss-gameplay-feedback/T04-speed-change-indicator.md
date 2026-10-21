# Task: T04 Speed Change Indicator

## Status: done

## Goal
Show a clear, short top-of-screen indicator while the engine is accelerating or decelerating, so players can anticipate the selected one-second speed transition.

## Decision Summary
- Use `>> 가속` for increasing speed and `<< 감속` for decreasing speed.
- The indicator is visible only while the one-second speed transition is active and is absent at a steady speed.

## Implementation

### I01. Add accessible HUD feedback and styling
- Related Files:
  - `src/ui/game-hud.js` :: `createGameHud`, `update` — create/update a dedicated speed-change indicator; modify
  - `src/styles.css` :: `.warning-banner`, `.game-hud` and nearby HUD rules — position and style a distinct compact indicator at the screen top; modify
  - `tests/ui/game-hud.test.js` :: speed indicator rendering tests; modify
  - `src/game/game-engine.js` :: `getSnapshot` — provide `speedChange` from current transition state; modify if not completed in T03
- **Signatures & Types**:
  ```js
  // Snapshot contract:
  // speedChange: null | { direction: 'up' | 'down', remainingSeconds: number }
  ```
- **Data & Schema Fields**:
  - `speedChange` is transient presentation state; no storage, network, or leaderboard fields are added.
- **Execution Flow / Logic**:
  1. Add an element with class `speed-change-indicator`, an appropriate status/live-region role, and `aria-hidden`/hidden behavior for the inactive state.
  2. In `update(snapshot)`, render `>> 가속` for `direction === 'up'`, `<< 감속` for `direction === 'down'`, and hide for null/unknown direction.
  3. Keep the indicator visually separate from the WARNING/BOSS banner so both can be read without replacing one another.
  4. Style for the existing neon palette, high contrast, compact top placement, and reduced-motion preference; do not move the HUD or obstruct gameplay controls.
  5. Make repeated snapshots with the same transition direction avoid needless live-region announcements; announce once at transition start if the existing HUD update pattern permits.
- **Error & Exception Handling**: Treat missing, malformed, or non-finite `remainingSeconds` as inactive; unknown directions hide safely.
- **State Transition & Return**: Indicator appears at target speed change, remains through the one-second ramp, and hides when the engine reaches a steady target.

### I02. Verify indicator state transitions
- Related Files:
  - `tests/ui/game-hud.test.js` :: visible up/down and hidden steady-state assertions — modify
  - `tests/game/game-engine.test.js` :: snapshot speedChange lifetime assertions — modify if needed
- **Test Cases**: Up direction displays `>> 가속`; down direction displays `<< 감속`; null and invalid direction are hidden; progress to transition completion hides the indicator.

## Acceptance Criteria
- [ ] Top HUD clearly shows acceleration/deceleration while a transition is active.
- [ ] WARNING/BOSS announcements remain independently visible and unchanged.
- [ ] No speed indicator is shown during steady speed.
- [ ] Missing/invalid snapshot data does not break HUD rendering.

## Validation
- `npm test -- --run tests/ui/game-hud.test.js tests/game/game-engine.test.js` — all targeted tests pass.
- `npm run build` — production build succeeds.

## Commit Message
```text
feat(ui): show speed transition feedback

Plan: 2026-10-21-boss-flow-speed-feedback
Phase: P01-boss-gameplay-feedback
Task: T04-speed-change-indicator

- Display acceleration and deceleration cues during speed ramps
- Preserve boss/warning banners and accessible HUD feedback
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
