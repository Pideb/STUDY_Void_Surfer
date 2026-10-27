# Task: T02 Combined gap and dash-barrier walls

## Status: done

## Goal
Combined gap and dash-barrier walls; apply the approved combat/audio review with deterministic state and regression coverage.

## Decision Summary
User approved all previews and requested autonomous continuation. Existing laser fairness and scoring rules remain in force. Implementation baselines are recorded in the decision document.

## Implementation
### I01. Hybrid geometry
- `src/game/obstacles.js`: kind union normal|special|hybrid; hybrid width72, stationary gap. New `isDashObstacle(obstacle):boolean` and `getDashBarrierBounds(obstacle):{x:number,width:number}`; special uses full24 width at x; hybrid uses24 centered inside72 wall width. `barrierBroken:boolean=false` for hybrid, timing-guide flag accepts both.
- `src/game/collision.js::intersectsPlayerObstacle`: hybrid normal upper/lower solids always collide, even during dash; inner barrier collides only horizontally at its own bounds and while unbroken/untargeted. Targeted successful dash does not make other walls safe. Normal and standalone special rules unchanged.
- `src/game/game-engine.js`: after first boss clear, half of existing special choices become hybrid. Keep special probability and forced boss two-normal / three-special minima; use isDashObstacle for counters, pending sets, cooldowns and dash selection. Use barrier X for timing; require player inside gap before accepting hybrid dash. Break locally at player Y; no extra points. Laser scheduling treats hybrid as a dash obstacle and protects any opening when applicable, never overlapping a pending barrier.
- `src/game/renderer.js::drawObstacle`: render normal wall using its original stage asset; inside gap clip and render existing special art at centered24px barrier, no graphics outside opening. Render local break by existing effect, then retain destroyed opening after effect. Timing guide anchored to actual barrier X; existing early-guide duration retained.
- Meaningful regressions in `tests/game/{obstacles,collision,game-engine,renderer,laser-safety}.test.js`: top/bottom solids lethal during targeted dash; barrier intact/lethal, correct timed dash, no guide offset; first-boss gating, seeded repeated boss clears with mixed kinds and laser gaps safe.

## Acceptance Criteria
- [x] All behaviors and fields described above implemented.
- [x] Focused regressions pass; no stale async state, paused clocks or collision/render mismatch.
- [x] Production build and whitespace checks pass.

## Validation
- `npm test -- --run tests/game/obstacles.test.js tests/game/collision.test.js tests/game/game-engine.test.js tests/game/renderer.test.js tests/game/laser-safety.test.js`
- `npm run build`
- `git diff --check`

## Commit Message
```text
feat(game): combined gap and dash-barrier walls

Plan: 2026-10-27-combat-audio-integration
Phase: P01-combat-audio
Task: T02-hybrid-walls
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- Validation: 104 focused tests and build passed, including 20 seeded boss clears.
- `barrierBreakY:number|null` retains local break geometry after its transient effect.
- commit: `2ff2f14`
