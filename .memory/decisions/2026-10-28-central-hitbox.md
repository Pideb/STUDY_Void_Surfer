# Decisions: Central Square Hitbox

- Date: 2026-10-28 (Asia/Seoul)
- Status: Implemented and verified 2026-10-28. All five Tasks complete; final implementation/validation commit `b2ece8b`. The interview decisions below record the approved requirements.
- Feature name: `central-hitbox`
- Approved review: [comparison.png](../previews/2026-10-28-central-hitbox/comparison.png), generated with the production aircraft renderer and existing assets.

## Review Result: Independent Large Success Box — User Selected Option1
- User approved the common **56x36** special-wall success rectangle shown in [dual-timing.png](../previews/2026-10-28-central-hitbox/dual-timing.png). Use the same centered, axis-aligned size for all three craft.
- This supersedes the earlier16px-leading-edge activation proposal. Existing wall-timing.png documents the OLD current runtime behavior only.

## D01. Centered 16x16 Damage Area — User Selected Option1
- **Chosen**: All three aircraft use a centered, axis-aligned **16x16 world-pixel square** for hit detection.
- Bounds: left=`player.x-8`, right=`player.x+8`, top=`player.y-8`, bottom=`player.y+8`.
- No front trim or rear offset applies to this symmetric square. Ship tilt or temporary laser-facing animation does not rotate the collision area.
- **Rationale**: User requested a square in the central part of the ship and selected the smallest, most forgiving of the three actual-aircraft previews.

## D02. Separate Artwork Dimensions from Collision Dimensions — Scope Applied from Code Inspection
- **Chosen**: Preserve aircraft artwork, existing render dimensions/scaling, flight physics, trail and recharge-ring placement. Introduce an independent collision size rather than shrinking the shared `player.width/height` used by the renderer.
- **Rationale**: Current player dimensions36x24 drive both visuals and geometry. Merely changing those constants would shrink the ship and alter cosmetic effects, contrary to the approved preview.
- All actual damage checks use the same central square: ordinary/special/hybrid solids, boss projectiles, single/global lasers, and upper/lower screen boundaries. Boundaries remain lethal; their contact geometry follows the selected damage area.
- Use the same square for hybrid-opening containment and laser safe-route/player-height calculations, avoiding a16px actual body with stale24px clearance assumptions.
- Preserve other gameplay timings, scoring and independent administrator invincibility rules.

## D03. Independent56x36 Success Rectangle — User Confirmed
- **Chosen**: Special/hybrid activation uses a separate centered **56x36** rectangle: left=`player.x-28`, right=`player.x+28`, top=`player.y-18`, bottom=`player.y+18`. It is axis-aligned and shared by every craft, irrespective of artwork aspect ratio or facing.
- Space can succeed as soon as this large rectangle first touches the wall's success band, while the small16x16 damage body has not collided with an unbroken solid wall. Partial intersection is enough; the center and entire rectangle need not enter. Entry alone never activates or queues a dash: a fresh accepted Space press is required.
- Keep the wall's visual timing-band width `currentSpeed * windowSeconds`: **0.30s** normally and **0.15s** in WARNING/BOSS. The horizontal eligibility test is inclusive interval overlap: `successBounds.right >= barrierX - currentSpeed * windowSeconds && successBounds.left <= barrierX`.
- The large rectangle may overlap the wall while the small damage square remains clear; large-box contact is never lethal and must not prematurely disable a valid Space press. Do not use the old formula requiring the large front edge to remain left of the wall. A dead ship or actual small-body overlap with an unbroken solid cannot be rescued retroactively.
- Example: speed400, BOSS window.15 → band begins60px before barrier. Activation becomes available with center88px before the barrier (large front edge60px before it). This intentionally increases input tolerance compared with center-based timing; band durations themselves are unchanged.
- Preserve hybrid-wall requirement to be vertically inside the opening and perform a successful timed dash; update opening containment to the selected body, not the visible wings. A square partly embedded in the upper/lower solid wall does not qualify merely by touching the horizontal success band.
- Space cooldown remains0.7s; projectile dash protection remains0.6s; mandatory special-wall passage separation remains1.2s.
- The large rectangle applies only to special-wall horizontal timing. Damage, hybrid vertical opening containment and boss projectile contact use16x16. Projectiles retain0.6s dash contact immunity, without a new large-box reflection/success mechanic.
- **Rationale**: User requested a separate aircraft-sized success box after seeing the small damage square and selected the shared56x36 proposal. This improves visual timing and avoids per-craft success advantages.
- The existing wall-timing.png explains OLD current center-based logic. Implementation must align actual activation and timing-guide progress/highlighting with large-box interval overlap.

