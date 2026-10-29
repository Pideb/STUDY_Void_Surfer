# Task: T04 Approved Boss Entry Siren

## Status: done

## Goal
Play the approved broad low three-pulse siren for2.4s, synchronized with boss alert, pause/resume and BGM ducking.

## Decision Summary
- D05: approved`03-broad-triple.wav`, eachpulse.7s, gaps.15s, onsets0/.85/1.7, total2.4s. Earlier1.5s/single-wail ideas are superseded.
- Preserve.4s darkening,1s entrance, live player control, eventdedupe, mute, reset and menu interruption.

## Implementation

### I01. One deterministic sound source and approved packaging
- Related Files:
  - `.memory/previews/2026-10-29-flight-performance-lasers-siren/compose-sirens.mjs` :: `synthesizeSiren`, `synthesizeTripleSiren` — approved review source, read-only reference.
  - New `src/audio/boss-entry-synth.js` :: pure `synthesizeBossEntrySiren`; `src/audio/boss-entry-siren.js` :: `createBossEntryBuffer` — new/modify.
  - `public/assets/audio/boss-entry.wav`; `scripts/build-game-audio.mjs` entrance copy source — modify approvedasset only, never regenerate12 unrelated BGMloops.
  - `src/game/constants.js` :: `BOSS_PATTERN_PREVIEW_SECONDS` —2.4; new audio source exports `BOSS_ENTRY_DURATION_SECONDS=2.4` or share one pure constant to prevent drift.

#### Details
- API `synthesizeBossEntrySiren(sampleRate:number=24000):{channels:[Float32Array,Float32Array],durationSeconds:number}`; `createBossEntryBuffer(context:AudioContextLike):AudioBufferLike` remains externally unchanged.
- Move/copy the approved deterministic synthesis into production without preview filesystem/runtime imports or file-writing side effects. Preserve broadharmonics `[1,.31,.22,.095]`, contour178+330rise-370fall, sub-octavebody, deterministicseed5713/noise, stereo phase spread/delays, envelopes and per-pulse gain exactly as approvedscript. Pulse duration.7, silence.15; allocate totalround(sampleRate*2.4) frames. At24kHz compare PCM conversion to approvedfile within2/32767 perchannel; do not collapse stereo channels or speedup playback to shorten pulses.
- Approvedsource path `.memory/previews/2026-10-29-flight-performance-lasers-siren/03-broad-triple.wav`, SHA256`925ffc1b9ef079dd9dca52260398af72b9224ff633479a7b3111b6d50efb18b2`. Copy toproduction asset and update packaging source so futurebuild-game-audio cannot revert it to old2026-10-27/01-sweep.
- Runtime must work with productionmodules/publicassets only, independent of `.memory`. ContextsampleRate44100/48000 yields exact2.4s and safepeak without array bounds/phase discontinuities. No client secret or network dependency.

### I02. All lifecycle clocks and regressions
- Related Files:
  - `src/audio/audio-manager.js` :: `cancelEntry`, `playEntry` — modify hardcoded1.5 limits to shared duration (or buffer.duration with correctfallback).
  - `src/game/game-engine.js` :: `updateBossPreview` — consumes sharedgameconstant; existingentryphase flow unchanged.
  - `src/ui/app-controller.js` :: `syncCombatAudio` — read-only unless needed; already ducks duringpreview and starts bossmusic on actualmode.
  - `tests/audio/audio-assets.test.js`, `tests/audio/audio-manager.test.js`, `tests/ui/app-controller.test.js`, `tests/integration/boss-entry.test.js` — modify.

#### Details
- Alert/siren start once after walls/ambient drain and.4sdarkening; no boss music/motion before2.4s alert completes. BGMducking spanswholepreview, bossmusicstartsactualencounter. No extra1.5s stale stop/offset clamp or premature cancellation.
- Resume from retainedoffset in second/thirdpulse; clamp at2.4, not1.5. Tests latepause1.8s→resume, repeatedpause/oldonendedrace, mute/menu/reset/destroy, eventdedupe and noAudioContextbeforeunlock.
- Verify asset RIFF/stereo24kHz16-bit frames57600, exactapprovedSHA, no clipping, three nonzeroenergy blocks and twosilentgaps. Removeoldassert channelsidentical: approved stereo is intentionallydifferent. Keepother12musicloops/6roars hashes unchanged.
- Entryintegration uses variableactualdurations rather than arbitrarylegacyfixedticks. Validate boundary2.399/2.4, ambient/wall drain prerequisites, pausefreeze and rightentrance afteralert.

## Acceptance Criteria
- [x] Packaged sound matches approvedhash and runtime synthesis reproduces it.
- [x] Alert, ducking, pause/resume and entry transition agree on2.4s without truncation or duplicateplayback.

## Validation
- `npm test -- --run tests/audio/audio-assets.test.js tests/audio/audio-manager.test.js tests/ui/app-controller.test.js tests/integration/boss-entry.test.js tests/game/game-engine.test.js`
- Audition actual runtime entry, including pause/resume in thirdpulse; record outcome.
- `git diff --check`

## Commit Message
```text
feat(audio): synchronize the approved broad three-pulse boss siren

Plan: 2026-10-29-flight-performance-lasers-siren
Phase: P01-runtime
Task: T04-boss-siren

- Package and synthesize the approved2.4-second mechanical alarm
- Keep entry ducking and pause offsets synchronized with alert timing
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 9052205
