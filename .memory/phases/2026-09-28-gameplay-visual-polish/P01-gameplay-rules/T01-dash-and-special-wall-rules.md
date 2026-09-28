# Task: T01 Dash and Special-Wall Rules

## Status: done

## Goal
Apply the agreed balance and control changes without changing aircraft dimensions or scoring: increase all three dash-success windows by 20%, introduce special walls starting at 10 score, exclude 3 px at the ship's forward edge from obstacle collision, and replace the tutorial's current SPACE sentence with `SPACE: 대시 (회피)`.

## Decision Summary
- Normal special-wall timing: 0.30 s; WARNING special-wall timing: 0.15 s; boss projectile reflection timing: 0.18 s.
- `SPECIAL_UNLOCK_SCORE` becomes 10. Keep the existing first-five-special-wall timing guide behavior.
- All aircraft keep the same `36 × 24` player model/hitbox. Trim exactly 3 logical px from the right/forward edge only during obstacle collision checks.

## Implementation

### I01. Gameplay thresholds and hitbox
- Related Files:
  - `src/game/constants.js` :: player collision trim, special unlock score, and timing constants; modify.
  - `src/game/difficulty.js` :: `getDifficulty`; read-only unless its existing derived values need a direct test seam.
  - `src/game/collision.js` :: `getPlayerBounds`, `intersectsPlayerObstacle`, `isSpecialTimingSuccess`, and `isProjectileReflectionSuccess`; modify.
  - `src/game/boss-attacks.js` :: `createBossProjectile`; verify it consumes the shared reflection-window constant; modify only if needed.
  - `tests/game/collision.test.js`, `tests/game/difficulty.test.js`, `tests/game/boss-attacks.test.js`; modify.

#### Details
- **Signatures & Types**:
  - Add `PLAYER_FRONT_HITBOX_TRIM = 3` to `src/game/constants.js`.
  - Keep `PLAYER_WIDTH = 36` and `PLAYER_HEIGHT = 24` unchanged.
  - Set `NORMAL_TIMING_WINDOW_SECONDS = 0.30`, `WARNING_TIMING_WINDOW_SECONDS = 0.15`, and `BOSS_PROJECTILE_REFLECTION_WINDOW_SECONDS = 0.18`.
  - Set `SPECIAL_UNLOCK_SCORE = 10`.
  - In `getPlayerBounds(player)`, preserve `left = player.x - player.width / 2`, `top`, and `bottom`; set `right = player.x + player.width / 2 - PLAYER_FRONT_HITBOX_TRIM`. Do not trim vertical bounds or alter out-of-bounds checks.
- **Execution Flow / Logic**:
  1. Existing `getDifficulty` must derive special probability from the new threshold and expose the selected timing-window constants unchanged by aircraft selection.
  2. Existing `isSpecialTimingSuccess` and `createBossProjectile` consume the widened constants; do not add input buffering or change dash duration.
  3. Add boundary tests proving the 3 px forward margin avoids collision only at the nose, while collision at the remaining hull and all rear/vertical collision behavior remain unchanged.
  4. Add exact threshold tests: score 9 has `specialChance === 0`, score 10 has positive normal special chance; assert warning timing is 0.15 s and normal timing is 0.30 s.
  5. Assert projectiles have `reflectionWindowSeconds === 0.18` and existing success-window geometry uses that value.
- **Error & Edge Handling**: Preserve existing finite-number validation and collision behavior for malformed/unknown player data. Do not let a negative trimmed width affect valid player dimensions.

### I02. Tutorial copy
- Related Files:
  - `src/ui/screens.js` :: `renderTutorialScreen`; modify.
  - `tests/ui/screens.test.js` :: tutorial copy test; modify.

#### Details
- Replace only the existing instruction beginning `SPACE:` with exact text `SPACE: 대시 (회피)`.
- Preserve pointer/touch lift, special-wall dash timing, pause penalty, and return-to-menu instructions.
- Test that the exact replacement is present and the prior sentence `SPACE: 언제든 대시 잔상이 남습니다` is absent.

## Acceptance Criteria
- [x] All agreed constants are exact and are exercised by unit tests.
- [x] All aircraft retain `36 × 24` model dimensions; only the forward collision edge is shortened by 3 px.
- [x] Special walls are disabled below score 10 and enabled starting at score 10.
- [x] Tutorial displays `SPACE: 대시 (회피)` and retains its other controls.

## Validation
- `npm test -- --run tests/game/collision.test.js tests/game/difficulty.test.js tests/game/boss-attacks.test.js tests/ui/screens.test.js` — all tests pass.

## Commit Message
```text
feat(game): tune dash windows and special-wall rules

Plan: 2026-09-28-gameplay-visual-polish
Phase: P01-gameplay-rules
Task: T01-dash-and-special-wall-rules

- Widen all dash timing windows by 20 percent
- Unlock special walls at score 10 and trim the collision nose by 3 px
- Clarify the tutorial SPACE description
```

## Progress
- [x] Implementation complete
- [x] Validation passed: 22 tests passed.
- commit: pending
