# Task: T02 Menu Presentation

## Status: pending

## Goal

The signed-in menu displays a purpose-built VOID SURFER space scene rather than a prior game-over frame. Tutorial and account controls are clearer: tutorial can return to menu, sound controls use accessible icons, and logout is visually separated from core game actions.

## Decision Summary

- Menu canvas scene uses existing code-native Canvas 2D primitives: star field, soft nebula/depth gradients, and a stationary ship silhouette. No raster asset or network fetch is needed.
- Sound buttons render inline speaker SVGs rather than text, with state-specific `aria-label`s. Logout resides in a lower auxiliary section beneath the main actions.

## Implementation

### I01. Render and select a static menu canvas scene

- Related Files:
  - `src/game/renderer.js` :: new `renderMenuBackground` public renderer method and local menu-scene helpers; modify
  - `src/ui/app-controller.js` :: `paint`, `setScreen` menu handling; modify
  - `tests/game/renderer.test.js` :: menu-canvas draw coverage; modify
  - `tests/ui/app-controller.test.js` :: menu-screen renderer invocation; modify

#### Details

- **Signatures & Types**:
  ```js
  // Returned by createRenderer(canvas)
  {
    resize,
    render(snapshot),
    renderMenuBackground(),
    destroy,
  }
  ```
- **Execution Flow / Logic**:
  1. Add `renderMenuBackground()` to clear the canvas at the world dimensions and draw a static menu composition: the existing dark star field, at least one soft blue/purple radial nebula gradient, a subtle depth path/line treatment, and `drawShip` with a fixed centered-left non-moving ship model.
  2. The menu scene must be deterministic and rendered entirely from Canvas APIs already available in the test spy; it must not use image files, animation loops, or random values per paint.
  3. In the controller's menu branch, call `renderer.renderMenuBackground?.()` immediately before or after replacing menu UI. This must execute whenever the controller reaches menu, including returning from game-over, pause, or tutorial.
  4. Do not call `renderMenuBackground` for login, tutorial, playing, paused, or game-over screens. The playing animation loop remains the sole caller of `renderer.render(snapshot)`.
- **Test Scenarios**:
  - The renderer's menu method clears/fills the canvas and emits scene drawing calls including a ship path.
  - Entering menu causes exactly one menu-background render, while entering tutorial does not add another call.
  - Existing renderer stubs in controller tests can omit the new method without failure through optional chaining.

### I02. Add tutorial exit, icon sound controls, and separated logout layout

- Related Files:
  - `src/ui/components.js` :: reusable `createIconButton` / SVG icon helper; modify
  - `src/ui/screens.js` :: `renderMenuScreen`, `renderTutorialScreen`; modify
  - `src/ui/game-hud.js` :: mute control icon conversion; modify
  - `src/ui/app-controller.js` :: tutorial `menu` handler and handler wiring; modify
  - `src/styles.css` :: icon button, auxiliary logout section, menu spacing; modify
  - `tests/ui/screens.test.js` :: tutorial/menu action behavior; modify
  - `tests/ui/accessibility.test.js` :: accessible icon names and separated logout structure; modify
  - `tests/ui/app-controller.test.js` :: tutorial-to-menu transition and icon mute behavior; modify

#### Details

- **Signatures & Types**:
  ```js
  export function createIconButton({ label, icon, onClick, className });
  // icon is 'volume-on' or 'volume-off'; render a child SVG with aria-hidden="true".
  ```
- **Execution Flow / Logic**:
  1. Add a reusable button factory that creates a `button[type="button"]` with an inline, decorative SVG icon. The button's non-empty accessible name is supplied by `aria-label`, not visible text. Provide distinct path content for `volume-on` (speaker plus sound waves) and `volume-off` (speaker plus slash).
  2. Replace visible text mute toggles in both `renderMenuScreen` and `createGameHud` with the icon factory. Use `aria-label: '음소거'` when currently audible (the click will mute) and `aria-label: '소리 켜기'` when currently muted. Update icon and label each HUD update.
  3. Keep start, controls, and sound in `.screen-actions`. Place logout alone in a new `.account-actions` element appended after that group; style it with a visible top margin, top divider, and muted/text-button treatment. Do not alter the sign-out handler.
  4. Give `renderTutorialScreen` a `handlers.menu` callback and append a secondary “메인 메뉴” button alongside its start button. Wire it in controller `paint()` to `dispatch({ type: 'RETURN_TO_MENU' })`; the existing state guard must allow the event when current screen is `tutorial` as well as `paused`/`game-over`.
  5. Update tutorial copy to explain that Space can always produce a dash trail but only a special-wall timing success grants passage. Preserve the existing lift and pause instructions.
- **Error & Exception Handling**:
  - Icon controls must never rely on icon glyph text for accessibility. If an unknown icon name is supplied, render a safe speaker-outline fallback while preserving the supplied label and click handler.
  - Keep `RETURN_TO_MENU` user/session behavior intact; it must not sign out or submit a score when leaving tutorial.
- **Test Scenarios**:
  - Menu and HUD sound controls contain SVG children, have the correct state label, have no text label, and invoke mute handler.
  - Menu logout is contained in `.account-actions`, not `.screen-actions`; core actions remain together.
  - Tutorial shows both start and main-menu actions. Clicking/dispatching menu returns an authenticated user to menu without starting a game.
  - Existing login, pause, game-over, and mobile input tests retain their behavior.

## Acceptance Criteria

- [ ] Menu entry always replaces any old game frame with a deterministic star/nebula/ship canvas scene.
- [ ] Tutorial has a main-menu exit, sound toggles are accessible icons, and logout is visibly separated from core menu actions.
- [ ] No new behavior breaks authenticated menu transitions, current mute state, or gameplay rendering.

## Validation

- `npm run test -- --run tests/game/renderer.test.js tests/ui/screens.test.js tests/ui/accessibility.test.js tests/ui/app-controller.test.js` — menu scene, controls, and accessibility pass.
- `npm run test -- --run` — full suite passes.
- `npm run build` — production build succeeds.

## Commit Message

```text
feat(ui): add menu scene and clearer controls

Plan: 2026-09-22-menu-dash-feedback
Phase: P01-feedback-and-menu
Task: T02-menu-presentation

- render a dedicated static VOID SURFER menu background
- add accessible sound icons and separated account actions
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
