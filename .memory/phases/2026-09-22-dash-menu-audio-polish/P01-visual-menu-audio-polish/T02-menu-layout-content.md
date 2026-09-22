# Task: T02 Main Menu Layout and Content

## Status: done

## Goal

Remove the heavy menu card so the canvas backdrop can carry the presentation. Keep the game title and personalized welcome on the left, primary actions on the right, and logout deliberately separated below them. The menu must no longer expose a controls/tutorial entry point.

## Decision Summary

- The authenticated menu is a transparent full-width overlay, not a nested `screen-panel` card.
- Show the pilot name in bold with the exact greeting: `{displayName}파일럿, 다시 도전하는 것을 환영합니다.`
- Keep Start and icon-only sound toggle together on the right; place logout below with visibly larger separation.

## Implementation

### I01. Restructure the authenticated menu DOM

- Related Files:
  - `src/ui/screens.js` :: `renderMenuScreen`; modify
  - `src/ui/app-controller.js` :: menu action registration/dispatch in the screen render flow; modify

#### Details

- Change `renderMenuScreen({ displayName, muted })` to return a semantic menu overlay section instead of calling `createPanel`. It must be identifiable with a stable class such as `menu-overlay` and retain an accessible `aria-label` for the VOID SURFER menu.
- Place the title and greeting inside a left-side `menu-brand` region. Render `displayName` inside a semantic `<strong>` and append `파일럿` directly after it with no added whitespace. The complete visible greeting must be `NAME파일럿, 다시 도전하는 것을 환영합니다.` followed by `다시 도전하는 것을 환영합니다.` exactly as decided.
- Place only the `game-start` and `sound-toggle` controls inside a right-side `menu-actions` region. Continue using `createIconButton` for `sound-toggle`, preserving the existing speaker and muted-speaker accessible labels and `aria-pressed` behaviour.
- Remove the controls/tutorial button and its `data-action` from this menu. Do not remove the tutorial-screen route itself; it remains valid if another in-game route invokes it.
- Keep `logout` in a separate `account-actions` region after the primary row. Its `data-action="logout"` and controller behaviour must remain unchanged.
- Remove only the obsolete menu `controls` listener/handler from the app controller. Start, sound, logout, and all non-menu routes must preserve their current action behaviour.

### I02. Style the transparent desktop and responsive mobile layout

- Related Files:
  - `src/styles.css` :: menu layout rules including `.menu-overlay`, `.menu-brand`, `.menu-actions`, and `.account-actions`; modify

#### Details

- Add menu-specific layout rules that use a transparent background: no card border, backdrop, panel fill, or box shadow around the menu content.
- At desktop widths, arrange the brand on the left and primary actions on the right in one content row. Keep the title and greeting left-aligned; stack the Start and sound icon actions with intentional spacing on the right.
- Make `.account-actions` span below the primary row and add a clear vertical gap larger than the gap between primary controls. Logout must look separate from normal game actions without becoming inaccessible.
- At the existing mobile breakpoint, collapse to one column, preserve logical keyboard/DOM order, retain touch target sizes, and make actions comfortably tappable. Do not reintroduce desktop play-screen controls that are intentionally hidden by the existing responsive rules.
- Reuse existing button tokens and focus-visible styles rather than duplicating button primitives.

### I03. Update UI and controller regression tests

- Related Files:
  - `tests/ui/screens.test.js` :: `renderMenuScreen` expectations; modify
  - `tests/ui/accessibility.test.js` :: menu accessible-control assertions; modify
  - `tests/ui/app-controller.test.js` :: menu event wiring assertions; modify if the current tests cover the removed control handler

#### Details

- Assert that the rendered menu has no `.screen-panel` wrapper, has the transparent menu-overlay structure, includes a bold display name, and contains the exact updated Korean greeting.
- Assert the main menu does not render a `조작법` control, while Start, sound toggle, and logout remain present and accessible.
- Assert the controller does not attempt to bind or dispatch the removed menu controls action; preserve tests for Start, mute, and logout behaviour.

## Acceptance Criteria

- [ ] The menu no longer appears inside a card/panel, and its primary content is balanced between left brand and right actions on desktop.
- [ ] The pilot name is bold and the greeting uses the exact updated wording with no space before `파일럿`.
- [ ] The controls entry is absent; sound remains icon-only, and logout is visibly separated below primary actions.
- [ ] Mobile menu interaction and existing gameplay HUD responsiveness remain intact.

## Validation

- `npm run test -- --run tests/ui/screens.test.js tests/ui/accessibility.test.js tests/ui/app-controller.test.js` - menu and controller regression tests pass.
- `npm run test -- --run` - the complete test suite passes.
- `npm run build` - production build completes without errors.

## Commit Message

```text
feat(ui): streamline main menu layout

Plan: 2026-09-22-dash-menu-audio-polish
Phase: P01-visual-menu-audio-polish
Task: T02-menu-layout-content

- remove the menu card and obsolete controls entry
- strengthen the pilot greeting and separate account actions
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending
