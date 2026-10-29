# Task: T01 Entry and Basic Rules

## Status: pending

## Goal
Old walls exit before boss factors apply; background darkens before reveal while player stays visible; passed timing bands keep their width; approved cap/WASD numeric changes apply.

## Decision Summary
- D01..D03,D09,D10. Preserve moving gaps and input/physics; capture displayed guide width before score/mode changes.

## Implementation
### I01. Rules and guides
- Related Files: `src/game/constants.js` speed caps200 and failure8; `src/game/wasd-challenge.js::createChallenge` minimumLength floor4; `src/game/obstacles.js::createObstacle`; `src/game/renderer.js::getTimingGuideWidth`; `src/game/game-engine.js::processPassedObstacles` — modify.
- Signatures unchanged. Add nullable `timingGuideWidthPx:number|null=null` to obstacle, populated only for visible special/hybrid guides on passage. `passed:boolean` and position remain existing fields.
- At start of passage processing capture displayed scrollSpeed/windowSeconds, then assign width before mark/award/startWarning changes. Renderer uses stored finite nonnegative width only for passed guide; upcoming guides remain live.
- Cap score200 for every aircraft; existing normalized pre-aircraft formula retains actual+10 steps, actual max440/440/680. First WASD4, later lengths4..8 under existing max-minus2 rule, no4 identical inputs; time5/2.8 unchanged. Failure8 inclusive final1.2 fade.
- Invalid numeric inputs retain existing finite normalization. No persistent schema/I/O changes.

### I02. Explicit boss entry state
- Related Files: `src/game/game-engine.js` entry/start/update/reset/snapshot/getStageState; `src/game/renderer.js` render ordering; `src/ui/game-hud.js` bossPreview banner; `src/ui/app-controller.js::syncCombatAudio` — modify/audit.
- Add nullable `bossEntry` state with phase `'draining'|'darkening'|'alert'|'entering'`,warningIndex:number,pattern:string,elapsedSeconds:number; snapshot includes darkness:number0..1 and phase.
- Threshold creates draining entry, not bossPreview/encounter. Suppress candidate boss difficulty while pending; ordinary speed progression/easing remains. Stop new spawns and reset accumulator during every pending/entrance phase.
- Wait obstacles.length===0 (full left exit), then.4s darkening0->1; create existing1.5s bossPreview only once darkness reached (siren/HUD start here). On alert completion create encounter and enter existing1s entrance; background mode swaps under black; darkness fades1->0 as boss enters. Clear entry on entrance completion.
- Apply darkness after scenery/walls, before boss/player/essential effects/HUD so ship remains visible. Keep live flight/controls and boundary deaths throughout intro; no hostile attacks/new walls until entrance done.
- Reset/stop clears entry/preview; snapshot deep copies; no delayed spawn burst. Existing music coupling uses bossPreview then actual boss mode; drain never emits alert/music. Manage intro phase remainder conservatively, no double advancement on creation.

### I03. Validation
- Modify/add `tests/game/difficulty.test.js`,`tests/game/game-engine.test.js`,`tests/game/wasd-challenge.test.js`,`tests/game/renderer.test.js`,`tests/game/barrier-spacing.test.js`,`tests/ui/app-controller.test.js` as needed.
- Explicit actual maxima440/440/680,200 boundary/above; phase drain with old walls ahead, no new walls/early boss factor, fade ordering/player visibility, restart/death reset, guide width unchanged across speed/window transitions, moving gaps still move after passage.
- Existing fixtures assuming cap100 or direct1.5s intro must be updated to approved semantics, not stripped of safety assertions.

## Acceptance Criteria
- [ ] No boss start with old walls onscreen; dark reveal keeps live ship visible.
- [ ] Passed guide stable;200 cap and WASD4+/8s rules proven.

## Validation
- `npm test -- --run tests/game/difficulty.test.js tests/game/game-engine.test.js tests/game/wasd-challenge.test.js tests/game/renderer.test.js tests/game/barrier-spacing.test.js tests/ui/app-controller.test.js`
- `git diff --check`

## Commit Message
```text
feat(game): drain walls before boss entry and stabilize timing guides

Plan: 2026-10-29-boss-motion-aim-patterns
Phase: P01-runtime
Task: T01-entry-and-basics

- Add live dark entrance after old walls exit
- Freeze passed guide widths and apply approved speed and WASD rules
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
