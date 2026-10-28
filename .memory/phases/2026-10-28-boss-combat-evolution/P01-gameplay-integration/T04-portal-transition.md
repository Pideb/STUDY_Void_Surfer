# Task: T04 Destination portal transition in the actual engine

## Status: done

## Goal
After clearing the current stage boss, approach the matching destination portal, swap scenery under white cover, and resume only new-stage obstacles after reveal.

## Decision Summary
- Implement approved decisions in .memory/decisions/2026-10-27-boss-combat-evolution.md, without reopening accepted art/audio/balance.
- Depends on preceding Tasks. Preserve their public snapshots/interfaces; execute sequentially. No external DB or credentials required.

## Implementation

### I01. Runtime behavior and public contracts
- Related Files: `src/game/game-engine.js::{completeBossIfReady,advanceStage,updateStage,getStageState,update,getSnapshot}`, new `src/game/portal-renderer.js`, `src/game/renderer.js::{drawBackgroundTransition,render}`, game-engine/renderer/portal tests; approved motion review portal.js read-only.

#### Details
- **Signatures & Types**:
```typescript
createPortalTransition({fromKey,toKey,fromStageId,destinationStageId,crossingX,crossingY}): PortalTransition; advancePortalTransition(transition,deltaSeconds,scrollSpeed): PortalTransition; getPortalWhiteAlpha(transition): number; drawPortal(ctx,{transition,destinationBackground,ornamentImage,reducedMotion}): void; drawTransitionOverlay(ctx,{transition,reducedMotion}): void
```
- **Data & Schema Fields**: Transition {kind:'portal',fromKey,toKey,fromStageId,destinationStageId,phase:'lead-in'|'approach'|'white-out'|'hold'|'reveal'|'complete',elapsedSeconds,phaseElapsedSeconds,travelledPixels,portalX,crossingX,crossingY,progress,swapped:boolean}. Engine stage.id stays source until opaque white switch, destinationId explicit; mode/background captured from boss before clear. Separate pending stage index from visible index.
- **Execution Flow / Logic**:
  1. Precondition & Validation: normalize finite inputs, retain existing API defaults and engine state guards. Handle absent optional browser APIs through existing fallbacks.
  2. Core Processing: Replace two-postclear-wall delay with transition after final visible hit; stop spawning immediately, let existing walls continue with their own stageId until clear before portal lead-in, no relabel/removal at player. Approved .45s lead-in, integrate960px travel at actual current wall speed (including changing speed), .20s white brighten/.10s opaquehold/.60s reveal. Use real player crossing coordinates; no preview fixed-craft/autopilot physics. Switch stage identity exactly once under opaque cover; suppress new encounters/spawns through reveal. Resume with at mostone wall and zero accumulatedburst. Render previous background until switch, portal with NEXT-stage ornament/destination scenery, white overlay after all world actors. Port exact accepted ornamentPose and eight overlapping angular masks±.085rad, aperture exclusion, stage-specific accents. Retain original images; decorative no collision. Missing-image fallback keeps portal/transitions. Background leftward scroll stays. Reset/pause reproducible, reduced motion uses opaque dimmer cover so scene switch is still hidden.
  3. Error & Exception Handling: deterministic fallback for missing assets/API, no unhandled promise rejection or permanently paused combat; malformed inputs must not introduce NaN/Infinity. Do not conceal validation failures.
  4. State Transition & Return: expose independent snapshot data; advance engine phases only once; restart/menu clear transient state.

### I02. Verification and regression coverage
- Related Files: tests listed above; modify existing superseded expectations and add focused behavioral tests.
#### Details
Speed integration at240/480/960 and Velocitycap, phase timings/opaque swap, old obstacle stageId unchanged/no newwalls untilreveal, immediate matching next-stageboss aftershuffle, no attacks duringportal, boundedresume/restart/pause; all six NEXT-stage decorations and geometry, overlay layerorder/reduced/fallback. Replace old two-wall/wipe-specific tests with approved portal behavior.

## Acceptance Criteria
- [x] After clearing the current stage boss, approach the matching destination portal, swap scenery under white cover, and resume only new-stage obstacles after reveal.
- [x] Actual runtime integration preserves earlier completed Tasks and existing guest/admin/aircraft behavior.
- [x] Specified validation passes; evidence recorded below.

## Validation
- `npx vitest run tests/game/portal-transition.test.js tests/game/game-engine.test.js tests/game/renderer.test.js tests/game/stages.test.js` — passes
- `npm run build` — passes

## Commit Message
```text
feat(portal): add approved destination transitions after boss clear

Plan: 2026-10-28-boss-combat-evolution
Phase: P01-gameplay-integration
Task: T04-portal-transition

- After clearing the current stage boss, approach the matching destination portal, swap scenery under white cover, and resume only new-stage obstacles after reveal.
- Validate actual state transitions and regression boundaries
```

## Progress
- [x] Implementation complete — actual-speed portal phases, covered stage swap, destination ornaments and bounded wall resume.
- [x] Validation passed — 5 files / 164 tests; production build passed.
- commit: 46dc0cd

