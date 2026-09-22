# Task: T02 Runtime Feedback Integration

## Status: pending

## Goal

UI 입력과 오디오가 실제 게임 엔진 결과만 반영하게 하여, 일반 벽 SPACE의 오인 피드백을 막고 WARNING/BOSS 상태를 게임 HUD와 접근성 안내에 연결한다.

## Decision Summary

- 일반 벽 SPACE는 효과도, 대시 사운드도 발생시키지 않는다.
- HUD는 엔진 snapshot의 `difficulty`와 `warning`만 사용하며, WARNING/BOSS 진입은 한 번만 알린다.

## Implementation

### I01. 엔진 결과 기반 입력·피드백

- Related Files:
  - `src/ui/app-controller.js` :: `triggerDash`, `renderFrame`; modify
  - `src/ui/game-hud.js` :: existing snapshot banner update; read-only unless warning detail display is needed
  - `tests/ui/app-controller.test.js` :: dash success/failure and warning announcement tests; modify
  - `tests/integration/mobile-input.test.js` :: virtual SPACE normal/special behavior; modify

#### Details

- `triggerDash()` must call `gameEngine.dash()` and play `audioManager.play('dash')` only when it returns `true`.
- Track the last announced difficulty mode (`normal`, `warning`, `boss`) privately in controller. In `renderFrame`, after reading the engine snapshot, transition into `warning` with `audioManager.play('warning')` and Korean polite announcement, or into `boss` with `audioManager.play('boss')` and `BOSS WARNING` announcement. Do not replay the same event every frame.
- Reset the mode tracker on `beginPlaying`, `finishGame`, and return to menu. Preserve existing Canvas renderer and HUD update contracts.

### I02. End-to-end regression

- Related Files:
  - `tests/integration/game-flow.test.js` :: real engine snapshot warning/boss UI assertions; modify
  - `tests/ui/accessibility.test.js` :: live warning announcement remains outside rerender root; modify only if needed

#### Details

- Verify mobile SPACE calls `dash()` but audio plays only on success.
- Verify warning/boss mode transitions play the matching sound once and update the assertive banner; normal frames do not produce these sounds.
- Keep the current immediate game-over action rendering and leaderboard request order unchanged.

## Acceptance Criteria

- [ ] normal-wall/failed SPACE has no dash sound, successful special-wall SPACE has exactly one.
- [ ] WARNING and BOSS transition feedback fires once per entry and HUD banner follows engine snapshot.
- [ ] current keyboard/mobile input and game-over flow tests continue to pass.

## Validation

- `npm run test -- --run tests/ui/app-controller.test.js tests/integration/game-flow.test.js tests/integration/mobile-input.test.js` — input/feedback integration 통과
- `npm run test -- --run` — 전체 회귀 통과
- `npm run build` — production build 성공

## Commit Message

```text
feat(ui): reflect runtime dash and warning feedback

Plan: 2026-09-22-gameplay-runtime-loop
Phase: P01-runtime-loop
Task: T02-runtime-feedback-integration

- play dash feedback only for successful special-wall timing
- announce warning and boss state transitions once per entry
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
