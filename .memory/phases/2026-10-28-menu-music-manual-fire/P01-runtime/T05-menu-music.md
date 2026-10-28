# Task: T05 Loop approved ORBIT RUN menu composition

## Status: done

## Goal
Play an actual seamless ORBIT RUN loop in the menu with existing music/mute/unlock lifecycle.

## Decision Summary
- D01; preserve audition notes/tempo and stage tracks. No network/cloud audio service.
- Source: .memory/decisions/2026-10-28-menu-music-manual-fire.md; no auth/database/deployment change.

## Implementation

### I01. Runtime contract
- Related Files: New `scripts/audio/compose-menu.mjs` (derive approved synth), new `scripts/build-menu-audio.mjs`, `public/assets/audio/menu/orbit-run.wav`, `src/audio/music-manifest.js`, `src/audio/stage-music-player.js` select/preloadScene, `src/audio/audio-manager.js` menu selection; audio tests.

#### Details
- **Signatures, Data & Schema Fields, Execution Flow**: Export renderMenuMusic({loop:boolean}):{bytes:Buffer,metadata:object}, ORBIT_RUN constant copied exactly from selected audition. Verify audition regeneration hash equals approved orbit-run.wav. Production8bars/32beats at112BPM, stereo22050Hz16bit; render periodic tails from preceding cycle then crop exact one-loop window, no fade-to-silence. Normalize to safe peak and avoid seam discontinuity; store menu track separately (MENU_MUSIC_TRACK) rather than affecting6 stage manifest keys. StageMusicPlayer select(sceneId,menu) resolves menu URL independent of current stage. Cache/decode/generation/pause/resume/destroy same as stage tracks; late menu load must never override gameplay/boss. Oscillator menu only existing fallback if track unavailable; stop fallback on recorded music start. Build script regenerates selected file/manifest metadata without rewriting stage tracks. Ensure build-game-audio regeneration preserves menu export.
- **Validation and errors**: reject unavailable actions without consuming ready ammo or replaying later; validate finite deltas; guard null boss and restart lifecycle. Keep deterministic tests.
- **State Transition & Return**: public engine snapshot must represent real state with copied nested mutable data; final statuses match the contract above.

### I02. Behavior verification
- Related Files: test paths listed in I01; modify or new as specified.
- WAV header/duration/loop edge/approved sample hash and safe peak; menu async switching/mute/pause/destroy with fake audio; previous stage tests unaffected.

## Acceptance Criteria
- [x] Observable goal and all approved timings/counts above implemented.
- [x] Specified validation passes without replacing meaningful adjacent guarantees.

## Validation
- `npm test -- --run tests/audio` ? expected successful exit; run individual commands sequentially when separated above.
- `git diff --check` ? no whitespace errors.

## Commit Message
```text
feat(audio): menu music

Plan: 2026-10-28-menu-music-manual-fire
Phase: P01-runtime
Task: T05-menu-music

- Loop approved ORBIT RUN menu composition
- Validate approved behavior and preserve adjacent mechanics
```

## Progress
- [x] ?? ??
- [x] ?? ??
- commit: pending
