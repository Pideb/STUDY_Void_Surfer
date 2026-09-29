# Task: T03 Explain BOSS Clear Condition Before Launch

## Status: done

## Goal
Teach the actual BOSS clear condition and distinguish projectile damage from WASD challenges in the pre-flight controls screen.

## Decision Summary
- Explain that timed SPACE dashes reflect projectiles and reduce BOSS HP to zero; BOSS 1–4 require 3 reflections, BOSS 5 onward require 5; WASD challenges are separate and do not damage BOSS.
- This is tutorial copy only; do not alter combat mechanics, challenge timing, or HP scaling.

## Implementation

### I01. Add clear-condition and challenge guidance to the tutorial
- Related Files:
  - `src/ui/screens.js` :: `renderTutorialScreen`; add three visible list items describing timed reflection/HP-zero clear, required reflection counts, and no-damage WASD challenge.
  - `tests/ui/screens.test.js` :: verify each rule is visible as text and existing controls remain present.
  - `tests/ui/accessibility.test.js` :: ensure instructions remain ordinary readable DOM list content and do not replace semantic tutorial structure.

#### Details
- Add these Korean instructions to the existing `tutorial-list`:
  1. `투사체를 타이밍에 맞춰 SPACE 대시로 반사해 BOSS HP를 0으로 만들면 클리어합니다.`
  2. `BOSS 1~4는 3회, 5번째부터는 5회 반사가 필요합니다.`
  3. `WASD 챌린지는 별도 도전이며, 성공해도 BOSS에게 피해를 주지 않습니다.`
- Keep all existing click/touch, SPACE, special-wall, and pause instructions. Preserve list semantics, screen actions, and keyboard/touch start/menu behavior.
- Do not change the clear count, boss health, challenge success effects, or add new explanatory UI to the in-game HUD.

## Acceptance Criteria
- [ ] Pre-flight tutorial states how to damage and defeat the BOSS.
- [ ] It accurately distinguishes 3-reflection early BOSSes from 5-reflection BOSSes starting at number 5.
- [ ] It clearly says WASD challenge success does not damage the BOSS.
- [ ] Existing tutorial controls and screen navigation are unchanged.

## Validation
- `npm test -- --run tests/ui/screens.test.js tests/ui/accessibility.test.js` — pass tutorial-copy and DOM accessibility checks.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
feat(tutorial): explain BOSS reflection clear condition

Plan: 2026-09-29-boss-combat-clarity
Phase: P01-boss-readability
Task: T03-boss-clear-tutorial

- Explain reflection counts and BOSS HP clear condition
- Clarify that WASD challenges do not deal BOSS damage
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`16` focused tests; full suite, build, and `git diff --check`)
- commit: `c58a090`

## Learning Notes
- Put rules that materially affect a first boss encounter in the pre-flight tutorial so players can learn them before combat, while retaining semantic list markup.
