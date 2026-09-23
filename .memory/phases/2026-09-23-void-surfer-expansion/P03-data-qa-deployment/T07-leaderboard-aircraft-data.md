# Task: T07 Leaderboard Aircraft Data

## Status: done

## Goal

기존 Supabase 리더보드에 선택 기체 정보를 안전하게 저장하고 조회한다. 하나의 통합 리더보드를 유지하며 계정 최고 점수는 기체와 무관하게 해금 기준으로 사용하고, 다른 사용자는 별도 설정 없이 기록과 기체 아이콘을 볼 수 있게 한다.

## Decision Summary

- 점수 행마다 `aircraft_id`를 저장하고 리더보드 조회 결과에 포함한다.
- 계정 최고 점수는 기존처럼 사용자별 단일 최고점이며, AEGIS 50점/VELOCITY 100점 해금에 사용한다.
- 클라이언트는 anon key와 RLS/RPC만 사용하고 service role key는 사용하지 않는다.

## Implementation

### I01. Database migration and RPC contract

- Related Files:
  - `supabase/migrations/202609230001_aircraft_scores.sql` :: new migration
  - `supabase/tests/leaderboard.sql` :: extend SQL assertions
  - `docs/supabase-schema.md` :: schema/RPC documentation

#### Details

- Add `scores.aircraft_id text not null default 'default'` with a check constraint limited to `default`, `velocity`, and `aegis`.
- Update `submit_score(p_score integer, p_display_name text, p_aircraft_id text)` to validate the ID, preserve max-score-only update semantics, and return `aircraft_id`.
- Update `get_leaderboard` and `get_player_neighborhood` RPC result shapes to include `aircraft_id` while preserving rank, display name, score, achieved timestamp, and current-user behavior.
- Update any RLS policy only as necessary; public reads go through existing safe RPCs and clients cannot write arbitrary rows.
- Migration must be idempotent where the project convention allows, but must not silently weaken existing policies.

### I02. Client normalization and submission

- Related Files:
  - `src/services/leaderboard-types.js` :: `normalizeScoreRecord`, `normalizeLeaderboardRows`; modify
  - `src/services/leaderboard-service.js` :: `submitBestScore`, fetch methods, `fetchPlayerBestScore`; modify
  - `src/ui/leaderboard-view.js` :: aircraft icon/name rendering; modify
  - `src/ui/app-controller.js` :: pass selected aircraft and use best score; modify
  - `tests/services/leaderboard-service.test.js`, `tests/ui/leaderboard-view.test.js` :: extend

#### Details

- Normalize unknown/missing `aircraft_id` to `default` for backward-compatible old rows. Never trust arbitrary display HTML; keep textContent rendering.
- `submitBestScore(client, { score, displayName, aircraftId })` sends `p_aircraft_id` and returns it in `record`.
- `fetchPlayerBestScore` returns the authenticated account's best score for unlock state without exposing another user's private data.
- Leaderboard entries render a compact icon/label from the immutable aircraft catalog; the score/rank ordering remains one global list.

## Acceptance Criteria

- [ ] Existing rows migrate to `default` and remain readable.
- [ ] Invalid aircraft IDs are rejected by the database and normalized safely by the client.
- [ ] Scores submitted with VELOCITY retain the actual 2x wall score and show VELOCITY in the list.
- [ ] Unlock state is derived from account best score and works after a new browser/device login.
- [ ] RLS and RPC tests prove a user cannot overwrite another user's score.

## Validation

- `supabase test db` or the repository's configured SQL test command, if Supabase CLI is available
- `npm run test -- --run tests/services/leaderboard-service.test.js tests/ui/leaderboard-view.test.js`
- `npm run build`

## Commit Message

```text
feat(data): persist aircraft identity in leaderboard scores

Plan: 2026-09-23-void-surfer-expansion
Phase: P03-data-qa-deployment
Task: T07-leaderboard-aircraft-data

- add aircraft_id to score records and leaderboard RPCs
- derive unlocks from the account best score
```

## Progress

- [x] Implementation complete
- [x] Client tests and production build passed; SQL runtime test not run (Supabase CLI unavailable; Docker unavailable in this environment)
- commit: included in T07 changeset
