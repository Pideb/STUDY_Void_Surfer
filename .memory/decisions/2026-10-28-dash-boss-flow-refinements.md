# Decisions: Dash and Boss Flow Refinements

- Date: 2026-10-28 (Asia/Seoul)
- Status: Implemented and verified 2026-10-28. All five Tasks complete; final verification commit `407ee14`. Interview sections below preserve the approved requirements, including unrestricted projectile firing during special walls.
- Feature name: `dash-boss-flow-refinements`
- Prior completed plan: `2026-10-28-boss-combat-evolution`. Preserve its approved art/audio and unaffected mechanics.

## D01. Dash Cooldown and Reachable Special Walls — User Confirmed
- All aircraft: cooldown **1.0 second from successful activation**, including the existing0.6-second dash effect. The remaining0.4s prevents continuously renewed protection.
- Draw a thin white circular progress ring around the ship immediately after activation. It fills while use is blocked; disappear on full charge and allow a fresh press. Do not add the old rectangular hitbox visualization to ordinary gameplay.
- Cooldown attempts do not restart the timer, dash effect, special-wall break effect or dash sound. No queued activation when cooldown ends.
- Ordinary walls keep their existing cadence. Ensure successive mandatory special/hybrid barrier response opportunities have predicted passage times at least**1.2s apart**, including VELOCITY and boss acceleration. Do not only compare spawn timestamps or initial wall positions; later speed changes can shorten arrival gaps. Preserve fair timing across stage/encounter boundaries too.
- Rationale: current WARNING/BOSS generation is1.4s; VELOCITY multiplies it by0.5, giving0.7s between spawns. A cooldown alone would make some consecutive barriers impossible.

## D02. Exactly One Dash per Press — User Requested
- Holding Space never repeats or auto-reactivates; release and press again for the next activation.
- Apply equivalent single-activation behavior to mobile/touch controls. Suppress duplicate pointer/click events from one interaction.
- Input lifecycle must recover after blur, menu, pause, challenge and restart. A key held through a blocked period must not fire automatically when control returns.

## D03. Dash Protection Scope — User Confirmed Option1
- Keep existing special-wall timing success and hybrid opening requirements.
- During the0.6-second dash effect, protect the player from boss projectile contact only. No normal-wall, laser or upper/lower boundary immunity is added.
- Existing designated-admin invincibility remains a separate setting with its existing scope and score-submission behavior.
- Implementation constraint: projectile hit flags currently latch. Merely skipping death while dashing would allow stale hit flags to kill the player later. An immune contact must not become delayed damage after the dash expires; projectiles keep moving.

## D04. Missed Projectiles Continue Offscreen — User Requested
- Remove the current retirement at the player's left edge. A missed projectile keeps travelling until its body leaves the game viewport.
- Preserve each stage's announced trajectory and speed, continuing the outgoing direction naturally after passing the original aim point. Do not freeze a projectile at its target or teleport it out.
- Maintain swept collision detection (check the travelled segment between frames) so fast shots cannot tunnel through the player.
- Counters/attack completion must account for the longer real flight; no permanent volley or stalled boss phase. An actual unprotected contact remains lethal; a miss remains harmless.

## D05. Admin Player Hitbox Display — User Requested; Existing Conventions Applied
- Add a separate `플레이어 히트박스 표시` toggle to the existing administrator settings window, default off and independent of the invincibility switch.
- Keep the existing administrator identity restriction (`gh.lee@dexconsulting.net`). Debug display is effective only for the designated account in administrator mode; never show it to guests/ordinary players or after logout/mode-off.
- Show the real collision rectangle including the front trim, not the larger decorative ship sprite bounds. Do not change collision size or physics.
- Follow existing local admin-setting persistence; old saved settings lacking the new boolean must load safely with display off. No backend/admin/auth expansion is part of this request.

## D06. More Frequent One/Two-Line Lasers — User Confirmed
- During eligible boss wall combat, check every**2 seconds**, with**90% activation probability**. This supersedes4s/70%.
- Once selected to fire: **one line70% / two lines30%**. A two-line attack has two distinct Y positions, both visibly telegraphed before firing. Use the existing warning/sweep/active/fade style; no silent extra beam.
- Preserve protection of all current normal openings, including the full moving-gap excursion. No incompatible required special-wall response may overlap the laser.
- If two safe positions cannot be found, fall back to one; if none exists, skip. Retain a reachable route, not merely nonoverlapping beam centers.
- Keep single-line opportunities independent of wave completion. Do not accumulate skipped opportunities into a burst. Higher frequency must not be defeated by retaining an unnecessarily broad whole-wave gate when only upcoming response conflicts need protecting.
- Existing global/quarter-laser rules remain: boss2 unlock,60% sequence activation, uniform1..3 shots, changed consecutive safe quarters, fresh reachable warning per shot and wall-free execution.

