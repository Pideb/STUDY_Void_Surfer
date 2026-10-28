# Task: T03 Approved assets and articulated boss rendering

## Status: done

## Goal
Deploy the exact approved four replacement bosses/six portal ornaments/six roar sounds and make real-game bosses articulate like the accepted preview.

## Decision Summary
- Implement approved decisions in .memory/decisions/2026-10-27-boss-combat-evolution.md, without reopening accepted art/audio/balance.
- Depends on preceding Tasks. Preserve their public snapshots/interfaces; execute sequentially. No external DB or credentials required.

## Implementation

### I01. Runtime behavior and public contracts
- Related Files: New `scripts/build-combat-assets.mjs`, `src/game/boss-rigs.js`, `src/game/boss-motion.js`, `src/audio/boss-roar-synth.js`; `src/game/visual-assets.js`, `src/game/renderer.js::{drawBoss,drawProjectile,drawChallengeEffects,render}`; production assets and visual/render tests. Read-only approved previews: boss-redesign, boss-animation, portal-destination-ornaments, portal-motion-review.

#### Details
- **Signatures & Types**:
```typescript
prepareBossRig({rig,image,canvasFactory}): PreparedRig|null; getBossPose({animation,idleElapsedSeconds,reducedMotion}): Pose; drawBossRig(ctx,{rig,prepared,pose,box,projectileImage,reducedMotion}): void; drawBossActionEffects(ctx,{rig,pose,box,action,reducedMotion}): void; exported BOSS_RIGS indexed by stageId
```
- **Data & Schema Fields**: PreparedRig {width,height,base,parts:[{canvas,pivot,poly,side,amplitude,open,slide?,lift?,recoil?}]}; Pose {time,charge,fire,roar,hit}. Add portalOrnaments path to each stage manifest (eight-image pack). Four new assets named boss-evolved.png; Industrial/Gravity retain exact existing boss.png. New portal-ornaments.png for all6. Six /assets/audio/roar/{stageId}.wav. Production roar synth exports original approved profiles/synthesize without global/IIFE.
- **Execution Flow / Logic**:
  1. Precondition & Validation: normalize finite inputs, retain existing API defaults and engine state guards. Handle absent optional browser APIs through existing fallbacks.
  2. Core Processing: Copy Crystal/Signal/Abyss/Solar candidate PNGs from approved previews byte-for-byte; do not overwrite original sprites or substitute procedural colors. Copy six approved ornament PNGs and six WAVs with source hashes verified in build script. Generate production normalized rig data from exact approved rigs.js and export approved synth as ES module from preview source, with no .memory browser imports. Cache prepared 768px masks per image, bounded2 rigs; no mask rebuilding per frame; graceful flat-sprite fallback without Canvas/offscreen support. Port exact preview part transforms, jaw/fin/tail deformation, reactor/lens/shutter motion and action envelopes, reduced motion handling. Preserve entrance; use anchored192x128 body instead of stacking old whole-image bob. Use shared box/muzzle/core coordinates for attacks/impacts. Renderer loops volley projectiles, draws each telegraph/body using stage projectile PNG, draws counterattack and roar shockwaves, keeps strong readable player/essential telegraphs through4s ink/glitch. Strengthen penalty coverage but clear player corridor. Tests with mockCanvas need ellipse/clip/rect methods.
  3. Error & Exception Handling: deterministic fallback for missing assets/API, no unhandled promise rejection or permanently paused combat; malformed inputs must not introduce NaN/Infinity. Do not conceal validation failures.
  4. State Transition & Return: expose independent snapshot data; advance engine phases only once; restart/menu clear transient state.

### I02. Verification and regression coverage
- Related Files: tests listed above; modify existing superseded expectations and add focused behavioral tests.
#### Details
Exact artwork hashes versus approved candidates; Industrial/Gravity hash unchanged; six ornament/roar deployedpaths; preload dedupe/failure remains. Rig caching/articulation/time-varying region transforms, fallback and reduced motion; volley telegraph visuals and counterattack/roar. Existing renderer mocks and seven-key manifest expectation updated to eight.

## Acceptance Criteria
- [ ] Deploy the exact approved four replacement bosses/six portal ornaments/six roar sounds and make real-game bosses articulate like the accepted preview.
- [ ] Actual runtime integration preserves earlier completed Tasks and existing guest/admin/aircraft behavior.
- [ ] Specified validation passes; evidence recorded below.

## Validation
- `node scripts/build-combat-assets.mjs` — passes
- `npx vitest run tests/game/visual-assets.test.js tests/game/boss-motion.test.js tests/game/renderer.test.js tests/audio/audio-assets.test.js` — passes
- `npm run build` — passes

## Commit Message
```text
feat(visuals): integrate approved boss art and articulated motion

Plan: 2026-10-28-boss-combat-evolution
Phase: P01-gameplay-integration
Task: T03-approved-assets-motion

- Deploy the exact approved four replacement bosses/six portal ornaments/six roar sounds and make real-game bosses articulate like the accepted preview.
- Validate actual state transitions and regression boundaries
```

## Progress
- [x] Implementation complete — exact approved production assets, bounded articulated-rig cache, volley/counterattack/roar rendering.
- [x] Validation passed — asset builder, 4 files / 86 tests, production build.
- commit: a34ec7d

