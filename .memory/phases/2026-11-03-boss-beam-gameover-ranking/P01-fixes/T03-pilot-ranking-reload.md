# T03 pilot-ranking reload

## Status: done

## Results
- Pre-fix regression reproduced3 automatic requests instead of1 for both resolved errors and rejected promises. No manual click was issued.
- Error reload and successful pagination now have distinct controls/actions; error/loading disables automatic observation/dispatch. Manual retry preserves failed offset and rows and deduplicates pending requests.
- 67 targeted UI/integration tests passed, plus build/verify:config/diff whitespace checks. Initial error/rejection, second-page recovery and stale retry after closing covered.
- Actual Chromium IntersectionObserver: error remains stable after1.2s with1 request, no auto sentinel. Real mouse press200ms/release keeps button connected, triggers exactly1 additional request. Live public RPC200 returns12 rows, zero writes. Evidence browser.json.
- Local commit only; no version change, push, or new deployment.

## Goal / Decision Summary
Reproduce guest ranking failure causing automatic repeated requests/repainting, then make one explicit manual click retry the failed page. Rename to `랭킹 다시 불러오기`. Previous T02 intentionally removed game-over retry only; user now expands scope to full ranking retry.

## Implementation
### I01 Separate manual retry
- `src/ui/screens.js` `renderPilotRankingScreen(model,handlers)`: show error action with `.ranking-reload`, label `랭킹 다시 불러오기`, handlers.retry. Successful pagination alone uses `.ranking-load-more` sentinel and loadMore callback. Error control rendered for model.error even when hasMore false; never display completion copy alongside error. Disable controls while loading. Preserve current rows.
- `src/ui/app-controller.js` paint ranking handlers add `retry:()=>dispatch('RETRY_RANKING')`. `attachRankingObserver`: do not attach while error/loading/not-hasMore or outside ranking; observe success sentinel only. Observer callback rechecks current guard through loadRankingPage.
- `loadRankingPage({reset=false,retry=false}={})`: loading guard applies to all calls, auto/load-more must not run while error, explicit retry bypasses exhausted-hasMore guard for failed page; preserve rows/offset on failure and retry. Set error null/loading before one request, keep stale-response requestId guard. dispatch RETRY_RANKING only when in ranking and error exists; call retry:true. Error announcement mentions explicit action.
- No SQL, auth, score submission, release version, existing game-over removal or unrelated menu changes.

### I02 Regressions and browser
- `tests/ui/app-controller.test.js`: eager IntersectionObserver bounded auto callbacks reproduces repeated requests pre-fix, asserts exactly1 request after initial failure, zero automatic retries, one manual retry request after click, loading deduplication and recovery; test both resolved error and rejection. Failed second page preserves50 rows and offset50; retry appends page once; late retry response after leaving cannot overwrite menu.
- `tests/ui/leaderboard-view.test.js`: exact new label/retry callback, hasMore:false error still allows retry and hides completed copy, regular load-more remains, no game-over retry.
- Browser diagnostic under `.memory/validation/2026-11-03-pilot-ranking-reload/`: actual IntersectionObserver, first request injected failure, observe stable error button, CDP real mouse press/release, subsequent public Supabase RPC200 shows ranking rows, zero writes. Persist requests/counts without keys or user names.

## Acceptance Criteria
- [x] Pre-fix regression fails with repeated requests; post-fix passes.
- [x] No automatic requests while failed; mouse click restarts request and recovers.
- [x] Pagination/duplicate/stale-request protections retained.

## Validation
`npm test -- --run tests/ui/app-controller.test.js tests/ui/leaderboard-view.test.js tests/integration/leaderboard-failure.test.js`
`npm run build` and `npm run verify:config`; actual browser error→mouse retry→public rows.

## Commit Message
```text
fix(ui): make pilot ranking reload manual and stop error retry loops

Plan: 2026-11-03-boss-beam-gameover-ranking
Phase: P01-fixes
Task: T03-pilot-ranking-reload
```

## Progress
- [x] implementation
- [x] validation
- commit: pending
