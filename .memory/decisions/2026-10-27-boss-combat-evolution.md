# Decisions: Boss Combat Evolution

- Date: 2026-10-27
- Last reviewed: 2026-10-28 (Asia/Seoul)
- Status: Confirmed. D01..D15 and all requested visual/audio reviews approved2026-10-28; ready for memory-plan. Production integration has not started.

## Requested Changes
1. Stop regular speed growth after progression score150. User selected option1: clamp the base used in all modes to score150; boss speed-pattern multipliers alone may exceed the regular ceiling. Return smoothly to the capped regular speed after clearing. VELOCITY retains its2x aircraft-specific regular ceiling. Boss base must not resume unbounded score growth.
2. Use laser patterns substantially more actively, with safe routes retained.
3. Inspect WARNING/BOSS frequency and shorten the interval between encounters.
4. Audit and adjust obstacle/pattern unlock progression.
5. WASD first boss5s; all subsequent bosses2.8s. Preserve existing sequence-length progression unless changed explicitly.
6. Strengthen WASD failure obstruction/glitch feedback; confirmed4s, strongest initially and gradually clearing while keeping essential cues readable.
7. Precede each WASD challenge with a boss-origin outward roar effect and sound; confirmed.8s frozen wind-up, design-specific sounds approved on2026-10-28.
8. Present multiple stage-specific boss attack ideas that create a stronger sense of fighting the boss, using existing projectile artwork.
9. Add a spacecraft-explosion death sound synchronized with the death effect.
10. Redesign awkward grounded-looking bosses as appropriate spaceborne forms. Show current/new artwork side by side for selection before replacing assets.
11. After choosing boss designs, create and show actual animation examples with articulated/action motion, beyond moving one static image around.
12. Boss identity must match the currently played stage; switch to the next stage after boss clear.
13. Show a portal/white-out/flash stage-transition animation example for approval; current traversal speed is acceptable.

## Verified Existing Behavior
- `difficulty.js::getBaseSpeed`: 240 * 1.1^floor(progressionScore/10), currently uncapped. Score150=1002.53956 world px/s, score200=1614.59999. VELOCITY multiplies speed by2 (150 ceiling would be2005.07912); its fast-boss multiplier additionally has .88 adjustment.
- Speed follows the monotonic progression score (pause deductions do not reverse speed), before VELOCITY's final-score1.5 multiplier. Preserve this existing convention unless the user changes it.
- First WARNING at20; WARNING and BOSS alternate. After each completes, next encounter threshold is current score + random10..15; current-score pause deductions can delay that threshold. WARNING target5 walls, boss waves7 walls until three successful WASD challenges.
- Special walls unlock at10 points; ordinary selection20%, WARNING/BOSS50%, plus forced minimums (WARNING2, BOSS3). First boss clear unlocks moving gaps on50% of normal selections and hybrids replacing50% of special selections. Gap continuity starts at progression60, VELOCITY from the beginning.
- Lasers unlock at boss2. One opportunity per fully spawned boss wave,25% chance, single/quarter50:50; all safety checks and the nonconsecutive-laser guard reduce the effective firing frequency further. Quarter lasers wait for all visible walls to leave; singles cannot cover normal gaps or coincide with pending dash barriers.
- WASD currently always5s, 3..4 keys at boss1, growing to6..8 by boss5; wrong key/timeout produces random ink/glitch for only .75s, no HP damage to boss. Three successful challenges clear every boss.
- Existing shared boss behavior has slow(.75x), fast(1.25x), and shift (target changes every2s) speed patterns plus lasers/WASD. No implemented stage-specific split-wall/heat/visibility combat patterns found in the current scheduler.
- Stage visual boss is already selected through current stageId/theme. However there is no encounter-owned stageId lock. Stage change currently waits for2 more passed walls after clear; new request supersedes that delay once the new portal transition is specified.
- Projectile assets, projectile motion helpers and drawing still exist, but the current scheduler never emits projectile attacks after the WASD overhaul.
- `collision` sound configuration exists but no controller call plays it on death. Add a real explosion cue at the start of `deathEffect`, once per death, rather than only declaring another unused sound.
- Current boss idle motion moves the full image and decorative accents; the user requests articulated/action animation and redesigned floating/flying silhouettes.

