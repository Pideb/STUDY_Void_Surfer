# Decisions: Combat Visual and Audio Polish

- Date: 2026-10-27
- Status: Interview in progress — laser v2 approved and integrated separately; remaining wall/dash/music previews pending.

## Requested Changes
1. Show `BOSS HP`, starting at 3 and decreasing once per successful WASD challenge. The engine already exposes hp/maxHp; the current HUD displays successfulChallenges instead.
2. Improve quarter-screen safety-lane laser into clearly visible bright light firing right to left, rather than translucent colored coverage.
3. Verify single-line laser and obtain approval on its actual source asset and gameplay appearance.
4. Verify a hybrid wall: ordinary top/bottom solids with a special dash barrier inside the gap. Show a visual example for the user's understanding check before implementation.
5. Make stage transitions travel naturally at wall approach speed.
6. Pause new obstacle generation until the background transition has fully finished. Existing in-flight obstacle handling must preserve their stage art. Avoid accumulating a burst of delayed spawns.
7. Compose separate BGM for six stage backgrounds, deliver playable samples, and obtain approval before integrating.
8. Deliver several clearly visible SPACE-dash effect previews and obtain approval; current long exhaust trail masks dash feedback.

## Code Inspection
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

## Pending Review Queue
- Hybrid wall example/geometry and timing interpretation.
- SPACE dash effect variants.
- Six stage BGM audio samples and selection.
- Any unresolved transition/fairness details after reviewing the current code and preview feedback.

## Laser Scheduling Approval and Integration
- User explicitly requests single lasers during wall travel without covering wall gaps, and quarter lasers only with no walls on screen.
- Corrected the old gap-overlap predicate and removed the unsafe center-gap fallback. Safe Y protects all visible normal gaps and their complete movement envelopes; no safe slot means skip.
- Single opportunities occur after wave generation, while normal walls are still approaching and special-wall response has resolved. Keep that wave intact after the shot; continue to WASD.
- Quarter telegraph starts only after all visible walls, including passed ones behind the player, have exited. Spawning remains paused through 2s warning, 1s active and .15s fade.
- Shared .4s right-to-left front is used by both rendering and collision; warnings/fades never damage the player.
- Active implementation plan: `.memory/plans/2026-10-27-laser-light-integration.md`.
