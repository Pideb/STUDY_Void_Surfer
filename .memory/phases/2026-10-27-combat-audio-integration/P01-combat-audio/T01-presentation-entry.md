# Task: T01 HP countdown, shock ring and boss arrival

## Status: done

## Goal
HP countdown, shock ring and boss arrival; apply the approved combat/audio review with deterministic state and regression coverage.

## Decision Summary
User approved all previews and requested autonomous continuation. Existing laser fairness and scoring rules remain in force. Implementation baselines are recorded in the decision document.

## Implementation
### I01. HP and dash presentation
- `src/ui/game-hud.js::update`: label BOSS HP, accessible progressbar label boss health; maxHp default3, hp clamped0..max; render remaining active segments and text `hp / maxHp`. Failures do not remove HP.
- `src/game/renderer.js`: export `drawDashShockRing(ctx,player,theme)`; all dashes show a brief white/cyan expanding broken oval and short radial sparks around hull, visually distinct from retained curved exhaust. Reuse current dash clock; no hitbox rectangle, no shield/collision changes. Special success retains its wall-local destruction effect.
- `tests/ui/game-hud.test.js`, `tests/game/renderer.test.js`: countdown3/2/1/0, all-dash ring and normal trail unchanged, Canvas state restoration.

### I02. Boss entrance state
- `src/game/constants.js`: BOSS_ENTRANCE_SECONDS=1.
- `src/game/boss.js::createBossEncounter`: `entranceDurationSeconds:number=1`, `entranceRemainingSeconds:number=1`.
- `src/game/game-engine.js`: decrease clock in playing update, freeze in pause/WASD; no new boss walls or attacks while entrance remains. Existing walls move. Begin entrance at boss session creation after1.5s preview; exposure in snapshot via existing spread. Do not change boss HP, score or attack success rules.
- `src/game/renderer.js::drawBoss`: use smoothstep progress to move full sprite from x>=WORLD_WIDTH+200 to existing842. Idle amplitude ramps with entry; draw accents and pattern label with same moving anchor. No sudden end snap, no sprite visible before crossing screen edge.
- `tests/game/game-engine.test.js`: preview?entrance?wave timeline, pause/resume clock and no attack/spawn during entrance. `tests/game/renderer.test.js`: offscreen/intermediate/final sprite geometry.

## Acceptance Criteria
- [x] All behaviors and fields described above implemented.
- [x] Focused regressions pass; no stale async state, paused clocks or collision/render mismatch.
- [x] Production build and whitespace checks pass.

## Validation
- `npm test -- --run tests/ui/game-hud.test.js tests/game/renderer.test.js tests/game/game-engine.test.js`
- `npm run build`
- `git diff --check`

## Commit Message
```text
feat(game): hp countdown, shock ring and boss arrival

Plan: 2026-10-27-combat-audio-integration
Phase: P01-combat-audio
Task: T01-presentation-entry
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- Validation: 86 focused tests, production build and whitespace checks passed.
- commit: `96707d4`
