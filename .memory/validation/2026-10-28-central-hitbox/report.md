# Central Hitbox, Clarity and Aircraft Balance — Validation

- Date: 2026-10-28 (Asia/Seoul).
- Result: all five planned Tasks implemented and verified. [Visual review](./review.html).

## Delivered behavior and implementation rationale
- Central **16x16** damage body shared by wall solids, active/swept projectiles, line/quarter lasers and screen boundaries. `getPlayerBounds` is shared; body dimensions no longer come from the36x24 visual dimensions. Ordinary play has no boxes; administrator debug draws the real16px body.
- Independent **56x36** success rectangle for every aircraft. `success.right >= wallX - speed*windowSeconds` enables a fresh Space press from first contact, even with the center outside. Large-box contact never causes damage; hybrid vertical clearance still uses16px. Actual small-body solid overlap is not rescued retroactively. Bands retain.30/.15s, cooldown.7s and mandatory-special passage separation1.2s.
- One/two-line laser damage cores fit within logical y54..486 (top/bottom10% excluded), i.e. current18px beam centers y63..477. Existing moving openings remain protected; two-line no-fit falls back to one, full no-fit skips. Global laser rules stay unchanged.
- Score-driven speed caps: **VELOCITY70 / NOVA and AEGIS100**, with existing aircraft/boss multipliers and gradual transitions. Boss entry snapshots and conservative future barrier-speed bounds use the same aircraft cap. Pause still cannot lower progression speed; final-score multiplier stays separate.
- Boss HP always initializes/displays **3/3**. AEGIS manual laser applies3damage at one impact and records one landed shot; others do1damage and need3shots. Gauge/inputs/timing/clear reward remain unchanged. Hangar/tutorial/README describe the exception.
- Canvas buffer follows actual CSS extent and DPR (capped2), with a **3840x2160 total-pixel ceiling**. Independent logical X/Y scales preserve960x540 gameplay coverage. High-quality image sampling, allocation only on dimension change and cached scene redraw keep menus/paused views intact during resize. Original selected aircraft art is retained.

## Automated checks
- `npm test -- --run`: **48 files / 621 tests passed**.
- `npm run build`: passed (96 modules; main JS387.76kB /111.75kB gzip, CSS18.70kB /4.88kB gzip).
- `npm run verify:config`: passed, run after the build.
- `git diff --check`: passed.
- `node .memory/validation/2026-10-28-central-hitbox/verify-evidence.mjs`: eight actual-renderer reports/images validate geometry, pixel sizes, asset loads, viewport fit, UI states, AEGIS impact and line placement.
- Focused Task checks covered: exact body edges/harmless wing grazes and real debug geometry; full swept projectile traversal and immunity; large-box first contact/center-outside/front-past-wall cases;699ms blocked/700ms ready cooldown retained; bounded1/2-line placement/no-fit; cap thresholds69/70 and99/100, huge scores, pause, boss transitions/future spacing; AEGIS exactly-one-hit damage/reward; resize/DPR/fallback/cap/cached redraw and cleanup.
- Existing multi-cycle integration still covers all three aircraft and six stage identities, penalties/retries, wave quotas, minimum special separation, boss clear rewards, portals and restart. AEGIS's expected attack count changed from18 to6 across six bosses, preserving every boss's3HP initialization and failure/success challenge coverage before manual fire.

## Confirmed integration defect repaired
- A real low-FPS simulation at VELOCITY cap exposed a wall-crossing miss: a24px special barrier moved from x283.69 to190.15 in a100ms frame, crossing the entire16px body while neither endpoint overlapped it.
- Added `intersectsSweptPlayerObstacle` to check the horizontal contact interval and in-frame opening/player motion. It also handles ordinary/hybrid solids and preserves targeted dash protection through the actual contact interval, rather than incorrectly revoking an already-completed protected crossing when the dash expires later in the frame.
- Dedicated unit/runtime tests reproduce and prevent the thin-wall miss; no additional invincibility or attack rule was introduced. This is necessary to make the approved small-body geometry reliable at high speed.

## Actual renderer evidence
All fixtures use the production renderer/HUD/styles and states driven through the public engine API; all load **53/53** visual assets. Deterministic framing uses gravity0 and collision bypass. DPR2 is emulated in the review page only. These are real browser renders, not AI-generated replacement game screenshots.

| Fixture | CSS viewport | Actual canvas buffer | Verified result |
| --- | --- | --- | --- |
| [desktop-layout.png](./desktop-layout.png) |1920x1080,DPR1|1920x1080|No fixed960px enlargement; no touch fire button.|
| [mobile-layout.png](./mobile-layout.png) |640x360,DPR2|1280x720|Fire button/gauge fit, no document overflow.|
| [fourk-layout.png](./fourk-layout.png) |3840x2160,DPR2|3840x2160|Pixel ceiling prevents8K allocation; logical world unchanged.|
| [geometry-layout.png](./geometry-layout.png) |1920x1080|1920x1080|Actual16px square plus diagnostic56x36 outline; successful overlap with center still outside band.|
| [aegis-start-layout.png](./aegis-start-layout.png) |1920x1080|1920x1080|HP3/3 before fire.|
| [aegis-hit-layout.png](./aegis-hit-layout.png) |1920x1080|1920x1080|HP0/3 at one actual impact, laserHits1/damageTaken3.|
| [velocity-layout.png](./velocity-layout.png) |1920x1080|1920x1080|Correct craft snapshot,70-point cap.|
| [laser-layout.png](./laser-layout.png) |1920x1080|1920x1080|Actual generated beam y208.8, damage core inside the allowed interior.|

- [clarity.png](./clarity.png): same production `drawShip`, original art and logical size, isolated against the same quiet background. Left1x raster enlarged versus right2x raster, to illustrate the Full HD drawing-density change without scene clutter. Both crops are enlarged for inspection, not a second change to ship size.
- Reports in the matching `.json` files include exact viewport/buffer dimensions, body/success coordinates, speed/damage metadata, HP labels, assets and overflow flags. Raw canvas PNGs match reported buffer dimensions; `*-layout.png` includes the actual DOM HUD.
- Reproduce: Vite on127.0.0.1:4186, `node .memory/validation/2026-10-28-central-hitbox/serve.mjs`, then native Firefox headless screenshot with an own temporary profile and `--window-size` to runtime.html mode=desktop/mobile/fourk/geometry/aegis-start/aegis-hit/velocity/laser plus capture=1 and optional dpr=2. A local image-load barrier holds page load until PNG/report exports finish, preventing screenshot-mode browser shutdown from truncating async capture. Native screenshot mode is required for requested viewport sizes; ordinary headless launching ignored that option in this environment.

## Limits / adjacent work
- Real-device FPS, subjective image quality on the user's monitor and physical touch ergonomics still require play feedback. This review verifies pixel dimensions/rendering and deterministic flows, not a sustained4K performance benchmark.
- Increasing render pixels does not invent detail absent from source backgrounds. Aircraft originals1536/1774px remain ample; no new art was generated.
- No unrelated issue requiring another Task was found. Azure/Supabase/auth/leaderboard were not changed and no deployment/push was performed.
