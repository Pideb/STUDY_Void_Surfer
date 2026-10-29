# Decisions: Boss Motion, Aiming and Random Patterns

- Date: 2026-10-29 (Asia/Seoul)
- Status: D01..D13 confirmed. Interview/design previews complete; production implementation not started.
- Feature name: `boss-motion-aim-patterns`
- [Interview history and review evidence](../previews/2026-10-29-boss-motion-aim/review-notes.md).
- Supersedes relevant runtime rules from completed cooldown-speed-boss-tuning; do not reopen that completed plan or revert its unrelated changes.

## D01. Freeze Only the Passed Special-wall Timing Guide — User Clarified
- **Chosen**: Once a special/hybrid wall has passed the player, preserve the displayed timing guide width from passage until offscreen exit. Continue translating the guide with its wall.
- Capture its logical-pixel width BEFORE encounter/difficulty transitions triggered by passing that wall. Upcoming walls retain live `speed * windowSeconds` widths so guides agree with actual timing.
- Preserve early-guide visibility rules; no permanent guide or damage-box overlay.
- Moving gaps continue oscillating; wall motion, real collision geometry and broken state behave as before. Do NOT freeze moving gaps, remove collision or pin wall travel speed under this request.
- **Rationale**: User specifically dislikes the guide behind the player growing/shrinking. Inspection found renderer recomputes width from current global difficulty each frame, even for passed obstacles.

## D02. Drain Existing Walls Before Boss Entry — User Requested
- **Chosen**: When boss threshold is reached, stop spawning more ordinary walls and let all existing walls leave the LEFT VIEWPORT completely before beginning the boss intro.
- Preserve ordinary-flight speed/target while draining; do not apply boss slow/fast factors or switch existing-wall gap/timing mode early. Existing score-driven speed changes remain governed by their normal easing; boss-entry factors must not change approaching walls.
- Do not delete/teleport old walls, count merely passing the player as viewport exit, or accumulate a burst of delayed spawns.
- Threshold notification/state must not produce boss HUD/music/patterns prematurely during drain.
- **Rationale**: Current preview immediately begins a boss after1.5s even with walls ahead. This causes the reported approach-speed change.

## D03. Dark Entrance While Keeping Player Visible — User Requested; Timing Derived
- **Chosen**: After drain, darken the current scene while player/trail and essential controls remain readable; show boss alert; reveal the boss background progressively as the boss enters from right.
- Background swap happens under the dark cover, not as a visible instant recolor. Darkening should not affect the foreground player or hide important guidance/controls.
- Preserve existing1.5s boss alert/siren and1s right-to-left entrance/music coupling as the basis. Plan a short smooth lead-in to darkness; avoid unnecessary extra waits. Concrete fade timing is an implementation choice, not another unasked user preference.
- Keep live flight/control during darkening, alert and entrance; do not add a world/player freeze. No new walls/hostile attacks until entrance completes. Preserve top/bottom boundary risk and existing pause rules.
- **Rationale**: The user wants a deliberate dark-to-boss reveal, with their ship still visible.

## D04. More Visible Stage-specific Boss Actions — User Requested; Demonstrated Direction
- **Chosen implementation direction**: Keep approved boss images,192x128 nominal artwork size and six stage identities. Use the demonstrated amplified articulated motion rather than simply bobbing one flat image.
- Show distinguishable idle, projectile charge, firing/recoil, roar, hit and entrance: crystal shards open, industrial armor/barrel recoil, signal rings separate, gravity shell/orbits rotate, abyss jaw/tail move, solar fins open/vent.
- The shown preview scales existing idle angular articulation roughly3x, action opening1.7x and slide/lift/recoil2x. Use those visible examples as the starting point; exact amplitudes may be adjusted to avoid detached seams/clipping while retaining clearly visible motion.
- This is derived implementation detail for the requested visual improvement, NOT a claim that the user separately selected each numeric multiplier. No boss redesign or new art generation is requested.
- [Animated action examples](../previews/2026-10-29-boss-motion-aim/review.html).
- **Rationale**: User says current motion is barely noticeable and requested examples for each action; examples were provided alongside subsequent movement/UI reviews.

## D05. Continuous Vertical Motion20..80%, Six-second Round Trip — User Confirmed
- **Chosen**: Center y=`270 + 162*sin(2*pi*motionTime/6)` in the unchanged960x540 logical world. Range108..432 (20..80% screen height);6s full round trip with smooth turnaround.
- Nominal128px height remains onscreen at extremes (box y44..496); ensure articulated visible parts do not clip. Keep existing horizontal entrance/final position.
- Maintain movement during projectile warning and firing; no added attack-only vertical pause. Existing pause/WASD world-freeze behavior still applies to the motion clock.
- Drawing, hit detection, projectile origins, roar, hit effects and weapon target geometry share the same current pose/translation. Do not independently approximate y in separate modules.
- [Approved wide animation](../previews/2026-10-29-boss-motion-aim/full-motion.html?range=wide), [recorded video](../previews/2026-10-29-boss-motion-aim/full-motion-wide-video.html), [range reference](../previews/2026-10-29-boss-motion-aim/full-motion-wide-range.png).
- **Rationale**: User requested wider option3, watched the revised animation and then explicitly chose to keep20..80% with6s cycle.

