# Decisions: Menu Music and Manual Boss Laser

- Date: 2026-10-28 (Asia/Seoul)
- Status: Implemented and verified 2026-10-28. All six Tasks complete; final implementation/validation commit `1361098`. Interview decisions below preserve the selected behavior.
- Feature name: `menu-music-manual-fire`
- Review sources: [approved previews and interview history](../previews/2026-10-28-menu-music-manual-fire/review-notes.md).
- Prior completed plan: `2026-10-28-dash-boss-flow-refinements`. These decisions supersede only the affected mechanics.

## D01. Main-menu Music — User Selected
- **Chosen**: **ORBIT RUN**, original 112 BPM melodic, slightly upbeat space-adventure music (audition option 1).
- **Rationale**: The user wants a clear melody and a stronger space-flight atmosphere than the current short oscillator sequence.
- Approved composition: `.memory/previews/2026-10-28-menu-music-manual-fire/compose.mjs`, ORBIT RUN entry in `samples.json`, and `orbit-run.wav`.
- Preserve its melody and musical direction when preparing a seamless production loop. The audition fades out and is not yet a finished looping asset.
- Existing mute/unlock, scene transitions and stage/boss music conventions still apply. Replace the menu music, rather than playing it on top of the old eight-note menu sequence.

## D02. Projectile Fire While Walls Are Present — User Requested
- **Chosen**: Each boss projectile firing during a normal/special/hybrid wall phase emits **exactly one projectile**, not the existing full multi-projectile signature volley.
- **Rationale**: Several projectiles combined with wall navigation make this phase too difficult.
- Preserve the preceding approved rule: special-wall presence/timing does not suppress projectile firing. Projectiles remain avoidable by flight or the existing Space protection.
- Preserve existing stage art, trajectories, visible warning and offscreen lifetime. An unhit projectile must continue out of the viewport.
- Existing wall-phase firing opportunities remain separate from the new guaranteed wall-free sequence; do not consume or merge their counters accidentally.

## D03. Dedicated Wall-free Projectile Sequence — User Confirmed
- **Chosen**: After every boss wall group has fully passed out of the viewport, perform **1–3 consecutive multi-projectile volleys**, with the count selected randomly for that sequence.
- Each volley uses the existing stage-specific signature pattern of **3–5 projectiles**. The single-projectile restriction in D02 does not apply here.
- Wait until all projectiles from the previous volley have exited/resolved, then give the next volley its full **1.1-second trajectory warning** before firing.
- No additional 0.5-second rest between volleys. No walls spawn during this sequence.
- After its final volley, continue the existing global-laser/roar/WASD sequence, retaining its existing unlock/chance rules.
- **Rationale**: Give bosses a distinct shooting phase without overwhelming the player during wall navigation; each consecutive volley remains readable.

## D04. Failure Penalty Appearance and Duration — User Selected
- **Chosen**: Keep both ink and sensor glitch as separate possible WASD failure penalties. Both last **5 seconds** of the existing gameplay-effect clock.
- Ink source: approved **set03**, `penalty-v3.mjs`, `ink-v3.png`, `ink-v3.webm`.
- Glitch source: approved **set05**, `penalty-v5.mjs`, `glitch-v5.png`, `glitch-v5.webm`.
- Ink: localized irregular stains and short drips; no near-total/global opaque cover.
- Glitch: visibly animated crackling static and moving broken bands; the slightly stronger set05 intensity is final. Do not replace it with static stripe artwork.
- Both must be uncomfortable but playable, keeping the ship and approaching openings legible. The visual obstruction never moves actual collision geometry.
- **Rationale**: The user approved the visual identity but rejected near-total blindness, then selected a 5-second duration.
- Apply the approved source's short onset and final 1.2-second fade within the new 5-second total as the retained visual convention. Existing preview videos still demonstrate 4-second effects, not the new 5-second setting.
- Existing random ink/glitch selection is 50/50; no new distribution was requested. Do not stack both simultaneously.

## D05. Automatic Firing Gauge, Independent of WASD — User Correction and Confirmation
- **Chosen**: Start an empty bottom firing gauge when boss combat begins. Automatically fill one shot in **10 seconds of active flight**.
- Maximum stored ammunition: **one shot**. A full gauge glows and stays full until fired; no additional shots accumulate behind it.
- After an accepted firing input consumes the ready shot, start charging the next shot.
- Pause charging during WASD challenges and ordinary game pause. WASD success does **not** charge the gauge, shoot, or damage the boss.
- Existing live roar remains active gameplay; do not mistake it for the world-frozen WASD interval.
- **Rationale**: The user explicitly separated weapon charging from challenge success and chose active-flight time for the 10-second clock.
- Reset charge and firing state on each new boss/run; no carried ammunition from a previous boss or game.

