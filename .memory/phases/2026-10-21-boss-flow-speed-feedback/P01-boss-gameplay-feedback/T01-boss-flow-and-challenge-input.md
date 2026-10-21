# Task: T01 Boss Flow and Challenge Input

## Status: done

## Goal
Ensure active WASD challenges accept the requested keys when a game button retains focus, and prove repeated boss attack/wall waves continue through successful and timed-out challenges.

## Decision Summary
- Preserve the established boss cadence: at least two normal walls between projectile attacks, no overlap between special walls and projectiles, and existing challenge failure feedback without changing failure into game over.
- The controller must not discard challenge keys merely because focus remains on a button; editable text controls remain protected.

## Implementation

### I01. Route active challenge input before non-editable focus filtering
- Related Files:
  - `src/ui/app-controller.js` :: `handleKeyDown` — route WASD to `gameEngine.handleChallengeKey` before the generic button-focus early return; modify
  - `tests/ui/app-controller.test.js` :: `routes only WASD to an active challenge and suppresses flight/pause inputs` — cover a focused button and editable controls; modify

#### Details
- **Signatures & Types**:
  ```js
  function handleKeyDown(event) // event: KeyboardEvent; return: void
  ```
- **Data & Schema Fields**:
  - Challenge state remains `{ active: boolean, sequence: string[], cursor: number }`; no new persistent fields.
- **Execution Flow / Logic**:
  1. Preserve admin-dialog keyboard handling.
  2. If target is an input, textarea, select, or contenteditable element, do not steal text-entry keys.
  3. If the game is playing and `state.snapshot?.challenge?.active`, consume WASD and call `gameEngine.handleChallengeKey(event.code)` regardless of whether the focused target is a button. Consume Space without dashing; do not allow pause shortcuts during the challenge.
  4. Only after challenge handling, retain the existing button/link focus guard for ordinary game shortcuts.
- **Error & Exception Handling**: Keep optional chaining for engine adapters/mocks and always `preventDefault()` for handled challenge keys.
- **State Transition & Return**: Correct challenge input advances the engine cursor immediately; ordinary controls keep their current behavior.

### I02. Add boss-wave liveness regression coverage
- Related Files:
  - `src/game/game-engine.js` :: `startNextBossWallWaveIfNeeded`, `processPassedObstacles`, `scheduleBossAttack`, `updateBossAttack`, `resolveChallenge` — inspect and modify only if the regression exposes a progression deadlock; modify if needed
  - `tests/game/game-engine.test.js` :: boss progression tests — exercise at least four projectile waves with challenge success and timeout paths; modify
  - `tests/game/boss.test.js` :: boss state transition unit tests — extend only for a demonstrated missing transition; modify if needed

#### Details
- **Data & Schema Fields**:
  - Preserve `bossEncounter.normalWallsSinceProjectile`, `awaitingNextWave`, `wallSpawningPaused`, `attack`, `hp`, and `warningSession.spawnedCount` semantics unless a failing test proves a specific transition is invalid.
- **Execution Flow / Logic**:
  1. Create a deterministic runtime engine for boss number 3 or later with invincibility enabled to isolate progression from collision deaths.
  2. Drive special-wall timing dashes and projectile reflections only when the snapshot indicates a valid reflection window and vertical tolerance.
  3. On one challenge path, submit each sequence key; on another, leave the challenge unanswered until its existing timer expires.
  4. Assert that after a resolved projectile the attack clears, a new wall wave spawns, the two-normal-wall cooldown is re-applied, and neither path leaves `challenge.active` or `wallSpawningPaused` stuck indefinitely.
  5. Assert multiple distinct projectile IDs and wall waves are observed; do not change HP, cooldown, or challenge difficulty rules to make the test pass.
- **Error & Exception Handling**: Keep the test bounded by a fixed simulated-time/frame budget; on failure include boss/warning snapshot state in assertion context.
- **State Transition & Return**: Existing valid lifecycle remains `wave complete -> attack -> reflection/miss -> optional challenge -> attack resolved -> next wall wave`.

## Acceptance Criteria
- [ ] WASD challenge input is accepted when a button is focused and does not steal input from editable text controls.
- [ ] Deterministic integration coverage proves repeated boss attacks and wall waves continue after challenge success and timeout.
- [ ] Existing boss cadence and challenge failure behavior remain unchanged.

## Validation
- `npm test -- --run tests/ui/app-controller.test.js tests/game/game-engine.test.js tests/game/boss.test.js` — all targeted tests pass.

## Commit Message
```text
fix(boss): keep challenge input and boss waves progressing

Plan: 2026-10-21-boss-flow-speed-feedback
Phase: P01-boss-gameplay-feedback
Task: T01-boss-flow-and-challenge-input

- Route challenge keys when a button retains focus
- Cover repeated boss waves and challenge resolution paths
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
