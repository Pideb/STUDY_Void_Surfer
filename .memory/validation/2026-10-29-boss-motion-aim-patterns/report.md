# Boss Motion, Aiming and Random Patterns — Implementation Evidence

Date: 2026-10-29. All thirteen confirmed decisions implemented across six sequential tasks. [Local visual review](./review.html).

## Verification

- `npm test -- --run`: **51 files / 678 tests passed**. Includes all three aircraft through six distinct stage bosses, failed/successful challenges, retries, actual aimed shots, portals, scoring, guest/admin controls, input, pause/restart and snapshot isolation. See [test output](./tests.log).
- `npm run build`: passed;98 modules, JS393.36kB/gzip113.81kB, CSS19.30kB/gzip5.06kB.
- `npm run verify:config`: passed after build; no restricted secret identifiers in public template/build output.
- `git diff --check`: passed.
- `node .memory/validation/2026-10-29-boss-motion-aim-patterns/verify-evidence.mjs`:14 actual-runtime cases,29 PNGs, all53 visual assets loaded, no capture errors or document overflow.

## Decision Coverage

| Decisions | Result / evidence |
| --- | --- |
| D01 | Passed special guide captures pre-transition width75px while current forward guide becomes37.5px; moving-gap update continues. `boss-entry.test.js`, `obstacles.test.js`, passed capture. |
| D02–03 | Old walls drain fully left before.4s darkening,1.5s alert and1s entrance; foreground control/trail retained and background swapped under darkness. Drain/intro/entrance images plus `boss-entry.test.js`. |
| D04–06 | One shared6s motion clock, center108..432; amplified articulation and live muzzle/recoil/roar geometry. Each unlaunched projectile preview follows muzzle until its own launch, then never homes. Six-row actual action board; geometry/motion/signatures tests. |
| D07 | Horizontal player beam tests full nominal body plus articulated extents over its.2s active interval, including swept vertical crossing. No core-only or homing auto-hit. Hit3→2, miss3→3, AEGIS3→0/one impact shown in actual engine captures. Dead ship cannot apply later damage; existing lock/recharge/input behavior retained. |
| D08 | Actual bottom-center80px reactor arc, percent/READY/FIRE, key labels, real10s charge and mobile fire preserved. PC/landscape screenshots and DOM progress semantics tests. |
| D09 | All craft cap200; actual general speed NOVA/AEGIS240→440, VELOCITY480→680. Same+10 steps, eased2s; existing independent boss factors and monotonic progress preserved. Numeric engine/difficulty tests. |
| D10 | Minimum4/max8 keys; first5s/later2.8s; partial ink/glitch8s including1.2s fade. Challenge and full-encounter tests. |
| D11 | Teal safe fill/boundaries/chevrons, clipped red danger hatching; original cyan/white right-to-left beam retained. No visible SAFE/DANGER/countdown text. All four safe quarters tested; normal and bottom-quarter screenshots reviewed. Timing/collision unchanged. |
| D12 | Every eligible block once per shuffled round; boss1 excludes global, boss2+ always includes it; no adjacent boundary repeats. Three whole rounds on bosses1/2/7 and seeded six-stage regressions pass; hazards drain without deletion or overlap. |
| D13 | Removed lower boss-pattern label, enemy-laser sentences, WASD headings/duplicate canvas keys. Kept speed arrows **and words**, one DOM sequence/time, charge/fire/HP/score/entrance notices and functional controls. No menu/tutorial/result text changes. |

## Runtime Capture Method and Limits

`runtime.mjs` imports the production engine, asset loader, renderer, HUD and CSS. Fixtures use public APIs and deterministic RNG; only gravity0 and collision bypass make images repeatable. They do not inject boss geometry, weapon hits, projectiles or hazard states. Camera/pose comparisons crop rendered images; row captions are evidence annotations outside the product.

Raw canvas PNGs use measured buffers1414×807 for desktop and674×307 for landscape. Edge's final native screenshots resize to1440×900 and700×400 after page load; the renderer redraws its stored snapshot on resize. JSON records describe the pre-screenshot measured export, not an invented viewport size. The manifest records both actual PNG dimensions separately. PC hides touch buttons, landscape shows them; no recorded overflow. Images and actual JSON HP/guide values were reviewed.

The initial bulk browser-launch command was rejected by automatic command review; individual headless captures succeeded. No user browser sessions were controlled or closed. Vite4186 was left running; only this task's capture server was stopped after export.

Human live-play difficulty/feel and hardware-specific motion perception still warrant the user's playtest. No external login/DB/deployment mutation was part of this change. No unrelated defect was found requiring extra scope.

## Task Commits

- T01 `ff0864e`: guide/entry/basic tuning.
- T02 `fe43080`: shared live motion and projectile origins.
- T03 `9f4184c`: aimed horizontal beam contact.
- T04 `386497b`: shuffled complete pattern blocks.
- T05 `61a5bb9`: reactor/global graphics/text cleanup.
- T06: recorded in the [task blueprint](../../phases/2026-10-29-boss-motion-aim-patterns/P01-runtime/T06-integration-evidence.md) after commit; final memory-sync commit closes the pointer.
