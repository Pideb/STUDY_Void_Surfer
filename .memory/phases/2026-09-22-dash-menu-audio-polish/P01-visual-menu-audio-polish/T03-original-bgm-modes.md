# Task: T03 Original Procedural BGM Modes

## Status: done

## Goal

Give VOID SURFER a state-aware original chiptune/synth soundtrack without importing any copyrighted recording. The menu loops a restrained space-flight theme, gameplay loops a faster flight theme, WARNING plays an urgent stinger over gameplay, and BOSS temporarily replaces gameplay music with a gritty military sci-fi loop.

## Decision Summary

- All music is generated through the existing Web Audio manager. Do not copy, decode, package, or reference the supplied Mega Man MP3, Mega Man X material, Metal Slug material, or any recognizable melody/arrangement.
- Menu, gameplay, and BOSS are mutually exclusive looping modes. WARNING is a short original stinger over the currently active gameplay loop.
- Music starts only after a browser user-gesture unlock, pauses with the game, resumes with it, and is covered by the existing mute toggle.

## Implementation

### I01. Add deterministic stateful procedural music to the audio manager

- Related Files:
  - `src/audio/audio-manager.js` :: `createAudioManager` and internal oscillator scheduling helpers; modify
  - `tests/audio/audio-manager.test.js` :: `MockAudioContext` and music-mode unit tests; modify

#### Details

- Extend the public object returned by `createAudioManager()` with these methods while preserving `unlock`, `setMuted`, `isMuted`, `play`, and `destroy`:
  ```js
  setMusicMode(mode) // mode: 'none' | 'menu' | 'gameplay' | 'boss'
  pauseMusic()
  resumeMusic()
  ```
- Add an internal `musicGain` node connected beneath the existing master gain. Keep effects and music independently controllable internally, but use the existing master mute path so `setMuted(true)` silences both.
- Store only original, short, deterministic note patterns in source code. Define a mode table for `menu`, `gameplay`, and `boss`, where each mode has its own tempo, oscillator waveform choices, note/rest sequence, and loop interval. The musical characteristics must be broad genre cues only:
  - `menu`: restrained 16-bit-style space-flight arpeggios and sustained synth support.
  - `gameplay`: faster forward-motion chiptune pulse.
  - `boss`: lower-register, gritty, martial sci-fi pulse distinct from gameplay.
- Implement one owned music scheduler/timer. `setMusicMode` must cancel the existing scheduler and active scheduled music voices before changing modes; selecting the same active mode must be idempotent and must not create a duplicate loop.
- Before `unlock()` has successfully created/resumed an audio context, mode changes must record the requested mode but schedule no audible oscillator. After unlock, schedule the current mode if it is not `none` and music is not paused.
- `pauseMusic()` must stop/cancel the current music scheduler while retaining the requested mode; `resumeMusic()` must restart only the retained non-`none` mode after unlock. `setMusicMode('none')` must cancel music and clear the requested mode.
- Enhance `play('warning')` into a short original urgent alarm stinger with at least two rapid tones or tone layers. It must schedule through the effects path, must not change `musicMode`, and must not reuse a recognizable external melody.
- Continue routing existing event effects (`flap`, `dash`, `hit`, `boss`, and any existing events) as before. `destroy()` must clear every music timer, stop tracked music voices safely, disconnect created nodes where supported, and close the context without throwing if no context was ever unlocked.
- Add tests with fake timers and the mock context to prove: no scheduler before unlock; menu mode schedules after unlock; switching to boss cancels/replaces the menu loop; repeated same-mode requests do not multiply timers; pause/resume works; `none` cancels scheduling; mute retains the selected mode while silencing master output; and warning does not replace the active gameplay mode.

### I02. Synchronize music with application and difficulty state

- Related Files:
  - `src/ui/app-controller.js` :: `beginPlaying`, pause/resume controls, game-state render loop, screen transitions, and teardown; modify
  - `tests/ui/app-controller.test.js` :: audio-manager interaction tests; modify

#### Details

- Treat `setMusicMode` as the single controller-facing mode API. Never create a second AudioContext or schedule music directly from UI code.
- When the authenticated main menu is rendered or reached via Main Menu after an audio unlock, request `setMusicMode('menu')`. This request is harmless before unlock and will become audible only after a user gesture.
- In the user-initiated Start/Restart path, call `audioManager.unlock()` before or alongside `setMusicMode('gameplay')` so the click satisfies autoplay policy. Then start the game as currently implemented. A direct game-over restart must enter gameplay music and must not route through the menu music.
- When the game is paused by the existing pause action, call `pauseMusic()` immediately after the engine pause transition. When it resumes, call `resumeMusic()`; it must continue the currently selected gameplay or boss mode.
- Use the existing difficulty-mode transition tracking in the game loop:
  - on entry to `warning`, call `audioManager.play('warning')` only; retain `gameplay` music;
  - on entry to `boss`, call existing boss feedback and `setMusicMode('boss')`;
  - on transition from `boss` to normal/warning, call `setMusicMode('gameplay')` before subsequent warning stingers;
  - do not repeatedly set a mode every frame when the difficulty mode did not change.
- On game over, set the music mode to `none`. On return-to-menu, request `menu`; on controller destruction, call the manager's `destroy()` as now.
- Keep the existing mute button contract: it toggles `setMuted`, updates its icon and accessible label, and does not lose the selected/paused music mode.
- Make integration robust with optional audio methods or update all injected test doubles to supply `setMusicMode`, `pauseMusic`, and `resumeMusic`; no test should fail merely because a legacy mock lacks a newly called method.
- Add controller tests for the exact call sequence of start, pause, resume, WARNING entry, BOSS entry/exit, game over, return to menu, and direct restart. Assert that WARNING leaves gameplay music selected and BOSS changes it exactly once per transition.

## Acceptance Criteria

- [ ] No audio asset is added to the repository; menu, gameplay, and boss music are generated by original Web Audio note patterns.
- [ ] Menu, gameplay, and BOSS loops transition without duplicate scheduler loops; WARNING layers a short stinger over gameplay rather than replacing it.
- [ ] Music starts only after user unlock, pauses/resumes with play state, stops on game over, returns on the menu, and respects mute.
- [ ] Existing gameplay sound effects, controls, and audio-manager cleanup remain functional.

## Validation

- `npm run test -- --run tests/audio/audio-manager.test.js tests/ui/app-controller.test.js` - focused audio lifecycle and controller tests pass.
- `npm run test -- --run` - the complete test suite passes.
- `npm run build` - production build completes without errors.

## Commit Message

```text
feat(audio): add original stateful chiptune music

Plan: 2026-09-22-dash-menu-audio-polish
Phase: P01-visual-menu-audio-polish
Task: T03-original-bgm-modes

- add original procedural menu, gameplay, warning, and boss audio modes
- synchronize music lifecycle with game and screen transitions
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending
