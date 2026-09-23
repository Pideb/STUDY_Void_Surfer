# Task: T05 Aircraft and Boss UI

## Status: pending

## Goal

기체 선택·해금 화면과 보스 전투 HUD를 DOM UI에 연결한다. 메인 메뉴는 카드 패널 없이 HUD COMMAND 구성을 유지하고, 게임 중에는 BOSS HP·스테이지·기체·투사체·레이저·WASD 상태를 즉시 이해할 수 있게 한다.

## Decision Summary

- 메인 메뉴는 왼쪽 우주/기체 연출과 오른쪽 직접 메뉴를 사용하며, 로그아웃은 아래에 별도 배치한다.
- 행거는 전체 화면에서 세 기체 외형·스탯·선택 상태·해금 점수를 보여주며 잠긴 기체는 어둡게 표시한다.
- 리더보드는 하나를 유지하고 각 기록에 기체 이름/아이콘을 함께 표시한다.
- WASD 실패는 게임 오버가 아니며, 화면 일부 잉크 또는 네온 글리치 효과를 HUD가 표시한다.

## Implementation

### I01. Main-menu and hangar state flow

- Related Files:
  - `src/ui/screens.js` :: `renderMenuScreen`, new `renderHangarScreen`
  - `src/ui/app-controller.js` :: `state.selectedAircraftId`, `state.accountBestScore`, `state.unlockedAircraftIds`, `HANGAR`/`SELECT_AIRCRAFT` dispatch cases
  - `src/styles.css` :: `.hangar-screen`, `.aircraft-option`, `.aircraft-option.is-locked`, `.aircraft-option.is-selected`
  - `tests/ui/screens.test.js`, `tests/ui/app-controller.test.js` :: extend

#### Details

- Menu actions remain direct buttons with no surrounding card panel. Add a `기체 선택` action and keep mute as icon-only speaker/speaker-off control; logout remains visually separated below primary actions.
- `renderHangarScreen({ aircraft, selectedAircraftId, bestScore, error }, handlers)` renders all catalog entries with semantic buttons, `aria-pressed`, lock reason, performance values, and `뒤로가기`.
- Dispatch `OPEN_HANGAR` from menu, `SELECT_AIRCRAFT` only when the item is unlocked, and `RETURN_TO_MENU` without mutating the selected choice on cancel. Starting a run passes the selected ID into `gameEngine.setAircraft`.
- If best-score loading fails, display the default aircraft as available and show a non-blocking status message; never expose a locked aircraft as selectable.

### I02. Gameplay HUD and challenge overlay

- Related Files:
  - `src/ui/game-hud.js` :: `createGameHud`, new HUD sections and overlay updates
  - `src/ui/components.js` :: status/aria helpers if required
  - `src/styles.css` :: HUD, boss gauge, telegraph, challenge overlay, ink/glitch effects
  - `tests/ui/accessibility.test.js`, `tests/ui/game-hud.test.js` :: new/extend

#### Details

- Add stage name, aircraft name/icon, and a `BOSS HP` segmented gauge when `snapshot.boss` is active. Gauge segments equal `maxHp`; update `aria-valuenow`, `aria-valuemax`, and readable text.
- Display projectile charge/trajectory cue, laser safe-zone cue, and reflection result using `aria-live` status without stealing focus from gameplay.
- When `snapshot.challenge.active`, show the full WASD sequence centered, cursor progress, and remaining seconds over a dark translucent but still visible playfield. Only keyboard `KeyW/KeyA/KeyS/KeyD` advances it; Space/click must not submit a challenge key.
- On challenge failure render either a bounded ink-splatter or neon-glitch effect class based on snapshot effect kind, then remove it when the remaining timer expires.
- Desktop playfield must not show an in-play click/space button; retain only the existing mobile-specific control behavior.

## Acceptance Criteria

- [ ] Menu, hangar, and logout layout matches the approved HUD direction with no main-menu card panel.
- [ ] Locked aircraft cannot be selected and selected aircraft persists into the next run.
- [ ] Boss HP and stage/aircraft identity are visible and accessible.
- [ ] WASD overlay freezes input scope correctly and failure resumes play without game over.
- [ ] Mobile controls remain available only where intended; desktop remains button-free in the playfield.

## Validation

- `npm run test -- --run tests/ui/screens.test.js tests/ui/app-controller.test.js tests/ui/accessibility.test.js tests/ui/game-hud.test.js`
- `npm run build`

## Commit Message

```text
feat(ui): add aircraft hangar and boss combat HUD

Plan: 2026-09-23-void-surfer-expansion
Phase: P02-visual-ui-audio
Task: T05-aircraft-and-boss-ui

- add account-score aircraft hangar selection flow
- expose boss health, stage identity, telegraphs, and WASD challenge feedback
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
