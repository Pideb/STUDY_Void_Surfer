# Current Context

## Active Plan
[Menu, Score, and Background Reliability](./plans/2026-09-28-menu-score-background-reliability.md)

## Active Phase
[P01 Reliability Fixes](./phases/2026-09-28-menu-score-background-reliability/P01-reliability-fixes/phase.md)

## Active Task
None — all tasks in this plan are complete.

## Status
- T01 and T02 are implemented; production builds passed. Remote Supabase migrations remain an operator action.

## Next Step (IMPORTANT)
To enable aircraft-specific leaderboard records on the hosted project, apply all migrations in `supabase/migrations/` with `npx supabase db push` after confirming the linked project.
