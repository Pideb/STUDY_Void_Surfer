# Task: T01 Speed Cap and Stable Boss Background

## Status: done

## Goal
All aircraft grow through220 progression points, while boss background artwork travels steadily at its captured entry speed without vertical bobbing or speed-dependent tile jumps.

## Decision Summary
- D01,D03. Preserve+10 actual px/s per10 points,2s easing, monotonic progression and independent boss slow/fast/shift factors.
- Ordinary maxima NOVA/AEGIS460, VELOCITY700px/s. Preserve primary viewport/DPR resolution and existing foreground boss movement.

## Implementation

### I01. Progression and captured background speed
- Related Files:
  - `src/game/constants.js` :: `SPEED_CAP_SCORE`, `VELOCITY_SPEED_CAP_SCORE` — modify200 to220.
  - `src/game/difficulty.js` :: `getBaseSpeed` — read-only unless necessary; current formula divides increments by aircraft multiplier before later application, so do not double VELOCITY growth.
  - `src/game/game-engine.js` :: `beginWarningSession`, `update`, `start`, `completeBossIfReady`, `getSnapshot` — modify background integration only.
  - `src/game/boss.js` :: `createBossEncounter` — modify background field initialization.

#### Details
- Signatures remain `getBaseSpeed(progressionScore:number,aircraftId?:string):number` and public engine methods.
- Add encounter `backgroundScrollSpeed:number|null`, defaultnull; this is full wall-equivalent speed, before the existing background factor.25. Capture the finite positive `currentScrollSpeed` at actual encounter creation in `beginWarningSession`, BEFORE applying any boss-factor transition. Fallback to current ordinary aircraft-adjusted base speed.
- Expose snapshot `backgroundScrollSpeed:number` (full-speed reference) and retain `backgroundScrollDistancePx:number`. While boss exists use its capture; otherwise use current difficulty speed. Integrate distance +=reference*.25*liveDelta.
- Pause/WASD/death early returns still freeze travel. Background state must not advance through elapsed wall-clock gaps, reset distance at entry, follow boss.position or reuse the oscillating shift target. Restart clears capture with encounter reset.
- Add session `bossBackgroundScrollSpeed:number|null=null` as retained ownership through post-clear scenery. At encounter creation assign the same captured speed to this field and encounter.backgroundScrollSpeed. During post-clear drain/portal the existing stage.mode may remainboss even after encounter removal; use the retained session capture until portal scenery swaps, then clear it. `start` also clears it; mereHP removal must not. Keep distance continuous throughout.
- Invalid/NaN captures fall back to a finite positive reference, never corrupt the accumulated distance.

### I02. Stable artwork and seam geometry
- Related Files:
  - `src/game/renderer.js` :: `drawStageArtwork`, `drawStageBackground`, `drawBackgroundTransition`, `render` — modify.
  - `tests/game/difficulty.test.js`, `tests/game/game-engine.test.js`, `tests/game/renderer.test.js`, new `tests/integration/boss-background.test.js` — modify/new.

#### Details
- `drawStageArtwork` currently adds sin(elapsed*.12)*up-to7px to vertical offset and derives overlap/period from current wall speed. Add explicit `stableVertical:boolean=false` argument (or equivalent options object) and passboss flag through `drawStageBackground`. In boss mode center artwork vertically with fixed overflowY/2. Procedural fallback stars also use fixedbaseY in boss mode.
- Pass `snapshot.backgroundScrollSpeed ?? snapshot.difficulty.scrollSpeed ??240` to background drawing/blending, not the current boss target. Never pass a globally frozen elapsed clock into boss animation or particle clocks.
- Keep right-to-left tiled travel/crossfade, background darkness, portal coverage and reduced-motion behavior. New density work belongs to T03, not here.
- Test score0/219/220/large for all craft (actual endpoints460/700); pause deduction cannot lower progression. Update prior200-bound assertions.
- For slow/fast/shift bosses with distinct speeds, assert captured background increments constant across several shift changes; current wall speed still varies/eases. Freeze onpause/WASD, restartreset, and post-clear scenery continuity.
- Renderer tests assert fixed boss-image vertical coordinates at differentelapsed times and fixed blend geometry under changing wall speeds; ordinary vertical decoration remains unchanged.

## Acceptance Criteria
- [x] Every aircraft reaches the correct220-point ordinary ceiling without changing step size or boss factors.
- [x] Boss artwork moves only steadily right-to-left, independent of wall acceleration, with no vertical bob/seam jump.

## Validation
- `npm test -- --run tests/game/difficulty.test.js tests/game/game-engine.test.js tests/game/renderer.test.js tests/integration/boss-background.test.js tests/game/barrier-spacing.test.js`
- `git diff --check`

## Commit Message
```text
feat(game): extend speed growth and stabilize boss background travel

Plan: 2026-10-29-flight-performance-lasers-siren
Phase: P01-runtime
Task: T01-speed-background

- Cap ordinary speed growth at220 points for all aircraft
- Decouple boss background travel and tiling from wall speed changes
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 36a451e
