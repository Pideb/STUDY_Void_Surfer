# Task: T02 Player and Game Engine

## Status: done

## Goal

플레이어 하강·클릭/터치 상승·화면 경계 실패 규칙과 고정 시간 기반 게임 루프를 구현하여, 외부 서비스 없이 재현 가능한 게임 세션 코어를 만든다.

## Decision Summary

- 플레이어는 네온 우주선이며 입력 1회마다 상승 힘을 1회 받는다.
- 논리 화면은 `960x540`; 게임 시간은 `requestAnimationFrame`의 실제 delta를 clamp하여 테스트 가능하게 한다.

## Implementation

### I01. 플레이어 물리와 입력

- Related Files:
  - `src/game/constants.js` :: 논리 화면·물리·입력 상수; new
  - `src/game/player.js` :: Player 상태와 update/reset; new
  - `src/game/input.js` :: pointer/keyboard/touch 입력 정규화; new
  - `tests/game/player.test.js` :: 물리·경계 테스트; new
  - `tests/game/input.test.js` :: 중복 터치·키 입력 테스트; new

#### Details
- **Signatures & Types**:
  ```javascript
  export function createPlayer(): { x: number; y: number; velocityY: number; width: number; height: number; isDashing: boolean };
  export function applyLift(player): void;
  export function updatePlayer(player, deltaSeconds: number, gravity: number): void;
  export function isOutOfBounds(player, worldHeight: number): boolean;
  export function createInputController(target: EventTarget, onLift: () => void, onSpace: () => void): { destroy(): void };
  ```
- `Player.x`는 초기 `240`, `y`는 논리 화면 중앙, `velocityY`는 `0`, `width/height`는 렌더 충돌과 동일한 값으로 고정한다.
- `applyLift`는 `velocityY = -LIFT_VELOCITY`로 설정하고 누르고 있는 동안 반복 상승하지 않는다.
- `createInputController`는 `pointerdown`을 클릭·터치 상승으로, `keydown`의 `Space`를 대시 입력으로, `P`/`Escape`를 pause 이벤트로 분리한다. `Space`의 `repeat` 입력은 무시한다.

### I02. 세션 상태와 게임 루프

- Related Files:
  - `src/game/game-state.js` :: `menu`, `tutorial`, `playing`, `paused`, `game-over` 상태; new
  - `src/game/game-engine.js` :: 세션 생성·update·pause·resume·종료; new
  - `tests/game/game-engine.test.js` :: 상태 전이·delta clamp·점수 차감 테스트; new

#### Details
- **Signatures & Types**:
  ```javascript
  export function createGameEngine(deps?: { now?: () => number }): {
    start(): void;
    update(nowMs: number): void;
    pause(): { score: number };
    resume(): void;
    stop(reason: string): void;
    getSnapshot(): GameSnapshot;
  };
  export type GameSnapshot = {
    state: 'menu' | 'tutorial' | 'playing' | 'paused' | 'game-over';
    score: number;
    elapsedSeconds: number;
    player: object;
  };
  ```
- `update`의 delta는 0~`MAX_FRAME_DELTA_SECONDS`로 clamp한다. pause 중에는 물리·점수·장애물 이동을 갱신하지 않는다.
- `pause`는 playing 상태에서만 한 번 처리하고 `score = Math.max(0, score - 10)`을 적용한다. 이미 paused/menu/game-over면 중복 차감하지 않는다.
- player가 위·아래 경계에 닿으면 `game-over`로 전환하고 game-over reason을 snapshot에 남긴다.

## Acceptance Criteria

- [ ] 클릭·터치 1회가 상승 1회만 발생시키고 hold 상태에서 반복 상승하지 않는다.
- [ ] gravity가 적용되지 않는 pause 상태에서는 player y와 score가 변하지 않는다.
- [ ] 위·아래 경계 접촉 시 game-over 상태가 된다.
- [ ] pause 1회당 10점 차감, 최저 0점, 중복 pause 차감 없음이 테스트로 보장된다.

## Validation

- `npm run test -- --run tests/game/player.test.js tests/game/input.test.js tests/game/game-engine.test.js` — 물리·입력·상태 전이 통과

## Commit Message

```text
feat(game): add player physics and deterministic game engine

Plan: 2026-09-21-void-surfer
Phase: P01-game-core
Task: T02-player-engine

- add lift, gravity, boundary, and normalized input rules
- add pause penalty and deterministic game session state
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: unavailable — `git` 명령이 현재 환경에 설치되어 있지 않음
