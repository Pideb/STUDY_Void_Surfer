# T02 game-over ranking

## Status: pending

## Goal / Decision Summary
Guest TOP10 reads public ranking, individual queries cannot erase each other, game-over has no retry control. Preserve score-save and pilot-ranking behavior.

## Implementation
### I01 Service
- `src/services/leaderboard-service.js` `fetchTopScores(client,limit)`: get session user ID; guest→get_public_leaderboard(p_limit,p_offset:0); signed-in→get_leaderboard, then public fallback only on AUTH_REQUIRED. Keep own-row normalization for successful signed-in responses; other errors remain errors. No SQL changes.
- `tests/services/leaderboard-service.test.js`: guest/missing/expired session, auth fallback, non-auth error, limits/own-row identity.
### I02 Independent async controller
- `src/ui/app-controller.js` `loadGameOverData`: preserve one run save; launch reads with individual catch/publish so one rejection/pending cannot erase/block sibling; repaint each independently. submitError means write failure only. Current guard includes same finished run in game-over or its pilot-ranking subview; update cached state there without repainting ranking. Ignore new-run/account-change stale responses. Remove retryLeaderboard callback.
- `src/ui/leaderboard-view.js` `renderLeaderboardPanel(model)` remove retry button/callback, error message directs to pilot ranking. `src/ui/screens.js` remove callback argument and copy inviting removed retry. Preserve full-ranking retry.
- Tests UI app-controller/leaderboard-view/screens: no retry on write/read errors; independent rejected/pending reads; late same-run result during pilot ranking cached on return; old result cannot replace next run. Replace obsolete write-retry test with truthful no-retry status.

## Acceptance Criteria
- [ ] Guest TOP10 works, private neighborhood remains authenticated.
- [ ] Healthy list survives sibling failure/pending and subview roundtrip.
- [ ] Game-over retry removed, full-ranking retry preserved.

## Validation
`npm test -- --run tests/services/leaderboard-service.test.js tests/ui/app-controller.test.js tests/ui/leaderboard-view.test.js tests/ui/screens.test.js tests/ui/accessibility.test.js`
`npm test -- --run`, `npm run build`, `npm run verify:config`.
No release:prepare or version advance; docs:check is expected to require release preparation after local source fixes. Protected release snapshots unchanged.

## Commit Message
```text
fix(ui): load game-over rankings independently and remove retry action

Plan: 2026-11-03-boss-beam-gameover-ranking
Phase: P01-fixes
Task: T02-gameover-ranking
```

## Progress
- [ ] implementation
- [ ] validation
- commit: pending
