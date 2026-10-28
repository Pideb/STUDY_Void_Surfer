# Task: T01 Independent manual boss weapon

## Status: done

## Goal
Add an independently clocked one-shot weapon; WASD success no longer attacks or removes HP.

## Decision Summary
- User decisions D05/D07/D08. Active-flight recharge10s; charge0.20s and recovery0.10s, live world;3 laser hits clear boss.
- Source: .memory/decisions/2026-10-28-menu-music-manual-fire.md; no auth/database/deployment change.

## Implementation

### I01. Runtime contract
- Related Files: `src/game/constants.js` constants; `src/game/boss.js` createBossEncounter/advanceBossEncounter; `src/game/game-engine.js` resolveChallenge/update/updateBossAttack/completeBossIfReady/lift/dash/getSnapshot; new `src/game/boss-weapon.js`; new `tests/game/boss-weapon.test.js` and `tests/integration/manual-boss-fire.test.js`.

#### Details
- **Signatures, Data & Schema Fields, Execution Flow**: Export createBossWeapon():Weapon, advanceBossWeapon(weapon,dt):boolean impact event, startBossWeapon(weapon,{id,fromX,fromY,toX,toY}):boolean. Weapon fields chargeSeconds:number=0, rechargeSeconds:number=10, ready:boolean=false, firing:null|{id:string,elapsedSeconds:number=0,chargeSeconds:number=.2,durationSeconds:number=.3,fromX,fromY,toX,toY:number,impacted:boolean=false}. Advance finite nonnegative dt, clamp charge; ready at10s; consume exactly1 ready shot and refill from accepted input. Fire impact exactly once crossing.2s, lock ends.3s; HP damage via laser-hit, independent of challenge-success. Engine fire():boolean accepts only playing/live boss/ready/no challenge/death/current firing; read actual boss core target. Begin clock after entrance completes. WASD/pause/death exclude charge clock; roar/world continue. Lock player position/velocity for overlapping part of timestep, update physics for unlocked remainder; enemies/obstacles/collisions continue throughout, no new immunity. Defer WASD activation until shot action finishes. Independent shot snapshot deep copy; keep counterattack visual compatibility as shot flight until T03 renderer. Challenge success/failure both recover into subsequent wall waves without damage, failure creates feedback. After lethal hit clear hostile actions/challenge scheduling and wait hit effect/short firing recovery before existing+10/stage advance. HP counts laserHits; successfulChallenges remains diagnostic only.
- **Validation and errors**: reject unavailable actions without consuming ready ammo or replaying later; validate finite deltas; guard null boss and restart lifecycle. Keep deterministic tests.
- **State Transition & Return**: public engine snapshot must represent real state with copied nested mutable data; final statuses match the contract above.

### I02. Behavior verification
- Related Files: test paths listed in I01; modify or new as specified.
- Unit clock/invalid delta/full capacity/reset; integration WASD no damage, three manual hits, live walls during lock, partial timestep physics, no pause/WASD charge and no new invulnerability.

## Acceptance Criteria
- [x] Observable goal and all approved timings/counts above implemented.
- [x] Specified validation passes without replacing meaningful adjacent guarantees.

## Validation
- `npm test -- --run tests/game/boss-weapon.test.js tests/integration/manual-boss-fire.test.js` - expected successful exit; run individual commands sequentially when separated above.
- `git diff --check` - no whitespace errors.

## Commit Message
```text
feat(game): manual weapon

Plan: 2026-10-28-menu-music-manual-fire
Phase: P01-runtime
Task: T01-manual-weapon

- Independent manual boss weapon
- Validate approved behavior and preserve adjacent mechanics
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 033ad4e
