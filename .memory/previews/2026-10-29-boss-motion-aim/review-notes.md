# Boss Motion, Aiming and Entrance Review

- Date: 2026-10-29
- Status: D01..D13 confirmed in ../../decisions/2026-10-29-boss-motion-aim-patterns.md. Added gameplay-text cleanup confirmed (keepT03; cleanT01/T02/T04/T05). Preview only; production unchanged.
- User prefers inline numbered choices, one question per turn. Use actual assets and animated examples for visual decisions.

## Requested / Accepted Intent
- Clarified passed-wall request: only the VISIBLE SPECIAL-WALL TIMING GUIDE must stop changing width after it passes the player. User explicitly wants moving gaps to continue oscillating. Do not freeze wall/gap geometry, travel or alter collision rules under this request.
- Drain all old walls fully off the left screen before starting a boss, not merely past the player. Stop ordinary spawning when boss is pending; retain ordinary speed while clearing old walls so entry factors cannot change approach timing.
- Darken before boss while keeping player visible, show boss alert, then reveal boss background progressively as boss enters from right.
- More noticeable stage-specific articulation and action animations; show idle, charge, fire, roar, hit and entrance examples before confirmation.
- Boss travels vertically; user approved center20..80% of screen height (108..432 in540px world),6s smooth sinusoidal round trip after reviewing the wide animation. User selected CONTINUOUS movement during projectile telegraph/firing: unlaunched trajectory previews follow current boss/muzzle; each projectile's path is committed at its own launch and stays fixed thereafter (no homing). Roar and other source effects follow current boss geometry.
- Player laser faces and travels strictly right; no automatic targeting/guaranteed hit. User confirmed100% of the visible boss artwork is hittable, including wings/protrusions (not core-only or70% body). Transparent exterior margins are not artwork. User selected contact during the.20s visible beam window, at most one damage event per accepted shot. Misses deal no damage; preserve existing ammunition consumption/recharge.
- Manual-laser charge HUD: user selected design2 (bottom-center reactor arc), then selected size2 (80px diameter) after seeing identical normal/special-wall scenes. Style and size confirmed.
- Speed growth cap becomes200 for ALL aircraft, preserving actual+10 per10 points: NOVA/AEGIS240->440, VELOCITY480->680; existing boss factors separate.

## Verified Existing Constraints
- `startWarningIfNeeded` creates bossPreview immediately at threshold; `updateBossPreview` begins encounter after1.5s without waiting for existing obstacles to exit.
- `getBossGeometry` currently fixes centerY270 and192x128 artwork box. Engine projectiles/fire and renderer/effects call it independently. New motion requires one shared transform/snapshot for drawing and gameplay origins/collision.
- `updateObstacle` continues moving gaps after `passed`; passage flag is set after full wall width passes the player's left visual boundary. Collision scans all walls, although horizontal overlap excludes walls fully behind the player.
- Each obstacle stores kind/gapHeight/stageId/broken state; these are not reassigned at boss entry in the inspected engine. Do not describe a proven kind-change bug without a reproduction.
- Manual weapon currently charges.5, lasts.7, resolves one guaranteed impact at.5; renderer rotates ship toward core and draws to core. New aiming rules supersede those behaviors, not recharge10s/one stored round unless requested.
- AEGIS damage3 and other craft1; all bosses3HP. Preserve unless user changes.

## Visual Proposals
- Six-stage motion preview: amplify existing separate-part articulation, distinguish charging/fire/roar/hit, and use visible smooth vertical flight. Same approved art; no replacement boss designs.
- Charge HUD1 recommended: frameless horizontal segmented rail with thin circuitry and compact Shift/Ctrl labels.
- HUD2: bottom-center reactor arc — selected,80px arc diameter in960x540 logical coordinates; preserve approved bottom placement, compact key label and charging/ready styling. Scale with playfield. Other sizes not selected.
- HUD3: compact bottom-right vertical capacitor.
- These examples are design proposals and do not change production engine, HUD or collision.

## Reactor Size Review Evidence
- [Comparison](./reactor-sizes.png), [interactive/full scenes](./reactor-size.html): ring diameters64,80,104 in unchanged960x540 logical playfield. User selected80px (option2); do not confuse size choice with the earlier reactor-style option2.
- Same production-rendered backdrop, actual ship/boss assets and fixed normal/special-wall arrangement for every option; only candidate HUD diameter changes. Bottom key label alignment remains fixed.
- Lower normal gap deliberately reaches y455 so overlap with lower flight routes is visible; this is a composition fixture, not a claim about live wall generation.
- Comparison left uses the same half-scale complete field; right crops the SAME260x150 region at the same1.8x zoom for every option. Whole-frame PNGs remain960x540.
- Ready/charging toggles in the review page allow contrast inspection. Source syntax and whitespace checked; no production files changed.

## Pending Branches
- None requiring another user choice. Gameplay-text cleanup confirmed in text-audit.md: keep >> 가속 / << 감속 unchanged; remove other numbered candidates while retaining functional WASD/controls. Implement only in the planned execution stage.
- Implement stronger action articulation from the demonstrated preview as a code-derived visual direction, not an additional claimed user selection. Preserve existing live flight and entrance/preview durations where compatible with requested dark entrance; routine visual timing can be chosen in planning.

## Boss Damage Area (Confirmed)
- User chose the entire boss,100% of visible artwork. Prior suggested70% body/core-only options are rejected.
- Exact shared geometry must follow actual boss motion, not independently recomputed renderer positions. Current production still auto-hits at charge completion; no implementation changes yet.

## Earlier Full-window Vertical Motion Preview (Superseded Range)
- User requested animation in the whole playfield before choosing movement range.
- Proposal: centerY=270+120*sin(2*pi*t/6), i.e.150..390 (27.8..72.2% of540px world), one round trip6s, maximum center speed125.7px/s.
- Existing192x128 nominal art box then extends y86..454 (15.9..84.1%); articulating parts may extend a little beyond the nominal box. Preserve actual ship/boss artwork sizes and80px reactor.
- Full-window canvas uses the entire960x540 field with actual production background/wall/ship rendering, separate amplified boss rig and shared translated muzzle/core in this preview. Walls and automatic ship motion are visual fixtures, not a playable collision simulation.
- Six stage selectors, optional range guides, pause/replay/fullscreen; real-time6s WebM plus top/middle/bottom reference frames. The earlier28..72% range was superseded by confirmed20..80%; preserve these earlier artifacts for comparison only.
- Artifacts: [full-window interactive](./full-motion.html), [video player](./full-motion-video.html), [range reference](./full-motion-range.png), [recording](./full-motion.webm).
- Recorded960x540 VP8,144 frames,6.03s. Added WebM duration metadata without re-encoding for usable playback controls.
- Actual playback QA decoded140 frames to6.03s, samples at.513/1.515/4.515/5.815s have different boss-region pixel hashes; no decoder error. [Decoded frame](./full-motion-decoded.png) shows boss near lower endpoint. Report: full-motion-playback.json.
- Reviewed recorded image and top/middle/bottom references. Preview sources pass syntax/whitespace checks; src/tests remain unchanged.

## Wider Motion Revision (Confirmed)
- User chose option3 to SEE a revised animation: center20..80%, i.e.108..432, amplitude162. Keep6s round trip and all other scene/art/UI sizes unchanged.
- Nominal128px artwork box spans y44..496 at extremes, retaining screen margins. Max center speed169.6px/s (35% higher than prior range at unchanged cycle).
- Preserve the earlier28..72% files as comparison. New interactive query `range=wide`; new movie/poster/range/report filenames use `full-motion-wide` prefix.
- After seeing the revised animation, user selected option1: keep20..80% and6s round trip. Movement range and cycle confirmed; no production code changed during interview.
- Wide artifacts: [interactive](./full-motion.html?range=wide), [video player](./full-motion-wide-video.html), [reference frames](./full-motion-wide-range.png).53 assets loaded; actual report confirms center108..432 and nominal art44..496.
- Wide recording:960x540 VP8,144 frames,6.019s. Playback QA decoded141 frames through6.019s, distinct boss-region samples, no decoder error. Reviewed decoded lower-end frame and top/middle/bottom strip. Original narrower recording preserved.

## Player Beam Contact Timing (Confirmed)
- Preserve.50s charge+.20s recovery/.70s movement lock and right-facing ship/beam. Entire visible boss is hittable.
- User selected option1: damage at most once if boss overlaps the horizontal beam at any time during its.20s visible firing/recovery window. Instant-only testing rejected.
- Misses deal no damage. Preserve ammunition use/recharge on accepted shot (existing behavior) unless user explicitly changes it; do not refund a miss or introduce homing.