## Stage Identity Reference (Approved Direction; D09 Governs Scope)
- Crystal Gates: orbiting shards, telegraphed fan volleys and a prism line beam.
- Industrial Void: moving cannon ports, alternating firing lanes and a barrage with one clear route.
- Signal Monoliths: sequentially lit beam lanes that fire in the same announced order, paired pulse projectiles.
- Gravity Well: curved gravity-orb paths and a clearly telegraphed converging/splitting volley; no unannounced player-physics changes.
- Abyssal Beast: articulated jaws/tentacles, alternating upper/lower obstructions and arcing organic shots.
- Solar Forge: charging vents, sweeping heat lines and a marked safe-lane burst with rapid readable follow-up.
- All proposals need scheduling/reachability constraints: no impossible wall/laser combinations, no special-barrier timing simultaneous with required projectile response, and no attacks during frozen WASD input.

## Interview Completion / Handoff
- D01..D15 are confirmed. User selected option1 after viewing the six destination-portal animation clips; no visual/audio approval remains pending. Preserve the exact selected designs and approved motion references.
- User-approved artwork, articulated motion, revised roar audio and portal visuals are implementation references, not already-integrated production features.
- Preserve inspected existing behavior for settings not explicitly changed, including boss HP3, existing wall-wave size and score rules. Parameterize initial attack tuning for playtesting rather than introducing new unapproved difficulty rules.
- Next step: create a memory plan for `boss-combat-evolution` from this document, including destination-themed portal ornaments and their motion. Do not implement production code during planning.

## D01. Speed Ceiling — Confirmed
- User choice: option1. Cap base-speed progression at150 for ordinary play, WARNING and the boss base. Apply existing boss-pattern and aircraft multipliers after this clamp.
- Default/AEGIS regular ceiling: `240 * 1.1^15`, about1002.54 world pixels/s. VELOCITY regular ceiling: twice that, about2005.08. Preserve the existing VELOCITY fast-boss adjustment unless changed in the later boss-pattern discussion.
- Boss clear returns to the capped normal target through the existing smooth speed transition; if progression is below150, return to that current progression's regular target, never jump up to the150 ceiling prematurely.
- Preserve pause behavior: deductions never lower progression speed, and VELOCITY's final-score1.5 multiplier does not advance speed progression.

## D02. Encounter Frequency — Confirmed
- User choice: option1, completion score + random5..8 points for the next encounter (inclusive integer range).
- First WARNING remains at20; WARNING and BOSS continue alternating. Preserve the existing score threshold convention and the separate boss-clear score award.
- This changes the ordinary-flight gap between encounters. Boss wave duration and attack scheduling are settled separately in the combat-pattern discussion.

## D03. Laser Scheduling — Confirmed (D14 Completes Sequence Rules)
- User clarified that the60% probability applies to quarter-screen/global lasers, not single lasers.
- Per attack cycle, a60% activation check may start a global-laser sequence. User subsequently selected a uniform1..3 shot count; safe-zone changes and fresh per-shot warnings are confirmed in D14. Do not add shot-count scaling by boss number.
- Every global shot must retain its own readable safe-zone telegraph; no walls on screen throughout global-laser phases. Number of global shots must not silently determine WASD success count or boss HP.
- Single laser opportunities must be independent of wall-wave completion, with their own timer/probability. User selected option3: check every4 seconds with70% probability. Do not interpret this as a per-frame roll.
- Retain fair scheduling: single lasers must not obstruct traversable wall gaps or coincide with another required dash response; global lasers, WASD and boss entrance/transition must not be interrupted by an unrelated single-laser roll. Safety checks may defer/skip opportunities without queuing a burst.
- Laser unlock timing confirmed (option1): single at boss1, global at boss2. Next resolve projectile purpose and how the player damages the boss, then remaining penalty/roar/pattern/visual decisions.

