# Task: T05 HUD and Visual Clarity

## Status: done

## Goal
Actual HUD uses approved80px reactor, global safe/danger graphics are obvious, and only approved clutter text is removed.

## Decision Summary
- D08,D11,D13. Preserve >> 가속 / << 감속 unchanged; keep one functional WASD sequence/time and control labels. No SAFE/DANGER/countdown text despite historical prototype labels.

## Implementation
### I01. Reactor UI
- Related Files: `src/ui/game-hud.js` weapon HUD DOM/update; `src/styles.css`; `src/game/renderer.js` redundant text rendering — modify.
- Use inline SVG or CSS for bottom-center80-world-pixel arc with270-ish-degree track/progress, ticks, charge percentage/READY/fire state and compact Shift/Ctrl label; match selected preview and actual10s weapon state, not decorative animation.
- Scale with viewport while retaining readable phone labels and no offscreen content; preserve existing touch fire/space controls and desktop hidden controls. Keep accessible progress semantics and existing testable state.
- Remove lower renderer BOSS:<pattern>, HUD enemy-laser combat sentences, WASD INPUT SEQUENCE/순서대로 입력 headings and redundant canvas key copy, leaving DOM letters/time/touch inputs.
- Keep score, player weapon status, WARNING/BOSS entrance notices, BOSS HP; keep speed words AND symbols. No cleanup of menus/preflight/pause/results or baked art.

### I02. Global laser graphics
- Related Files: `src/game/laser-renderer.js::safeLane/drawLaser` — modify.
- Warning: pale teal safe fill, bright inset safe boundaries and inward chevrons; red diagonal hatching/tint only on danger quarters. Active: maintain boundaries/hatching without hiding original right-to-left cyan/white light beam or player.
- No visible SAFE, DANGER, LASER ACTIVE, countdown or explanatory text. Real warning>=2s, quarter geometry, sweep/active/fade timing unchanged.
- Clip danger decoration exactly outside safe quarter and keep markings/beam collision consistent at every quarter position. Safe bottom must remain readable around reactor.
- Reduced-motion variant keeps clear static distinction, no large flashing full-screen cover.

### I03. Validation
- `tests/ui/game-hud.test.js`,`tests/ui/app-controller.test.js`,`tests/integration/mobile-input.test.js`,`tests/game/renderer.test.js` — modify; laser safety tests read-only.
- Real charge percent/ready/fire, key labels/mobile buttons, overflow/responsiveness, absent clutter text, visible speed words, exactly one WASD sequence and input timer; no change to challenge handling.
- Draw call ordering/clipping and actual screenshot evidence establish global treatment, without UI labels returning from failure-effect redraw path.

## Acceptance Criteria
- [x] Reactor matches80px selected design; approved text set only.
- [x] Global safe/danger clear with no unapproved wording or timing/collision change.

## Validation
- `npm test -- --run tests/ui/game-hud.test.js tests/ui/app-controller.test.js tests/integration/mobile-input.test.js tests/game/renderer.test.js tests/game/laser-safety.test.js`
- `git diff --check`

## Commit Message
```text
feat(ui): add reactor charge HUD and simplify combat text

Plan: 2026-10-29-boss-motion-aim-patterns
Phase: P01-runtime
Task: T05-hud-and-clarity

- Use the approved reactor and distinct global-laser danger treatment
- Remove only the confirmed clutter while preserving functional cues
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 61a5bb9