## D06. Moving Projectile Telegraphs, Fixed Paths After Launch — User Selected Option2
- **Chosen**: While each projectile is unlaunched, its origin and advertised path follow the moving boss/muzzle. At that projectile's own launch instant, commit the path; thereafter it travels on the committed advertised polyline without homing.
- Staggered volleys must sample each projectile's actual launch pose/time; later shots cannot use the first shot's origin. Retain each shot's full preview/delay semantics and distinctive stage trajectory.
- Roar rings/muzzle charge/fire effects originate from current boss geometry and remain visually attached as appropriate to the effect.
- Preserve wall-phase1 projectile, wall-free3..6 random projectiles per volley,1..3 wall-free volleys,220..360 individual speed, offscreen resolution and existing player dash immunity/contact rules.
- **Rationale**: User explicitly rejected pausing the boss during warning/fire and selected moving previews with committed post-launch paths.

## D07. Horizontal Player Laser, Whole-boss Contact During.20s Beam — User Confirmed
- **Chosen**: On player fire, face ship directly right. Preserve.50s charging+.20s visible beam/recovery=.70s movement lock. Beam originates at the ship nose and travels/extends straight right, never toward the boss core.
- No guaranteed hit or diagonal homing. Every visible part of the boss is hittable, including wings/protrusions; not core-only or70% body. Empty transparent exterior is not visible boss artwork; glows/roar rings are cosmetic. Use the same rendered pose for the full-body hit geometry.
- Any overlap during the.20s active beam window can damage the boss, but only ONCE per accepted shot. Test movement through the beam across frame boundaries so a crossing cannot be missed merely because it occurs between frame samples.
- A miss deals no damage. Preserve ammunition consumption and restart recharge on accepted fire; no miss refund. Preserve10s independent recharge, one stored shot, Shift/Ctrl/mobile fire, hold-key rejection and no extra immunity.
- Keep existing wall penetration: boss-only beam hit detection; walls do not newly block a shot. World threats continue during firing. No damage during charge; no impact after beam expires or after player death/boss defeat.
- AEGIS deals3 damage, NOVA/VELOCITY1; all bosses retain3HP. Retain one clear/reward/portal transition despite multiple overlapping frames or lethal impact.
- **Rationale**: User requests aim-dependent straight fire, chose the entire boss, and selected contact anywhere during the visible beam rather than only at the first firing instant.

## D08. Reactor Arc Charge HUD, Diameter80px — User Selected Style2 and Size2
- **Chosen**: Bottom-center reactor arc,80 logical-pixel arc diameter, matching [approved size comparison](../previews/2026-10-29-boss-motion-aim/reactor-sizes.png).
- Keep frameless energy-instrument styling, percentage/ready/firing states, thin ticks and compact Shift/Ctrl labels. Ready state glows visibly; state reflects real charge/firing instead of a decorative loop.
- Scale sensibly with playfield/full-window rendering; preserve mobile button functionality, legibility and no offscreen overflow. Avoid overlap with global-laser safety labels.
- Space's small upper-left cooldown ring is a separate indicator and remains unchanged.
- **Rationale**: User selected reactor style and then80px after reviewing actual walls and ship at the same scale.

## D09. Raise All Aircraft Speed-growth Caps to200 — User Requested
- **Chosen**: Actual normal speed continues+10px/s per10 monotonic progression points, but stop growth at200 rather than100 for every craft.
- NOVA/AEGIS240->440; VELOCITY480->680. VELOCITY doubles only starting speed, NOT increments.
- Preserve2s speed easing, pause monotonicity, boss-clear+10 speed progression, boss-entry snapshot and boss slow/fast/shift exceptions (including VELOCITY fast adjustment). Scores can continue above200.
- Update shared/future speed consumers, spacing bounds and documentation consistently; keep cap numbers out of aircraft descriptions per earlier approved UI.

## D10. WASD Minimum Four Keys and Eight-second Failure Effect — User Requested/Selected
- **Chosen**: Minimum sequence length4, maximum8. Preserve maximum-minus2 variation with floor4 and existing no-four-identical-consecutive safeguard.
- First boss exactly4 keys; second4..5, third4..6, fourth5..7, fifth onward6..8. Existing input time limits remain first5s, later2.8s.
- Both ink/glitch penalties last TOTAL8s (was5), including the final1.2s fade. Preserve50/50 selection and previously approved partial-screen ink/glitch strength/animation; not a full-screen opaque cover or game over.
- Preserve live roar before challenge and world freeze only during actual WASD. Challenge success does not charge the player weapon or damage the boss.