## D06. Manual Fire Inputs and Mobile Button — User Confirmed
- **Chosen**: PC fires with **Shift or Ctrl**. Mobile receives a **separate fire button**, rather than tapping the gauge.
- Bottom gauge communicates charging/ready state. Mobile button reflects the same availability and invokes the same firing action as keyboard input.
- Fire only when a shot is ready and ordinary boss-flight control is available. No firing during pause, WASD, death or a preceding firing action.
- Apply existing input conventions: one action per press/touch, no held-key repeat, no queued shot after leaving a blocked screen. Prevent fire controls from also causing lift/Space inputs.
- **Rationale**: Mobile has no physical Shift/Ctrl equivalent; the user chose a dedicated button. Both input methods must share the same ammunition and lock rules.

## D07. Live-world Firing Lock — User Selected After Speed Calculation
- **Chosen**: Total ship movement lock **0.30 seconds**: face/align toward the boss and charge for **0.20 seconds**, fire, then return control after **0.10 seconds**.
- Only the ship's movement locks. Walls, enemy attacks and the rest of the world continue normally. No global freeze or new firing invulnerability was approved.
- Use a temporary facing/pose for the shot and restore ordinary flight afterward. Preserve a coherent pre/post-lock physics state; visual alignment must not resize the real collision body.
- Do not allow a WASD transition to silently discard a consumed shot/charging action; resolve the short action and the scheduled challenge coherently.
- **Rationale**: The original proposal was 0.3 seconds charging and 0.5 seconds total. At the score-150 cap, fast-boss walls travel about 627 world pixels for NOVA/AEGIS and 1,103 for VELOCITY during 0.5 seconds (viewport width 960). The user chose 0.3 seconds total over the suggested 0.2-second alternative, retaining a deliberate firing risk.
- Keep the visible boss/laser target coherent as the boss animates; ship alignment alone must not create a miss.

## D08. Boss HP and WASD Flow Separation — User Confirmed; Existing Code Consequence
- **Chosen**: A fired player laser **always hits the boss**. Each distinct laser hit removes one HP. Boss starts at **3 HP** and clears after **three laser hits**.
- Do not reduce HP on WASD success or on a boss projectile reflection. Apply damage exactly once per accepted shot/impact.
- WASD success resumes the boss cycle without automatic counterattack; failure resumes with the selected 5-second visual penalty. Continue cycles while boss HP remains, regardless of total WASD successes.
- Keep the existing HP display as remaining **BOSS HP**. No success-count-based clear path may remain.
- **Rationale**: Current `resolveChallenge` creates an automatic counterattack, and `advanceBossEncounter('challenge-success')` reduces HP. Both must be separated from HP damage to support the approved independent weapon.
- Preserve existing boss-clear scoring, speed progression and stage-transition behavior after the third hit.

## D09. Code-derived Compatibility and Validation Needs
- These are applications of existing behavior, not newly selected durations or combat patterns.
- Current relevant code: `src/game/game-engine.js`, `boss.js`, `boss-signatures.js`, `wasd-challenge.js`, `constants.js`, `renderer.js`, `src/ui/app-controller.js`, `game-hud.js`, `src/audio/audio-manager.js` and existing audio build/player modules.
- Preserve existing laser patterns, Space cooldown, ordinary collision rules, first/later WASD limits, admin/guest score exclusions, and unrelated auth/leaderboard behavior.
- Planning must cover independent HP/charge/challenge transitions, no-stall repeated waves, exactly-one-projectile wall shots, wall-free sequencing/telegraphs, firing input/collision timing and mobile controls.
- Visual verification must use actual production rendering for the selected ink/glitch motion, new 5-second duration, readable gauge/ready glow, firing alignment and resumed flight. Previous clips verify only preview rendering, not runtime balance.
- Audio verification must cover seamless ORBIT RUN looping and menu/game/boss transitions with existing mute/unlock controls.
- Azure deployment remains waiting for company resource-group access. This interview does not create a deployment plan or change Supabase.

## Interview Result
- All requested design choices above were resolved before planning. The user then authorized both planning and sequential execution through the final Task.
- Production implementation is complete. `.memory/current.md` has no remaining active Task. See [verification report](../validation/2026-10-28-menu-music-manual-fire/report.md); physical playtesting remains the next feedback step.