## D04. Independent Single Laser Frequency — Confirmed
- User choice: option3. During eligible boss combat, independently check every4 seconds and fire with70% probability, separate from wall-wave completion and global-laser activation.
- Retain safety checks for all current/upcoming wall openings, special-wall responses, global attacks, boss entrance, WASD and transitions. Do not accumulate missed opportunities into a later burst or roll once per rendered frame.
- This confirms the timer/probability, not the unlock point, projectile interaction or new boss-cycle structure.

## D05. Laser Unlock Progression — Confirmed
- User choice: option1. Single lasers can start in the first boss encounter; global/quarter-screen sequences unlock at the second boss encounter.
- The independent single-laser4s/70% timer and global60%/up-to3 rules apply after their respective unlocks.
- Existing wall unlocks remain the inspected baseline: special at10, moving gaps and hybrids after first clear; no new choice changing these has been made.

## D06. Projectile Combat Model — Confirmed Initial Playtest Baseline
- Existing boss HP3 and three WASD successes remain the clear rule; the selected model adds dodge hazards and a visible automatic counterattack for each successful challenge.
- User selected option1: projectile volleys are real dodge hazards; each WASD success triggers a visible player counterattack that hits the boss and removes1HP, preserving the three-success clear rule. Include boss-origin attack wind-up, projectile launch, recoil and damage animation.
- Projectiles do not become another SPACE-reflection damage source in this iteration. User explicitly plans further tuning after actual play; keep timings/parameters configurable and avoid treating this initial baseline as permanent balancing.
- Retain prior session behavior for projectiles: a miss alone is harmless; actual player impact is fatal unless the authorized test invincibility applies. Avoid required reflection timing simultaneous with special/hybrid barriers.

## D07. WASD Failure Penalty — Confirmed Duration
- Current random ink/glitch obstruction lasts0.75s. User requests stronger visibility impact and a much longer duration, while preserving a nonfatal penalty.
- User selected option3:4 seconds. Strongest obstruction at the beginning, gradually recovering toward the end; preserve readable player position and essential attack/safe-lane telegraphs. Keep ink/glitch as nonfatal penalties; damage/collision behavior is not changed by this effect.
- First-boss WASD5s and later bosses2.8s are already explicit requested values, requiring no repeat question. Roar wind-up timing and examples remain separate upcoming decisions.

## D08. Pre-Challenge Roar Wind-up — Confirmed
- This cue occurs before each WASD challenge, separately from the already-approved1.5s boss-entry siren.
- User selected option1:0.8s. World/obstacles/projectiles pause, boss emits an outward shockwave and roar, then the key sequence appears and the full5s(first boss)/2.8s(later) countdown begins. Do not subtract the roar duration from input time or inflict collision damage during the paused wind-up.

## D09. Six Boss Signature Attacks — Confirmed Direction
- User selected option1: adopt all six stage identities as the baseline before visual redesign: crystal fan shards; industrial alternating cannon volleys; signal sequential announced firing lanes; gravity curved converging/splitting orbs; abyss jaws/tentacles with alternating obstructions and arcing shots; solar charged heat volleys.
- Start with a readable basic form at that stage's first boss encounter; later encounters may increase density/sequence complexity. The confirmed single/global laser unlocks and probability rules remain separate constraints, not bypassed by a signature.
- Coordinate wall generation and attack geometry so the required route remains reachable. Never require a simultaneous dash barrier and incompatible projectile response, obstruct a wall opening with a single laser, or leave walls during global lasers.
- D09 confirms attack direction; the later D10..D13 and approved review sections also confirm artwork, animation, roar audio and portal presentation. No production stage-specific art/pattern integration has been done yet.

