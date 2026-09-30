# Task: T01 Public Ranking RPC

## Status: in_progress

## Goal
Let guests and signed-in users page through global ranking rows without granting anonymous users any write access or exposing account identifiers.

## Decision Summary
- Guest ranking is read-only and may expose only display name, global rank, best score, achieved timestamp, and aircraft ID.
- Fetch at most 50 rows per page; preserve existing authenticated score submission and account-specific APIs.

## Implementation

### I01. Public ranking query and migration
- Related Files:
  - `supabase/migrations/YYYYMMDDNNNN_public_leaderboard_read.sql` :: new migration, public read-only RPC
  - `supabase/tests/leaderboard.sql` :: migration/RPC privilege and row-shape assertions; modify
  - `src/services/leaderboard-service.js` :: `fetchLeaderboardPage`; modify
  - `src/main.js` :: leaderboard service dependency adapter; modify
  - `tests/services/leaderboard-service.test.js` :: paging and guest query tests; modify

#### Details
- **RPC contract**: Add `public.get_public_leaderboard(p_limit integer default 50, p_offset integer default 0)` returning exactly `rank bigint, display_name text, best_score integer, achieved_at timestamptz, aircraft_id text`. Do not return `user_id`, email, profile metadata, or other account data.
- **SQL behavior**: Rank all `player_scores` joined to `profiles` by `best_score DESC, achieved_at ASC, user_id ASC`; calculate stable global row numbers before applying `LIMIT/OFFSET`. Clamp limit to `[1,50]`; clamp negative offset to zero and cap offset at a safe integer upper bound. Use `STABLE SECURITY DEFINER`, set `search_path = public`, and qualify referenced relations. Grant execute to `anon, authenticated`; revoke from `public`. Keep submit and player-specific RPC grants authenticated-only.
- **Service signature**:
  ```js
  fetchLeaderboardPage(client, { limit = 50, offset = 0 } = {}) -> Promise<{ rows: LeaderboardRow[], error: Error | null }>
  ```
  Validate/clamp pagination before RPC call, normalize with `normalizeLeaderboardRows`, and map errors through `mapLeaderboardError`. Do not require `auth.getSession()` for public rows.
- **Client adapter**: Expose `fetchLeaderboardPage(options)` through the existing leaderboard service dependency in `src/main.js`; missing Supabase configuration returns the existing structured configuration error.
- **Migration test**: Assert anon can execute only the public read function, cannot execute `submit_score` or account-specific best/neighborhood RPCs, returned columns omit UUID/email, result order and offset are stable, and result count never exceeds 50.

### I02. Service contract tests
- Related Files:
  - `tests/services/leaderboard-service.test.js` :: new cases for limit/offset, no session dependency, row normalization and errors; modify

#### Details
- Verify the RPC is called with sanitized `p_limit` and `p_offset`; invalid inputs fall back/clamp deterministically.
- Verify public page results work when `auth.getSession` is absent or returns no session.
- Preserve current `fetchTopScores`, `fetchPlayerNeighborhood`, and submission behavior unless a consumer is deliberately migrated in T02.

## Acceptance Criteria
- [ ] Anonymous clients can only read safe global ranking fields in pages no larger than 50.
- [ ] Anonymous clients cannot invoke any score submission or account-specific RPC.
- [ ] Signed-in ranking ordering and data normalization remain compatible.

## Validation
- `npm test -- --run tests/services/leaderboard-service.test.js`
- `supabase test db` (when Supabase CLI/local database is available); otherwise record that SQL privilege assertions remain unexecuted and verify migration syntax by review.

## Commit Message
```text
feat(leaderboard): expose safe public ranking pages

Plan: 2026-09-30-pilot-ranking-admin-guest
Phase: P02-pilot-ranking
Task: T01-public-ranking-rpc

- Add a paged public read-only ranking RPC
- Limit anonymous output to public ranking fields
- Keep score writes and account queries authenticated-only
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
