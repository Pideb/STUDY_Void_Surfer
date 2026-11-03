# Aircraft rankings and private score history — implementation report

Date: 2026-11-03
Scope: approved menu, schema, services, telemetry, local commits. No remote DB mutation, push, release preparation or deployment.

## Delivered
- Four ranking tabs: overall, NOVA, AEGIS, VELOCITY. Overall remains one account-wide best; aircraft bests can be lower and are stored independently.
- Approved visual structure: ship-image tabs, scrollable ranking, pinned own record, guest login hint, existing back navigation. Game-over stays overall-only.
- Both list and own-record requests reject stale responses after tab changes, close/reopen and account changes. Scoped pagination retries the failed offset without duplicating rows.
- Existing bests seed the matching aircraft with original score/achievement time/private tie duration. Old lower scores cannot be recovered. Existing RPC signatures remain compatible.
- Existing private tracker/outbox now retains final score at death or observable abandonment, preserving NULL for unknown legacy data and 0 for known zero. Finalization remains immutable. Guests/admin tests never enter official ranking submission.

## Validation
- Actual SQL in local PGlite: all six migrations and three transactional role-test scripts passed. Known legacy score/history invariants preserved and tests rolled back. See sql.json.
- Targeted service/history/controller checks: 122 passed at T02.
- Full unit/integration suite after UI changes: 85 files / 1,415 tests passed.
- Final production build passed; configuration verification passed after the build. git diff --check passed.
- Player guide check passed, existing update notes unchanged.
- docs:check intentionally remains blocked by the release source fingerprint gate: development source differs from deployed v0.2b. No release was requested, so releases.json/fingerprint/version and protected release snapshots were not rewritten to pretend this source is deployed. Run normal release preparation when deployment is requested.

## Browser evidence and limitation
The actual controller, templates, CSS and aircraft assets were exercised with injected fictional services, not a live Supabase session. browser.json and PNGs record successful 1600×900, 844×390 and 568×320 checks: four tabs, correct columns, fixed personal card during scroll, 44px minimum targets, 13px minimum mobile table font, no horizontal/panel overflow, no runtime exceptions. Native mobile layout uses scale1 rather than shrinking the PC panel.

Visual inspection of the initial 568×320 capture found insufficient table space. A compact single-row personal card and reduced gaps were then browser-tested and captured again. The last small refinement (tighter table line spacing and keep-all heading wrapping) built successfully but could not receive a final screenshot recheck: automatic approval review rejected a new headless Edge launch with `blocked by policy` and supplied no more specific reason. The supported browser connector was unavailable; fallback native Computer Use then stopped because URL policy enforcement is unsupported for the current Windows browser. No further app input was issued. The current verifier adds a minimum-two-whole-rows assertion; that added assertion has not been rerun after the tool interruption. Existing PNGs/browser.json predate only that final spacing refinement.

review.html opens actual fixture frames at both mobile sizes while the local Vite server is running on5174. Fixture records are examples and never write remote data. These captures verify emulation, not physical-device touch behavior.

## Rollout
Apply `supabase/migrations/202611030001_aircraft_rankings_history.sql` once using the ordered procedure and invariants in `supabase/AIRCRAFT_RANKINGS.md`, before deploying the new client. Actual Supabase/JWT/PostgREST and independent multi-connection concurrency were not tested locally. The local engine is single-connection; account row locking serializes score writes by design.

## Adjacent finding
An existing menu test hard-coded v0.2 even though the released registry is v0.2b. It now asserts against the release registry so feature tests do not depend on a stale version literal. No gameplay/audio/balance changes or unrelated preview files were included.
