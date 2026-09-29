# Task: T02 Tutorial Copy

## Status: pending

## Goal
Use the requested pre-flight heading and remove the two tutorial details the user no longer wants shown.

## Decision Summary
- Heading must be exactly `출격 전 안내`.
- Remove the BOSS reflection-count sentence and the WASD challenge sentence; retain every other instruction.

## Implementation

### I01. Update tutorial panel text and tests
- Related files:
  - `src/ui/screens.js` :: `renderTutorialScreen` — change heading and remove two entries; modify.
  - `tests/ui/screens.test.js` :: tutorial rendering test — assert new heading and absence of removed copy; modify.
  - `tests/ui/app-controller.test.js` :: tutorial heading expectations — update; modify.
  - `tests/integration/game-flow.test.js` :: tutorial heading expectation — update; modify.

#### Details
- Change `createPanel('출격 전 조작 안내', 'tutorial-screen')` to use `출격 전 안내`.
- Remove exactly these lines from the tutorial copy array:
  - `BOSS 1~4는 3회, 5번째부터는 5회 반사가 필요합니다.`
  - `WASD 챌린지는 별도 도전이며, 성공해도 BOSS에게 피해를 주지 않습니다.`
- Do not remove or alter the remaining guidance, including click, SPACE dash, or pause instructions.
- Update all test expectations that check the old heading. Add negative assertions for the removed tutorial text.

## Acceptance Criteria
- [ ] The tutorial title is `출격 전 안내` everywhere it is rendered.
- [ ] The two specified sentences are absent from the tutorial DOM.
- [ ] Other tutorial instructions and screen flow remain unchanged.

## Validation
- `npm test -- --run tests/ui/screens.test.js tests/ui/app-controller.test.js tests/integration/game-flow.test.js`

## Commit Message
```text
fix(ui): simplify pre-flight guidance

Plan: 2026-09-29-gameplay-final-tweaks
Phase: P01-gameplay-and-viewport
Task: T02-tutorial-copy

- Rename the pre-flight guide heading
- Remove BOSS reflection count and WASD challenge details from the guide
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