## D04. Debug Visualization — Existing Behavior Preserved
- **Chosen**: Review overlays are comparison aids only. Do not add a permanently visible square to ordinary gameplay or bring back a hitbox on dash.
- Existing designated administrator's hitbox-display option must draw the real16x16 square when enabled.
- **Rationale**: Existing user requirements keep normal play free of rectangular hitbox overlays while retaining administrator inspection.

## D05. Improve Full-window Rendering Resolution — User Request; Code-derived Approach
- **Chosen**: Improve rendering clarity across the game, especially player aircraft, by sizing the canvas drawing buffer to its actual displayed viewport and device pixel ratio, instead of enlarging a fixed960x540 drawing buffer on a large window.
- Preserve the logical960x540 game world, gameplay coverage, aircraft visual size and both logical hitbox sizes. Rendering at more pixels must not add offscreen game space, zoom the playfield, change physics/speed or shift collision positions.
- Current evidence: `createRenderer.resize` uses `WORLD_WIDTH * devicePixelRatio` and `WORLD_HEIGHT * devicePixelRatio` only. CSS makes the canvas fill the entire viewport. Thus1920x1080 at DPR1 enlarges a960x540 raster2x.
- Existing aircraft PNGs are1536x1024 (NOVA),1774x887 (AEGIS/VELOCITY). They are already ample for player display; do not regenerate/repaint selected ship art as a first remedy. Crystal background is1672x941, so higher-resolution rendering cannot invent source texture detail on very large screens; vector effects/sprites still benefit from removing avoidable canvas upscaling.
- Use independent X/Y render transforms from actual buffer dimensions to the unchanged logical world, retaining current full-window coverage. Reapply high-quality image smoothing after canvas resize. Cover menu rendering as well as gameplay/foreground/effects.
- Follow existing resize lifecycle and add element-size/DPR awareness as needed; resizing a canvas clears it, so menu/paused frames must be redrawn rather than left blank. Avoid reallocating the backing buffer every frame when dimensions have not changed.
- Apply a practical render-pixel/DPR ceiling for high-density/mobile performance, maintaining aspect ratio when applying the ceiling. Select concrete limits in planning with desktop1080p/1440p/4K and landscape-mobile evidence; do not promise unlimited native rendering on every device.
- Implemented limits: DPR at most2, render-buffer area at most3840*2160 pixels, uniform scale reduction when exceeding this area. Real1920x1080/DPR1,640x360/DPR2 and3840x2160/DPR2 captures passed.
- **Rationale**: User asks for sharper player artwork and prefers an overall resolution improvement. The avoidable viewport-to-buffer mismatch affects the whole canvas, while source ship files are already high resolution.

## D06. Aircraft-specific Speed Progression Caps — User Requested
- **Chosen**: Stop score-based speed growth at **70 progression points for VELOCITY**, and **100 progression points for NOVA/AEGIS**, replacing the shared150-point cap.
- Scores continue increasing normally; these are speed-calculation caps, not final-score limits. Apply to the existing monotonic progression score before VELOCITY's final-score1.5 multiplier, so pause deductions still cannot lower reached speed.
- Preserve the existing10%-per10-points growth and aircraft multipliers, including VELOCITY's2x movement speed. Preserve boss slow/fast/shift factors and VELOCITY high-boss adjustment; boss deviations can exceed capped ordinary-flight speed and return to the new capped ordinary target on clear.
- **Rationale**: User explicitly requests different ceiling scores by aircraft. Existing prior boss exceptions were not revoked.
- Update every shared speed consumer consistently: getDifficulty/getBaseSpeed, boss entry base snapshot, clearance/future special-spacing bounds and any UI/README descriptions. Do not leave a150-point future-speed bound that unnecessarily delays special spawns after normal movement has switched to70/100.

