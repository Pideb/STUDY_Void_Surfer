# Plan: Pilot Ranking, Admin Tools, and Guest Mode

## Goal
Complete the confirmed boss-projectile collision correction, add scrollable global Pilot Ranking, expose isolated client-side admin test controls, and let visitors play as GUEST without signing in. Guest best scores persist only in that browser, guests can use every aircraft and view public rankings, and guest scores never enter or transfer to the account leaderboard.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Guest-first startup, local guest score, and aircraft access | [P01](../phases/2026-09-30-pilot-ranking-admin-guest/P01-guest-mode/phase.md) |
| P02 | `done` | Public read-only leaderboard pagination and Pilot Ranking UI | [P02](../phases/2026-09-30-pilot-ranking-admin-guest/P02-pilot-ranking/phase.md) |
| P03 | `done` | Boss projectile collision correctness and admin test controls | [P03](../phases/2026-09-30-pilot-ranking-admin-guest/P03-boss-admin/phase.md) |
| P04 | `in_progress` | Cross-flow regression and release validation | [P04](../phases/2026-09-30-pilot-ranking-admin-guest/P04-integration-qa/phase.md) |

## Confirmed Scope
- Use `.memory/decisions/2026-09-30-pilot-ranking-admin-tools.md` as the source of truth for all behavior and safety boundaries.
- Keep admin gating client-side and explicitly document that it is a test convenience, not a secure authorization boundary.
- Never allow guest mode to invoke score-write RPCs; anonymous leaderboard access must be read-only and limited to public ranking fields.
- Do not transfer the guest local record into an authenticated account automatically or silently.
