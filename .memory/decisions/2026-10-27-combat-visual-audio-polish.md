# Decisions: Combat Visual and Audio Polish

- Date: 2026-10-27
- Status: Confirmed and implemented. All requested previews approved; combat/audio plan completed.

## Requested Changes
1. Show `BOSS HP`, starting at 3 and decreasing once per successful WASD challenge. The engine already exposes hp/maxHp; the current HUD displays successfulChallenges instead.
2. Improve quarter-screen safety-lane laser into clearly visible bright light firing right to left, rather than translucent colored coverage.
3. Verify single-line laser and obtain approval on its actual source asset and gameplay appearance.
4. Verify a hybrid wall: ordinary top/bottom solids with a special dash barrier inside the gap. Show a visual example for the user's understanding check before implementation.
5. Make stage transitions travel naturally at wall approach speed.
6. Pause new obstacle generation until the background transition has fully finished. Existing in-flight obstacle handling must preserve their stage art. Avoid accumulating a burst of delayed spawns.
7. Compose separate BGM for six stage backgrounds, deliver playable samples, and obtain approval before integrating.
8. Deliver several clearly visible SPACE-dash effect previews and obtain approval; current long exhaust trail masks dash feedback.

## Code Inspection Before Integration (historical)
- `src/game/boss-attacks.js`: both `createSingleLaser` (random Y, 18px body) and `createQuarterLaser` (one safe quarter) exist. Telegraph 0.7s, active 1s.
- `src/game/game-engine.js::scheduleBossAttack`: lasers unlock from boss2; choose single/quarter with 50% random selection when a laser attack is selected.
- `src/game/renderer.js::drawLaser`: horizontal asset drawn across the field at once, no right-to-left leading front. Quarter danger zones use alpha0.24 coverage with thin beam image in each zone. Visual/collision timing must remain consistent when adding travel.
- `src/game/obstacles.js` and `collision.js`: only normal and special wall kinds; no combined gap+dash barrier kind found. Confirm the intended new hybrid geometry by preview.
- `src/game/game-engine.js::updateStage`: travelledPixels already integrates wall scrollSpeed. Renderer adds background scrolling at quarter wall speed while sliding transition scenes; inspect combined motion before changing numeric speed. No stageTransition guard currently pauses updateSpawning.
- `src/audio/audio-manager.js`: SCENE_SETTINGS changes semitones only; each gameplay stage still shares the same eight-note melody.

## Preview 01: Single Horizontal Laser — Approved
- Actual source asset: `public/assets/game/stages/crystal-gates/laser.png` (existing white-core cyan beam; viewed with the actual game background/boss/ship).
- Built-in imagegen storyboard (preview-only, not an implemented screenshot): `C:/Users/이근혁/.codex/generated_images/01a0e595-90a5-77c1-a99f-35ac0036b2e8/exec-bfb656e2-82b6-455c-a8cf-b6b40452e6af.png`.
- Prompt summary: composite the real crystal boss background, left-facing crystal boss and right-facing player with the existing cyan/white laser; three widescreen frames show AIM, RIGHT TO LEFT leading front, ACTIVE full beam; no walls, no unrelated UI.
- Proposed appearance: white-hot narrow core, cyan halo, thin targeting line, bright leading front from right to left. Random Y remains; storyboard depicts one example.
- User selected option1: retain the narrow bright white core with cyan halo from the storyboard, and clearly animate firing from the screen's right toward the left.
- Random Y is not locked to the middle. Select a valid height across the playfield when telegraphing and keep it fixed through that shot so the warning remains trustworthy. Source remains on the right; do not interpret random height as a random horizontal origin.

## Quarter-Screen Laser Reaction Time — Approved
- User reports the current 0.7-second safe-zone warning is too short to react during play and requests a longer delay before the quarter-screen laser fires.
- Change the quarter-screen warning independently of the single-line laser's warning.
- User selected 2.0 seconds of safe-zone warning before firing. Single-line warning remains independent.
- The marked safe zone must remain fixed throughout the warning and firing, and danger collision must not start during the warning.

## Animated Laser Preview Revision — Approved and Integrated
- Preview-only files: `.memory/previews/2026-10-27-lasers/laser-animations.template.html` (editable animation), `laser-animations.html` (embedded artwork fragment), `preview.html` (standalone browser page).
- User viewed the standalone animation and approved the colors but found the beam too rectangular. Requested a more light-like appearance.
- v2 keeps the cyan/white palette, random single-line height, right-to-left motion and 2-second quarter warning. Replaces filled beam rectangles/edge rails with additive blurred round rays, layered luminous filaments, drifting highlights and soft leading bloom. Adjacent dangerous quarters share the glow; only the safe lane is excluded. Safety markers use horizontal boundaries rather than a boxed grid.
- User approved v2 and requested integration on 2026-10-27. The actual renderer now uses the same layered light routines. Other wall/dash/music previews remain pending.

