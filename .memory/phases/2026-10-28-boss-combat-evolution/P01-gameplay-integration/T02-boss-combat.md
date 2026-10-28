# Task: T02 Stage-specific combat and safe laser scheduling

## Status: pending

## Goal
Make six boss identities fire real dodge hazards, interleave fair lasers and frozen roar/WASD, and visibly counterattack for three-hit clears without stalled encounters.

## Decision Summary
- Implement approved decisions in .memory/decisions/2026-10-27-boss-combat-evolution.md, without reopening accepted art/audio/balance.
- Depends on preceding Tasks. Preserve their public snapshots/interfaces; execute sequentially. No external DB or credentials required.

## Implementation

### I01. Runtime behavior and public contracts
- Related Files: `src/game/game-engine.js::{beginWarningSession,scheduleBossAttack,updateBossAttack,resolveChallenge,completeBossIfReady,update,getSnapshot}`, `src/game/boss.js`, new `src/game/boss-signatures.js`, `src/game/boss-attacks.js::createQuarterLaser`, related game tests.

#### Details
- **Signatures & Types**:
```typescript
createSignatureAttack({id,stageId,bossNumber,playerX,playerY,baseSpeed,rng}): SignatureAttack; updateSignatureAttack(attack,deltaSeconds,player): SignatureAttack; createQuarterLaser({rng,worldHeight,styleKey,excludeSafeZone,playerY,playerHeight,liftSpeed}): Laser; createBossEncounter(number,stageId?): BossEncounter
```
- **Data & Schema Fields**: Encounter adds stageId:string, cyclePhase:'walls'|'signature'|'global'|'roar'|'challenge'|'counterattack'|'recovery', cycleNumber:number, globalShotsRemaining:number, previousSafeZone:number|null, singleLaserElapsedSeconds:number, roar:{id,elapsedSeconds,durationSeconds:.8}|null, counterattack:{id,elapsedSeconds,durationSeconds:.3,fromX,fromY,toX,toY,impacted:boolean}|null, animation:{kind,elapsedSeconds,durationSeconds,actionId}. SignatureAttack {id,type:'volley',stageId,state:'charging'|'flying'|'resolved',elapsedSeconds,chargeSeconds:1.1,projectiles:Projectile[],hitPlayer:boolean}; Projectile carries origin/target, delay,speed,curveAmplitude,x,y,previousX,previousY,state and telegraphPoints.
- **Execution Flow / Logic**:
  1. Precondition & Validation: normalize finite inputs, retain existing API defaults and engine state guards. Handle absent optional browser APIs through existing fallbacks.
  2. Core Processing: Reuse seven-wall boss waves/minspecial3/minnormal2. Lock encounter stageId and capped entry speed. Once wave passes and old walls leave screen: one telegraphed signature volley -> eligible global sequence -> roar -> challenge; retry same flow until3 successes. Crystal fan shards; Industrial alternating upper/lower barrels; Signal sequential telegraphed lanes; Gravity curved/converging orbs; Abyss alternating upper/lower arcing pressure; Solar charged heat volleys. Initial counts3..5, speed random clamped220..360px/s, no simultaneous wall/projectile response; parameterize. Actual projectile contact fatal except admin invincible, missed shots harmless; SPACE never reflects in this model. Use swept collision and stop at world edge, no reflected helper damage. Singles unlock boss1, independent eligible-combat4s timer/70% roll, skip unsafe slots/no queued bursts; pause new wall spawning during single warning/active/fade to protect future gaps. Globals boss2+, one60% roll/cycle, uniformly1..3 shots; no walls/projectiles through sequence. Each shot excludes previous safe quarter, keeps full2s warning (extend if reachable-time estimate requires), ends previous damage/fade first. After signature/global sequence, freeze world/player/projectiles for .8s roar; reveal full WASD countdown only afterwards. Success creates .3s automatic counterattack, then apply one HP damage on impact with .38s visible hit; preserve encounter through final hit before clear. Failure4s penalty and next cycle, no damage. No scores from boss walls, clear+10 progression retained. Deep-clone snapshot arrays/clocks. Restart/pause must clear stale state; transitions never schedule attacks.
  3. Error & Exception Handling: deterministic fallback for missing assets/API, no unhandled promise rejection or permanently paused combat; malformed inputs must not introduce NaN/Infinity. Do not conceal validation failures.
  4. State Transition & Return: expose independent snapshot data; advance engine phases only once; restart/menu clear transient state.

### I02. Verification and regression coverage
- Related Files: tests listed above; modify existing superseded expectations and add focused behavioral tests.
#### Details
New deterministic signatures tests (six identities, swept hit/miss/admin, delays/telegraphs); engine cycles beyond3 attacks, retry failures, three counterattack impacts, no scoring duringboss, final clear once, roar world freeze/full countdown, safe independent singles; globals60% RNG and uniform counts, nonrepeat quarters, every2s warning, no walls/other attacks. Existing tests asserting no projectiles or instantaneous HP should be replaced with new behavior, not removed wholesale.

## Acceptance Criteria
- [ ] Make six boss identities fire real dodge hazards, interleave fair lasers and frozen roar/WASD, and visibly counterattack for three-hit clears without stalled encounters.
- [ ] Actual runtime integration preserves earlier completed Tasks and existing guest/admin/aircraft behavior.
- [ ] Specified validation passes; evidence recorded below.

## Validation
- `npx vitest run tests/game/boss.test.js tests/game/boss-attacks.test.js tests/game/boss-signatures.test.js tests/game/laser-safety.test.js tests/game/game-engine.test.js` — passes

## Commit Message
```text
feat(combat): add boss signatures and sequenced laser challenges

Plan: 2026-10-28-boss-combat-evolution
Phase: P01-gameplay-integration
Task: T02-boss-combat

- Make six boss identities fire real dodge hazards, interleave fair lasers and frozen roar/WASD, and visibly counterattack for three-hit clears without stalled encounters.
- Validate actual state transitions and regression boundaries
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