## D07. Keep Flight Active During Roar — User Requested
- Keep the approved0.8-second stage-specific roar sound/action animation.
- Roar no longer freezes flight. Player gravity, lift and Space input, scenery and already-present world objects continue normally until WASD actually starts.
- At WASD activation, freeze normal gameplay as before and give the full challenge countdown: first boss5s, later bosses2.8s. Resume the existing success/counterattack and failure/penalty flow.
- Follow the existing gameplay clock for cooldown: pause/challenge freeze it; a live roar does not. This is a derived consistency rule, not a new duration or physics mechanic.
- Ensure UI/controller input guards agree with engine behavior; currently both block inputs during roar.

## D08. One to Three Signature Volleys per Attack Cycle — User Confirmed Option1
- One cycle means the wall/attack period before **one WASD challenge**, not the whole boss encounter.
- Choose integer1,2 or3 with equal probability once per cycle. One use is one stage-specific projectile volley, not one projectile within a volley.
- Distribute selected volleys while either ordinary or special/hybrid walls are travelling; do not force every volley into the old post-wall/pre-roar slot.
- **User amendment (2026-10-28):** do not suppress, defer or cancel projectile volleys because a special/hybrid wall is present, approaching its timing window or needs a dash. Remove the previously proposed special-response/recovery exclusion for projectiles, including equivalent indirect wall-type/timing filters. The player can dodge projectiles through flight movement; Space immunity is optional, not a required response to every projectile.
- Retain each stage's existing distinct projectile design/pattern and the clear rule of three successful WASD counterattacks /3HP. Volley count does not replace HP or WASD count.
- Remaining scheduler constraints: avoid incompatible laser/projectile combinations; no new attack during boss entrance, active challenge, counterattack/clear or portal. Preserve finite remaining-volley counts and phase completion without deadlocks. These constraints must not reintroduce a special-wall exclusion. D01's minimum interval between mandatory special-wall responses still applies to wall generation; D06's laser safety rules remain unchanged.
- Preserve normal/special wall mixture and minimum wall counts wherever compatible with mandatory cooldown spacing; do not silently remove special walls from all boss fights.

## D09. Fixed-Height Full-Height Portal — User Confirmed Option1
- Portal vertical center stays at world midpoint. Do not capture or follow playerY at creation or during approach.
- Enlarge the **open interior**, not just its glow/ornament bounds, to cover every legal player height with room for the visible ship. No upward/downward movement is required to enter.
- Keep horizontal approach from right to left at actual wall speed, the approved destination ornaments, white-out/opaque swap/reveal and spawn suspension. The user did not choose a horizontally stationary portal that expands in place.
- The player keeps normal control; do not pull, snap, align or autopilot the ship into the opening. Decorative portal shapes remain non-colliding.

## Verified Baseline and Planning Constraints
- `constants.js`: dash effect0.6s; ordinary spawn2s, WARNING/BOSS1.4s; VELOCITY spawn factor0.5; base speed clamps at score150 with boss multipliers afterward.
- `game-engine.js::dash` currently has no cooldown. `app-controller.js::handleKeyDown` currently invokes Space even on repeating keydown; only WASD rejects repeats.
- `collision.js` currently exempts only a successfully targeted special barrier; projectiles/lasers have no dash immunity. Shared player rectangle36×24 trims3px from the front; the sprite draws larger.
- `boss-signatures.js::moveProjectile` currently retires a miss near playerLeft and records hits on shots/attack. Extending lifetime and adding immunity must be coordinated with completion and sticky hit state.
- `game-engine.js` currently stores one active boss attack and schedules one signature only after all walls leave. Multi-volley wall-phase scheduling and two-line laser geometry require an explicit compatible state model; do not leave old post-wall follow-up transitions duplicated.
- `game-engine.js::update` currently returns early during roar before world physics. `lift`/`dash` and controller triggers also reject roar. All these guards must change together.
- Portal `crossingY` currently follows playerY; the renderer also limits aperture height. Correct engine coordinates and rendered opening together.
- Runtime assets, boss identity, previous speed caps, scoring, stage ordering, guest mode and leaderboard contracts remain unchanged. No SQL migration or external service work is needed for these refinements.

## Interview Completion
- User choices: cooldown1s with mandatory response spacing1.2s; projectile-only dash immunity;2s/90% laser opportunities with70/30 one/two lines; uniform1..3 volleys per WASD cycle during either ordinary or special walls, with no special-wall timing exclusion; vertically fixed/full-height approaching portal.
- Direct requests: one activation per press, missed shots fly offscreen, admin hitbox toggle and flight continuing until actual WASD activation.
- Derived implementation rules are labelled above and follow current timing/input/admin conventions. No additional art/audio redesign or out-of-scope system change is approved here.
- Interview handoff was `/memory-plan dash-boss-flow-refinements`; no implementation code changed during that interview. The user subsequently authorized planning and execution, completed in [this plan](../plans/2026-10-28-dash-boss-flow-refinements.md).
- [Final verification report](../validation/2026-10-28-dash-boss-flow-refinements/report.md):41 files/556 passing tests, production build/config, repeated real-engine combat and actual-renderer evidence.
