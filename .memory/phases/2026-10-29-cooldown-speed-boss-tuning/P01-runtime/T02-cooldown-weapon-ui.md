# Task: T02 Cooldown, Weapon and UI

## Status: pending

## Goal
Render the approved small cooldown marker, make manual firing last.70s and display the requested aircraft/tutorial text.

## Decision Summary
-16px ring center(player.x-36,player.y-24), follows without tilt; preserve cooldown.70s and no repeat-input behavior.
- Player firing: charge.50s, recovery.20s; live enemy world and no added immunity. Exact tutorial sentence replaces verbose boss paragraph.

## Implementation
### I01. Visual marker and weapon clock
- Related Files: `src/game/renderer.js` :: `drawDashCooldown`, `drawManualLaser` — modify; `src/game/boss-weapon.js` :: `startBossWeapon`, `advanceBossWeapon` — modify; `src/game/game-engine.js` :: update lock / fire facing — audit, modify only if hardcoded assumptions are found.
#### Details
- Signatures unchanged: `drawDashCooldown(ctx:CanvasRenderingContext2D,player:object):void`; `startBossWeapon(weapon:object,shot:object):boolean`; `advanceBossWeapon(weapon:object,deltaSeconds:number):boolean`.
- Firing fields remain `elapsedSeconds:number=0,chargeSeconds:number=.5,durationSeconds:number=.7,impacted:boolean=false`; no persistent storage.
- Damage once at.5; clear firing at.7. Invalid deltas/shots retain existing rejection and do not spend ammo. Recharge remains10 and begins again on shot acceptance.
- Existing physics lock must consume only the firing fraction of a frame; world motion continues. Lift/dash rejected during lock, no queue, boss hit is guaranteed and aircraft damage remains3 for AEGIS /1 others.
- Renderer uses shot fields rather than hardcoded.2/.3; nose charge grows for.5, beam exists through recovery.
- Ring: progress `1-clamp(remaining/.7)`, radius8, center(-36,-24) relative to player, thin1.8px white arc starting-pi/2, faint full track and subtle dark backing matching approved preview. Return without drawing when remaining<=0. Save/restore context; do not change ship, hitbox or surrounding dash shockwave.

### I02. UI wording
- Related Files: `src/ui/app-controller.js` :: `getHangarAircraft`; `src/ui/screens.js` :: `renderTutorialScreen` — modify.
- Remove only the appended ` · 속도 증가 ${craft.speedCapScore}점까지` string; retain three aircraft trait descriptions.
- Exact boss tutorial: `보스전에서는 10초마다 레이저가 충전됩니다. Ctrl/Shift 키로 발사하세요`.
- Preserve other tutorial rows and existing actions/mobile fire controls. No added old WASD/count paragraph.

### I03. Validation cases
- Related Files: `tests/game/boss-weapon.test.js`, `tests/integration/manual-boss-fire.test.js`, `tests/game/renderer.test.js`, `tests/ui/app-controller.test.js`, `tests/ui/screens.test.js` — modify.
- Check .499 no impact/.500 one impact/.699 still firing/.700 unlocked, exactly-once hit with coarse updates, live hazards during ship lock, partial frame beyond.7, AEGIS one shot, other craft3, pause/WASD recharge unchanged.
- Ring half progress atremaining.35 uses center204,246 andradius8 forplayer240,270; no drawing ready; original player data/context not mutated.
- UI asserts exact new sentence and absence of cap suffix on every description, preserving traits and unlock labels.

## Acceptance Criteria
- [ ] Approved marker matches location/size, progress and readiness behavior.
- [ ] .70s firing and one impact at.50s verified in actual engine.
- [ ] Both wording changes match confirmed text.

## Validation
- `npm test -- --run tests/game/boss-weapon.test.js tests/integration/manual-boss-fire.test.js tests/game/renderer.test.js tests/ui/app-controller.test.js tests/ui/screens.test.js` — pass.
- `git diff --check` — clean.

## Commit Message
```text
feat(ui): refine dash cooldown and extend boss laser firing

Plan: 2026-10-29-cooldown-speed-boss-tuning
Phase: P01-runtime
Task: T02-cooldown-weapon-ui

- Move cooldown into the approved small upper-left marker
- Extend firing to seven tenths and simplify aircraft and preflight text
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
