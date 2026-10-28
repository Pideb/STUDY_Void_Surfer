# Task: T01 Dash and Projectile Lifecycle

## Status: done

## Goal
Make each fresh Space press activate at most one dash with a visible1s cooldown, protect only projectile contacts for0.6s, and let missed/immune shots leave the viewport naturally.

## Decision Summary
- D01..D04: cooldown begins on accepted activation, not effect completion; no buffering/retrigger during cooldown. Normal walls/lasers/boundaries remain lethal. Stage artwork and targeted special timing stay unchanged.

## Implementation
### I01. Dash state and contact lifetime
- Related Files: `src/game/constants.js`, `player.js`, `collision.js`, `game-engine.js`, `boss-signatures.js`; modify existing symbols `createPlayer`, `advanceDash`, `dash`, `updateBossAttack`, `updateSignatureAttack`, `moveProjectile`, `pointAtX`.
#### Details
- **Signatures & Types**:
```typescript
Player.dashCooldownRemainingSeconds: number; // default0, nonnegative, cloned in snapshots
DASH_COOLDOWN_SECONDS = 1;
updateSignatureAttack(attack: Volley, deltaSeconds: number, player?: Player|null, options?: { projectileImmune?: boolean }): Volley;
```
- **Data & Schema Fields**: add only cooldown to Player; existing dash duration0.6, targetId/kind preserved. Attack/shot `hitPlayer` remains a real unprotected-contact latch; immunity must never leave a later lethal latch. Shot previous position/telegraphPoints remain numeric detached snapshots.
- **Execution Flow / Logic**:
  1. Reject dash outside playing, death, active challenge, or cooldown>epsilon; roar rejection remains until T03. Only accepted calls set cooldown1 and existing dash state. Rejected attempts returnfalse before changing sounds/effects/barriers.
  2. Advance cooldown independently of `isDashing` in normal simulation; pause and challenge return before it. Restart uses fresh createPlayer. Evaluate projectile immunity for the actual frame interval before expiration: a swept contact must compare its contact time with remaining dash time, not grant the whole frame beyond expiry. A simple options field for remaining protected seconds may extend the above optional interface if needed; document it and test boundary contacts.
  3. Extend `pointAtX` beyond the original target using the last announced segment's tangent. Retire only after projectile body fully exits left/top/bottom/right boundaries. Compute swept segment contact/edge ordering; never discard a collision while crossing the edge. Guard malformed/nonfinite deltas through existing checks.
  4. Immune contact continues movement without setting hitPlayer or resolving at player; unprotected contact preserves death behavior. Increase finite volley duration bound to actual offscreen lifetime so scheduler cannot use stale shorter estimates. Existing stage patterns and charge/delays preserved.
### I02. One press and visible cooldown
- Related Files: `src/ui/app-controller.js` key lifecycle/triggerDash, `src/ui/game-hud.js` mobile button only if needed, `src/game/renderer.js` :: `createRenderer` and new `drawDashCooldown`.
#### Details
- **Signatures & Types**: controller-local `spaceHeld:boolean=false`; keydown/keyup and blur handlers installed/removed with existing mount/destroy. Rendering function `drawDashCooldown(ctx, player):void`.
- Track Space presses even when screen/challenge/input focus prevents activation; never activate on repeat or a held-key transition. Release clears latch; blur permits recovery but repeating held events remain rejected. Do not reset the latch just because a cooldown or scene ends. Avoid double pointer/click activation on mobile using existing click-only semantics where already present.
- Ring radius must surround the enlarged rendered ship (roughly40 world px), faint white circumference plus bright clockwise progress from top,2px stroke, after ship/trail/effects so visible. Draw only when cooldown>0 and no death; no full ring at ready state and no rectangular debug box. Preserve Canvas save/restore and reduced-motion behavior.
- Tests: cooldown repeated input cannot extend effect; expires1s,0.6s protection; pause/challenge/restart; trajectory continues behind player; high-delta swept contacts and immunity expiry; keyboard hold across cooldown/challenge/menu/blur and touch duplicate events; renderer ring progression disappears at0. Existing tests expecting immediate repeat calls must simulate fresh release/elapsed time.

## Acceptance Criteria
- [x] Accepted dash starts1s ring; blocked attempts have no effects or buffered action.
- [x] Exactly one activation per physical press on keyboard/touch; lifecycle recovery works.
- [x] Projectile-only immunity has no delayed death; misses/immune shots leave screen with finite completion.

## Validation
- `npx vitest run tests/game/player.test.js tests/game/collision.test.js tests/game/boss-signatures.test.js tests/game/game-engine.test.js tests/game/renderer.test.js tests/integration/mobile-input.test.js tests/ui/app-controller.test.js`
- `git diff --check`

## Commit Message
```text
feat(dash): add cooldown feedback and projectile-only protection

Plan: 2026-10-28-dash-boss-flow-refinements
Phase: P01-runtime
Task: T01-dash-projectiles

- Require a fresh press and display one-second recharge
- Continue missed and immune projectiles offscreen without stale damage
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: ca6a8de
