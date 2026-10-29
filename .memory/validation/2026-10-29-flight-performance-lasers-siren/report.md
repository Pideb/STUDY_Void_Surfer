# Flight Performance, Ambient Lasers, Siren and Guest Access — Final Verification

Date:2026-10-29. All six decisions implemented. [Actual runtime screens](./review.html), [matched rendering comparison](./performance-review.html).

## Required Checks
- Complete suite: **55 test files / 699 tests passed** (`npm test -- --run`). [Output](./tests.log).
- `npm run build`: passed,100 modules; JS399.54kB/gzip116.38kB, CSS19.51kB/gzip5.10kB.
- `npm run verify:config`: passed after build; restricted secret identifiers absent from public template/build output.
- `git diff --check`: passed.
- `node .memory/validation/2026-10-29-flight-performance-lasers-siren/compare-performance.mjs`: paired snapshots/viewport/buffer/density/full-reference checks passed.
- `node .memory/validation/2026-10-29-flight-performance-lasers-siren/verify-evidence.mjs`:11 actual-runtime cases, all53 assets available, no document overflow, actual browser2.4s stereo buffer, guest/account policy, geometry and file hashes verified.

## Implemented Decisions
| Decision | Verification |
| --- | --- |
| D01 cap220 | NOVA/AEGIS460px/s, VELOCITY700px/s ordinary ceiling; same+10 steps,2s easing, no pause-score speed rewind. Difficulty/engine/barrier bound tests. |
| D02 ambient lasers | Second boss clear unlocks normal/WARNING3s70% opportunities, one/two70/30. Safety covers moving/hybrid openings and imminent special barriers. Separate clocks/collision/audio selection; no future wall backlog; attacks drain before intro. Dedicated integration cases include Space not shielding laser contact and admin immunity. Actual normal/2-line WARNING images. |
| D03 stable background | Entry-speed capture retained through post-clear scenery swap; no boss-background artwork vertical bob or wall-speed-driven tile period changes. Slow/fast/shift tests and120 live browser samples show fixed background reference while wall speed varies. Pause/WASD still freeze. |
| D04 differentiated density | Native player/boss/UI unchanged; background50%, walls75%, projectiles50%, lasers35%. Reused surfaces, bounded resampled image cache, bilinear low-layer sampling, native guidance, proper resize/destroy/fallback. Unit/context/actual dimensions and original/full-reference/optimized captures. |
| D05 siren | Exact approved2.4s WAV SHA`925ffc1b9ef079dd9dca52260398af72b9224ff633479a7b3111b6d50efb18b2`; deterministic runtime waveform matches both channels at24kHz. Tests cover44.1/48kHz, silent gaps, clipping, third-pulse pause/old-voice race. Shared constant synchronizes alert/ducking/offset clamp. Actual browser OfflineAudioContext produces57600 frames/2channels/2.4s. |
| D06 guest | UI and engine enforce NOVA, including constructor/forged selection/fresh-run auth changes. Scoped retirement deletes onlyoldguestkey; no guest best reads/writes/UI/private RPC/submission. Real controller+engine regression covers account VELOCITY→logout→fresh guest NOVA. Guest result shows transient2points; mocked account100best/allunlock retained. |

The guest rule is shared by UI selection and fresh engine starts. Its central check in `src/game/aircraft.js` is:
```js
return AIRCRAFT_CATALOG.some(craft=>craft.id===id) && (guestMode ? id==='default' : isAircraftUnlocked(id,bestScore));
```
This keeps account score-based unlocks intact while preventing stale account selections from carrying into a guest run. Rendering density changes only raster buffers, so collision geometry and simulation clocks remain independent.

## Rendering Measurements and Practical Limits
Same static public-engine snapshots, browser, measured viewport and buffer;60 warmup +180 RAF samples per scene. One-pixel synchronous readback forces software raster completion; draw-submit durations and RAF intervals are separate. Original renderer bundled before edits from7ff44ed, source provenance/hashes retained. The layered all100% diagnostic reference is recorded separately. See [full raw comparison](./performance-comparison.json) and [method notes](./render-notes.md).

Median forced-raster milliseconds:

| Scene | PC before → after | Landscape before → after |
| --- | --- | --- |
| Walls | 7 → 11.8 | 3 → 2.6 |
| Projectiles | 16.2 → 20 | 5 → 4.9 |
| Global laser | 605.7 → 44.5 | 73.1 → 10.6 |
| Failure effect | 15.5 → 15.1 | 3.6 → 4.5 |

Heavy global lasers improve roughly93% on PC and85% on landscape in this software-raster harness. Some light scenes incur additional layer-composition cost; this is not a universal speedup claim. PC wall RAF median remains around16.6ms; projectile frames can take longer. This headless`--disable-gpu` result is **not physical hardware FPS**. Human playtesting on the user's GPU is still needed for perceived lag/quality. DPR2 captures verify resolution/appearance only (one sample, not a matched benchmark).

Runtime auth/ranking data are explicit local test doubles; no remote login/DB/deployment mutation was attempted. Audio's approved preview was selected by the user; exact waveform/lifecycle and actual browser buffer were verified, but hardware speaker playback was not independently manually auditioned. Existing aircraft/boss asset images and12 music loops/6 roar files were not replaced.

## Necessary Integration Fixes
- The old guest-ranking fixture asserted browser-local best visibility; it now checks sign-in guidance and suppresses even legacy guest personal-record objects.
- Guest result still displayed a private-neighborhood empty panel until actual capture inspection; the explicit public-only model now removes it and preserves account panels.
- Landscape hangar had a3rem image column containing a6.5rem image, overlapping text. Matching the column and spanning the image across its text rows makes new guest lock explanations readable; desktop layout and existing internal vertical scrolling remain.
- Previously noted duplicated admin-reset assignments in signout remain unchanged; no unrelated cleanup was included.

## Task Commits
- T01 `36a451e`: cap/background.
- T02 `7ff44ed`: ambient lasers.
- T03 `8f29888`: measured density layers.
- T04 `9052205`: approved siren.
- T05 `a2f70b7`: guest policy/records.
- T06 hash is recorded in the [task blueprint](../../phases/2026-10-29-flight-performance-lasers-siren/P01-runtime/T06-integration-evidence.md) and final pointer-sync commit.
