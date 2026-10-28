# Boss Combat Evolution — final verification

Date: 2026-10-28 (Asia/Seoul). Scope: approved D01..D15, actual local runtime and production assets.

## Results

- Complete Vitest run: **37 files / 500 tests passed**. The strengthened six-portal integration assertions also passed afterward (3 aircraft cases).
- `npm run build`: passed, 91 modules, JS 374.35 kB / gzip 107.45 kB; CSS 18.14 kB / gzip 4.82 kB.
- `npm run verify:config`: passed. `git diff --check`: passed.
- `node scripts/verify-combat-assets.mjs`: passed against Vite production preview on port 4187. All 16 new approved files match source SHA-256 after HTTP delivery; all 53 visual-manifest URLs deliver real PNG data. Original Industrial/Gravity bosses match planning-commit bytes. Deployed JS does not reference `.memory/` URLs.
- Deterministic integration: each of DEFAULT/AEGIS/VELOCITY completes six distinct stage bosses, retries one failed challenge per boss, hits 18 counterattacks and completes all six portal transitions without a stall, unexpected aircraft change or premature stage swap.
- Independent read-only audit: 36 runs / 216 boss clears without scheduler stalls; two additional issues found and fixed below.

## Decision coverage

| Decisions | Evidence |
| --- | --- |
| D01 speed cap; D02 frequency | difficulty/engine tests: score150 base clamp, aircraft factors, smooth return, pause progression and 5..8-point cadence |
| D03–D05 single/global lasers | boss-attacks/engine tests: eligible independent timer, safe normal openings, special exclusion, wall-free global sequence and unlocks |
| D06–D09 combat, failure, roar, stage signatures | boss-signatures, WASD and engine tests plus six-stage integration: real swept collisions, harmless misses, .8s freeze then full countdown, first5/later2.8 seconds, 4-second obstruction, counterattack impact/HP timing |
| D10 selected designs; D11 motion | byte verification, 40 boss-motion tests and actual production-renderer captures: four approved new PNGs, two original PNGs, articulated parts and action effects |
| D12 distinct roar audio | deterministic synthesis/file checks and audio/controller tests: exact approved profiles, pause offsets, mute/menu/restart cancellation and one death-start explosion |
| D13 portal transition | pure transition/engine tests and actual rendered portals: current wall-speed travel, covered swap, no spawn through reveal, bounded resume |
| D14 global shot sequence | 1..3 shots after60% activation; changed consecutive quarters; fresh full warning after each shot, no overlapping damage phases |
| D15 destination ornaments | 61 portal-renderer tests, approved PNG hashes and actual six-destination captures; decorative geometry has no collision role |

## Actual renderer evidence

`runtime.html` imports the production `createRenderer`, asset loader, boss geometry/signatures and portal transition helper. It renders deterministic snapshots to inspect visual integration, not the old preview drawing functions. The separate engine simulation verifies real scheduling; these screenshots do not claim to be manual gameplay captures.

- [Six stage bosses and announced signature paths](./runtime-bosses.png): 53 images loaded, zero image failures. Projectiles have no simultaneous walls, matching the scheduler.
- [Six destination portals](./runtime-portals.png): correct next-stage ornaments and scene visible through the aperture; existing scene remains outside it.
- [Mobile landscape / DPR2 roar](./runtime-mobile-dpr2.png): actual renderer on 844×390 viewport, 1920×1080 backing canvas, contained without stretching.
- [Reduced-motion covered swap](./runtime-covered-swap-reduced.png): full opaque cover hides the scenery switch.

Reproduce: start `npm run dev -- --host 127.0.0.1 --port 4186 --strictPort`, then open `/.memory/validation/2026-10-28-boss-combat-evolution/runtime.html`. `?mode=portal` shows destinations; `?stage=4&roar=1&dpr=2` shows a single roar; `?mode=portal&stage=0&phaseTime=3.7&reduced=1` shows the covered swap. Add `&animate=1` to observe articulated production motion. Browser automation profiles must be outside the watched repository: a locked Firefox `parent.lock` inside it can stop Vite's Windows watcher.

## Final fixes and limits

- AEGIS could not climb from the bottom to the top laser quarter at sustained100ms frames. Preparation now accounts for gravity applied before displacement at the supported maximum frame step, plus reaction margin. Real physics/laser collision tests pass at10/30/60fps.
- The final boss-clear snapshot previously exposed one normal-background frame before creating the portal. Pending stage advance now retains boss scenery until transition cover.
- The mobile challenge test now verifies that HP stays unchanged until the visible counterattack hits, then drops once; repeated touch events still produce no world-input leakage or duplicate success sound.
- No database, auth, leaderboard or deployment settings changed. Hosted account behavior was outside this gameplay validation. Automated audio checks verify PCM/lifecycle, not listening-device loudness or subjective balance. Real-device playtesting can still tune the approved initial combat baseline.
