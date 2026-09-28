# Task: T04 Stage-Owned Obstacles

## Status: pending

## Goal

Make the existing 1.5-second right-to-left stage transition visually continuous while active obstacles retain the art of their spawn stage and newly spawned obstacles use the new stage art.

## Implementation

### I01. Persist visual stage ownership

- Related Files:
  - `src/game/obstacles.js` :: `createObstacle`; add nullable `stageId` input and return field without affecting collision data.
  - `src/game/game-engine.js` :: `spawnObstacle`; pass the current stage definition ID into each new obstacle.
  - `tests/game/game-engine.test.js` :: assert obstacle stage ownership across a transition.

#### Details

- `stageId` is a string visual metadata field only.
- Existing obstacle x, width, gapCenter, gapHeight, kind, and motion fields remain unchanged.

### I02. Render per-entity art ownership

- Related Files:
  - `src/game/renderer.js` :: render obstacle stage resolution; use `obstacle.stageId ?? stage.id` for walls and keep background transition independent.
  - `tests/game/renderer.test.js` :: assert old and new obstacle assets are selected simultaneously during transition.

#### Details

- Incoming background still enters from the right and pushes the old background left.
- Never recolor or reassign existing obstacle objects when `stageTransition` changes.

## Acceptance Criteria

- [ ] Existing obstacles keep their original stage asset during transition.
- [ ] Newly spawned obstacles use the incoming/current stage asset.
- [ ] Transition remains 1.5 seconds and does not pause gameplay.

## Validation

- `npm run test -- --run tests/game/game-engine.test.js tests/game/renderer.test.js`

## Commit Message

```text
fix(game): preserve obstacle art across stage transitions

Plan: 2026-09-28-game-visual-assets-and-flow-fixes
Phase: P02-flow-fixes
Task: T04-stage-owned-obstacles

- bind obstacles to their spawn stage
- keep right-to-left scene transition visual-only
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
