# Pilot-ranking manual reload follow-up

Previous T02 removed game-over retry only, intentionally leaving full pilot-ranking retry. User now requested fixing that control or removing it. This follow-up retains a functional manual action labelled `랭킹 다시 불러오기`.

## Reproduced cause
IntersectionObserver observed the retry button as if it were a successful-pagination sentinel. Failure paint replaced the button and reattached the observer, issuing repeated automatic requests and repainting the control. An eager-observer regression failed before the fix:3 calls vs expected1 for both returned errors and promise rejections.

## Fix and validation
- Error action `.ranking-reload` has dedicated RETRY_RANKING; `.ranking-load-more` is pagination only.
- Loading/error/no-more guards prevent automatic requests; manual retry uses the same failed offset, preserves rows, deduplicates loading and retains late-response protection.
- Exact new label checked; existing game-over no-retry behavior retained.
- 67 targeted UI/integration tests pass; build and verify:config pass; whitespace check clean.
- Actual Chromium observer available: failure stable1.2sec with1 simulated failed request, button hit-testable; real mouse press/release200ms apart retains the same DOM control and triggers1 live public RPC200.12 rows displayed; no score writes. See browser.json and verify-reload.mjs.
- Browser fixture waits for initial authentication refresh to settle before testing ranking; otherwise the initial menu refresh can legitimately replace an immediately opened test view. Authentication flow was not changed by this patch.
- Local source commit only. Published v0.2 unchanged; no release preparation, push or gameplay deployment requested.
