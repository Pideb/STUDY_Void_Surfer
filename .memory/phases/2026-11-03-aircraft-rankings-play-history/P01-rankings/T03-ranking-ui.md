# Task: T03 Ranking tabs and mobile UI

## Status: done

## Goal
Approved four-tab menu with independent table/pinned record and readable mobile landscape controls.

## Decision Summary
- Open overall each time; game-over remains overall-only.
- Mobile uses actual viewport layout (not desktop shrink),44px minimum tab/back targets and13px+ table text.

## Implementation
### I01. Scoped async state
- Related Files: `src/ui/app-controller.js` state/paint/loadRankingPage/loadRankingPersonalRecord/openPilotRanking/dispatch; tests/ui/app-controller.test.js.
#### Details
- `rankingAircraftId:null|'default'|'aegis'|'velocity'`; SELECT_RANKING_AIRCRAFT validates and ignores same scope. Reset rows/offset/errors/loading; invalidate BOTH list/personal generation IDs before async calls. Capture scope at request start and check request ID/screen/scope after every await. Auth change/close invalidate both. Keep pagination/retry offset semantics and observer cleanup.
- Overall fetchLeaderboardPage({limit,offset}) and neighborhood flow unchanged. Craft page passes aircraftId; own record fetchPlayerAircraftRecord(id); no overall fallback for missing craft record. Empty record displays unregistered for selected craft. Game-over untouched.
### I02. Approved screen and sizing
- Related Files: `src/ui/screens.js` renderPilotRankingScreen; `src/ui/leaderboard-view.js` renderPilotRankingTable(rows,{aircraftId=null}={}); `src/styles.css`; `src/ui/menu-layout.css`.
#### Details
- Accessible4button tablist, overall/NOVA/AEGIS/VELOCITY, actual VISUAL_ASSET_MANIFEST ship images, aria-selected/controls/IDs. handler.selectAircraft(id|null), arrow/Home/End within tablist; do not capture table scrolling. Selected cyan/gold/magenta styling matches preview.
- Overall4columns rank/pilot/aircraft/score; craft3columns omit aircraft. Dynamic caption/description; safe textContent. Pin personal section outside scroll: scope title, identity+ship left, rank/score right. Guest/loading/error/no-record states, existing reload/back remain.
- Desktop ~820x794 logical px with6row grid heading/description/tabs/flexible table/personal/back; replace obsolete5row rules. Mobile full viewport with safe-area padding, hide description,5row grid, min-height0 scrolling,14px tabs/13px table/44px targets. Validate568x320,844x390; no footer clipping.
### I03. Verification and documentation
- Related Files: tests/ui/screens.test.js, tests/ui/leaderboard-view.test.js, scoped integration tests; `.memory/validation/2026-11-03-aircraft-rankings/verify-browser.mjs`, screenshots/report; supabase/AIRCRAFT_RANKINGS.md.
- Test stale responses for BOTH list and own record, pagination/reload, guest/account switch, close/reopen, empty and missing-migration errors. Actual browser controller/templates with injected deterministic services, no live writes; screenshots1600x900,844x390,568x320, assert fixed personal card on scroll, targets>=44px,no overflow.
- Full tests/build/config/docs/guide checks. Rebuild generated docs only if stale; never version bump or overwrite confirmed release snapshots. Record local SQL/live Supabase distinction and operator migration required.

## Acceptance Criteria
- [x] Four tabs match preview, no stale cross-tab data.
- [x] Mobile native-pixel sizing and pinned footer implemented; emulated browser checks passed before final spacing refinement. Final screenshot recheck limited by tools (see report).
- [x] Existing game-over/reload/guest behavior preserved.
- [x] 1,415 tests/build/config passed; migration guide/evidence recorded. Release-only docs fingerprint gate remains pending a future release.

## Validation
- `npm run test -- --run`
- `npm run build`
- `npm run verify:config`
- `npm run docs:check`
- `npm run guide:check`
- `node .memory/validation/2026-11-03-aircraft-rankings/verify-browser.mjs`

## Commit Message
```text
feat(ui): add aircraft ranking tabs with readable mobile layout

Plan: 2026-11-03-aircraft-rankings-play-history
Phase: P01-rankings
Task: T03-ranking-ui
```

## Progress
- [x] 구현 완료
- [x] Code/SQL/build validations passed; final visual recheck limitation documented.
- commit: recorded in git history (T03-ranking-ui)
