# Task: T04 Admin Hitbox and Full-Height Portal

## Status: done

## Goal
Display accurate collision bounds only through the authorized admin option and make the portal accessible at every legal flight height without tracking the player.

## Decision Summary
- D05: designated account + admin mode, separate default-off visual option; no collision/score changes. D09: central fixedY, full-height opening, same horizontal approach and exact ornaments/white-out flow.

## Implementation
### I01. Debug visualization
- Related Files: `src/ui/app-controller.js` :: admin defaults/read/persist/set/auth reset/renderFrame; `src/ui/screens.js` :: `renderAdminSettingsDialog`; `src/game/collision.js` :: export existing `getPlayerBounds`; `src/game/renderer.js`.
#### Details
- **Signatures & Types**:
```typescript
AdminSettings.showPlayerHitbox:boolean; // defaultfalse, optional in old version1 storage
render(snapshot, options?:{showPlayerHitbox?:boolean}):void;
getPlayerBounds(player):{left:number,right:number,top:number,bottom:number};
```
- Add labelled switch `플레이어 히트박스 표시`; persist in existing local version1 object. Existing invalid old fields still reject safely; missing new field defaultsfalse. Toggle independent from invincibility, effective only `isDesignatedAdmin(user) && adminModeEnabled && showPlayerHitbox`.
- Pass debug display as renderer option, not engine damage flag. Account/logout/mode changes immediately gate it off. Draw stroke at true bounds (width33,height24 for current36-wide front-trim3), save/restore, above ordinary effect layers; never draw automatically on dash. Tests cover old storage and ordinary/guest accounts, modeoff, independent setting and correct coordinates.
### I02. Fixed aperture geometry
- Related Files: `src/game/game-engine.js` :: `updateStage`; `portal-transition.js` :: `createPortalTransition`; `portal-renderer.js` :: `drawPortal`, optional exported geometry helper; tests.
#### Details
- Force crossingY=`WORLD_HEIGHT/2` regardless of incoming playerY; remove per-frame recapture. Preserve actual horizontal960px wall-speed approach/crossingX and phase durations.
- Enlarge the ellipse's inner aperture with enough vertical/horizontal margin for the enlarged ship at all legal heights (e.g. near crossing rx>=90, ry>=WORLD_HEIGHT/2+70, not merely decorative height). Derive one geometry function used for actual clip/glow/ornaments; verify at x offsets covering visible ship and y at boundary-safe extrema. May clip decorative ornaments beyond viewport; preserve their artwork/animation and noncollision role.
- Do not alter player position/velocity or impose an entry collision. Background swap stays under opaque hold, spawn resumes only after reveal. Reduced motion/missing ornament fallbacks remain functional.

## Acceptance Criteria
- [x] Only authorized active admin option shows actual bounds, independent from invincibility.
- [x] Portal never tracks playerY and its actual opening covers all legal flight heights with ship margin.

## Validation
- `npx vitest run tests/ui/app-controller.test.js tests/ui/screens.test.js tests/game/renderer.test.js tests/game/portal-renderer.test.js tests/game/portal-transition.test.js tests/game/game-engine.test.js`
- `git diff --check`

## Commit Message
```text
feat(debug): add admin hitbox display and fixed full-height portal

Plan: 2026-10-28-dash-boss-flow-refinements
Phase: P01-runtime
Task: T04-debug-portal

- Gate accurate hitbox visualization on designated admin mode
- Preserve portal travel while opening every flight height
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
