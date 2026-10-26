# Task: T02 Challenge Controls and Guidance

## Status: done

## Goal
모바일 가로 화면에서도 WASD 챌린지를 해결하고, 안내와 보스 진행 표시가 새로운 클리어 조건과 일치한다.

## Decision Summary
- 터치 W/A/S/D 4버튼은 챌린지 중에만 사용 가능. PC 키보드와 동일한 핸들러 사용.
- 성공 횟수/3을 보여주고 기존 반사 설명 제거.

## Implementation

### I01. Shared Input and HUD
- Related Files:
  - `src/ui/app-controller.js` :: `paint`, `handleKeyDown`, shared challenge input helper; modify
  - `src/ui/game-hud.js` :: `createGameHud`, `update`; modify
  - `src/styles.css` :: challenge controls media queries; modify
- Handler signature `challengeKey(code: 'KeyW'|'KeyA'|'KeyS'|'KeyD'): void`. Controller validates playing + current active challenge and invokes engine handler, refreshes snapshot/HUD so fast consecutive taps don't see stale cursor, and syncs combat audio exactly once. Keyboard uses same helper and ignores held-key auto-repeat. Retain editable element exemption and focused-button WASD support. W/A/S/D clicks never lift or dash.
- HUD creates W/A/S/D buttons once in cross layout (W top, A/S/D below) under sequence; no rebuilding buttons per frame (prevents lost focus/taps). Buttons use click to avoid pointerdown+click duplicate input, are disabled whenever challenge inactive, and group hidden then. Keep Space disabled or hidden during active challenge. Container `pointer-events:auto`, buttons `touch-action:manipulation`.
- CSS default hides touchscreen controls on mouse/fine pointer. Enable for `(pointer: coarse)` or `(hover: none)` independent of viewport width (landscape phones often exceed700px). Scope compact spacing/button sizes for short landscape viewports; minimum44px touch targets. Use explicit `[hidden]` overrides to prevent media CSS exposing controls outside challenges. Preserve keyboard PC route.
- Boss gauge keeps hp/maxHp fields for rendering but label/text communicates `WASD 성공 n / 3`, progressbar aria describes completed challenges consistently. Laser status remains; remove obsolete projectile reflection status from runtime UI guidance.

### I02. Copy and Validation
- Related Files:
  - `src/ui/screens.js` :: `renderTutorialScreen`; modify
  - `tests/ui/game-hud.test.js`, `tests/ui/app-controller.test.js`, `tests/ui/screens.test.js`, `tests/integration/mobile-input.test.js`; modify
- Tutorial replaces reflection condition with `보스전은 WASD 챌린지 3회 성공으로 클리어합니다. 보스전 중에는 점수가 오르지 않으며 클리어 시 10점을 얻습니다.` and indicates key/touch input with5seconds in same entry as needed; do not re-add old variable3/5-reflection rules.
- Tests verify button->controller->engine key and next cursor, exactly one key per click, inactive guard, no lift/dash/pause, keyboard repeat suppression, success/failure cues once, controls disabled/hidden outside challenge, gauge3 success counts and no obsolete tutorial.

## Acceptance Criteria
- [x] PC and touch both route valid single inputs and cannot interact with world during challenge.
- [x] Challenge controls support landscape width>700px via capability media query and disappear when inactive.
- [x] New boss clear guide/gauge and existing HUD/audio paths validated.

## Validation
- `npm test -- --run tests/ui/game-hud.test.js tests/ui/app-controller.test.js tests/ui/screens.test.js tests/integration/mobile-input.test.js`
- `npm run build`
- `git diff --check`

## Commit Message
```text
feat(ui): add touch WASD controls and boss victory guidance

Plan: 2026-10-26-wasd-boss-overhaul
Phase: P01-boss-challenges
Task: T02-challenge-controls
```

## Progress
- [x] 구현 완료
- [x] 검증 통과 — 4 files / 52 tests; production build; diff whitespace check.
- commit: pending

## Implementation Notes
- The mobile integration test drives the real engine to its first challenge, sends all touch clicks without waiting for animation frames, and verifies cursor, successful damage, no world input and one success sound.
- Existing pause could switch the controller to paused while the engine refused pausing an active challenge. Disabled its button and guarded the dispatch as part of keeping challenge inputs consistent.
- Touch capability media queries are width-independent. Actual landscape device layout still needs visual playtesting.