## Review Status
- Hybrid wall approved; implementation baseline: after first boss clear, replace 50% of special choices without changing total special probability.
- SPACE dash effect: option 1 shock ring approved; implementation pending.
- All twelve music directions and boss-entry siren option 1 approved.
- All requested visuals, normal/boss music and entrance cue approved. No pending preview selection remains.

## Resumed Review: 2026-10-27
- User requests continuing the unfinished items; laser v2 integration is already complete (`0bf9579`, `0515da0`), not a pending replacement.
- Confirmed HP behavior: label `BOSS HP`, display 3 at entry, then 2 / 1 / 0 after successful WASD challenges. Failed challenges do not remove HP. Use existing `boss.hp` / `boss.maxHp`; no clear-condition change.
- Hybrid-wall search found no existing combined kind or implementation. User selected option 1 and approved the review image: ordinary top/bottom cyan solids with a thin vertical magenta special barrier spanning only their opening at the same X; player must align with the opening AND dash through the barrier. Normal solids remain lethal during dash. Barrier breaks locally at the player's crossing height. This confirms geometry, not completed implementation.
- Background evidence: `updateStage` integrates wall-speed travel, but `drawBackgroundTransition` translates the whole scrolling scene while `drawStageArtwork` also scrolls its texture at 0.25 wall speed. A moving transition boundary must advance at wall speed without adding texture displacement to the scene translation. The reduced-motion branch currently completes its crossfade in about 0.15 seconds, despite the transition state lasting a screen of travel.
- Confirmed obstacle behavior: pause new spawns until the next background completely replaces the old one; retain existing walls and their original stage art, and do not accumulate delayed spawn bursts.
- Current review order: hybrid wall geometry, visible SPACE-dash variants, six distinct stage BGM audio samples. Ask one question at a time in ordinary chat, never a separate choice popup.
- Remaining implementation follows a new memory plan after design review. Do not describe preview generation as completed game integration.

## Hybrid Wall Preview 01 — Approved
- Built-in imagegen; preview only, no production asset replacement.
- File: `C:/Users/이근혁/.codex/generated_images/01a0e595-90a5-77c1-a99f-35ac0036b2e8/exec-ea5fe64a-8e77-460b-afc2-b9cadabbf55a.png`.
- References: Crystal Gates background, normal-wall, special-wall and default aircraft assets from `public/assets/game/`.
- Prompt: two side-by-side gameplay concept panels, APPROACH and DASH THROUGH; same thick cyan top/bottom solids with one passage, a very thin vertical magenta barrier spanning only that passage at the same X; approach aligned inside the opening, then break the barrier locally at flight height by SPACE dash, leaving normal solids intact. Restrained dark crystalline background; retain existing silver/cyan ship silhouette; no bosses, lasers, hitbox rectangles or unrelated UI.
- Visual inspection: correctly shows barrier confined to the opening, normal upper/lower solids intact, and localized break around the ship. Gameplay scale and timing remain illustrative, not implemented screenshots.
- User selected option 1: use the combined opening+dash geometry as shown.

## SPACE Dash Preview 01 — Approved
- Built-in imagegen, three separate preview-only images using the actual Crystal Gates background and default aircraft as references. No gameplay code changed and no production sprites replaced.
- Shared prompt: retain the right-facing silver/cyan ship, dark blue crystal background and long curved tapering cyan flight ribbon; make SPACE feedback visible around/on/in front of the hull, independent of the ribbon; no rectangle, hitbox, permanent shield or full-screen flash. Existing movement/collision behavior stays unchanged. Enlarged illustration scale is for comparing effects.
- Option 1 / SHOCK RING (recommended): brief white/cyan expanding broken oval pressure wave and a few radial sparks around the ship. File: `C:/Users/이근혁/.codex/generated_images/01a0e595-90a5-77c1-a99f-35ac0036b2e8/exec-2658eb4a-0ee1-46a9-832b-d74f82592c80.png`.
- Option 2 / PHASE FLASH: white/cyan hull flash, two nearby translucent ship silhouettes and a few thin speed streaks. File: `C:/Users/이근혁/.codex/generated_images/01a0e595-90a5-77c1-a99f-35ac0036b2e8/exec-60ed7509-fc9a-4d64-8d7b-2f8f8bd6c78d.png`.
- Option 3 / FRONT BURST: compact white/cyan crescent just ahead of the nose, short top/bottom streaks and a brief front-armor highlight. File: `C:/Users/이근혁/.codex/generated_images/01a0e595-90a5-77c1-a99f-35ac0036b2e8/exec-498babb6-2b75-4068-a0f1-0a5030f090d1.png`.
- Visual inspection: all retain the curved rear trail while adding a distinct bright effect near the ship. These are still concept frames, not runtime screenshots or animations. Ghost spacing and ring size must be scaled to the actual gameplay ship during implementation after selection.
- User selected option 1: SHOCK RING. Use a brief expanding white/cyan oval pressure wave around the ship, preserving the normal curved flight trail and existing movement/collision. No rectangular hitbox, permanent shield or full-screen flash. Continue the stage BGM listening review before game integration.

