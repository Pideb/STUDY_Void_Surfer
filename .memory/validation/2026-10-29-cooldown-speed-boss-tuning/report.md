# Cooldown, Speed and Boss Tuning — Validation

- Date: 2026-10-29
- [Actual renderer gallery](./review.html)
- [Confirmed decisions](../../decisions/2026-10-29-cooldown-speed-boss-tuning.md)

## Verified Behavior
| Item | Result |
| --- | --- |
| Actual normal speed | NOVA/AEGIS:240,250,290,330,340,340 at0,10,50,99,100,200 points. VELOCITY:480,490,530,570,580,580. |
| Speed progression | Fixed+10 per10 points for every craft; cap100; no doubled VELOCITY increment. Existing2s easing and boss exceptions retained. |
| Pause/boss scoring | Pause deductions preserve speed progression; boss reward+10 still raises progression. Boss base snapshot and return behavior pass existing engine/stage-cycle tests. |
| Space marker | Production drawDashCooldown: radius8, center204/246 for ship240/270; all three craft. Half-progress detail at remaining.35, gameplay capture at remaining.05; disappears ready. |
| Manual boss weapon | Charge.50s; total lock.70s. Real engine: no damage at.49, HP3->2 at.50, live wall/world movement while ship held. Boundary/one-time/coarse update and partial-frame unlock covered by tests. |
| Wall-free projectiles | Six actual announced paths with no walls in capture. Unit/integration tests cover random3/4/5/6 across all six stages; wall-phase shots stay1; complete cycles reach roar/WASD instead of stalling. |
| Line-laser placement | Whole18px core stays y81..459 (15% excluded each edge); captured line center203.4. Tests cover one/two-line and moving-gap clearance, one-line fallback and skip. Global lasers unchanged. |
| UI text | No speed-cap-score suffix; VELOCITY says initial speed x2; tutorial boss row exactly matches requested sentence. |
| Hitboxes/rendering |16x16 damage and56x36 activation preserved; high-resolution canvas stays viewport-scaled with no document overflow in captured desktop/landscape cases. |

## Commands
- `npm test -- --run` —48 files,650 tests passed (final run after wording clarification recorded before completion).
- `npm run build` — passed; Vite production bundle generated.
- `npm run verify:config` — passed after build; no restricted secret identifiers in public template/build.
- `node .memory/validation/2026-10-29-cooldown-speed-boss-tuning/verify-evidence.mjs` — eight fixtures plus three enlarged ship details passed.
- `git diff --check` — clean.

## Evidence Method and Limits
- `runtime.mjs` imports the production engine, renderer, HUD and53 real assets. No design-preview ring implementation is substituted. Detail images call production drawShip/drawDashCooldown at4x zoom using a real cooldown snapshot.
- Capture-only fixtures use fixed clocks, gravity0, guest mode and collision bypass so patterns can be reached repeatably. These are not changes to ordinary game settings. Actual nonzero-velocity lock, collision risk, damage and complete boss loops are tested separately.
- Native headless Edge captures are1280x720 desktop /640x360 landscape. Exported canvas reports reflect the browser viewport before its final screenshot resize (1254x627 /614x267); renderer handles final resize. PNG headers are checked against each corresponding report rather than assuming outer window size is the earlier viewport.
- Landscape canvas capture uses DPR2 (1228x534 buffer for614x267 viewport); desktop DPR1 (1254x627). Both have no document overflow. Mobile fire is correctly hidden in the ordinary-flight mobile capture, where no boss weapon exists.
- Early Firefox capture processes stalled before loading the page; only isolated task profiles were stopped. Edge completed all captures. No user's normal browser profile was modified or closed.
- Reviewed normal marker, charging, firing, six-shot fan and laser screenshots. Animation feel, the chosen.70s firing risk and reduced speed remain subject to the user's real playtest.
- No additional unrelated issue found. No DB/auth/deployment change.

## Commits
- Plan:9934b6b
- T01 fixed speed:eac7e76
- T02 marker/weapon/UI:60611a7
- T03 volleys/laser:bccbed6
- T04 actual-render/full regression:6f95ba1. Final pointer-sync commit follows this report and is visible in git history.
