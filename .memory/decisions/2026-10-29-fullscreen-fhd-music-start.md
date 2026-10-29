# Decisions: Fullscreen FHD Rendering and Music-Ready Start

- Date: 2026-10-29 (Asia/Seoul)
- Status: Confirmed
- Stage: interview complete; user subsequently authorized plan, execution, commits and deployment through completion.
- Current deployed baseline: VOID SURFER0.01-b, runtime `e0eaacf`, publication record `e3a9210`.
- User requests: improve fullscreen frame drops; remove brief menu music before gameplay music when entering a run.

## D01. Rendering resolution — selected by user (option3)
- **Chosen**: Limit the full game render buffer to a maximum FHD bounding size1920×1080, including player/boss rendering. Preserve viewport aspect ratio within that maximum and continue filling the browser viewport through the existing CSS display sizing. Do not crop the playable world or add a different collision space.
- **Rationale**: Current code allows up to3840×2160 output. FHD reduces the number of pixels drawn/composited, particularly at fullscreen/high DPR. A16:9 buffer drops from8,294,400 to2,073,600 pixels; this is a pixel-work reduction, not a guarantee of4× FPS.
- Small viewports must not be forced up to FHD. Respect existing DPR handling within the new cap. Ultrawide viewports preserve their aspect ratio and fit inside the FHD bounds rather than stretching a16:9 buffer or exceeding the cap.
- Keep logical world960×540, ship visual size, hitboxes, input mapping, physics, speed progression and game rules unchanged. Existing background/wall/projectile/laser reduced-resolution layer densities remain; no additional automatic quality reduction is selected.

## D02. Frame cadence — selected by user (option2)
- **Chosen**: Preserve display-refresh-driven requestAnimationFrame scheduling. Do not add a60FPS/30FPS cap or intentionally skip rendering frames to impose a lower limit.
- **Rationale**: The user chose to retain the feel of high-refresh monitors. Reduce drawing cost through the FHD limit, with measurements to establish remaining bottlenecks.
- Record viewport, actual backing-buffer dimensions, DPR, browser and measurement conditions. Compare matched normal-flight and boss/effect scenes before/after, including frame interval distribution and slow frames. Software/headless evidence must be labelled; it cannot establish the user's physical GPU performance.

## D03. Music-ready start — selected by user (option2)
- **Chosen**: Prepare the selected run's stage music before starting gameplay. When it is ready, begin gameplay and its BGM together. During preparation, player, obstacles, score, progression, boss clocks and input-driven game actions must not advance.
- **Rationale**: The user prefers a short start wait to an immediate silent start or transient unrelated music.
- End menu music at departure/preparation entry, including already-fading voices. Do not allow late completion of an old menu-track load or old unlock callback to restart it. Do not play the temporary synthesized menu/game music while waiting for the chosen stage track.
- Preserve menu first-gesture audio activation and mute settings. Do not bypass browser autoplay requirements, force sound on, change the music compositions, or change existing stage/boss crossfades as an unrelated audio redesign.
- The stage whose music is prepared must match the actual run, including randomized stage order and chosen aircraft. Do not start a second run or reshuffle the stage after loading. Restart uses the same preparation contract.

## D04. Slow/failing music load — selected by user (option2)
- **Chosen**: Wait up to10 seconds for the selected game track. If still unavailable or loading failed, start gameplay automatically without BGM. If that same current track becomes ready later, begin it while gameplay continues.
- **Rationale**: Prevent infinite loading or extra retry dialogs while honoring the preferred music-ready start when loading is timely.
- Use one start gate per departure: readiness and timeout must not start gameplay twice. Timeout must not cancel useful loading that can complete later. A fetch/decode failure must not produce endless immediate retries or restore menu/synthesized music; whether a retry is needed can be handled as bounded internal lifecycle logic during planning.
- Late results from a cancelled, superseded, logged-out or destroyed preparation must not start a run or play the wrong track. Clean up preparation timers/listeners when leaving the flow. Effect sounds retain the existing mute policy; timeout means absent BGM, not a globally broken audio context.

## D05. Code-derived constraints and investigation findings
- `src/game/render-resolution.js::getRenderResolution` currently caps total buffer pixels at4K and clamps DPR to1..2. `renderer.js::syncResolution` applies the dimensions/scales to the main canvas and reused reduced layers; a cap must cover resize/fullscreen transitions and high-DPR screens, not only startup.
- `src/game/render-layers.js` already uses background.5/walls.75/projectiles.5/lasers.35 densities. Re-adding the same layer strategy would duplicate existing behavior. Player/boss will now also be affected by the explicitly selected global FHD cap.
- The background repetition uses multiple clipped draws each frame; glow effects and HUD updates are other cost candidates. They are not proven user-device bottlenecks. Large speculative rewrites, new render backends and extra quality controls are not approved by this interview.
- `src/ui/app-controller.js` currently calls `resetRun`, starts the engine, selects the scene/mode, unlocks audio, then schedules gameplay RAF. The readiness gate needs to prevent both visible and hidden game-time progress and avoid charging a pause penalty as a loading mechanism.
- `src/audio/stage-music-player.js::select` currently fades an outgoing track with stop scheduled+.24s. It already has a generation guard for asynchronous loads. Preserve and extend that protection; the symptom's exact cause still requires a reproduction test rather than assuming all asynchronous guards are missing.
- `src/audio/audio-manager.js` can schedule synthesized fallback music via the stage player's `onPlaying(false)`. Investigate both outgoing menu audio and this fallback so a brief sound is not incorrectly attributed solely to menu-track overlap.
- Planning should distinguish preloading/fetch/decode readiness from actual audible playback. Preparing music must not itself play it or tick the game. Browser activation/context-resume failures must not prevent the10-second automatic start path.

## D06. Scope and handoff
- This interview writes decisions only. Do not change production code, tests, active execution pointers, package version or deployment during grill-me.
- Next step: `/memory-plan fullscreen-fhd-music-start`, followed by `/memory-execute` when authorized. The plan should include meaningful resolution/fullscreen/input-mapping and audio race/timeout/cancellation regression checks, matched measurements and current version documentation.
- No new version label was requested. Keep0.01-b. Subsequent user request explicitly authorizes plan/execution/commits and Azure deployment after validation.
- Adjacent observations reported only: per-frame bounds reads/background clipped draws/HUD updates may warrant profiling; physical-GPU frame drops remain unverified in the prior software-headless captures. No unrelated optimization or UI redesign is included automatically.
