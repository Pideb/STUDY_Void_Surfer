# Task: T09 Integration QA

## Status: done

## Goal

브라우저에서 인증·게임·리더보드 경계를 포함한 핵심 사용자 시나리오를 자동·수동으로 검증하고, 반응형·접근성·네트워크 실패 회귀를 방지한다.

## Decision Summary

- 테스트는 외부 Supabase 호출을 mock하고, 실제 연결은 별도 수동 smoke check로 분리한다.
- 게임 코어 순수 테스트, UI controller 테스트, production build 검증을 모두 통과해야 한다.

## Implementation

### I01. 통합 시나리오 테스트

- Related Files:
  - `tests/integration/game-flow.test.js` :: login-to-game-over scenario; new
  - `tests/integration/leaderboard-failure.test.js` :: query failure/retry behavior; new
  - `tests/integration/mobile-input.test.js` :: pointer/virtual SPACE/Pause; new
  - `vitest.config.js` :: integration include/setup 확장; modify

#### Details
- mock auth가 session을 반환하면 menu가 표시되고, tutorial start 후 player input과 fake clock으로 게임 오버까지 진행한다.
- game-over controller는 먼저 action buttons를 만든 뒤 leaderboard promises를 기다리는지 검증한다.
- top query 실패는 retry button만 해당 영역에 만들고 score/restart/menu를 유지하는지 검증한다.
- pointer touch, virtual SPACE, `P`, `Escape`가 동일한 engine 계약에 도달하는지 검증한다.

### I02. 접근성·반응형·정적 검사

- Related Files:
  - `tests/ui/accessibility.test.js` :: label, focus, live region, text escaping; new
  - `src/styles.css` :: reduced-motion, narrow viewport, safe-area rules; modify
  - `README.md` :: local test/build commands; modify

#### Details
- 버튼에 visible label 또는 `aria-label`이 있고, error/banner는 live region으로 전달되는지 검증한다.
- `@media (max-width: 700px)`에서 Canvas와 mobile SPACE가 사라지지 않는지 확인한다. `prefers-reduced-motion`에서는 screen shake와 aggressive animation을 줄인다.
- `npm run test -- --coverage`를 실행할 수 있도록 coverage 설정을 두되, 외부 SDK와 Canvas adapter를 제외하거나 명시적으로 mock한다.

## Acceptance Criteria

- [x] 전체 단위·통합 테스트가 통과한다.
- [x] 로그인 성공/실패, tutorial, play, pause penalty, warning/boss, game-over, retry 시나리오가 테스트된다.
- [x] 모바일 viewport에서 Canvas와 SPACE 버튼이 표시되고 터치 이벤트가 중복 처리되지 않는다.
- [x] 키보드 focus와 live region이 존재하며 사용자 표시 이름이 HTML로 해석되지 않는다.
- [x] `npm run build`가 최종 산출물을 생성한다.

## Validation

- `npm run test -- --run` — 전체 Vitest 통과
- `npm run test -- --coverage` — coverage 실행 성공
- `npm run build` — production build 성공

## Commit Message

```text
test(app): cover authenticated gameplay and responsive failure states

Plan: 2026-09-21-void-surfer
Phase: P03-product-flow-deployment
Task: T09-integration-qa

- add end-to-end style controller scenarios with mocked services
- verify mobile input, accessibility, retry, and reduced-motion behavior
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in git history
