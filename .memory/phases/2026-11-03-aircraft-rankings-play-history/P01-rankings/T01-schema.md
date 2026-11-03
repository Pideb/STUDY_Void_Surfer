# Task: T01 Aircraft ranking schema

## Status: done

## Goal
Independent aircraft bests while retaining all existing overall records and private tie duration.

## Decision Summary
- Additive migration; old RPCs remain compatible. No remote application.
- Every known final run score is private; historical unknowns remain NULL.

## Implementation
### I01. Schema and RPCs
- Related Files: `supabase/migrations/202611030001_aircraft_rankings_history.sql` new; previous migrations read-only.
#### Details
- `aircraft_scores`: user_id uuid FK profiles cascade, aircraft_id text enum default/aegis/velocity, best_score integer>=0, achieved_at timestamptz, duration_ms bigint0..604800000 default0, PK(user_id,aircraft_id). RLS, revoke direct public/anon/authenticated access. Rank index(aircraft_id,best_score DESC,duration_ms DESC,achieved_at,user_id).
- Lock existing score tables atomically during seed/RPC replacement. Seed player_scores LEFT JOIN player_score_timing preserving all values; absent timing0. Never delete/reset old bests.
- Replace `submit_score(integer,text,text,bigint) returns public.player_scores`. Same validation/auth/sync_profile. Lock overall user row FIRST, update overall/timing iff score higher or equal with longer duration. Upsert aircraft best independently under same rule. Existing2/3arg wrappers remain. Overall response still account best, possibly different aircraft.
- Add `get_aircraft_leaderboard(p_aircraft_id text,p_limit integer default50,p_offset integer default0) returns table(rank bigint,display_name text,best_score integer,achieved_at timestamptz,aircraft_id text)`. Validate ID; filter aircraft before row_number; order score DESC,duration DESC,achieved_at ASC,user_id ASC; clamp limit1..50/offset0..2147483647. anon/auth execute.
- Add `get_player_aircraft_record(p_aircraft_id text)` same columns plus user_id uuid; auth required, filter auth.uid AFTER ranking; empty result is valid. authenticated execute only. Duration never in return columns.
- Add nullable `play_sessions.final_score integer check>=0`. Add `finish_play_session(uuid,uuid,bigint,text,integer) returns void` with nonce-bound row lock, nullable final score validation; exact repeated completion idempotent, changed finalized values denied. Existing4arg wrapper delegates NULL. No legacy score backfill. anon/auth execute; direct history remains private.
- Definers SET search_path=''; qualified references. Invalid22023, unauthorized42501; full transaction rollback on error.
### I02. Validation and operator guide
- Related Files: `supabase/tests/aircraft_rankings_history.sql` new; `.memory/validation/2026-11-03-aircraft-rankings/verify-sql.mjs` new; `supabase/AIRCRAFT_RANKINGS.md` new.
- Use TEMP/void-surfer-pg-validation PGlite existing module and existing `.memory/validation/2026-11-02-v02-feedback-release/verify-sql-local.mjs` bootstrap pattern (auth.uid/users/roles). Apply old migrations, seed known legacy best/history, then new migration; assert exact preservation.
- SQL rollback tests: lower aircraft best independent, equal duration tie ordering, old wrappers, public pagination, private SELECT/anonymous write denied, no duration leaks, guest/admin histories, NULL vs0, immutable retry, invalid aircraft/score, rollback. Embedded single connection cannot prove cross-connection concurrency; document lock ordering and that limitation.
- Guide includes prerequisites/order, before/after invariants and exact migration path. No automatic remote mutation.

## Acceptance Criteria
- [x] Known legacy bests/times preserved; independent bests work.
- [x] Old clients compatible; private history/time stay private.
- [x] Actual SQL engine executes migration, role and rollback tests.

## Validation
- `node .memory/validation/2026-11-03-aircraft-rankings/verify-sql.mjs`
- `npm run test -- --run tests/deployment/ranking-duration-schema.test.js`

## Commit Message
```text
feat(db): preserve bests and add aircraft rankings with private run scores

Plan: 2026-11-03-aircraft-rankings-play-history
Phase: P01-rankings
Task: T01-schema
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in git history (T01-schema)