## D07. Exclude Top/Bottom10% from Line-laser Placements — User Confirmed Option1
- **Chosen**: Prevent the line-laser pattern from spawning in strips at the very top/bottom of the viewport. Applies to both one-line and two-line selections of the existing `kind:'single'` pattern; every selected beam must respect it.
- Exclude **10% of world height at EACH edge**, i.e. top54px and bottom54px in the logical540px world. Allowed damaging-beam area is y54..486. The15% alternative was not selected.
- Restrict the whole damaging beam thickness, not only its center, to the remaining allowed vertical region. Decorative glow may feather outside this region; it is not collision geometry.
- With the current18px beam thickness, a valid beam center must be within y63..477 (inclusive), in addition to all existing gap/safety constraints. Scale margins by logical world height, not physical render pixels, so high-resolution rendering does not change placements.
- Preserve every active/moving gap safety exclusion and special-response conflict rule. If two safe interior beams cannot fit, fall back to one; if none can fit, skip without forcing an opening collision or putting the beam back at the edge.
- Global/quarter lasers are outside this placement restriction and retain their existing safe-quarter pattern.
- **Rationale**: `findSafeLaserY` currently samples down to thickness/2 from the viewport edge, which permits line attacks that do not threaten useful flight positions. The user wants those placements removed.

## D08. AEGIS Defeats a Boss with One Player-laser Hit — User Requested
- **Chosen**: All bosses still initialize and display **3/3 HP** for every aircraft. An AEGIS player laser deals **3 damage on its single impact**, changing HP directly3→0; do not shrink maxHP or show a one-segment health bar.
- NOVA/VELOCITY player lasers retain1 damage and require3 hits. Charging10s, one stored shot, manual Shift/Ctrl/mobile button, .2s charge/.1s recovery and guaranteed boss hit remain unchanged.
- Damage must occur exactly once at the actual laser impact, not when charged, when input is accepted or on WASD success. Preserve existing boss-hit/defeat effects and+10 boss reward/stage progression exactly once.
- Keep landed-shot count separate from damage amount: AEGIS landed1 laser, not3 fictitious shots. Existing `hp = maxHp - laserHits` must become damage-aware without reintroducing challenge-based damage.
- Update aircraft-selection/tutorial descriptions that currently state an unconditional three-shot clear so they describe AEGIS's exception accurately.
- **Rationale**: User specifically asks for an AEGIS one-shot clear with the same three-cell HP presentation.

## Code-derived Implementation Constraints
- `src/game/collision.js::getPlayerBounds` is a natural shared geometry entry point.
- `src/game/boss-signatures.js::playerBounds` and `src/game/boss-attacks.js` currently duplicate old trimmed bounds; these paths must not silently keep33x24 collision after walls become16x16.
- `src/game/player.js::isOutOfBounds`, laser collision/safe-zone helpers and `src/game/game-engine.js::dash` currently read player height directly. Update relevant collision consumers while keeping artwork/physics dimensions independent.
- Verify exact square edges, just-outside wing/nose grazes, projectile swept collisions, both laser types, hybrid containment, boundaries and real administrator debug rendering. For special activation, test first large-box band contact and just-before entry, center/small-body-outside with large-box overlap, large-front-beyond-wall while small-body-clear, cooldown/held-key rejection, and no retroactive success after actual solid overlap. Preview selection is visual approval, not a claim of runtime balance validation.
- High-resolution rendering needs viewport/DPR/resize tests and before/after actual-renderer images with identical logical scene and ship size. Keep prior pixel-ratio-only tests as no-layout fallbacks, not the sole fullscreen-resolution contract.
- Test both sides of70/100 cap thresholds, large scores, boss entry/exit and future spacing by aircraft; laser placement must check full beam bounds and safe-gap/no-fit fallbacks. AEGIS must show3HP before one impact and0 after it, with one landed-shot event and one reward; other aircraft retain three hits.
- No unrelated issue requiring expanded scope was identified. Deployment, authentication and database work are outside this change.

## Next Step
- User authorized planning and sequential execution through the final Task. All approved changes are now implemented. See [verification report](../validation/2026-10-28-central-hitbox/report.md); next step is physical playtesting/feedback, with no remaining active Task.
