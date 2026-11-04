# Decisions: Next gameplay stability and balance update

- Date: 2026-11-04
- Status: Confirmed. Requirements interview complete; gameplay and version automation implementation has not started.

## D01. Version policy — confirmed by user
- Replace numeric suffix progression0.21/0.22 with0.2 ->0.2b ->0.2c ->0.2d ->0.2e... . Next default0.2d; numeric base0.3/1.0 changes only by explicit user request.
- Persist rule in AGENTS.md now. Include scripts/release-core.mjs nextVersion, release-docs explicit validation, registry nextVersion/policy and docs/tests in the subsequent plan. Preserve actual current/development0.2c and existing deployed proofs/snapshots until appropriate preparation. Do not deploy from this interview.

## D02. Requested scope — confirmed by user
1. Stronger prevention of sudden falling after WASD, player laser and similar control interruptions.
2. Investigate/fix excessive wall spacing when single line laser appears.
3. Slightly increase stage-specific boss attack frequency.
4. Explain current boss difficulty stages and tune them with user.
5. Rebalance AEGIS because competent play makes scoring too easy.

## D03. Verified current recovery implementation
- constants.js: GRAVITY900, lift360, CHALLENGE_RECOVERY_SECONDS0.15.
- resolveChallenge removes downward velocity with Math.min(0,velocityY), starts0.15-second linear gravity ramp. lift immediately cancels remaining recovery and applies upward impulse.
- Player weapon:0.5-second charge,0.7-second control/vertical-motion lock. Existing velocityY is retained; fire completion has no dedicated recovery trigger. This is a likely source of immediate post-shot falling, not yet a reproduced runtime test in this interview.
- **Chosen by user (option1):** apply downward-speed cancellation plus a0.3-second gravity ramp after BOTH challenge completion (success or failure) and player laser firing completion. Restore lift input immediately; click/Up applies normal lift and cancels remaining recovery as appropriate. This removes old post-shot downward momentum rather than merely lowering gravity while already falling fast. Preserve upward velocity; do not add invincibility.

## D04. Verified line laser spacing implementation
- Telegraph0.7 + active1 + fade0.15 =1.85 seconds.
- Boss inline line laser sets wallSpawningPaused=true and clears spawnAccumulatorSeconds. Ambient line laser blocks spawning and clears the accumulator throughout the attack and at completion. Normal spawn interval2s; later-boss1.4s, further multiplied by aircraft spawn interval (VELOCITY0.5).
- Current prepareLineLaser chooses lines outside all current openings, and avoids imminent special barriers. Future opening safety currently relies on stopping spawns; removing the pause must replace that safeguard rather than create impossible paths.
- **Chosen by user (option1), refined by later steering:** maintain ordinary wall cadence during single/two-line laser attacks. Keep announced positions fixed; do not reset wall spawn clocks or force an extra post-laser waiting interval. Apply to ambient and boss inline line lasers; global wall-free laser blocks remain separate. Remove opening-height/future-opening prediction and replace it with horizontal wall-clearance timing, as confirmed below.
- Safety explanation from current code: laser center excludes top/bottom15% with half-thickness clearance. Each wall opening is expanded by9px half laser +8px half player damage box +1px margin=18px per side. Moving gaps protect their full motion envelope. Revised scheduling must also cover future walls/reachable passage during the attack, rather than rely on stopped spawning; randomness remains over valid locations, not player homing.
- **Chosen by user (option3):** minimum clear space between the two beam cores is25% of world height,135px at540px. With18px-thick cores this means153px center separation. If two lines cannot fit under the remaining position/edge constraints, fall back to one rather than squeezing two. Existing default was about43px center separation/25px clear space. No gameplay implementation yet.
- **Chosen by user (emission option1):** single/two-line laser active emission lasts0.2s, with a correspondingly faster right-to-left sweep for a brief swishing shot. Retain the proposed0.7s telegraph and use a short non-damaging fade (implementation default0.1s). Do not merely shorten the active clock with the old0.4s sweep, which could expire before reaching the player. Do not change global laser timing from this request.
- **Latest user proposal:** restrict line-laser firing to the time between consecutive walls passing the player. Recommended resolution of the safety branch: remove opening-height and future-opening prediction; use only horizontal wall clearance/arrival timing so the whole brief damaging interval fits after the previous wall clears the player damage bounds and before the next wall reaches them, with a small margin. Include normal, moving, special and hybrid walls. Keep wall cadence/geometry unchanged. If current speed/acceleration leaves insufficient time, skip this slot and target the next; no compressed wall spawning to compensate.
- **Chosen by user (option1):** telegraph may overlap wall passage, while the whole damaging shot must fit between walls at player X. Do not require telegraph+shot to fit together. Keep ordinary spawn cadence and announced Y fixed; if the usable interval is insufficient, wait for a later valid slot without firing early or shortening the warning. Include both lines in the same reserved window. Vertical selection retains top/bottom15% exclusion and two-line25% clear space, with no player homing. Couple shorter active duration to a faster sweep so the beam reaches the player; separate short-line clocks from global laser clocks.
- Timing resolved:0.7s full warning,0.2s damaging emission, short non-damaging fade. A delayed slot still receives the full warning; exact held/repeated telegraph treatment can be implemented with a scheduled slot rather than altering announced Y.

