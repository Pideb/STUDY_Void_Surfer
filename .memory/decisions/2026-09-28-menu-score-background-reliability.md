# Decisions: Menu, Score, and Background Reliability

- Date: 2026-09-28
- Status: Confirmed

## D01. Logout visibility
- **Chosen**: Keep logout separate from gameplay actions, but tighten the desktop menu grid and spacing so all menu rows fit within the 16:9 game frame. Keep the existing mobile scroll behavior.
- **Rationale**: The logout control exists in the DOM but the desktop menu's padding, row gaps, and action heights can push its row below the clipped game frame.

## D02. Legacy leaderboard schema compatibility
- **Chosen**: Submit with the current three-argument `submit_score` RPC first; only when the database reports a missing function/signature, retry with the legacy two-argument RPC.
- **Rationale**: A deployment that has not yet applied `202609230001_aircraft_scores.sql` should still save the player's best score. Legacy submissions necessarily record the default aircraft because the older schema has no `aircraft_id` column.
- **Constraint**: Do not connect to or mutate the remote Supabase project as part of this local code change. Document that applying all migrations remains necessary for aircraft-specific records and current account-score RPCs.

## D03. Gameplay background brightness and motion
- **Chosen**: Apply a modest dark readability veil over gameplay backgrounds and use a very slow, eased cyclical horizontal drift that starts by moving the full scene from right to left, with subtle vertical parallax. Keep the existing stage transition and reduced-motion handling.
- **Rationale**: The user selected an understated whole-scene drift and requested better contrast without losing the full-screen stage art.
