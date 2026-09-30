# Task: T02 Admin Test Controls

## Status: pending

## Goal
Provide the designated account with separate admin-mode and invincibility switches for local testing, without changing score display or normal boss progression.

## Decision Summary
- Show the isolated top-left menu admin button only to signed-in `gh.lee@dexconsulting.net`; dialog independently controls admin mode and invincibility.
- Both settings persist through retries until toggled off. Admin-mode runs score normally but client skips score submission. This client check is not a security boundary.

## Implementation

### I01. Admin identity and persistent test settings
- Related Files:
  - `src/ui/app-controller.js` :: state, menu model, game start, game-over submit guard, dispatch; modify
  - `src/ui/screens.js` :: `renderMenuScreen`, new `renderAdminSettingsDialog`; modify
  - `src/game/game-engine.js` :: invincibility state, collision decision points, settings setters; modify
  - `src/styles.css` :: isolated top-left button/dialog styling; modify
  - `tests/ui/app-controller.test.js` :: email gate, persistence, skip write; modify
  - `tests/ui/screens.test.js` :: controls and labels; modify
  - `tests/game/game-engine.test.js` :: fatal exceptions and hit pass-through; modify

#### Details
- **Authorization check**: Normalize `state.user.email` with `trim().toLowerCase()` and compare exactly with `gh.lee@dexconsulting.net`. Do not enable controls from display name, metadata, or client-supplied query parameters. Hide button and reset active in-memory test settings when any other account/guest is active.
- **Settings model**: Add `adminModeEnabled: boolean` and `invincibilityEnabled: boolean`, stored in `localStorage` key `void-surfer:admin-settings:v1` only for the exact designated account. Validate version and booleans; default both false. Persist across retries and reloads for that account; clear active state on sign-out.
- **Menu/dialog**: Render small, separate top-left `관리자 모드` action only for the designated account. It opens a labelled dialog with independent accessible switches `관리자 모드` and `기체 무적`, plus close action. Keyboard focus is contained/restored and Escape closes. Guest and other accounts never render the action.
- **Game engine integration**: Add explicit `setInvincibilityEnabled(boolean)` (or equivalent) and include `invincibilityEnabled` in runtime config. In `update`, continue treating world boundary as fatal. When invincible, suppress wall, laser, and actual incoming projectile collision deaths; a missed projectile remains a miss and successful reflections still reduce boss HP. Preserve the existing WASD challenge ink/glitch failure feedback and all non-collision progression.
- **Admin score behavior**: At game over, if `state.adminModeEnabled` and designated account is active, do not call `submitBestScore`; set an explicit non-error result state/message `관리자 테스트 점수는 리더보드에 저장되지 않습니다`. Do not alter computed/displayed score or guest record. Admin mode does not imply invincibility; toggles are independent.
- **Security note**: This is only a client-side convenience. Do not represent it as server authorization or trust it to protect leaderboard integrity; a modified browser can bypass client suppression, consistent with the existing client-trusted score system.

### I02. Admin control tests
- Related Files:
  - `tests/ui/app-controller.test.js` :: exact email, case/whitespace normalization, guest/other account gating, retry persistence, admin no-submit; modify
  - `tests/ui/screens.test.js` :: dialog switches and accessible attributes; modify
  - `tests/game/game-engine.test.js` :: invincible wall/laser/projectile and still-fatal boundary/challenge feedback; modify
  - `tests/ui/accessibility.test.js` :: dialog role, labels, focus behavior; modify

#### Details
- Verify settings remain across immediate restart but reset when signed out; admin-only score skip does not set submit failure.
- Verify invincible missed boss projectile advances encounter; successful reflections still damage boss; boundary remains fatal; challenge failure feedback remains visible.

## Acceptance Criteria
- [ ] Only the normalized designated email sees admin controls.
- [ ] Admin/invincibility switches are independent and persist across retries.
- [ ] Admin runs retain their displayed score but do not call global score submission.
- [ ] Invincibility suppresses selected collisions while preserving fatal boundaries, challenge feedback, and boss reflection requirements.
- [ ] Client-only limitations are clearly documented.

## Validation
- `npm test -- --run tests/ui/app-controller.test.js tests/ui/screens.test.js tests/game/game-engine.test.js tests/ui/accessibility.test.js`

## Commit Message
```text
feat(admin): add isolated gameplay test controls

Plan: 2026-09-30-pilot-ranking-admin-guest
Phase: P03-boss-admin
Task: T02-admin-test-controls

- Gate admin controls to the designated account
- Add independent persistent admin and invincibility settings
- Keep test runs out of the leaderboard without changing displayed score
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