## Already-passed Timing Guide (Clarified / Confirmed)
- User means the early-run special-wall timing band displayed before the first boss clear, NOT actual wall collision/gap geometry. The guide looks bad when its width changes after the wall has already passed.
- Keep moving gaps moving and preserve current collision, wall motion, scoring and broken-wall behavior. Reject the prior proposed wall/gap freeze and collision-removal alternatives as a misinterpretation.
- Verified cause: renderer `getTimingGuideWidth` recomputes current `difficulty.scrollSpeed * difficulty.timingWindowSeconds` every frame, even for passed walls. Changes of speed or normal/WARNING/BOSS window therefore resize a band already behind the player.
- Capture the displayed guide's width in logical pixels at passage, BEFORE encounter/mode changes triggered by processing that wall. Subsequent frames use the stored width and keep translating with the obstacle until exit. Preserve live width calculation for upcoming walls, so the displayed upcoming window matches real timing.
- Preserve early-guide visibility rules; do not enable permanent guides or add a hitbox outline. Apply the rule to any special/hybrid guide renderer path that is actually used.
- Data-field naming and exact passage handling/tests belong in planning; include a regression switching difficulty after passage and a moving-gap-continues assertion.

## Added WASD and Global-laser Requests
- WASD failure-effect duration confirmed by user option1:8s for both ink/glitch (was5s), random50/50. Preserve approved partial-screen appearance and final1.2s fade. Seven/ten-second alternatives not selected.
- WASD sequence minimum becomes4 keys. Preserve max8, maximum-minus2 random variation with new floor4, no4 identical consecutive keys, first-boss5s /later2.8s input limits. First boss therefore exactly4 keys; second4..5, third4..6, fourth5..7, fifth onward6..8.
- Improve global/quarter laser safe/danger-zone distinction: user selected visual option1 (teal safe / red diagonal danger). Preserve right-to-left light-beam appearance and readable player.
- Global-laser frequency confirmed: user chose100% instead of60% (80% alternative rejected). Preserve1..3 shots per global sequence and second-boss unlock. With newly requested randomized order, interpret this as always including the global pattern when eligible, not forcing it to remain immediately after signatures.
- These four items are part of the same pending execution scope. No production edits during interview.

## Added Random Pattern Order (Confirmed)
- User wants boss pattern order randomized rather than current walls -> wall-free signatures -> global(if eligible) -> roar/WASD -> restart walls.
- User selected option1: shuffle ALL eligible pattern blocks once each per round: walls(with existing single-projectile/line-laser opportunities), wall-free multi-projectiles, global lasers(second boss onward), roar+WASD as one inseparable block. Reshuffle next round; avoid immediate block repetition at round boundary.
- Walls-first alternative rejected. Boss entry first block may be any eligible type; first boss has no global block because existing second-boss unlock stays.
- Global and wall-free multi-projectile blocks still wait for all existing walls to leave the viewport. Each projectile volley must resolve and each laser sequence/fade must finish before next block; no simultaneous incompatible patterns.
- Preserve internal counts1..3 signature volleys,3..6 projectiles per volley,1..3 global shots, single wall-flight shot, changing safe quarter/fresh warning per global shot, and live roar followed by paused WASD.
- Independent player recharge/firing and boss HP/clear rules remain separate from shuffled block completion. Do not tie clearing to finishing all blocks.
- Pattern-order scope confirmed; global safe-danger option1 also confirmed. Stronger action animation uses the already shown prototype as implementation direction for the requested visibly livelier motion.

## Global Laser Visual Review (Option1 Confirmed)
- [Comparison](./global-laser-comparison.png), [animated review](./global-laser-review.html). Top row telegraph, bottom row active fire, same safe quarter and production backdrop/ship/boss. Obstacles absent by design for global attacks.
- User selected option1: pale teal safe fill, bright teal boundaries/inward chevrons/SAFE label, contrasting red diagonal hatching and DANGER labels covering the hazardous regions. Maintain marks during active light beams.
- Option2: brighter safe fill with darker hazardous backdrop and no red hatching; same safe boundaries/labels and original cyan/white light beams.
- Safe label displays countdown during warning; active label directs staying inside. Bottom-quarter SAFE label shifts away from the approved80px reactor HUD so the two do not obscure each other.
- Animation uses production createQuarterLaser/updateLaser/drawLaser for2s warning, right-to-left sweep, active/fade; candidate highlighting is preview overlay only. Supports all four safe-quarter positions via selector.
- Reviewed both styles in warning/active screenshots. Preview scripts pass syntax checks; production files unchanged.
