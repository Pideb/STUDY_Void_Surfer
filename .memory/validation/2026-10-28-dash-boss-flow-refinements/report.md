# Dash and Boss Flow Refinements — verification

Date: 2026-10-28 (Asia/Seoul).

## Results
- Complete Vitest suite: **41 files / 556 tests passed**.
- Production build: passed,92 modules; JS378.59kB / gzip108.52kB, CSS18.14kB / gzip4.82kB.
- `npm run verify:config` and `git diff --check`: passed.
- Actual Firefox rendering: all53 production visual assets loaded, zero failures. [Feature contact sheet](./runtime-features.png), [six full-height destination portals](./runtime-portals.png), [landscape DPR2/reduced-motion recharge ring](./runtime-dpr2-reduced.png).

## Coverage
| Decisions | Evidence |
| --- | --- |
| D01 cooldown/ring | engine tests:1s clock, blocked re-input has no mutation,0.6s effect ends before recharge, pause freezes/restart resets; actual renderer25%/92%/ready screenshots |
| D01 mandatory spacing | helper plus real-flight tests:9 aircraft/progression cases, normal cadence preserved;18 integration runs across three aircraft, score60/150 and slow/fast/shift bosses measure actual barrier-crossing intervals>=1.2s across encounters |
| D02 press lifecycle | mobile-input tests: duplicate pointer/click prevention, repeated and held keydown, keyup recovery, blur, focused mobile button intercepts native keyup-click queue; WASD inputs remain isolated |
| D03/D04 immunity/offscreen | swept segment tests split frames at protection expiry, immune/admin contacts leave no sticky damage flag, missed shots remain visible behind player, final offscreen edges and curved paths remain finite |
| D05 admin display | old version1 settings default the new flag off; designated/admin-mode gating and guest/ordinary exclusion; independent from invincibility; renderer uses real33×24 trimmed bounds |
| D06 line lasers | two distinct announced/damaging positions, shared clock/front, fallback to one/none, safe moving openings, serialized attacks and no accumulated burst |
| D07 live roar | engine/controller tests accept lift/dash, move world during0.8s roar, then freeze actual WASD with full first5/later2.8 countdown; six-stage integration updated to require live roar clock |
| D08 finite volleys/amendment | deterministic budgets1/2/3 exhaust exactly before WASD; volleys and ongoing spawns coexist with special walls; no wall-type/timing gate in volley branch;3HP clear and+10 points preserved |
| D09 portal | ignores stale/captured playerY, center270; actual aperture contains enlarged ship corners at every legal flight height; same960px travel/covered swap/reveal, six exact ornament designs, no player snapping |

The new18 integration scenarios each complete two bosses, one failed-challenge retry and two portals:36 boss clears and36 portals, plus the retained three-aircraft six-stage regression (18 more bosses/portals). Every challenge verifies its cycle's selected volley budget before accepting input. Ordinary flight does not gain invulnerability to walls, lasers or boundaries.

## Actual renderer harness
Start `npm run dev -- --host 127.0.0.1 --port 4186 --strictPort` and open `/.memory/validation/2026-10-28-dash-boss-flow-refinements/runtime.html`. `?portals=1` shows all destinations. `?single=0&dpr=2&reduced=1` reproduces landscape recharge. These are deterministic snapshots rendered by the real production loader/renderer, not manual-play screenshots or preview drawing functions. Engine tests separately prove scheduling and physics.

## Maintenance notes and necessary integration fixes
- Cooldown is live gameplay time: pause/WASD freeze it; roar does not. `dashCooldownRemainingSeconds > 0` rejects use before creating sound/effects.
- Projectile contacts are checked along each travelled segment. Split at immunity expiry rather than extending protection to the whole frame; never leave a protected contact in the lethal hit latch.
- Barrier spacing uses absolute world distance, a conservative future score/speed bound and delayed mandatory quota slots. Never reuse this wall-generation rule as a projectile scheduling gate: the user explicitly allows volleys during special walls.
- Two-line lasers own one clock and a copied `ys` list. Rendering/collision both use that list; test fixtures setting a single line's `y` must update `ys` too.
- Browser-native Space on a focused mobile dash button normally produces a click at keyup. Intercept that keydown so holding through recharge cannot queue a dash; ordinary button accessibility stays native.
- Admin display is a renderer option gated by account+mode, independent from engine damage settings. Exporting existing collision bounds avoids a divergent debug rectangle. Old settings remain version1 compatible.
- Original portal-command oracle compared the old small, player-following dimensions. It was replaced with geometric containment, fixed-center and unchanged-art/mask checks because the newly approved size intentionally differs; no old test was silently skipped.
- No new art/audio, dependencies, SQL, auth contract, leaderboard or deployment changes. No unrelated blocker found. Physical-device balance and subjective difficulty still need user playtesting; browser captures do not claim those checks.
