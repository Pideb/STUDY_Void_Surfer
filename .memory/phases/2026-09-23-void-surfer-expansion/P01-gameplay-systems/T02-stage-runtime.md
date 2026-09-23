# Task: T02 Stage Runtime

## Status: pending

## Goal

여섯 개 스테이지 테마를 하나의 결정론적 카탈로그로 만들고, 실행 중 랜덤 순서로 순환시키며, 일반/WARNING/BOSS 배경 상태와 자연스러운 전환 정보를 게임 snapshot에 제공한다.

## Decision Summary

- 테마는 `CRYSTAL_GATES`, `INDUSTRIAL_VOID`, `SIGNAL_MONOLITHS`, `GRAVITY_WELL`, `ABYSSAL_BEAST`, `SOLAR_FORGE` 여섯 가지이며 한 런에서 랜덤 순서로 모두 사용한다.
- 모든 배경은 화면 전체를 채운다. 중앙을 비우는 전용 마스크는 사용하지 않으며, 시인성은 팔레트/입자 밀도로 조절한다.
- 일반과 WARNING은 현재 스테이지 배경을 사용하고, BOSS는 같은 테마의 BOSS atmosphere variant를 사용한다.
- 전환은 즉시 교체하지 않고 crossfade와 팔레트/입자/edge-energy 보간을 사용한다.

## Implementation

### I01. Stage catalog and shuffle-bag

- Related Files:
  - `src/game/stages.js` :: new `STAGE_IDS`, `STAGE_CATALOG`, `createStageShuffleBag`, `getStageDefinition`
  - `src/game/constants.js` :: `STAGE_ROTATION_SECONDS = 30`, `STAGE_TRANSITION_SECONDS = 0.8`
  - `tests/game/stages.test.js` :: new

#### Details

- **StageDefinition fields**:
  ```js
  {
    id: 'crystal-gates' | 'industrial-void' | 'signal-monoliths' | 'gravity-well' | 'abyssal-beast' | 'solar-forge',
    name: string,
    backgroundKey: string,
    bossBackgroundKey: string,
    obstacleStyle: string,
    specialObstacleStyle: string,
    bossStyle: string,
    projectileStyle: string,
    laserStyle: string,
    palette: { background: string, primary: string, accent: string, warning: string },
  }
  ```
- `createStageShuffleBag(rng)` returns a permutation of all six IDs, using the injected RNG and preventing a direct repeat at a bag boundary when at least two IDs exist.
- Keep the catalog pure and independent of Canvas; invalid IDs fall back to `crystal-gates`.

### I02. Integrate stage timing and snapshot state

- Related Files:
  - `src/game/game-engine.js` :: stage state, rotation, `start`, `update`, `getSnapshot`; modify
  - `src/game/difficulty.js` :: expose current mode without changing existing WARNING cadence; modify only if needed
  - `tests/game/game-engine.test.js` :: stage rotation and mode tests

#### Details

- Add engine state `{ stageOrder, stageIndex, stageElapsedSeconds, stageId, stageTransition }`.
- On `start()`, generate one six-item shuffle bag, select index `0`, and reset elapsed/transition state. Rotate after exactly `STAGE_ROTATION_SECONDS` of playing time; do not rotate while paused, in the WASD challenge, or during game over.
- **Snapshot fields**:
  ```js
  stage: {
    id: string,
    name: string,
    index: number,
    order: string[],
    elapsedSeconds: number,
    mode: 'normal' | 'warning' | 'boss',
    backgroundKey: string,
    bossBackgroundKey: string,
    transition: { fromKey: string | null, toKey: string, progress: number, durationSeconds: number } | null,
  }
  ```
- On WARNING entry, keep the current normal background and change only atmosphere flags. On BOSS entry set `mode: 'boss'` and use `bossBackgroundKey`; after BOSS, return to the stage normal background without changing stage index.
- A rotation creates `{ fromKey, toKey, progress: 0 }`; progress advances by `delta / STAGE_TRANSITION_SECONDS`, clamps at `1`, then clears. The renderer must be able to render both layers during the transition.

## Acceptance Criteria

- [ ] Every run uses all six stage IDs exactly once before reshuffling.
- [ ] Stage rotation is frozen by pause/challenge and resumes with remaining time.
- [ ] BOSS always exposes the stage-specific boss background key.
- [ ] Transition data reaches `getSnapshot()` and never causes a one-frame hard cut.
- [ ] Existing WARNING score cadence and obstacle generation remain unchanged.

## Validation

- `npm run test -- --run tests/game/stages.test.js tests/game/game-engine.test.js tests/game/difficulty.test.js`
- `npm run build`

## Commit Message

```text
feat(game): add randomized stage runtime and transitions

Plan: 2026-09-23-void-surfer-expansion
Phase: P01-gameplay-systems
Task: T02-stage-runtime

- add six-theme shuffle bag and stage rotation state
- expose normal, warning, and boss background variants in snapshots
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
