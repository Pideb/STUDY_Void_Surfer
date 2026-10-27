# Task: T04 Twelve loop tracks, siren and playback lifecycle

## Status: done

## Goal
Twelve loop tracks, siren and playback lifecycle; apply the approved combat/audio review with deterministic state and regression coverage.

## Decision Summary
User approved all previews and requested autonomous continuation. Existing laser fairness and scoring rules remain in force. Implementation baselines are recorded in the decision document.

## Implementation
### I01. Approved music and siren assets
- Preserve `.memory/previews/2026-10-27-{stage-bgm,stage-boss-bgm,boss-entry-siren}`; approved sources for exact instrument/score reference. Use script build pipeline under `scripts/` to generate twelve production PCM loops under `public/assets/audio/`, six gameplay+six boss; stable manifest under `src/audio/`.
- Loop synthesis preserves approved melody/harmony/timbre and bass/drum arrangement. Render exact bar periods and wrap release/echo tails into loop beginning rather than appending silence/fade. Preview WAVs remain byte-identical. Keep reproducible score source, no external services or dependency upgrades.
- Approved siren: three original sweeps in1.5s, .4s bursts at0/.46/.92. Generate/cache a matching WebAudio buffer or load the built asset. Sound only once per boss preview, music duck during preview and restore on entry/cancel. Do not replay old low boss cue simultaneously.

### I02. Playback and controller integration
- `src/audio/audio-manager.js`, new music-player module: WebAudio decoded-loop cache, per-scene preload of normal/boss, crossfade selection with generation tokens to reject stale loads, safe fallback if fetching/decoding unavailable; current menu/SFX retained. One active loop plus fading outgoing voice, never accumulate old sources.
- Playback state fields: selected sceneId:string, mode:menu|gameplay|boss|none, paused:boolean, destroyed:boolean, playback offset:number, source start clock:number, generation:number, decoded cache/pending Maps. `pauseMusic/resumeMusic` preserve loop offset; mute affects all paths, switching same mode/scene does not restart. Stop/destroy invalidates loads and cancels voices; no async resurrection. A real boss starts its scene music at entry, with buffers preloaded before arrival where possible.
- `src/ui/app-controller.js`: bossPreview identity triggers siren once and music duck; actual boss mode starts matching boss loop together with entrance state; each new run resets cue identity and stale SFX dedupe, pause/menu/death/restart clear pending entry. Shared interface extends optional methods so supplied test mocks continue working.
- `tests/audio/`: buffers/URLs/loop periods and late-load races, pause/resume offsets, same selection, crossfade cleanup, mute and cue cancellation/repeated runs. Extend `tests/ui/app-controller.test.js` for preview?siren?boss BGM timing and cancellation. Full test/build; README updated for new gameplay/audio rules.

## Acceptance Criteria
- [x] All behaviors and fields described above implemented.
- [x] Focused regressions pass; no stale async state, paused clocks or collision/render mismatch.
- [x] Production build and whitespace checks pass.

## Validation
- `npm test -- --run`
- `npm run build`
- `git diff --check`

## Commit Message
```text
feat(game): twelve loop tracks, siren and playback lifecycle

Plan: 2026-10-27-combat-audio-integration
Phase: P01-combat-audio
Task: T04-stage-audio
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- Validation: all 32 files / 283 tests, production build, whitespace checks, and production-preview HTTP checks passed for all 13 audio URLs.
- Loop assets total about 22 MB, loaded by scene (gameplay+boss) and cached; JavaScript gzip97.47kB.
- Preview WAV hashes remain exact; loop tails wrap and a 5ms bridge smooths sample-rounded boundaries.
- No fresh subjective browser listening claim; the user approved all source previews.
- commit: see task commit
