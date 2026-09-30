# Task: T02 Pilot Ranking Screen

## Status: done

## Goal
Provide an all-pilots scrollable ranking view from the main menu and game-over result screen, incrementally loading rows while keeping the current user's or guest's own best score pinned below the list.

## Decision Summary
- Open Pilot Ranking from both the main menu and game-over; use vertical scrolling with pages of up to 50 rows.
- Signed-in users see account rank/name/aircraft/best score pinned; guests see `GUEST`, local best and its aircraft, with global rank explicitly unavailable.

## Implementation

### I01. Ranking controller state and navigation
- Related Files:
  - `src/ui/app-controller.js` :: state, `paint`, `dispatch`, menu/game-over handlers, ranking page loader; modify
  - `src/ui/screens.js` :: `renderMenuScreen`, `renderGameOverScreen`, new `renderPilotRankingScreen`; modify
  - `src/ui/leaderboard-view.js` :: ranking table renderer or new full-page renderer; modify
  - `src/styles.css` :: scrollable ranking layout and pinned-record styling; modify
  - `src/main.js` :: page service adapter from T01; read-only dependency
  - `tests/ui/app-controller.test.js` :: navigation, paging, account/guest pinned record; modify

#### Details
- **State fields**: `screen` accepts `pilot-ranking`; add `rankingRows: LeaderboardRow[]`, `rankingOffset: number`, `rankingHasMore: boolean`, `rankingLoading: boolean`, `rankingError: Error | null`, and `rankingRequestId: number` to ignore stale requests. Row fields are `rank`, `displayName`, `bestScore`, `achievedAt`, `aircraftId`; omit user ID in guest-visible data.
- **Controller flow**: Add `OPEN_PILOT_RANKING`, `CLOSE_PILOT_RANKING`, and `LOAD_MORE_RANKING` events. Opening resets rows/offset, retains menu/game-over return target, paints immediately, then loads first page. Load 50 rows at current offset; append only when request ID and screen still match; set `hasMore = rows.length === 50`; increase offset by actual row count. Prevent duplicate concurrent page loads. Errors retain already-loaded rows and show retry affordance.
- **Scroll loading**: Attach an `IntersectionObserver` sentinel inside the ranking table scroll container with a bottom root margin; if unsupported, expose a visible `더 불러오기` button. Disconnect observer on screen replacement/unmount and prevent repeated callbacks while loading.
- **Pinned record**: Account view uses the signed-in user's best-score/rank/name/aircraft metadata from a narrowly scoped account service method; do not weaken RLS. Guest view uses T02 local guest record and displays `전역 순위 없음 · 이 브라우저에만 저장`. Never present a guest local score as a global entry.
- **Screen controls**: Main menu and game-over each expose `파일럿 랭킹`; ranking view offers a return action restoring the previous screen. No score submit is triggered by opening ranking.
- **Accessibility**: Table has caption/column headers; scroll region is keyboard-scrollable and labelled; announce loaded row counts and errors via live region; pinned card is outside the scroll container.

### I02. Ranking view and paging tests
- Related Files:
  - `tests/ui/leaderboard-view.test.js` :: public ranking row cells, pagination UI, pinned record; modify
  - `tests/ui/screens.test.js` :: entry/return actions from menu and game-over; modify
  - `tests/ui/app-controller.test.js` :: page appending, deduped load, stale request, errors, guest vs account pin; modify
  - `tests/ui/accessibility.test.js` :: table/scroll labels and safe text rendering; modify

#### Details
- Cover 0, partial, and full 50-row pages; scroll sentinel or button; no duplicate requests; stale response; return to prior screen; account pinned record and guest local record; untrusted names rendered as text.

## Acceptance Criteria
- [ ] Pilot Ranking opens from main menu and game-over, lists all rows through incremental vertical scrolling, and pins a personal record below the table.
- [ ] Guests see their local best but no global rank; viewing ranking never writes scores.
- [ ] Loading/error states, keyboard access, safe text rendering, and return navigation work.

## Validation
- `npm test -- --run tests/ui/leaderboard-view.test.js tests/ui/screens.test.js tests/ui/app-controller.test.js tests/ui/accessibility.test.js`

## Commit Message
```text
feat(ui): add paged Pilot Ranking screen

Plan: 2026-09-30-pilot-ranking-admin-guest
Phase: P02-pilot-ranking
Task: T02-pilot-ranking-screen

- Add menu and game-over ranking navigation
- Load public rows incrementally with accessible scrolling
- Pin account or guest-local best score below the table
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
