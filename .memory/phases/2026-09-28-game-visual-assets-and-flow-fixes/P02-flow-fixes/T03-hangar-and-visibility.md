# Task: T03 Hangar and Visibility

## Status: pending

## Goal

Show real aircraft silhouettes in the hangar, keep logout visible and separated, hide generic collision/hitbox visuals, and retain the first-five-special-wall timing guide.

## Implementation

### I01. Aircraft previews

- Related Files:
  - `src/ui/screens.js` :: `renderHangarScreen`; accept an asset URL or visual preview source on each aircraft model and render an `<img>` inside every option.
  - `src/ui/app-controller.js` :: `getHangarAircraft`; provide the manifest URL for each aircraft.
  - `src/styles.css` :: `.aircraft-preview`; size and contain the transparent sprite inside a stable preview box.
  - `tests/ui/screens.test.js`; `tests/ui/accessibility.test.js` :: assert image previews and accessible labels.

#### Details

- Use `/assets/game/aircraft/default.png`, `/assets/game/aircraft/velocity.png`, and `/assets/game/aircraft/aegis.png`.
- Remove visible glyph text from the preview while retaining the aircraft name, stats, lock reason, and selected state as text.
- Keep the logout button in the menu’s separated `.account-actions` region.

### I02. Hitbox/timing visibility

- Related Files:
  - `src/game/renderer.js` :: timing-guide and obstacle visual helpers; ensure no generic player/obstacle hitbox is drawn.
  - `tests/game/renderer.test.js` :: retain assertion that `showTimingGuide` draws the early timing region and assert no debug hitbox layer exists.

#### Details

- Preserve the existing first-five-special-wall `showTimingGuide` behavior exactly.
- Do not add or render a player rectangle, collision outline, or broad avoidance hitbox.

## Acceptance Criteria

- [ ] Hangar buttons show actual aircraft silhouettes.
- [ ] Main menu logout remains visible and separated.
- [ ] Early special-wall timing guides remain visible; generic hitboxes are not rendered.

## Validation

- `npm run test -- --run tests/ui/screens.test.js tests/ui/accessibility.test.js tests/game/renderer.test.js`

## Commit Message

```text
feat(ui): show aircraft previews and preserve timing guidance

Plan: 2026-09-28-game-visual-assets-and-flow-fixes
Phase: P02-flow-fixes
Task: T03-hangar-and-visibility

- replace hangar glyphs with aircraft art
- keep logout and early special-wall guidance visible
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