## Next Visual Review: Boss Redesign Candidates
- Inspected all six actual `public/assets/game/stages/{stageId}/boss.png` files. Signal is an upright humanoid/obelisk with feet, and Solar is a legged ground machine; these are the clearest grounded silhouettes to replace.
- Crystal/Industrial/Gravity/Abyss already have spaceborne forms. Preserve their palette and identity while improving silhouette readability and separable moving components rather than replacing them with unrelated monsters.
- Generate six transparent candidate sprites using built-in imagegen and each actual original as reference. Do not overwrite current assets. A comparison page must render literal existing sprites beside candidate files; do not label a generated reconstruction as the exact existing asset.
- Candidate direction: Crystal core with four separated orbit shards; Industrial floating cannon platform with two articulated forward turret pods; Signal horizontal floating segmented obelisk array without arms/feet; Gravity segmented crescent lens with orbiting satellites; Abyss compact leviathan with a hinged jaw, fins and tentacles; Solar flying furnace craft with radiator fins/engines and no legs/ground supports.
- All side-view candidates face LEFT toward the player; no floor, ground contact or cast ground shadow; restrained stage-colored glow, clear joints and material matching the game's existing illustrated sprites.
- After candidate selection, produce actual part/action animation examples, then the requested portal transition preview. No production replacement or implementation at this review stage.

## Boss Redesign Preview Set 01 — Selection Confirmed
- Built-in imagegen, six separate calls using each actual original boss as the reference. Candidate PNGs copied into `.memory/previews/2026-10-27-boss-redesign/`; current game assets untouched.
- Compare page: `.memory/previews/2026-10-27-boss-redesign/preview.html`. Six literal original/candidate pairs, actual stage backdrops, enlarged and current-renderer192x128 display toggles. This is a still-art review, not an animation or implemented gameplay screenshot.
- Full prompts, generated source paths and stable candidate filenames are recorded in `candidates.json`; rebuild page using `node .memory/previews/2026-10-27-boss-redesign/build-preview.mjs`.
- New files: `crystal-gates-candidate.png`, `industrial-void-candidate.png`, `signal-monoliths-candidate.png`, `gravity-well-candidate.png`, `abyssal-beast-candidate.png`, `solar-forge-candidate.png`.
- Visual inspection: all face left, retain stage palettes, have no ground plane. Signal is no longer an upright humanoid; Solar has radiator fins and rear engines instead of legs. Crystal blades, Industrial turret pivots, Gravity segments/satellites, Abyss jaw/fins and Solar shutters offer distinct animation directions.
- Technical inspection: all six PNGs have transparent corners; dimensions range from1536x1024 to1774x887. Comparison player checks passed for six pairs / twelve image references, six backgrounds, display toggles and complete prompt persistence.
- User selected a custom combination: Industrial Void and Gravity Well keep their literal existing boss assets; Crystal Gates, Signal Monoliths, Abyssal Beast and Solar Forge use the new candidates. No other asset combination is authorized.

## D10. Boss Artwork — Confirmed Selection
- Existing assets: `industrial-void/boss.png`, `gravity-well/boss.png` from `public/assets/game/stages/`.
- New candidates: `crystal-gates-candidate.png`, `signal-monoliths-candidate.png`, `abyssal-beast-candidate.png`, `solar-forge-candidate.png` from `.memory/previews/2026-10-27-boss-redesign/`.
- Preserve these exact selected designs in the animated review. Use code-native Canvas part articulation with the actual PNGs so a new AI generation does not silently redesign an approved boss.
- Next deliverable: preview-only animation player for all six with idle, charge/fire, .8s roar and hit response. Articulate parts/regions and add appropriate core/weapon effects; do not pass off whole-image bobbing as articulated animation. Actual game engine integration remains for the later memory plan.

