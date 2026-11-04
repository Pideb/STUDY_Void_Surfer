# Decisions: v0.2d transition and AEGIS firing follow-up

- Date: 2026-11-04
- Status: Confirmed. Adds to the locally implemented v0.2d balance work; no new deployment requested.

## D01. Remove post-boss extra walls — chosen by user
- Remove the two new walls currently generated between boss defeat and the next-stage portal.
- Stop spawning new walls after boss clear. Let already visible walls drain normally, then begin the existing portal transition as soon as the screen is clear. Do not erase existing walls abruptly.
- Code baseline: game-engine.js pendingStageAdvance.extraSpawned permits two transition spawns and updateStage waits for extraSpawned>=2. Remove this requirement and the additional spawns together to avoid a portal deadlock.
- Preserve portal appearance, next-stage arrival and the subsequent15-wall encounter count. No bonus wall score from the removed transition walls.

## D02. Longer AEGIS firing action — chosen by user (option2)
- Verified baseline: boss-weapon.js startBossWeapon uses0.5s wind-up plus0.2s beam, total0.7s movement lock for all aircraft. AEGIS's separate ammunition recharge is30s; NOVA/VELOCITY10s.
- Chosen: AEGIS has1s wind-up plus0.2s beam, total1.2s control lock after Ctrl/Shift. Keep30s recharge, single stored shot and damage3. NOVA/VELOCITY remain0.5+0.2s. Preserve0.3s post-lock gravity recovery and immediate normal lift after unlock.
- Renderer and damage checks must use the actual shot timing; a longer wind-up cannot cause early damage, extend the beam lifetime or add immunity. Companion tests and documents must use craft-specific timing.

## Next
- Requirements complete. User previously authorized continuing through plan/implementation/validation/commits, which applies to this follow-up. No push/deployment or SQL changes. Keep development0.2d and operating0.2c.