## D05. Verified boss progression for later tuning
- Encounter spacing: first20 normal walls; subsequent15 after next stage arrival. Speed patterns first slow, second fast, third shift, then random.
- First boss: gap180/normal2s interval/special20%; second onward gap135/1.4s/special50%, at least3 special walls per7-wall wave. Special success window always0.30s.
- Second onward adds global laser and stage-specific unique block. Third onward adds single projectiles during walls; fourth adds inline single/two-line lasers. Normal play line lasers unlock after2 completed bosses.
- WASD boss1:4 keys/4s; boss2:4–5/2.5s; boss3:4–6; boss4:5–7; boss5+:6–8, all later2.5s. Wrong input doesn't instantly fail; penalty8s on timeout.
- Pattern rounds: first boss shuffled walls/signature/challenge; second onward shuffled walls/signature/global/unique/challenge, exactly one of each per round. Unique block includes1–3 sets; boss2 warning2s, later1.5s. Long blocks and early kills may lower observed unique frequency; not simply a configurable probability.
- **Chosen by user (frequency option1):** from the existing unique-pattern unlock (boss2), retain one unique block per round and add one extra unique block with50% probability. Thus each round has one or two unique blocks, not a50% chance of omitting the only block. Keep other block types and random ordering; avoid consecutive unique blocks, including across round boundaries. Existing1–3 sets inside each unique block are unchanged by this frequency choice.
- Baseline: all bosses HP3, normal player laser damage1; AEGIS damage3, so one hit clears. Recharge10s, first charge begins at encounter start. Confirmed AEGIS change is in D06.

- **Boss progression direction and numbers chosen by user (option1 for each):** distribute wall difficulty growth across bosses1–4. Boss1: gap180, interval2s, specialChance0.20, minSpecials0. Boss2: gap165, interval1.8s, specialChance0.30, minSpecials1. Boss3: gap150, interval1.6s, specialChance0.40, minSpecials2. Boss4+: gap135, interval1.4s, specialChance0.50, minSpecials3. Minimums apply to each7-wall wave; quota enforcement may increase realized special proportion. VELOCITY retains its0.5 spawn-interval multiplier. Special success window remains0.30s. Keep existing attack unlocks, speed-mode order and WASD progression unchanged.

## D06. AEGIS balance — confirmed by user
- **Verified baseline:** same score multiplier1 and scroll/spawn rates as NOVA. Gravity1.3 (1170), lift0.7 (252), shared16×16 damage box. Boss laser deals3 instead of1; one hit can end encounters after the first10-second charge. This is a likely source of its scoring advantage; comparative live-play balance has not been measured in this interview.
- **Chosen:** retain one-hit boss defeat (damage3 against HP3) and change AEGIS weapon charging to30 seconds, including the first charge from boss encounter start and subsequent recharges after firing. Maximum stored ammunition remains one. NOVA/VELOCITY retain10 seconds. Keep AEGIS gravity, lift, movement, scoring and hitbox unchanged.
- **Rationale:** preserve the powerful single-hit identity while requiring longer survival before the shot. A missed shot still consumes the stored shot under existing rules.
- Integrate the aircraft-specific recharge into weapon creation/reset/restart and visible charge progress/ready state. Update affected aircraft descriptions, preflight guidance and management documentation so they do not promise10 seconds for AEGIS. No score/history migration or resetting existing rankings is requested.

## D07. Completion and implementation constraints
- All requested design branches are resolved. Next step is memory-plan for these decisions, then sequential memory-execute when instructed. No implementation, release preparation, push or deployment was performed during this interview.
- User choices: alphabetic patch versions,0.3s recovery, unchanged wall cadence with short line shots between walls,25% two-line clear gap, higher unique-block frequency, gradual boss wall table, AEGIS one-hit/30s charging.
- Code-derived findings: line lasers currently pause/reset wall clocks; laser control unlock retains old falling velocity; unique attacks are shuffled blocks rather than a simple occurrence chance; VELOCITY spawn intervals are halved. These explain the implementation work and are not claims of runtime verification.
- Keep global-laser timing separate from short-line timing. Preserve existing deployed version IDs/proofs and old protected snapshots. Preserve unrelated untracked preview artifacts.
- No additional unrelated scope is proposed. Aircraft-specific recharge labels and progress must be synchronized as part of the confirmed AEGIS change; existing records and SQL are outside this balance change.
