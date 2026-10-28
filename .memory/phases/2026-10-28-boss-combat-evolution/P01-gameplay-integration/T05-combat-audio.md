# Task: T05 Roar and explosion audio lifecycle integration

## Status: pending

## Goal
Play the approved design-specific roar with the .8s frozen wind-up and one spacecraft explosion on death, respecting mute/pause/restart/menu without stale cues.

## Decision Summary
- Implement approved decisions in .memory/decisions/2026-10-27-boss-combat-evolution.md, without reopening accepted art/audio/balance.
- Depends on preceding Tasks. Preserve their public snapshots/interfaces; execute sequentially. No external DB or credentials required.

## Implementation

### I01. Runtime behavior and public contracts
- Related Files: `src/audio/audio-manager.js`, production `src/audio/boss-roar-synth.js` fromT03, `src/ui/app-controller.js::{syncCombatAudio,beginPlaying,renderFrame}`, audio/controller tests.

#### Details
- **Signatures & Types**:
```typescript
createBossRoarBuffer(context,stageId): AudioBuffer (new wrapper); audioManager.play(event,metadata?:{id?:string,stageId?:string}):void; existing resetRun/pauseMusic/resumeMusic/destroy interfaces preserved
```
- **Data & Schema Fields**: Add 'bossRoar' to AUDIO_EVENTS; metadata id includes audioRunId+roar.id; stageId from encounter lock. Track lastRoarId/lastDeathEffectId per run in controller, reset onbeginPlaying. Audio stores per-stage buffercache, active roar voice with offset/startTime and cancellation generation to prevent replay after menu/destroy. Explosion uses existing collision event with short original noise/low-tone layered configuration.
- **Execution Flow / Logic**:
  1. Precondition & Validation: normalize finite inputs, retain existing API defaults and engine state guards. Handle absent optional browser APIs through existing fallbacks.
  2. Core Processing: Use approved synth samples exactly (same PCM identity as packaged WAVs) to avoid async late roar. Shared master gain handles mute; keep entrance siren1.5s distinct from roar. Controller detects new roar id once, plays bossRoar with lockedstage; replay onlynewroar, noteveryframe. Stop/resume roar with pause retaining offset; cancel on menu/reset/destroy/death, no overlapping entrymusicvoices. Death effect detected at firstframe beforegame-over plays collision once perrun; expand into short spacecraft explosion noise/descending lowtone. Existing per-stage gameplay/boss tracks/ducking remain. Volley charge feedback supported without restoring old reflectionsource. Keep controller input guards coherent with engine frozenroar/counterattack state. No auth/leaderboard data/schema changes.
  3. Error & Exception Handling: deterministic fallback for missing assets/API, no unhandled promise rejection or permanently paused combat; malformed inputs must not introduce NaN/Infinity. Do not conceal validation failures.
  4. State Transition & Return: expose independent snapshot data; advance engine phases only once; restart/menu clear transient state.

### I02. Verification and regression coverage
- Related Files: tests listed above; modify existing superseded expectations and add focused behavioral tests.
#### Details
Sixroarbuffers differ, exact.8s, dedupe/mute/pauseoffset/menu/restart cancellation; controller onecueperroar/perdeath not perframe, stagedidentity stable, guest/admin unaffected; entrysiren/BGM tests unchanged.

## Acceptance Criteria
- [ ] Play the approved design-specific roar with the .8s frozen wind-up and one spacecraft explosion on death, respecting mute/pause/restart/menu without stale cues.
- [ ] Actual runtime integration preserves earlier completed Tasks and existing guest/admin/aircraft behavior.
- [ ] Specified validation passes; evidence recorded below.

## Validation
- `npx vitest run tests/audio/audio-manager.test.js tests/audio/audio-assets.test.js tests/ui/app-controller.test.js tests/integration/game-flow.test.js` — passes
- `npm run build` — passes

## Commit Message
```text
feat(audio): connect stage roars and ship explosion lifecycle

Plan: 2026-10-28-boss-combat-evolution
Phase: P01-gameplay-integration
Task: T05-combat-audio

- Play the approved design-specific roar with the .8s frozen wind-up and one spacecraft explosion on death, respecting mute/pause/restart/menu without stale cues.
- Validate actual state transitions and regression boundaries
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

