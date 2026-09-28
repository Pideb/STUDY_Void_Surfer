# Task: T08 Cross-stage Visual QA

## Status: pending

## Goal

Verify all six actual image-backed stage scenes and the redesigned menu across automated rendering tests, full build/config checks, desktop/mobile visual inspection, and resource-size/readability review.

## Decision Summary

- Automated tests prove wiring and preserve gameplay contracts; screenshots/manual inspection prove the art matches the approved visual direction.
- Do not close the plan or claim all art is applied if any image path falls back unexpectedly or if the game still reads as a recolored generic neon scene.

## Implementation

### I01. Cross-stage and regression QA

- Related Files:
  - `tests/game/renderer.test.js`, `tests/game/visual-assets.test.js` :: all-stage loaded-art/fallback and transition coverage; modify.
  - `tests/ui/screens.test.js`, `tests/ui/game-hud.test.js`, `tests/ui/accessibility.test.js` :: menu/HUD/label/accessibility contract; modify.
  - `README.md` :: describe asset-backed scene and controls only if user-facing guidance changes; modify if needed.
  - `.memory/phases/2026-09-28-game-visual-asset-integration/P02-stage-expansion/phase.md` and `.memory/current.md` :: completion/status sync; modify.

#### Details

- Run all test files; verify asset loader failures are observable and do not hang app startup. Test all six theme mappings and missing-asset fallback.
- Run `npm run build` and `npm run verify:config`; inspect Vite `dist/assets/game` public outputs and total/individual image byte sizes. Record actual totals in this task without adding an optimization dependency.
- Use `npm run dev` to inspect the menu, regular play, stage transition, special wall/break, projectile reflection, and laser scene at desktop and mobile viewport sizes. Confirm no stage/region or aircraft label appears in the in-play HUD, and confirm score/BOSS/attack/challenge cues remain readable.
- Inspect transition from its first frame through completion: new background begins at right edge, sweeps left for 1.5 seconds, and no one-frame palette cut appears. Check `prefers-reduced-motion` behavior.
- Fix visual implementation issues in this Task only when they remain within the confirmed decisions; for a direction change, ask the user and update the decision first.

## Acceptance Criteria

- [ ] Full test suite, build, and config verification pass.
- [ ] All six stages visibly use different approved art packs; no production play state silently shows the old generic primitive palette due to a bad path.
- [ ] Menu layout and game HUD match decisions; mobile and desktop remain readable/accessibly named.
- [ ] Right-to-left 1.5-second transition is smooth and gameplay/collision tests are unchanged.
- [ ] User has seen the final visual result; any remaining external OAuth/leaderboard smoke-test limitation is reported separately from art QA.

## Validation

- `npm run test -- --run` — all tests pass.
- `npm run build` — production build succeeds and includes the local art pack.
- `npm run verify:config` — public config/secret check passes.
- `npm run dev` — manual desktop/mobile full visual QA; show screenshots before claiming final approval.

## Commit Message

```text
test(visual): verify image-backed stages and responsive screens

Plan: 2026-09-28-game-visual-asset-integration
Phase: P02-stage-expansion
Task: T08-cross-stage-visual-qa

- verify six scene packs and the smooth stage push
- document final visual and responsive QA results
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
