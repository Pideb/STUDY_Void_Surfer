# Task: T02 Score RPC Compatibility

## Status: pending

## Goal
Keep personal best-score writes working when the deployed Supabase project has the original two-argument score RPC, while retaining aircraft-specific writes when the latest migration is installed.

## Decision Summary
- Prefer the current `submit_score(integer, text, text)` RPC.
- Retry the legacy `submit_score(integer, text)` RPC only for a missing function/signature error; legacy records normalize to the default aircraft.
- Explain that operators must apply all migrations, including `202609230001_aircraft_scores.sql`, for aircraft tracking and current account-score behavior.

## Implementation
### I01. Safe legacy RPC fallback
- Related Files:
  - `src/services/leaderboard-service.js` :: `submitBestScore`; modify
  - `src/services/leaderboard-errors.js` :: schema-cache/missing-function error recognition if needed; modify only if required
- Details:
  - First call `client.rpc('submit_score', { p_score, p_display_name, p_aircraft_id })` as today.
  - If and only if the returned error indicates the 3-argument function/signature is absent (PostgREST `PGRST202` or PostgreSQL undefined-function `42883`, including equivalent explicit missing-function text), retry once with `{ p_score, p_display_name }`.
  - Do not fallback on auth, permission, validation, network, or generic database errors.
  - Normalize and return the legacy record through the existing normalizer, which defaults an absent aircraft ID to `default`; preserve existing result shape and errors if the fallback fails.
  - Keep one game-over submission attempt from the UI perspective; the internal RPC fallback must not trigger a second user-visible submission or leaderboard retry loop.

### I02. Operator migration guidance
- Related Files:
  - `docs/supabase-schema.md` :: migration sequence and deployment reminder; modify
  - `docs/supabase-setup.md` :: applied migration list; modify if it duplicates the sequence
- Details:
  - List migrations in order: `202609210001_void_surfer_leaderboard.sql`, then `202609230001_aircraft_scores.sql`.
  - State that the compatibility fallback can save a score on an older schema but cannot save aircraft identity; apply all migrations with `npx supabase db push` for full features.
  - Do not include secrets or claim the remote project has been updated.

## Acceptance Criteria
- [ ] New schema uses the three-argument RPC without fallback.
- [ ] Missing three-argument RPC uses the two-argument compatibility path once.
- [ ] Other errors are returned without a legacy retry.
- [ ] Documentation identifies the required migration and its aircraft-score impact.

## Validation
- `npm run build`
- Review the fallback predicate and operator migration instructions; do not run the automated test suite unless the user asks for testing.

## Commit Message
```text
fix(leaderboard): support legacy score RPC deployments

Plan: 2026-09-28-menu-score-background-reliability
Phase: P01-reliability-fixes
Task: T02-score-rpc-compatibility

- fall back to legacy score RPC only when the new signature is missing
- document the aircraft score migration requirement
```

## Progress
- [ ] Implementation complete
- [ ] Build validation passed
- commit: pending
