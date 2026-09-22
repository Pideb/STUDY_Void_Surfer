# Task: T03 Menu and Controls

## Status: pending

## Goal

Wire the menu canvas scene into navigation and finish responsive, accessible controls: no PC in-play buttons, preserved mobile touch controls, tutorial return to menu, speaker icons for sound, and separated logout.

## Decision Summary

- Desktop hides all `.game-hud` buttons but keeps keyboard play. Mobile at the existing 700px breakpoint restores mute, pause, and touch Space controls.
- Sound uses decorative inline SVG with state-specific accessible labels; logout is isolated below the core menu action group.

## Implementation

### I01. Integrate menu rendering and tutorial/menu navigation

- Related Files:
  - `src/ui/app-controller.js` :: `paint`, tutorial handler wiring, `RETURN_TO_MENU`; modify
  - `src/ui/screens.js` :: `renderTutorialScreen`, `renderMenuScreen`; modify
  - `tests/ui/app-controller.test.js` :: menu-scene and navigation tests; modify
  - `tests/ui/screens.test.js` :: tutorial actions; modify

#### Details

- **Execution Flow / Logic**:
  1. In the authenticated `menu` branch, call `renderer.renderMenuBackground?.()` once when painting menu, then render menu UI. Do not call it on login, tutorial, play, pause, or game-over. Optional chaining keeps legacy test doubles working.
  2. `renderTutorialScreen` receives both `start` and `menu` handlers and displays “출격하기” plus secondary “메인 메뉴”. Controller binds `menu` to `dispatch({ type: 'RETURN_TO_MENU' })`.
  3. Extend `RETURN_TO_MENU` to handle authenticated `tutorial` state in addition to existing return paths. It stops no new state beyond the existing loop cleanup and neither starts a game nor signs out/submits score.
  4. Update tutorial copy: Space always makes a dash trail, but only exact special-wall timing permits a pass. Preserve lift and pause instructions.

### I02. Build icon audio controls and responsive account/HUD layout

- Related Files:
  - `src/ui/components.js` :: reusable accessible icon-button factory; modify
  - `src/ui/game-hud.js` :: mute icon update; modify
  - `src/ui/screens.js` :: menu mute icon and logout grouping; modify
  - `src/styles.css` :: HUD desktop/mobile rules, icon sizing, `account-actions`; modify
  - `tests/ui/accessibility.test.js` :: icon labels and layout classes; modify
  - `tests/integration/mobile-input.test.js` :: mobile control preservation; modify

#### Details

- **Signatures**:
  ```js
  export function createIconButton({ label, icon, onClick, className });
  // icon: 'volume-on' | 'volume-off'; SVG child is aria-hidden="true".
  ```
- **Execution Flow / Logic**:
  1. Factory builds `button[type="button"]` with no visible text and inline SVG. `volume-on` uses a speaker and waves; `volume-off` uses speaker and slash. Both require a non-empty `aria-label`; unknown icon falls back to safe speaker outline.
  2. Menu and HUD show `volume-on`/`aria-label="음소거"` when audio is currently on, and `volume-off`/`aria-label="소리 켜기"` when muted. HUD update replaces icon/label after toggling without adding text.
  3. Keep start, controls, and sound in `.screen-actions`. Put sign-out alone in `.account-actions` after it; CSS gives this section top margin, divider, and muted text treatment.
  4. Default desktop rule hides every `.game-hud button` with `display: none`. In `@media (max-width: 700px)`, restore `.game-hud button { display: initial; pointer-events: auto; }` and keep `.mobile-space-button { display: block; }`. Score/WARNING remain visible on PC. Do not change canvas pointer lift behavior.
- **Test Scenarios**:
  - Menu/HUD audio buttons have decorative SVG, no visible label text, correct `aria-label`, and functional click handler.
  - Logout is not a child of `.screen-actions` and is contained in `.account-actions`.
  - Styles include desktop hide and mobile restore behavior; mobile Space still triggers dash feedback.
  - Authenticated tutorial menu action returns to menu and invokes the menu background renderer exactly once.

## Acceptance Criteria

- [ ] Menu always renders its dedicated canvas backdrop rather than retaining a game-over frame.
- [ ] Tutorial allows menu return; menu sound is icon-only but accessible; logout is visibly isolated.
- [ ] PC playfield has no HUD buttons and mobile keeps all touch actions.

## Validation

- `npm run test -- --run tests/ui/app-controller.test.js tests/ui/screens.test.js tests/ui/accessibility.test.js tests/integration/mobile-input.test.js`
- `npm run test -- --run`
- `npm run build`

## Commit Message

```text
feat(ui): integrate refined menu and responsive controls

Plan: 2026-09-22-gameplay-experience-refinements
Phase: P01-integrated-experience
Task: T03-menu-and-controls

- wire menu scene and tutorial return navigation
- add accessible sound icons and separated responsive controls
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
