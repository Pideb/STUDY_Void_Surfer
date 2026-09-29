# Task: T06 Integrate the Selected Title Image

## Status: pending

## Goal
Show the approved geometric cyan VOID SURFER logo as an actual transparent image at the menu's existing title position while preserving semantic accessible text.

## Decision Summary
- Create a real transparent title logo, not just CSS-styled lettering.
- Keep the current title placement and exact accessible text `VOID SURFER`.

## Implementation

### I01. Produce and verify the transparent title asset
- Related Files:
  - `public/assets/game/menu/void-surfer-wordmark.png` :: new transparent logo; wide horizontal composition, exact readable title, pale white/cyan geometric lettering and restrained cyan edge light.
  - Image-generation skill/tool :: generate from approved art direction; visually inspect and regenerate if spelling, contrast, or transparency is incorrect.

#### Details
- Aspect ratio around 4:1–6:1. Transparent background; no scenery, card, border, opaque backdrop, or external font.
- Keep lettering crisp at menu display size; restrained glow only, no metallic bevel or excessive effects.
- Keep logo at the existing title position and responsive width.

### I02. Register and render the title image accessibly
- Related Files:
  - `src/game/visual-assets.js` :: `VISUAL_ASSET_MANIFEST.menuTitle`; register `/assets/game/menu/void-surfer-wordmark.png` for existing preloader.
  - `src/ui/screens.js` :: `renderMenuScreen`; retain `h1.menu-wordmark` exact `VOID SURFER` in `.sr-only`; insert manifest-backed image with `alt=""` and `aria-hidden="true"`.
  - `src/styles.css` :: `.menu-wordmark`, `.menu-wordmark-image`, responsive title rules; size without clipping and remove conflicting pseudo-underline if artwork includes its own treatment.
  - `tests/game/visual-assets.test.js` :: assert manifest registration and loader path.
  - `tests/ui/screens.test.js`, `tests/ui/accessibility.test.js` :: assert image position, one semantic heading, no duplicate announcement, and responsive sizing.

#### Details
- Continue using `createVisualAssetLoader` in `src/main.js`; add no separate loading path or network dependency.
- Use an `h1` containing an image hidden from assistive technology and a visually hidden text span, so accessible heading remains `VOID SURFER`. If image is unavailable, show readable CSS-styled text fallback.
- Verify PNG alpha transparency, readable display size, and expected public URL in build output.

## Acceptance Criteria
- [ ] Menu visibly uses an image at the prior title position and approved art direction.
- [ ] Exact `VOID SURFER` accessible heading remains present once.
- [ ] Asset is transparent, locally preloaded, and has readable fallback.
- [ ] Logo does not clip at desktop or mobile sizes.

## Validation
- `npm test -- --run tests/game/visual-assets.test.js tests/ui/screens.test.js tests/ui/accessibility.test.js`
- `npm run build`
- `git diff --check`

## Commit Message
```text
feat(ui): apply transparent VOID SURFER title art

Plan: 2026-09-29-gameplay-refinements
Phase: P02-fullscreen-and-title-art
Task: T06-title-image-asset

- Add the selected transparent geometric title logo
- Preserve accessible menu heading and responsive sizing
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