## Stage BGM Sample Set 01 — Approved Direction
- Six original synthesized eight-bar sketches, generated locally by `.memory/previews/2026-10-27-stage-bgm/compose-samples.mjs`; no external recordings or service dependencies.
- Preview player: `.memory/previews/2026-10-27-stage-bgm/preview.html`. Each card uses its actual stage background and a local WAV. Native controls, six-track playlist, exclusive playback, stop/reset and WAV downloads. No autoplay.
- CRYSTAL GATES / Prism Drift: 112 BPM, 18.04s, D-major/Lydian color, clear bells, wide pad and light beat.
- INDUSTRIAL VOID / Cold Assembly: 120 BPM, 16.90s, E-minor color, clipped bass pattern, metallic percussion and restrained pulse lead.
- SIGNAL MONOLITHS / Echo Protocol: 126 BPM, 16.14s, C-minor/Dorian color, alternating arpeggios and dotted pulse echoes.
- GRAVITY WELL / Event Horizon: 92 BPM, 21.77s, C-sharp-minor color, sustained low drone, descending figures and half-time beat.
- ABYSSAL BEAST / Bioluminescence: 104 BPM, 19.36s, D-minor color, watery FM plucks, rounded bass and spacious pads.
- SOLAR FORGE / Helios Run: 138 BPM, 14.81s, A-minor color, driving bass, electronic brass lead and active drum fills.
- WAV verification: six distinct stereo 24kHz/16-bit files; expected durations, RMS 0.115–0.140, peak <=0.84, no clipping and zero-valued endpoints. This is technical audio validation, not a claim of subjective listening approval.
- Player verification using JSDOM: all local audio/art references exist, playlist advance, single-track playback, stop/reset, status and error message work. Actual sound preference remains for the user to decide.
- These are finite review sketches with fade-out, not finished seamless production loops. After approval, arrange loop-ready versions and connect the existing scene transition/mute/pause lifecycle. Do not treat the current semitone-only scene implementation as distinct stage tracks.
- User selected option 1: adopt all six stage directions. Gameplay integration remains pending. User additionally requests matching boss arrangements that retain each stage's musical identity while sounding more urgent and exciting, with listening examples before integration.

## Stage Boss BGM Sample Set 01 — Approved Direction
- Source: `.memory/previews/2026-10-27-stage-boss-bgm/compose-samples.mjs`, using the shared preview synthesizer in `2026-10-27-stage-bgm/compose-samples.mjs`.
- Comparison player: `.memory/previews/2026-10-27-stage-boss-bgm/preview.html`; six cards each contain the approved normal track and its boss arrangement. Buttons play six boss tracks or normal/boss pairs, with exclusive playback, manual playlist override, stop/reset and downloads.
- Arrangement rule: preserve original chord progression, main melody and lead timbre; increase tempo, add sixteenth-note ostinatos, tighter bass, octave responses, stronger drums and four-bar fills. Twelve-bar review sketches; no gameplay/audio-manager edits.
- CRYSTAL GATES / Prism Overdrive: 112 → 136 BPM, 22.08s, bell theme plus fast arpeggios and stronger percussion.
- INDUSTRIAL VOID / Assembly Lockdown: 120 → 144 BPM, 20.90s, metallic rhythm and chopped bass with more driving pulse.
- SIGNAL MONOLITHS / Protocol Breach: 126 → 150 BPM, 20.10s, signal motif with dense repeating pulses and responses.
- GRAVITY WELL / Horizon Collapse: 92 → 116 BPM, 25.73s, descending motif and drone with urgent bass pulses.
- ABYSSAL BEAST / Abyss Awakening: 104 → 128 BPM, 23.40s, watery timbre with rapid low rhythmic figures.
- SOLAR FORGE / Helios Meltdown: 138 → 158 BPM, 19.13s, brass motif, fast bass and energetic drum fills.
- Validation: shared synthesizer regenerated all six approved normal WAVs byte-for-byte (SHA-256 checked); their existing files were not overwritten. Boss files are six distinct stereo 24kHz/16-bit WAVs, zero-valued endpoints, peak <=0.84, RMS 0.144–0.150; no clipping. Original chords, main melodies and lead instruments match, with higher event density per beat.
- Comparison-player checks: all 12 audio paths and six background paths exist; six-boss playlist, normal/boss playlist, single-track playback, manual override and stop/reset pass in JSDOM. This verifies files and playback logic, not subjective listening approval.
- User selected option 1: adopt all six boss directions. Additional request: an arcade-style repeated boss-entry siren, referencing the tension of Mega Man boss warnings; create original listening examples and obtain approval, then continue the unfinished gameplay/audio work.
- Existing audio evidence: `warning` currently plays two short square tones; `boss` is a short low tone played after entering boss mode. No repeated siren is attached to the pre-entry `bossPreview` yet. Preview duration is already 1.5 seconds (`BOSS_PATTERN_PREVIEW_SECONDS`). Prepare three original three-pulse variants that fit this interval instead of extending gameplay timing for the sample.

## Boss Entry Siren Sample Set 01 — Approved
- Source: `.memory/previews/2026-10-27-boss-entry-siren/compose-samples.mjs`; preview `.memory/previews/2026-10-27-boss-entry-siren/preview.html`.
- Three original arcade-style warning designs; no external recording or original game audio sampled. Each is 1.5s with three 0.4s bursts starting at 0, .46 and .92 seconds, matching the existing pre-boss preview interval.
- Option 1 (recommended), `01-sweep.wav`: rising/falling 260–770Hz sweep with a restrained harmonic edge; classic urgent arcade character.
- Option 2, `02-two-tone.wav`: alternating 390/660Hz tones within each burst; clear electronic emergency signal.
- Option 3, `03-low-alert.wav`: lower 190–440Hz sweep with a sub-octave layer; heavier spacecraft alarm character.
- Each has an 8s `-with-bgm.wav` comparison: approved Crystal Gates normal track for 3s, ducked normal track plus 1.5s siren, then approved Crystal Gates boss arrangement for 3.5s. This previews entering the boss cue before the boss music begins.
- Validation: six distinct stereo 24kHz/16-bit WAVs, exact 1.5s / 8s lengths, three non-silent bursts separated by silent gaps, zero stereo endpoints and no clipping. Standalone RMS .230, peaks .337–.493; context peak <=.82. JSDOM checks passed for six local audio paths, both playlists, exclusive playback, manual override and stop/reset. These are technical checks, not subjective listening approval.
- Proposed integration after selection: trigger once at the start of each `bossPreview`, briefly duck BGM, start the stage-specific boss music on actual entry, respect mute/pause/menu/restart lifecycle and avoid duplicate cues or extending preview duration. Normal WARNING retains its separate cue.
- User selected option 1 (rising/falling sweep), then requested proceeding with all remaining work.

## Laser Scheduling Approval and Integration
- User explicitly requests single lasers during wall travel without covering wall gaps, and quarter lasers only with no walls on screen.
- Corrected the old gap-overlap predicate and removed the unsafe center-gap fallback. Safe Y protects all visible normal gaps and their complete movement envelopes; no safe slot means skip.
- Single opportunities occur after wave generation, while normal walls are still approaching and special-wall response has resolved. Keep that wave intact after the shot; continue to WASD.
- Quarter telegraph starts only after all visible walls, including passed ones behind the player, have exited. Spawning remains paused through 2s warning, 1s active and .15s fade.
- Shared .4s right-to-left front is used by both rendering and collision; warnings/fades never damage the player.
- Active implementation plan: `.memory/plans/2026-10-27-laser-light-integration.md`.

## Final Addition and Implementation Baselines
- User requests boss appearance to begin together with boss music after the siren, sliding from outside the right edge rather than appearing instantly.
- Baseline: 1.0s smooth entrance from beyond the entire sprite to normal x=842; update in simulation time, pause correctly. Hold new boss-wall spawns and attacks until settled; existing in-flight walls keep moving. Preserve each boss idle motion after entrance.
- Hybrid baseline: unlock after first clear, choose for half of existing special-wall rolls, preserve total chance and boss minimum counts. Static opening for this combined type; normal solids remain lethal while the targeted inner barrier can be dashed. Existing stage art and timing windows retained. These numeric baselines are implementation judgments consistent with earlier post-first-boss unlock rules, not additional user selections.
- All remaining work is authorized. Execute plan `2026-10-27-combat-audio-integration` through completion with per-task verification and commits.
