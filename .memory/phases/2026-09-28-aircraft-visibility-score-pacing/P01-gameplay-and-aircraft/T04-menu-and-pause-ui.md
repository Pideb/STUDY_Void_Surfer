# Task: T04 Main-Menu Wordmark and Pause Guidance

## Status: done

## Goal
Restyle the main-menu `VOID SURFER` title with the selected clean geometric sci-fi wordmark treatment and explicitly tell players that pausing reduces score but does not reduce speed.

## Decision Summary
- Use the first title concept: wide geometric uppercase letters with restrained cyan edge light.
- Keep exact accessible DOM text `VOID SURFER`; do not use generated raster lettering.
- Explain the -10 pause score penalty and that attained speed does not decrease.

## Implementation

### I01. Style the main-menu title as a readable wordmark
- Related Files:
  - `src/ui/screens.js` :: `renderMenuScreen`; retain semantic `h1` text `VOID SURFER`, add stable wordmark class; do not alter login branding, menu layout, or actions.
  - `src/styles.css` :: `.menu-brand h1` and responsive menu rules; use available system font stack, controlled tracking, subtle cyan edge glow and responsive size; preserve contrast/reduced-motion.
  - `tests/ui/screens.test.js` :: assert exact text and semantic heading.
  - `tests/ui/accessibility.test.js` :: ensure title stays visible and unclipped at mobile breakpoint.

#### Details
- Keep exact text in existing `h1`; no glyph replacement, canvas text, generated bitmap, or external font dependency.
- Style: broad geometric uppercase, pale white/cyan text and restrained edge light; avoid metallic bevel, excessive glow, and speed streaks.
- Preserve menu structure, selected ship preview, pilot greeting, buttons, and logout placement.
- At narrow widths reduce font size/letter spacing to avoid clipping.

### I02. Clarify pause score and speed behavior
- Related Files:
  - `src/ui/screens.js` :: `renderPausedScreen`; add visible copy: `일시정지할 때마다 점수 10점이 차감되며, 이미 오른 속도는 내려가지 않습니다.` Keep resume/menu actions unchanged.
  - `src/ui/app-controller.js` :: paused-screen paint model and PAUSE announcement; pass required data only if needed; preserve pause action/audio behavior.
  - `tests/ui/screens.test.js` :: assert penalty and persistent-speed copy.
  - `tests/ui/app-controller.test.js` :: preserve one deduction per pause and resume semantics.

#### Details
- Explain that every pause costs 10 score and speed stays at its highest progression step.
- Keep copy in accessible visible DOM, not only an aria-live announcement. Do not suggest pause restores speed or cancels its penalty.

## Acceptance Criteria
- [x] Main-menu title remains exact `VOID SURFER`, semantic, and matches selected geometric cyan direction.
- [x] Title does not clip on desktop/mobile.
- [x] Pause screen clearly says each pause costs 10 points and speed does not decrease.
- [x] Pause/resume/menu behavior is unchanged.

## Validation
- `npm test -- --run tests/ui/screens.test.js tests/ui/accessibility.test.js tests/ui/app-controller.test.js`
- `npm run build`
- `git diff --check`

## Commit Message
```text
feat(ui): style title wordmark and explain pause speed behavior

Plan: 2026-09-28-aircraft-visibility-score-pacing
Phase: P01-gameplay-and-aircraft
Task: T04-menu-and-pause-ui

- Apply the selected geometric VOID SURFER wordmark styling
- Explain score penalty and persistent speed in pause screen
```

## Progress
- [x] Implementation complete
- [x] Validation passed: focused UI suite (33 tests), full suite (188 tests), production build, `git diff --check`
- commit: `feat(ui): style title wordmark and explain pause speed behavior`
