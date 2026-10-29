# Task: T01 Boss-only Loop

## Status: pending

## Implementation
- `src/game/difficulty.js` :: `getDifficulty(score,elapsedSeconds,completedBossCount,rng,bossPatternOverride,nextEncounterScore,progressionScore,firstBossCleared,aircraftId)`: keep positional interface, third number now actual cleared bosses. At threshold return isBoss true, isWarning false, one-based `warningIndex` legacy field equal to boss number. Boss intensity still uses existing narrowed gap/special chance/timing. A below-threshold state has neither mode. Preserve speed/rng/boss pattern functions.
- `src/game/game-engine.js`: explicit initialClearedBossCount with legacy initialCompletedWarningCount→floor(/2) fallback; use actual clearedBossCount for difficulty and encounter creation, firstBossCleared>=1 and ambient count>=2. First threshold20; fixture initial threshold20+20*initialClearedBossCount (legacy alias remains normalized); runtime next threshold clear score+5..8.
- `startWarningIfNeeded` must start a draining boss entry whenever candidate.isBoss; never begin standalone warning. Existing legacy session helpers can remain dormant. Current session difficulty.isWarning=false for boss. Create encounter with one-based number, no divide-by2.
- Tag spawned boss walls with an explicit `bossNumber` (null for normal) and preserve it in snapshots so score exclusion does not use odd/even indices. Passed boss walls award no points even after the encounter object disappears. Keep guide freezing, wave completion, deadlock fixes and portal draining.
- `.memory/archive/2026-10-29-warning-0.01v.md`: preserve source commit f1210bf, old alternation,5 walls/min2 specials, intensity, sounds/HUD and restoration concerns. No speculative revival implementation.
- `tests/game/difficulty.test.js`, `tests/game/game-engine.test.js`, relevant integration fixtures: update old standalone-WARNING assertions to boss-only expectations and use actual-boss fixtures where needed. Add end-to-end first threshold→boss1 clear→normal interval→boss2, first/second clear unlocks, no warning-only snapshot, leftover boss-wall score exclusion. Preserve test purpose rather than deleting failed tests.

## Validation
- `npm test -- --run tests/game/difficulty.test.js tests/game/game-engine.test.js tests/integration`
- Focus failures by exact spec; `git diff --check`.

## Acceptance Criteria
- [ ] No standalone WARNING in production sequence; first boss20, next after5..8 normal points.
- [ ] Actual boss numbers/clear unlocks and scoring are consistent, legacy fixtures still interpretable.
- [ ] WARNING archive and targeted regressions complete.

## Commit Message
```text
feat(game): replace standalone warnings with consecutive boss encounters

Plan: 2026-10-29-001b-boss-menu
Phase: P01-runtime
Task: T01-boss-only-loop

- Count actual bosses and preserve unlock and score semantics
- Archive the previous WARNING rules for a future redesign
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit:pending
