# Task: T01 BOSS Speed and Pre-Entry Pattern Preview

## Status: done

## Goal
Remove the abrupt BOSS speed spike and show the selected BOSS pattern for 1.5 seconds before BOSS mode activates, without pausing the player or losing the selected pattern.

## Decision Summary
- Set slow/fast modifiers to `0.75x`/`1.25x`; shift alternates between them every 2 seconds. During the 1.5-second preview, continue normal gameplay at pre-BOSS difficulty.
- Store the selected pattern once in `bossPreview`, transfer it to the BOSS warning session after the timer elapses, then apply the selected pattern's speed modifier.

## Implementation

### I01. Tune BOSS pattern speed multipliers
- Related Files:
  - `src/game/constants.js` :: `BOSS_SLOW_MULTIPLIER`, `BOSS_FAST_MULTIPLIER`; set to `0.75` and `1.25`.
  - `src/game/difficulty.js` :: `getBossSpeedMultiplier`, `getDifficulty`; preserve shift's existing 2-second cadence while using new constants.
  - `tests/game/difficulty.test.js` :: assert slow/fast/shift values and elapsed-time boundaries.

#### Details
- `getBossSpeedMultiplier('slow', elapsedSeconds)` returns `0.75` at every elapsed time.
- `getBossSpeedMultiplier('fast', elapsedSeconds)` returns `1.25` at every elapsed time.
- `getBossSpeedMultiplier('shift', elapsedSeconds)` returns `0.75` when `floor(max(0, elapsedSeconds)/2)` is even, otherwise `1.25`.
- `getDifficulty().scrollSpeed` remains `baseSpeed * bossSpeedMultiplier`; `applyAircraftDifficulty()` continues to apply the selected craft multiplier on top.
- Do not change base score pacing, WARNING speed, projectile speed factors, spawn intervals, or BOSS attack cadence.

### I02. Add pending pre-BOSS state, activate after 1.5 seconds, and show the pattern
- Related Files:
  - `src/game/constants.js` :: add `BOSS_PATTERN_PREVIEW_SECONDS = 1.5`.
  - `src/game/game-engine.js` :: `startWarningIfNeeded`, new `beginWarningSession`/`updateBossPreview` helpers, `getCurrentDifficulty`, `getStageState`, `update`, `start`, `getSnapshot`; hold preview state and activate the encounter after its countdown.
  - `src/ui/game-hud.js` :: `createGameHud`, `update`; render localized preview label in the existing accessible centered banner.
  - `src/styles.css` :: `.warning-banner` and new preview modifier; style `BOSS — 저속/고속/변속` legibly without obscuring play.
  - `tests/game/game-engine.test.js`, `tests/ui/game-hud.test.js` :: verify pre-BOSS interval, continued gameplay, cached pattern, and displayed label.

#### Details
- State shape:
  ```ts
  type BossPattern = 'slow' | 'fast' | 'shift';
  type BossPreview = {
    warningIndex: number;
    pattern: BossPattern;
    remainingSeconds: number; // starts at 1.5, clamps to zero
  } | null;
  ```
- `startWarningIfNeeded()` returns when either a `warningSession` or `bossPreview` already exists. When `getDifficulty()` reports a BOSS warning candidate, create `bossPreview` using `candidate.warningIndex` and `candidate.bossPattern`; do not create `warningSession` or `bossEncounter` yet.
- Refactor warning construction into `beginWarningSession(warningIndex, isBoss, bossPattern)`. It builds current wall counts/special quotas as before and creates `bossEncounter` only for a BOSS. BOSS number remains `max(1, floor(warningIndex/2))`.
- During preview, normal wall spawning, physics, score, elapsed time, and stage scrolling continue. `getCurrentDifficulty()` must force non-warning/non-BOSS difficulty for the preview (use a threshold above current score), so neither BOSS speed multiplier nor BOSS gap/spawn rules apply yet. Keep the cached pattern exposed only through `bossPreview` until activation.
- At each normal update, subtract `deltaSeconds` from `bossPreview.remainingSeconds`. When it reaches zero, copy its warning index/pattern, clear preview, and call `beginWarningSession(..., true, cachedPattern)` before computing this frame's active difficulty and spawning. Ensure one-frame expiration does not recreate the preview through `startWarningIfNeeded()`.
- Reset preview state on every `start()`. Expose a defensive `bossPreview` object or `null` in `getSnapshot()`.
- In HUD, map `slow -> 저속`, `fast -> 고속`, `shift -> 변속`; while preview exists show `BOSS — {label}` and keep `aria-live="assertive"`. Existing one-second BOSS/WARNING entry alert remains after actual mode transition. No countdown number is required.
- If the run ends during preview, clear the pending preview through existing run reset/game-over handling; do not instantiate an encounter or award BOSS progress before activation.

## Acceptance Criteria
- [ ] Slow, fast, and shift BOSS modifiers match `0.75x`, `1.25x`, and a 2-second alternation between them.
- [ ] Pattern is announced for 1.5 seconds before BOSS encounter activation; the selected pattern cannot change between preview and activation.
- [ ] Preview interval continues normal play and does not apply BOSS-specific speed/gap/attacks early.
- [ ] Existing WARNING/BOSS alternation, aircraft speed multipliers, and BOSS rules remain intact.

## Validation
- `npm test -- --run tests/game/difficulty.test.js tests/game/game-engine.test.js tests/ui/game-hud.test.js` — pass speed boundaries, preview lifecycle, and banner content.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
feat(boss): smooth entry speed and preview encounter pattern

Plan: 2026-09-29-boss-combat-clarity
Phase: P01-boss-readability
Task: T01-boss-speed-and-preview

- Reduce BOSS speed modifiers and retain shift cadence
- Announce the cached BOSS pattern before encounter activation
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`39` focused tests; `git diff --check`)
- commit: `70e7fa5`

## Learning Notes
- A pre-entry preview must suppress threshold-driven WARNING selection while leaving ordinary simulation and obstacle spawning active.
- Older engine tests that assumed instantaneous BOSS activation now advance the simulation through the preview before asserting encounter state.
