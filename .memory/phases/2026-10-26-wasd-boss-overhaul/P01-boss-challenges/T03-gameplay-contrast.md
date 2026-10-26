# Task: T03 Gameplay Contrast

## Status: pending

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
- Image background uses `rgba(2, 6, 18, 0.34)` full-world overlay; procedural background adds equivalent incremental0.1 dark layer after its motifs, with save/restore.
- In render(), move drawStageAtmosphere directly after drawBackgroundTransition and before obstacles/boss/player. Preserve black boss atmosphere and warning red tint, but never darken boss sprites with those overlays.
- Image ship: apply craft.outline shadowBlur8 before drawImage; reset before dash highlight/restore. Boss image globalAlpha1 and existing stage-colored glow. Do not add rectangle borders, hitbox graphics or change dimensions/physics.
- Tests record background/mood full-screen fill operations and sprite draw calls to assert darkness before boss/player in normal/warning/boss and six stage assets; preserve reduced-motion signatures and owned obstacle art during transition. Verify no new hitbox strokeRect.

## Acceptance Criteria
- [ ] Full-scene background a little darker; boss/player preserve foreground brightness.
- [ ] Existing asset size, idle animations, reduced motion, wall ownership and transitions retained.
- [ ] Full regression suite/build passes.

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
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
