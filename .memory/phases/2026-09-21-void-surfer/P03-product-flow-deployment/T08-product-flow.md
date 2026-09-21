# Task: T08 Product Flow

## Status: pending

## Goal

인증 상태와 게임 엔진·리더보드 서비스를 연결하여 로그인 게이트, 메인 메뉴, 매 게임 튜토리얼, 플레이 화면, WARNING/BOSS UI, 게임 오버 결과 화면의 전체 사용자 흐름을 완성한다.

## Decision Summary

- UI는 한국어이며, 게임 시작 전 튜토리얼을 표시한다. game-over에서 `바로 재시작`만 튜토리얼을 건너뛰고 `메인 메뉴`에서 다시 시작하면 튜토리얼을 보여준다.
- 게임 오버에서는 점수·상위 10명·내 주변 순위·재시도·메인 메뉴를 즉시 보여주며, 리더보드 오류는 재시도 가능한 영역 오류로 표시한다.

## Implementation

### I01. 화면 상태와 로그인 게이트

- Related Files:
  - `src/ui/app-controller.js` :: global state machine and service orchestration; new
  - `src/ui/screens.js` :: menu/login/tutorial/game/pause/game-over screen renderers; new
  - `src/ui/components.js` :: buttons, banners, live messages; new
  - `src/main.js` :: controller boot wiring; modify
  - `tests/ui/app-controller.test.js` :: state transition tests; new

#### Details
- **Signatures & Types**:
  ```javascript
  export function createAppController(deps: {
    authService;
    leaderboardService;
    gameEngine;
    renderer;
    audioManager;
    root: HTMLElement;
  }): { mount(): void; destroy(): void; dispatch(event): void };
  export function renderLoginScreen(model, handlers): HTMLElement;
  export function renderTutorialScreen(model, handlers): HTMLElement;
  export function renderGameOverScreen(model, handlers): HTMLElement;
  ```
- Auth session 없음: `Microsoft 계정으로 로그인` 버튼과 오류/연결 안내만 표시하고 start를 숨긴다. 세션 있음: 표시 이름, `게임 시작`, `조작법`, `음소거`, `로그아웃`을 표시한다.
- login error mapping: CONFIG_MISSING/POPUP_BLOCKED/AUTH_CANCELLED/AUTH_FAILED를 한국어 문구로 표시한다. Supabase 연결 실패는 “연결할 수 없어 게임을 시작할 수 없습니다”와 재시도 버튼을 제공한다.
- `START_GAME_FROM_MENU`는 tutorial로, `RESTART_IMMEDIATE`는 playing으로, `RETURN_TO_MENU`는 menu로 보낸다. menu에서 다시 start하면 tutorial을 반드시 거친다.

### I02. 게임·튜토리얼·일시정지·결과 UI

- Related Files:
  - `src/ui/game-hud.js` :: score, warning/boss banner, pause, mobile SPACE; new
  - `src/ui/leaderboard-view.js` :: top ten and neighborhood tables; new
  - `src/styles.css` :: overlay/modal/game HUD styles; modify
  - `tests/ui/screens.test.js` :: button labels and tutorial/restart behavior; new

#### Details
- 튜토리얼은 한국어로 “클릭/터치: 상승”, “SPACE: 특수 벽 앞 정확한 타이밍에 대시”, “일반 벽에서는 SPACE 무효”, “P/Esc 또는 버튼: 일시정지(-10점)”을 안내한다.
- 플레이 HUD에는 score, pause, mute, mobile `SPACE` 버튼을 표시한다. `SPACE` 버튼은 pointer event의 기본 스크롤을 막고 일반 벽에서는 engine이 무효 처리한다.
- 중앙 `WARNING`/`BOSS WARNING` 배너와 live region 상태 문구를 game snapshot의 warning/boss flag와 동기화한다.
- game-over 진입 직후 score와 재시작/메인 메뉴 버튼을 먼저 paint한 뒤 submit/query를 시작한다. 리더보드 성공 시 top ten과 current-player neighborhood를 표시하고 current row를 강조한다. 실패 시 “불러오지 못했습니다”와 “다시 시도”만 해당 영역에 표시한다.
- 이름과 리더보드 데이터는 DOM textContent로 렌더링하고, `aria-live=polite`, 버튼 accessible name, 키보드 focus 순서를 보장한다.

## Acceptance Criteria

- [ ] 로그인하지 않은 사용자는 게임을 시작할 수 없고 오류 상태를 볼 수 있다.
- [ ] tutorial → playing, game-over immediate restart, game-over → menu → tutorial 흐름이 테스트된다.
- [ ] 게임 오버에서 score와 두 액션 버튼이 리더보드 네트워크 응답보다 먼저 보인다.
- [ ] top 10, 주변 순위, current row, retry error 상태가 한국어로 표시된다.
- [ ] 모바일 SPACE와 mute/logout/pause 버튼이 존재하고 keyboard focus로 접근 가능하다.

## Validation

- `npm run test -- --run tests/ui/app-controller.test.js tests/ui/screens.test.js` — 상태·문구·오류 화면 통과
- `npm run build` — UI 통합 build 성공

## Commit Message

```text
feat(ui): connect auth gameplay tutorial and game over flow

Plan: 2026-09-21-void-surfer
Phase: P03-product-flow-deployment
Task: T08-product-flow

- add authenticated menu and tutorial state flow
- show immediate game-over actions with top ten and player rank states
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