## Boss Animation Preview Set 01 — Motion Approved (Audio Superseded by Approved Set02)
- Delivered `.memory/previews/2026-10-27-boss-animation/preview.html`, with six stage tabs and separate idle / charge-fire / roar / hit controls; automatic cycle, pause, current-renderer192x128 size toggle and explicit roar-audio audition. It runs directly from a local HTML file with classic scripts and relative image references.
- Uses D10's exact selected PNGs. Source PNGs and all production game files remain untouched. Canvas regions articulate crystal blades, industrial barrels, signal plates/fins, gravity crescent armor, abyss jaw/fins and solar radiators/shutters. Abyss tail uses continuous strip deformation; gravity adds rotating lens/orbiting existing projectile art; other cores and weapons pulse separately. This is a review rig, not final exported layered sprite art.
- Preview charge/fire uses the existing stage projectile PNGs; visible hit response includes an example player counterattack. No collision, attack scheduling, wall safety, full WASD input or actual game balance is implemented in this preview. Original generic audio was superseded by the approved set02.
- Verification: `node .memory/previews/2026-10-27-boss-animation/verify.mjs` passes six selected sources,18 image paths,330 sampled poses, finite drawing geometry, small-size mode and rapid-tab selection guard. Firefox headless rendered all six on actual stage backdrops; screenshots saved under `qa/` and visually inspected for framing and articulation seams at roar midpoint. Browser-profile cache is excluded by the preview folder's `.gitignore`.
- User selected option1: all shown boss designs and animations are approved. The requested audio revision and portal review were subsequently completed and approved under D12/D13. Preserve these choices rather than reopening them.

## D11. Boss Motion — Confirmed
- User explicitly approves all six designs and animation examples as shown. Preserve per-part idle, wind-up/fire, .8s roar shockwaves and hit responses from preview01 as the visual reference for the eventual production plan.
- This approval does not approve the old generic roar: the user separately asks for design-matched sound.

## Roar Audio Preview Set 02 — Approved 2026-10-28
- Replaced the previous shared growl/pitch variants with six distinct original synthesized material signatures: Crystal inharmonic glass resonance; Industrial geared metal/hydraulic clanks; Signal stepped electronic pulses/static; Gravity descending low-frequency vortex with audible harmonics; Abyss rough voiced/formant animal growl; Solar ignition/thermal-noise discharge.
- All six remain .8s to fit the approved frozen pre-WASD wind-up. Not the entrance siren or BGM. No borrowed game recording is used.
- Same animation preview now has a synchronized listen button, native audio player and downloadable PCM WAV for every selected boss. Source: `roar-synthesis.js`; reproduce/test/export via `node .memory/previews/2026-10-27-boss-animation/build-roars.mjs`. Files are under that preview's `audio/`, never production assets.
- Verified deterministic samples, finite PCM, fixed duration/sample rate, unclipped peaks, tapered endpoints and six different sound signatures. These checks verify the files, not subjective sound approval.
- The updated page was rendered in Firefox with the native audio controls and per-boss description visible. HTTP retrieval of the generated Abyss WAV returned200 and70604 bytes. Rapid selection/audio resume is guarded so an earlier click cannot play the previous boss after a tab change.
- User selected option1 on2026-10-28: adopt the revised sounds and portal preview. The six exported WAVs are the approved audio source for the later implementation plan.

## Portal Transition Preview Set 01 — Approved 2026-10-28
- New review page: `.memory/previews/2026-10-27-portal-transition/preview.html`. Select current/next stage and inspect three representative wall speeds. Uses literal existing stage backgrounds and player art.
- Proposal: after clear, stop spawning walls; a vertical portal approaches from the right at current wall speed, covering960 world pixels. When it crosses the player, brighten once to white over .20s, swap scenery behind opaque white, hold until .30s, then reveal next scenery over .60s. Resume new-stage wall spawns only after the reveal completes. Normal scenery keeps subtle leftward scrolling.
- User selected option1 on2026-10-28: adopt this portal/white-out/reveal sequence and the shown timings. Demo ship is fixed to illustrate crossing, not an approved gameplay autopilot or physics rule. Preview has pause/scrub/replay, weak-flash view and no audio autoplay. Production integration remains for the later implementation plan.
- Verification: `node .memory/previews/2026-10-27-portal-transition/verify.mjs` passes all six backgrounds, three representative speeds,162 sampled frames,960px world-speed travel and the spawn-resume gate. Firefox screenshots for approach and the covered scenery reveal were inspected and saved under `qa/`.

