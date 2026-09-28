# Task: T06 Regression and Visual Review

## Status: pending

## Goal

Verify the complete six-stage asset set, UI fixes, transition ownership, account score display, and game-over submission behavior together.

## Implementation

### I01. Automated regression

- Related Files:
  - All changed source/test files :: read-only validation.

#### Details

- Run the full Vitest suite, production build, and asset URL smoke check.
- Confirm no missing-image warning remains for the committed local manifest.

### I02. Manual visual review

- Related Files:
  - `src/main.js`, `src/game/renderer.js`, `src/ui/screens.js` :: live review only.

#### Details

- Inspect desktop and mobile menu, hangar previews/account score, ordinary gameplay, WARNING/BOSS, and a stage transition.
- Confirm background motion comes from the right edge, active obstacles preserve their previous look, and new obstacles use the next stage look.

## Acceptance Criteria

- [ ] Full tests and build pass.
- [ ] All asset paths return PNGs.
- [ ] Manual visual review confirms all seven requested behavior changes.

## Validation

- `npm run test -- --run`
- `npm run build`
- PowerShell local asset URL smoke check and manual `npm run dev` review.

## Commit Message

```text
chore(qa): verify visual asset and flow fixes

Plan: 2026-09-28-game-visual-assets-and-flow-fixes
Phase: P03-regression
Task: T06-regression-and-visual-review

- run full test and build regression
- verify six-stage asset paths and live transition behavior
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
