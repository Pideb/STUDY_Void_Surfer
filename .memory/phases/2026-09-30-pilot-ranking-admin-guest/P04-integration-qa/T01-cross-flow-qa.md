# Task: T01 Cross-Flow QA

## Status: done

## Goal
Validate the full feature set across guest, authenticated, admin, game-over, and ranking routes; confirm the SQL migration is ready to apply to the hosted Supabase project.

## Decision Summary
- Guests can play/select all aircraft, store local best, and read public rankings but never submit/transfer scores.
- Admin suppression is client-only; ranking RPC is the only new anonymous capability and is read-only.

## Implementation

### I01. Cross-flow regression and operator instructions
- Related Files:
  - `tests/integration/game-flow.test.js` :: guest/account/admin full-run paths; modify
  - `tests/integration/leaderboard-failure.test.js` :: ranking load failure and account submit retry separation; modify
  - `README.md` :: guest behavior, public migration deployment, and admin limitation; modify
  - `supabase/migrations/YYYYMMDDNNNN_public_leaderboard_read.sql` :: final security review; read-only unless tests require correction

#### Details
- Run full unit/integration suite, build, and config verification. Exercise via tests: first-load guest, guest all-plane selection, guest game-over local persistence, guest global ranking read, menu sign-in, account submission, account logout, non-admin/guest absence of admin controls, designated-admin no-submit, invincibility boundaries, and boss projectile overlap/miss/reflection progression.
- Review migration grants: anon has execute only on safe read-only ranking RPC; no anonymous access to `submit_score`, `get_player_best_score`, or `get_player_neighborhood`; row fields do not include UUID/email.
- Document the exact migration filename and application steps for the hosted Supabase project in README. State clearly that guest score is browser-local and cannot be restored across browsers/devices, is not transferred at login, and is not leaderboard-eligible.
- Do not claim hosted migration was applied unless a remote apply is performed and verified. If remote configuration/credentials are unavailable, finish local validation and leave deployment application as an explicit operator step.

### I02. Final automated verification
- Related Files:
  - all touched unit/integration tests; validate
  - Vite output; validate only

#### Details
- Run `npm test -- --run`, `npm run build`, `npm run verify:config`, and `git diff --check`.
- Confirm no guest path calls submit RPC and no admin-only account data enters anonymous ranking results.

## Acceptance Criteria
- [x] All automated tests, build, config verification, and diff checks pass.
- [x] README explains guest persistence boundaries, ranking visibility, migration application, and admin security limitation.
- [x] Deployment status distinguishes locally reviewed SQL from a migration actually applied to hosted Supabase.

## Validation
- `npm test -- --run`
- `npm run build`
- `npm run verify:config`
- `git diff --check`

## Commit Message
```text
test(app): verify guest ranking and admin flows

Plan: 2026-09-30-pilot-ranking-admin-guest
Phase: P04-integration-qa
Task: T01-cross-flow-qa

- Cover guest and authenticated navigation end to end
- Verify anonymous ranking is read-only and admin scoring is skipped
- Document Supabase migration and guest score boundaries
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
