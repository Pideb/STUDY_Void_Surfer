# Task: T04 Stage Rendering

## Status: pending

## Goal

엔진 snapshot의 stage/aircraft/boss attack 상태를 기존 960x540 Canvas 렌더러에 연결한다. 여섯 배경은 전체 화면을 채우고, 확정된 횡스크롤 방향과 테마별 시각 언어를 유지하며, 애니메이션 효과가 실제 충돌 판정을 바꾸지 않게 한다.

## Decision Summary

- 배경은 CRYSTAL GATES, INDUSTRIAL VOID, SIGNAL MONOLITHS, GRAVITY WELL, ABYSSAL BEAST, SOLAR FORGE 여섯 테마 모두 사용한다.
- 플레이어는 왼쪽, 보스는 오른쪽에 읽히고, 위협은 오른쪽에서 왼쪽으로 이동한다.
- 특수벽은 얇고 거의 직선인 기본 실루엣, 일렁임은 표면 효과만 허용한다. 모든 기체는 공통 히트박스 안에 외형을 그린다.
- WARNING/BOSS 배경 오버레이는 중앙 가독성을 유지하고 BOSS는 어두운 오버레이를 사용한다.

## Implementation

### I01. Theme catalog and full-screen background layers

- Related Files:
  - `src/game/visual-theme.js` :: `VISUAL_THEME`, new `STAGE_VISUAL_THEMES`
  - `src/game/renderer.js` :: `drawStageBackground`, `drawBackgroundTransition`, `drawStageAtmosphere`; modify
  - `tests/game/renderer.test.js` :: extend

#### Details

- Add one immutable visual definition per stage with `background`, `bossBackground`, `primary`, `accent`, `obstacle`, `specialObstacle`, `projectile`, `laser`, `boss`, and `particleStyle` fields.
- `drawStageBackground(ctx, stage, elapsedSeconds, mode)` must cover the full world rectangle; no fixed center hole, white panel, or opaque gameplay corridor is allowed.
- `drawBackgroundTransition(ctx, transition, elapsedSeconds)` renders outgoing and incoming layers simultaneously with clamped alpha progress and interpolated palette/particle/edge energy. If transition is null, render only the current layer.
- Normal uses the stage background; WARNING adds red atmospheric tint/particles; BOSS uses the stage boss background and dark overlay without making the player, safe gap, or projectile telegraph invisible.

### I02. Aircraft, obstacle, and stage-hazard silhouettes

- Related Files:
  - `src/game/renderer.js` :: `drawShip`, `drawObstacle`, new `drawBoss`, `drawProjectile`, `drawLaser`, `drawChallengeEffects`
  - `src/game/visual-theme.js` :: aircraft/obstacle/hazard geometry definitions
  - `tests/game/renderer.test.js` :: new calls/geometry assertions

#### Details

- Render `default` as compact cyan-contour triangle, `velocity` as slim cyan-rim/magenta-energy aircraft, and `aegis` as broad amber armored aircraft. All are centered at the same `player.x/y` and use the same collision bounds.
- Render the three existing obstacle styles and three new styles using the stage style key. Special walls remain thin with a fixed gap/timing geometry; surface wobble is derived from `visualSeed` and never modifies `gapCenter`, `gapHeight`, or collision width.
- Render boss profiles on the right side: crystal guardian, industrial factory/mech, signal monolith, gravity black hole, abyssal leviathan, and solar forge machine. Keep silhouettes readable at 960x540.
- Render direct and parabolic projectile dotted telegraphs during charge, a visible straight return path after reflection, boss hit flash/recoil, single random-Y laser, and quarter-screen safe-zone cue.

### I03. Visual effect lifetime and regression boundaries

- Related Files:
  - `src/game/renderer.js` :: rendering order and effect cleanup; modify
  - `src/game/game-engine.js` :: snapshot effect fields only if absent; modify
  - `tests/game/renderer.test.js` :: effect visibility/lifetime tests

#### Details

- Render order: background layers → stage particles → obstacles/laser → projectiles/telegraphs → boss → dash trail/player → warning/BOSS atmosphere → challenge overlay/UI cues.
- Break fragments, dash trail, boss hit, ink, and glitch effects use snapshot remaining/duration values and disappear at zero; no renderer-owned gameplay mutation is allowed.
- Passed walls remain visible until `x + width < 0`; rendering must not remove or hide them early.

## Acceptance Criteria

- [ ] Every stage background fills the viewport and transitions without a hard cut.
- [ ] All three aircraft are visually distinct but have identical hitbox geometry.
- [ ] Stage-specific boss, projectile, laser, ordinary wall, and special wall styles are visible and readable.
- [ ] Boss overlay is dark but not opaque enough to hide player or telegraphs.
- [ ] Visual wobble/effects never alter collision geometry or score behavior.

## Validation

- `npm run test -- --run tests/game/renderer.test.js tests/game/obstacles.test.js tests/game/collision.test.js`
- `npm run build`

## Commit Message

```text
feat(render): add six-stage visual language and boss hazards

Plan: 2026-09-23-void-surfer-expansion
Phase: P02-visual-ui-audio
Task: T04-stage-rendering

- render full-screen stage backgrounds and smooth transitions
- render aircraft, bosses, projectiles, lasers, and fixed-geometry walls
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
