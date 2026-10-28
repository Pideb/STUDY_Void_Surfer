# Plan: Menu Music and Manual Boss Laser

## Goal
Implement selected ORBIT RUN menu music, independent10s one-shot weapon and3-hit boss HP, single wall shots plus wall-free1..3 signatures,5s approved ink/glitch, desktop/touch controls and actual renderer verification.

## Decisions
[Confirmed decisions](../decisions/2026-10-28-menu-music-manual-fire.md). User authorized plan and execute through final task unless blocked.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | in_progress | Six sequential runtime/audio/validation tasks | [P01](../phases/2026-10-28-menu-music-manual-fire/P01-runtime/phase.md) |

## Order and rationale
1. Weapon/HP state first so UI consumes a real API.
2. Separate projectile phases so full volleys cannot leak into wall combat.
3. Wire controls/gauge/shot feedback to verified state.
4. Integrate chosen penalty art and duration.
5. Prepare seamless menu score and asynchronous playback.
6. Reconcile legacy automatic-damage assumptions and verify full runtime/build/captures.

## Regression traps
WASD success must never decrementHP; full meter cannot stack; pending audio loads cannot change scene; special presence never suppresses single projectiles; each wall-free repeat must wait offscreen exit and have a fresh warning. Mobile media-query visibility must expose FIRE without adding PC touch buttons.

## Scope
No Azure, Supabase, login or leaderboard changes. No unrelated adjacent issues identified during planning.
