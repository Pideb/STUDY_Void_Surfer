# Task: T03 Gameplay Contrast

## Status: done

## Goal
배경을 소폭 어둡게 하고 기체/보스 위에 암막이 덮이지 않게 하여 전경 식별을 개선한다.

## Decision Summary
- 배경 이미지 암막0.24→0.34. 분위기 오버레이는 배경 위/배우 아래. 기체색 halo, 보스 이미지 alpha1.
- 기존 아트/배경 이동/오른쪽→왼쪽 스테이지 전환/히트박스 유지.

## Implementation

### I01. Layer Composition
- Related Files:
  - `src/game/renderer.js` :: `drawStageArtwork`, `drawStageBackground`, `drawShip`, `drawBoss`, `createRenderer.render`; modify
  - `tests/game/renderer.test.js`; modify
  - `README.md` :: 게임 진행과 해금/관리자 안내 — 새 보스 규칙과 다른 오래된 보스 진행 설명 동기화; modify
- Image background uses `rgba(2, 6, 18, 0.34)` full-world overlay; procedural background adds equivalent incremental0.1 dark layer after its motifs, with save/restore.
- In render(), move drawStageAtmosphere directly after drawBackgroundTransition and before obstacles/boss/player. Preserve black boss atmosphere and warning red tint, but never darken boss sprites with those overlays.
- Image ship: apply craft.outline shadowBlur8 before drawImage; reset before dash highlight/restore. Boss image globalAlpha1 and existing stage-colored glow. Do not add rectangle borders, hitbox graphics or change dimensions/physics.
- Tests record background/mood full-screen fill operations and sprite draw calls to assert darkness before boss/player in normal/warning/boss and six stage assets; preserve reduced-motion signatures and owned obstacle art during transition. Verify no new hitbox strokeRect.
- Inspection found the README still documents every-fifth WARNING bosses, boss3 optional WASD, boss5 HP/laser unlock and fatal challenge failure. Replace those gameplay paragraphs with the confirmed boss/WASD/score/unlock rules and actual boss-clear stage advance so the new guide matches the app.

## Acceptance Criteria
- [x] Full-scene background a little darker; boss/player preserve foreground brightness.
- [x] Existing asset size, idle animations, reduced motion, wall ownership and transitions retained.
- [x] Full regression suite/build passes.

## Validation
- `npm test -- --run`
- `npm run build`
- `git diff --check`

## Commit Message
```text
fix(render): darken backgrounds and preserve foreground contrast

Plan: 2026-10-26-wasd-boss-overhaul
Phase: P01-boss-challenges
Task: T03-gameplay-contrast
```

## Progress
- [x] 구현 완료
- [x] 검증 통과 — all 30 files / 254 tests; production build; diff whitespace check.
- commit: `f96da12`

## Validation Notes
- Layer-order checks cover normal/WARNING/BOSS for all six stage assets. Existing idle animation, reduced motion, stage ownership and background transition tests pass.
- Existing boss atmosphere was drawn after the boss sprite, dimming it. It now affects the background layer only.
- Gameplay docs synchronized with the new rules; actual mobile device placement and subjective brightness still require playtest feedback.