## D12. Design-Specific Roar Audio — Confirmed
- User selected option1 on2026-10-28: adopt all six audio previews from set02. Keep the.8s wind-up and full subsequent WASD countdown; preserve separate entrance siren/BGM behavior.
- Crystal glass resonance, Industrial machinery, Signal electronic pulses, Gravity vortex, Abyss biological roar and Solar thermal discharge must remain distinct, not a shared sample with pitch changes.

## D13. Portal Stage Transition — Confirmed
- User selected option1 on2026-10-28: use portal preview01, approaching from the right at current wall speed, then one white-out/covered background swap and gradual reveal.
- Retain the shown.20s brighten/.10s opaque hold/.60s reveal. Resume new-stage obstacles only after the reveal completes; preserve existing obstacles' own stage styling until removed.
- Keep boss identity tied to the stage being played; after clearing, transition to the next stage through this portal rather than an exposed color/background swap. Preview ship fixation does not authorize changing gameplay controls/physics.

## D14. Global Laser Shot Count and Per-Shot Safe Zones — Confirmed
- User selected option1 on2026-10-28: after the60% activation roll succeeds, independently choose integer1,2 or3 with equal probability(one third each). Sample once for the sequence; no guaranteed activation or boss-number scaling.
- User explicitly requires a changed safe zone between consecutive shots. Choose a different one of the four vertical quarters for each subsequent shot; exclude the immediately previous quarter. A third shot may return to the first quarter, since only consecutive repeats are prohibited.
- Every shot gets its own complete visible safe-zone announcement and preparation interval before firing. Existing inspected global-laser telegraph is2.0s (`BOSS_QUARTER_LASER_TELEGRAPH_SECONDS`); restart the full interval for every shot, without shortening it for follow-ups or consuming it during the previous shot.
- Previous beam damage must end before moving the safe zone and starting the next warning. Never silently switch the safe quarter while a damaging beam is active. Continue the approved right-to-left luminous firing animation on each shot.
- Keep all walls and unrelated projectiles/lasers out of the global sequence from the first warning through the final beam/fade. Do not resume walls between sequence shots or interrupt a new warning with WASD.
- Select safe zones with a reachable route for the current aircraft. If a candidate cannot be reached within the preparation interval, choose another nonrepeating reachable quarter or extend the preparation interval; never create an impossible crossing merely to enforce randomness. This implements the user's explicit requirement to give time to dodge, without reducing the confirmed2s baseline.
- Rationale: random shot count varies the pattern, changed safe quarters require active repositioning, and a full new warning makes each move readable and fair.

## Implementation Notes / Existing-Code Constraints
- Read from code rather than chosen anew: global warning is2s, boss HP3, current wall wave7, existing monotonic progression score and aircraft multipliers. Reuse compatible laser/audio helpers; update the scheduler rather than creating a competing combat loop.
- The existing projectile helpers retain reflection-era behavior; production integration must implement D06's dodge-hazard/automatic-counterattack model and avoid accidentally restoring SPACE reflection as a damage source.
- Review PNGs and WAVs currently live under `.memory/previews`, not deployable game paths. The implementation plan must copy/package only approved assets into the production asset pipeline and verify real game renders/playback, not merely reproduce previews.
- Existing collision sound settings are declared but death playback is disconnected; connect the already-requested explosion cue once at death-effect start. These are discovered integration gaps inside the requested scope, not extra unrelated features.

