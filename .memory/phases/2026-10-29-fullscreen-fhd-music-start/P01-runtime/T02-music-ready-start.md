# Task: T02 Music-Ready Start

## Status: done

## Goal
Start a prepared run and its selected BGM together; after10s auto-start silently and allow that track to join later. No transient menu/synthetic music or hidden progression.

## Decision Summary
- Same selected aircraft/random stage through preparation and start. Preserve first-gesture unlock, mute, effects and normal stage/boss crossfades.
- Preparation cancellation/readiness/timeout must not race into duplicate/wrong starts. No paid pause or unbounded retry.

## Implementation
### I01 Audio contracts
- `src/audio/stage-music-player.js`: add `prepareTrack(sceneId:string,mode:string='gameplay'):Promise<boolean>` loading/decoding the chosen URL only, no select/source start. Reuse existing pending/cache. Returnfalse on unavailable/destroyed. Existing generation guard remains. Menu→game direct selection stops outgoing menu immediately; other scene/boss crossfades remain. Failures never throw unhandled rejections or spin retries.
- `src/audio/audio-manager.js`: share internal `unlockAudio():Promise<void>` for publicunlock and preparation. Add `prepareGameplay(sceneId:string):Promise<boolean>` and `startPreparedGameplay(sceneId:string):void` (also no-op manager). Preparation sets mode none, immediately stops old BGM/outgoing/synth voices, suppresses synthesized gameplay fallback for this run, starts context resume in gesture and chosen track preparation. Load may continue if resume hangs. Returntrue only if current preparation generation, loaded and context running; false on failure/cancellation. `startPreparedGameplay` selects exactscene/gameplay after gate; pending track may start later by the existing latest-generation loader. Keep fallback suppression through this run; menu/reset clears it. Late unlock must read current mode and never resurrect old menu. reset/destroy invalidate preparation. Avoid loading unrelated stage tracks during startup; normal established scene/boss behavior remains.

### I02 Frozen engine/start gate
- `src/game/game-state.js`: add `PREPARING:'preparing'`.
- `src/game/game-engine.js::start(runOptions={})`: optional `deferStart:boolean=false`. Initialize selected aircraft/stage/order exactly once as before, then set PREPARING ifdeferred; no progress throughupdate/input while PREPARING. Add `beginPreparedRun():boolean`: onlyPREPARING→PLAYING; reset `lastUpdateMs=null` so loading time is not simulated; false otherwise. Do not callpause() or award/deductscore. Existing defaultstart remains synchronous/compatible.
- `src/ui/app-controller.js`: production path whenaudio preparation API exists creates exactly one deferred engine run, snapshots selected stage, sets screen`preparing` and calls audio.prepareGameplay. One token +10000ms timer controls gate. True readiness starts once; rejected/false stays waiting until timeout. Activation clears timer/token, begins prepared engine, starts prepared BGM, creates HUD then starts native RAF. Only this path usesnewAPIs; existing lightweight test doubles withoutAPI retain prior synchronousstart path.
- During preparing, block lift/dash/fire/pause/challenge/double start by existing playing guards; menu cancellation anddestroy clear timer/token/reset audio and late results are ignored. Same-account auth refresh can continue, but logout/changed identity cancels preparation to menu. Restart uses same gate; stage must not reshuffle after readiness. No API/credentials/score writes during prep.
- `src/ui/screens.js`: `renderPreparingScreen(model,handlers)` using existing panel/components, accessible status`출격 준비 중`, concise music preparation/max10s text and `메인으로` action; no extra dialog or settings. Key/click cancellation follows existing UI conventions; loading start button absent to avoidduplicates.

### I03 Tests
- Stage player: prepareonly/no voices; cached/delayed exacttrack; immediate menu stop; preservebossfade; stopped/destroyed late guards.
- Audio manager: no menu/synth notes during prepare, existing voices stopimmediately, delayed decode/contextresume, timeout-startmode accepts late same-track, reset/menu/destroy reject stale callbacks, unavailable audio/mute unchanged.
- Engine: deferred state frozen evenupdates/input/pause over10s; activate once; firsttimestamp resets; same stage/aircraft, no deduction. Use new meaningful integration test.
- Controller: pending/ready/9999ms/10000ms/late/error/rejection/double-start/cancel/restart/logout/identity change/destroy; no RAF/engine progression duringwait, one start, menu restored. Use fake timers only in scoped tests and restore them. Existing tests with old mockAPI stay valid; native real-engine/audio browser delayed-request fixture required in T03.

## Acceptance Criteria
- [x] Ready→run/music together;10s→silent run/late music; no stale/duplicate starts or menu/fallback bleed.
- [x] Preparation truly frozen/no penalty/stage reshuffle; auth/mute/restart/cancel safe; targeted tests pass.

## Validation
- `npm test -- --run tests/audio tests/ui/app-controller.test.js tests/ui/screens.test.js tests/integration/prepared-run.test.js`
- Additional affected engine/state tests if needed; `git diff --check`.

## Commit Message
```text
fix(audio): gate departure on stage music with a ten-second fallback

Plan: 2026-10-29-fullscreen-fhd-music-start
Phase: P01-runtime
Task: T02-music-ready-start

- Freeze the prepared run until BGM readiness or timeout
- Stop menu bleed and reject stale music/start completions
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit:e90bb76

## Evidence
- Targeted9 files126 tests passed. New tests use real engine plus scoped fake timers and native-audio-like deferred loaders; actual browser delayed-request evidence follows inT03.
- Preparation uses a separate state, no paidpause. Existing lightweight controllers lacking the new audio API retain synchronous compatibility. Engine.stop duringpreparation returns to menu without death/score submission.
- Adjacent issue handled: account/aircraft setters now guard the prepared state as they already guarded playing/paused, so late account refresh cannot change a chosen run duringloading. No unrelated UI/art/gameplay change.
