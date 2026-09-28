# Task: T02 Encounter Cadence, Gap Continuity, and Special-Wall Feedback

## Status: done

## Goal
Alternate regular WARNING and BOSS encounters, keep successive wall openings reachable at high speed, show special-wall timing guides until the first boss is defeated (with VELOCITY gap limiting from run start), and make successful special-wall destruction impactful at the player's crossing height.

## Decision Summary
- WARNING event 1 is regular; event 2 is BOSS; continue alternating.
- At progression score 60+, constrain each new gap center to at most 70% of the new gap height from the previous wall's base center. VELOCITY uses the limit from score 0.
- Show timing guides for each special wall before the first boss clear; on success draw a centered expanding shock ring and outward fragments.

## Implementation

### I01. Alternate WARNING/BOSS and constrain gap-center changes
- Related Files:
  - `src/game/constants.js` :: add `GAP_CONTINUITY_SCORE = 60`, `MAX_GAP_CENTER_SHIFT_FACTOR = 0.7`.
  - `src/game/difficulty.js` :: `getDifficulty`; derive one-based warning index and mark even indices as BOSS; first WARNING remains regular.
  - `src/game/game-engine.js` :: `startWarningIfNeeded`, `spawnObstacle`, `getCurrentDifficulty`, `start`; use even-index cadence; store prior generated/base gap center and reset it per run.
  - `src/game/obstacles.js` :: `createObstacle`; preserve `baseGapCenter` as the generated fixed anchor for moving gaps.
  - `tests/game/difficulty.test.js`, `tests/game/game-engine.test.js`, `tests/game/obstacles.test.js` :: test cadence and continuity bounds.

#### Details
- Generate candidate center with existing uniform `createGapCenter(gapHeight,rng)` in valid `[gapHeight/2, WORLD_HEIGHT-gapHeight/2]` bounds.
- If prior wall exists and (`progressionScore >= 60` or `aircraft.id === 'velocity'`), clamp candidate to previous `baseGapCenter ± gapHeight * 0.7`, intersected with valid world bounds. Pass result into `createObstacle`; save its `baseGapCenter` as next anchor.
- First obstacle remains unrestricted. Apply to normal/special walls, regular WARNING/BOSS walls; do not alter gap height or moving-gap animation.
- Use generated base center rather than current animated `gapCenter` as next anchor.
- Both `getDifficulty().isBoss` and `startWarningIfNeeded()` use `warningIndex % 2 === 0`; retain score-based random warning interval, boss wall counts/minimum specials, attacks/challenges, and stage transition behavior.

### I02. Keep timing guidance through boss 1 and enhance break rendering
- Related Files:
  - `src/game/constants.js` :: replace/remove `SPECIAL_TIMING_GUIDE_COUNT`; add named special break effect lifetime, target 0.65 s.
  - `src/game/game-engine.js` :: run state, `start`, `spawnObstacle`, `completeBossIfReady`, `dash`, `update`, `getSnapshot`; track/reset `firstBossCleared`; guides active while false; set true only when encounter number 1 clears; store break center/duration/seed on success.
  - `src/game/renderer.js` :: `drawObstacle`; add shock-ring and radial-fragment helper anchored at obstacle x-center and `breakEffect.centerY`; animate from normalized remaining duration; keep open area centered at crossing point.
  - `src/game/visual-theme.js` :: break fragment/ring palette, using high-contrast cyan/white or stage accent with bounded glow.
  - `tests/game/game-engine.test.js`, `tests/game/renderer.test.js` :: guide lifetime and centered burst rendering.

#### Details
- Add run boolean `firstBossCleared`, initially false/reset on start. `showTimingGuide = kind === 'special' && !firstBossCleared`; do not count-limit. Guides continue during boss 1 and disappear after it.
- Set `firstBossCleared = true` only in the successful clear path for boss number 1 in `completeBossIfReady()`.
- On successful special dash, retain `breakEffect.centerY = player.y`; initialize `durationSeconds = remainingSeconds = 0.65` and a deterministic seed from the injected engine RNG (renderer must not call random).
- Renderer progress `p=1-remainingSeconds/durationSeconds`; expand and fade one shock ring at wall horizontal center/player crossing y, plus a controlled set of larger radial shards. Keep the opening at this y. Avoid obscuring player or playfield.
- Do not change dash success timing, collision result, normal walls, or failure effect behavior.

## Acceptance Criteria
- [x] Regular WARNING and BOSS alternate from first regular WARNING.
- [x] Gap-center shift is at most 70% of next gap height from score 60, or from run start for VELOCITY; bounds and first wall remain valid.
- [x] Moving gaps use base center as next spawn anchor.
- [x] Guides remain on all special walls through boss 1 and hide after boss 1 clears.
- [x] Special success has a visible centered shock ring and large outward fragments for about 0.65 seconds without collision changes.

## Validation
- `npm test -- --run tests/game/difficulty.test.js tests/game/game-engine.test.js tests/game/obstacles.test.js tests/game/renderer.test.js`
- `git diff --check`

## Commit Message
```text
feat(gameplay): alternate bosses and preserve reachable wall gaps

Plan: 2026-09-28-aircraft-visibility-score-pacing
Phase: P01-gameplay-and-aircraft
Task: T02-encounter-continuity

- Alternate standard WARNING and BOSS encounters
- Constrain high-speed gap shifts and improve special-wall feedback
```

## Progress
- [x] Implementation complete
- [x] Validation passed: focused 4-file suite (61 tests), `git diff --check`
- commit: `feat(gameplay): alternate bosses and preserve reachable wall gaps`
