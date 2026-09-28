# Plan: Menu, Score, and Background Reliability

## Goal

Make the logout control reliably visible, preserve best-score writes when a deployed Supabase database still has the legacy RPC, and improve gameplay background readability and motion without changing gameplay rules.

## Source Decisions
- [Menu, Score, and Background Reliability](../decisions/2026-09-28-menu-score-background-reliability.md)

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Fix menu fit, gameplay background readability/motion, and legacy leaderboard write compatibility. | [P01](../phases/2026-09-28-menu-score-background-reliability/P01-reliability-fixes/phase.md) |

## Global Constraints
- Do not change gameplay collision, scoring, obstacle timing, or stage ownership.
- Preserve the separated logout action and the existing reduced-motion stage transition.
- Do not print or commit `.env` secrets; do not apply changes to remote Supabase.
- Legacy fallback is only for missing RPC signatures; never mask authentication, authorization, network, or validation failures.
