# Decisions: Cooldown, Speed and Boss Tuning

- Date: 2026-10-29 (Asia/Seoul)
- Status: Confirmed; implementation not started.
- Feature name: `cooldown-speed-boss-tuning`
- Interview: [review notes](../previews/2026-10-29-cooldown-speed/review-notes.md).
- Approved visual: [cooldown comparison option1](../previews/2026-10-29-cooldown-speed/comparison.png).

## D01. Aircraft Description — User Requested
- Remove the appended `속도 증가 N점까지` fragment from every hangar aircraft description.
- Preserve each aircraft's other traits, unlock requirements and score/weapon behavior.
- Rationale: User wants descriptions without speed-cap-score information.

## D02. Small Upper-left Space Cooldown Ring — User Selected Option1
- Use a white16px-diameter progress ring (radius8 logical world pixels), centered36px left and24px above the aircraft center.
- Follow the aircraft position; do not rotate with its tilt. Use the same placement/size for all aircraft.
- Show only during cooldown, progress clockwise from12 o'clock, disappear when ready. Preserve readability with a subtle dark backing/track as in the approved preview.
- Replace the existing large ring around the hull. Do not introduce a damage/success hitbox outline or another ring.
- Preserve Space cooldown.70s, projectile protection.60s, fresh-press requirements and special-wall timing/spacing.
- Rationale: Selected actual-aircraft preview balances visibility with unobstructed ship artwork.

## D03. Longer Player Boss-laser Firing — User Selected Total.70s
- Increase total ship movement lock from.30s to.70s for playtesting.
- Code-derived split: charge.50s, then impact, followed by recovery.20s. The total selected by the user is.70s; the internal split is an implementation choice communicated in the interview.
- World obstacles/enemy attacks continue. Preserve current lift/dash input lock, no queued input, and no additional immunity.
- Emit exactly one impact event at charge completion. Re-enable movement at total completion, including partial-frame handling.
- Preserve recharge10s, one stored shot, Ctrl/Shift/mobile firing, guaranteed boss hit and damage (AEGIS3, other aircraft1). WASD success does not charge or damage.
- Update visual firing phases that assume old.20/.30 timings to match the new weapon clock.
- Rationale: User reports current firing feels far too short and explicitly chose.70s instead of the proposed.40/.50/.60 options.

## D04. Identical Fixed Speed Increment and Shared100-point Cap — User Confirmed
- Ordinary actual target speed in logical px/s:
  `startSpeed(aircraft) + 10 * floor(min(progressionScore,100) / 10)`.
- Starting speed: NOVA240, AEGIS240, VELOCITY480.
- Every10 progression points add exactly10px/s for every aircraft. No compound percentage growth; VELOCITY must NOT double the increment.
- Maximum ordinary speeds: NOVA340, AEGIS340, VELOCITY580 at100 progression points.
- User confirmed existing NOVA/AEGIS100-point cap and raised VELOCITY's70-point cap to100.
- Preserve monotonic progression independent of pause deductions and before VELOCITY's final score multiplier. Boss-clear+10 remains part of progression; score can exceed100.
- Preserve2s smooth speed transitions, boss entry base snapshot, boss slow.75/fast1.25/shift factors, VELOCITY fast adjustment.88, and ordinary-target restoration after boss. Boss factors can exceed ordinary maximums.
- Audit all getBaseSpeed/getDifficulty, aircraft-multiplier application, boss snapshots, future-speed/clearance predictions, special-wall spacing and gap-continuity consumers. Current architecture multiplies base speed downstream by aircraft.scrollSpeedMultiplier: merely replacing the compound formula with `240+10*steps` would wrongly give VELOCITY+20.
- Preserve VELOCITY's existing spawn interval and final score1.5 multiplier; no unrelated aircraft change.
- Rationale: User wants fixed increments shared by all three aircraft and specifically rejects an increased VELOCITY increment.

## D05. Preflight Boss Guidance — Exact User Text
- Replace the boss paragraph with:
  `보스전에서는 10초마다 레이저가 충전됩니다. Ctrl/Shift 키로 발사하세요`
- Preserve other preflight instructions. Do not reintroduce old WASD or boss-hit-count paragraphs.

## D06. Random3–6 Projectiles in Each Wall-free Volley — User Requested
- At each wall-free signature-volley creation, select integer3,4,5 or6 with equal probability through the existing injected RNG.
- Interpret the requested number as projectile count per volley, not volley repetition count. Preserve existing1..3 volley repetitions per wall-free sequence.
- While normal/special walls are passing, preserve exactly ONE projectile per firing.
- Preserve six stages' trajectory/appearance identities, common1.1s telegraph, individual speed220..360, advertised paths, collision/protection behavior, and missed-projectile travel to screen edge.
- Extend stage trajectory templates coherently to the selected count rather than truncating to existing3/4/5 templates, cloning identical paths, or silently ignoring counts above one.
- Recompute volley lifetime from all selected trajectories/delays so6-shot attacks finish and boss progression does not stall.
- Rationale: User observes repeated3-shot attacks and requests3..6 random counts. Inspection found stage-fixed templates of3/4/5 and only a `projectileCount===1` override today.

## D07. Exclude Top/Bottom15% from Line Lasers — User Requested
- Change edge exclusion from10% to15% of logical world height per edge for the existing single-line pattern, including its two-line variant.
- In540px world: allowed damaging core area y81..459. With18px beam thickness, center y90..450 inclusive.
- Restrict full damaging core, not decorative glow alone. Preserve all normal/moving-gap safe-route exclusions and fallbacks two lines -> one -> skip.
- Global/quarter lasers retain their existing safe-quarter logic and are not subject to this line-laser restriction.
- Rationale: User specifically expands the already implemented10% edge exclusion.

## Planning / Verification Notes
- No production code, authentication, DB, deployment or music changes during interview.
- Speed tests must assert actual post-aircraft-multiplier values at0/9/10/99/100/above cap for all three craft, +10 increments, pause monotonicity, boss reward/snapshot/return, and spacing predictions.
- Firing tests must cover just before/at.50 impact, exactly once damage, just before/at.70 unlock, no immediate rescue/extra immunity and live hazards; renderer phase tests follow actual shot durations.
- Volley tests must cover seeded RNG selecting all3..6 values for every stage, wall-phase one-shot preservation, delay/path validity, offscreen resolution and no progression stall.
- Laser tests must assert full-core81..459 and gap-safe fallback under both one/two-line selections.
- Ring tests/actual-render evidence should show upper-left16px, progress, ready disappearance, each craft, and correct viewport scaling. Verify exact UI text and no speed-cap suffix.