## D15. Destination-Themed Portal Ornaments and Motion — Confirmed
- **Chosen**: User selected option1 on2026-10-28 after reviewing the final six animation clips: adopt all six designs and animations as shown in `2026-10-28-portal-motion-review`.
- **Rationale**: Destination-specific shapes announce the next region before arrival; subtle material-specific motion makes the portal feel active while the clear aperture and established transition timing preserve readability.
- On2026-10-28 user proposes surrounding the portal with objects that identify the NEXT stage, e.g. scattered crystal pieces when travelling to Crystal Gates. This is destination identity, not current-stage identity.
- Approved six motifs: Crystal floating shards; Industrial separated mechanical armor/brackets; Signal suspended monolith tablets/nodes; Gravity orbiting rocks/crescent fragments; Abyss organic ribs/bone/tentacle tips; Solar scorched plates/molten fragments/embers.
- Preserve approved right-to-left portal approach, white-out/reveal timings and obstacle suspension. Ornaments are decorative-only, with no collision or additional dodge input, leaving the portal aperture readable and open. Do not turn decorations into new hazards.
- Keep approved portal preview01 unchanged. Produce a versioned preview for this proposed addition, using stage-matched illustrated ornament assets and actual existing backdrop/player art. No production integration or memory plan yet.
- Review delivered at `.memory/previews/2026-10-28-portal-destination-ornaments/`: `gallery.html` shows all six in game-like compositions; `preview.html` lets the user select a destination and inspect the previously-approved approach/white-out/reveal with the added ornament shell. Ornament toggle allows comparison to the original portal. Slight shell drift is proposed as visual movement only.
- Six separate built-in imagegen calls used each actual stage normal-wall PNG as material/palette reference. Original prompt set, generator, source paths and copied filenames are preserved in `manifest.json`. New transparent1024x1536 PNGs are `{stageId}-ornaments.png`; all six have alpha0 at center and corner. These are review assets, not production replacements.
- Existing clear energy aperture is protected with a Canvas exclusion mask while drawing the shell. Destination selection drives asset loading; changing the current background alone must never change the destination ornament identity.
- Verification: `node .memory/previews/2026-10-28-portal-destination-ornaments/verify.mjs` passes all six destination assets, three speeds,162 sampled frames, approved timing/spawn gate and ornament toggle. Contact sheet rendered in Firefox and visually checked with all six recognizable silhouettes and open apertures. Still-art review was followed by the final animation review, now approved.
- Review history: user liked the still designs but requested a fresh animation before confirmation. That animation was delivered and subsequently approved with option1; preserve the exact designs and final motion rather than reopening them.
- New animation review: `.memory/previews/2026-10-28-portal-motion-review/animations.html`. Six actual silent WebM clips at960x540, about5.4s each, plus per-clip posters and a live preview with destination/speed selection and fixed-position detail mode. The six selected source PNGs are referenced directly, never regenerated or overwritten.
- Approved per-region movements: Crystal independent shard float; Industrial small mechanical lock/pulse; Signal staggered plate hover and sequential lights; Gravity tangential drift and orbital accents; Abyss slow rib/tentacle breathing; Solar slight thermal movement and drifting embers. Approved portal travel/white-out/reveal/spawn gating stays intact.
- Actual browser recording and playback were checked: each of six clips decodes visible960x540 frames, advances past5s and reaches end-of-file with no media error. Proof is `qa/playback-report.json`; `verify.mjs` combines it with the six-stage/three-speed transition checks. The local review server supports video byte ranges. User motion confirmation is complete; production implementation has not started.
- Final reviewed export uses overlapping ornament-region masks to prevent artificial straight gaps at motion boundaries. Browser-recorded WebM duration metadata was finalized from encoded frame timestamps without re-encoding, so all native controls display a correct~5s duration. All six final videos were re-recorded, replayed through end-of-file and visually checked on the review page with their actual rendered posters. Original ornament PNGs remain untouched.