## D11. Global Laser Safety/Danger Style1 — User Selected
- **Chosen**: [Style1 comparison](../previews/2026-10-29-boss-motion-aim/global-laser-comparison.png), [animated review](../previews/2026-10-29-boss-motion-aim/global-laser-review.html).
- Pale teal safe fill, bright teal boundaries/inward chevrons and contrasting red diagonal hatching in hazardous regions. D13 supersedes the original prototype text: OMIT visible SAFE/안전 구역, DANGER, LASER ACTIVE, countdown and explanatory sentences.
- Keep safe boundaries/chevrons and hazard hatching during firing. Preserve existing cyan/white light beams, right-to-left sweep, active/fade timings and wall-free safety behavior. Removing visible countdown does not shorten the actual warning.
- Markings must agree exactly with real safe quarter/collision boundaries, all four quarter positions, and remain clear above effects and distinct from the80px reactor HUD.
- Preserve fresh minimum2s warning (or longer crossing budget) for each shot,1..3 shots, new safe quarter different from the preceding shot, and no overlapping walls/other attacks.
- **Rationale**: User wants safety and danger much clearer and chose the red-hatched versus darkened alternative.

## D12. Shuffle All Pattern Blocks; Always Include Eligible Global Laser — User Confirmed
- **Chosen**: Once per round shuffle all available blocks: wall flight, wall-free multi-projectiles, global/quarter lasers (boss2+), roar+WASD as one inseparable block. Use every eligible block once before reshuffling; avoid immediate same-block repeat at round boundary.
- First boss has3 eligible blocks; boss2+ has4. Entry first block may be any eligible type. Walls-first alternative rejected.
- Global chance becomes100% inclusion, replacing60%; this does NOT require staying after projectiles. Preserve1..3 shots inside each global block and1..3 volleys inside projectile block.
- Drain old walls fully offscreen before global or multi-projectile blocks. Do not erase walls, overlap incompatible attacks or start next warning while previous projectile/laser/fade still runs. Keep wall-block single projectile/line-laser opportunities and original normal/special mixture/quotas.
- Boss HP and manual player firing remain independent of round/block completion. Reaching zero HP ends the encounter regardless of queue position, awards10 once and follows the existing clear/portal sequence.
- Existing phase progression currently assumes WASD always restarts walls; replace that coupling with explicit pattern completion/queue advancement so shuffled orders cannot stall or skip blocks.
- **Rationale**: User chose100% global inclusion and then explicitly chose random order including the wall block.

## D13. Reduce In-play Text — User Confirmed T01/T02/T04/T05; Keep T03
- User explicitly keeps score, player-laser charge/fire, WARNING notice, boss notice and BOSS HP. After reviewing the numbered inventory, user confirmed keep item3 unchanged and clean up every other numbered candidate.
- [Reviewable text inventory and proposals](../previews/2026-10-29-boss-motion-aim/text-audit.md).
- RemoveT01 lower BOSS:<speed-pattern> label andT02 enemy-laser status sentences. Preserve BOSS/low-fast-shift notice at entrance and player weapon charge/fire text.
- KeepT03 EXACTLY as-is: `>> 가속` and `<< 감속`, including words, symbols and their current behavior. Do not replace with symbol-only notices.
- CleanT04: remove INPUT SEQUENCE and 순서대로 입력 headings plus redundant visual key copy; retain ONE readable WASD sequence and remaining time, input/touch controls and hidden accessibility announcements.
- RemoveT05 visible global SAFE/DANGER/LASER ACTIVE/countdown/회피 안내 wording. This supersedes only D11's text; selected teal-safe/red-hatched-danger graphics and actual warning timing stay.
- Retain existing action-button labels where their buttons appear (mobile Space/fire/pause); no new desktop controls. Retain all gameplay rules and functional numeric/letter displays described above.
- Preserve hidden accessibility labels/announcements and all gameplay/input behavior. Do not extend cleanup into menus/tutorial/pause/results or embedded raster artwork without user direction.

## Code-derived Constraints / Verification Targets
- Freeze guide width before score/encounter changes and verify old guides remain fixed while new ones track timing; moving gaps must still animate after passage.
- Boss threshold with walls immediately ahead must drain at non-boss speed; verify no early boss music/attack/background switch and no infinite drain/spawn backlog.
- One shared boss pose feeds rendering, origins/effects and damage. Check extremes, pause/WASD, delayed volleys, and trajectories before/after commit, including coarse-frame launch boundaries.
- Beam tests: miss, full wings/body hit, contact late in.20s window, crossings between ticks, one hit across multiple frames, AEGIS lethal damage, no charge-phase damage or duplicate reward.
- Queue tests: every eligible first/last position, boss1 exclusion, boss2+ global inclusion, all blocks exactly once/round, boundary repetition avoidance, repeated rounds, boss defeat during any block, wall draining and complete6-stage progression.
- Visual evidence must use actual production runtime after implementation, not these preview overlays. Check PC/fullscreen and landscape mobile HUD/labels and actual stronger boss action motion.
- No auth/DB/deployment/music changes. No unrelated adjacent issue requiring a scope decision was found.
- D01..D13 interview complete. Next step: memory-plan for this unified feature; current pointer still correctly reflects the completed previous plan until the new plan is initialized. No extra user confirmation is needed for the approved text set.
