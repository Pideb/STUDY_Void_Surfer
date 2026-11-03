# Startup update dialog — implementation and remote SQL verification

Date: 2026-11-03. Scope: local implementation/commit plus explicitly requested read-only remote checks. No push, version bump, deployment, remote migration or score/history write.

## Delivered
The approved dark/cyan modal now overlays the real title menu at fresh startup. src/main.js injects docs/player/updates.json entries[0], the same data the guide generator uses. Exact version/date/bullets are rendered with textContent. The guide link retains all previous update entries in the existing guide.

Confirm/Enter/Space/Escape dismiss to the menu; keyboard focus stays inside while open. Background dispatch/input is blocked and the menu root is inert. Auth/menu repaints retain the same modal. It does not reopen on return-menu, game-over or immediate restart; fresh app mount displays it again. Orientation gate has priority, restoring pending popup when rotated back. First-gesture audio unlock remains unchanged. Missing/malformed update data fails open to the menu.

The popup is a sibling of the scaled desktop menu, so landscape mobile uses native text/action sizes rather than shrinking. Approved640px maximum,16px mobile body text,44px+ confirm target, safe-area padding and reduced-motion rules are retained.

## Checks
- Targeted modal/controller suite:71 tests passed.
- Full regression:86 test files /1,421 tests passed.
- Production build, verify:config, guide:check and git diff --check passed.
- docs:check reaches the expected release-fingerprint gate because local game source differs from published v0.2b. No release was requested; deployed registry and protected HTML snapshots were not rewritten.
- Actual renderer/controller/CSS screenshots inspected: desktop1600×900, mobile844×390 and568×320;375×812 portrait correctly prioritizes the existing rotate-to-landscape gate with no horizontally clipped content. Fixture uses mocked services and disables entrance/ship animations only for deterministic capture. No live database calls occur from that fixture. Physical-device touch behavior and previously stored login session writes are not exercised by screenshots.

## Remote SQL results
See remote-sql.json for timestamped aggregate evidence, generated using Vite-loaded public environment configuration without printing credentials. All operations used GET reads.

- get_public_leaderboard: HTTP200,13 rows.
- get_aircraft_leaderboard: default/NOVA10, AEGIS2, VELOCITY1, all HTTP200 with correct aircraft scope and no private time/user-ID columns.
- All13 observed overall rows have a matching aircraft row with the same public display name, score and achieved_at. This is observational matching of public records, not private-ID-based proof of every migration invariant.
- Anonymous get_player_aircraft_record, aircraft_scores duration read and play_sessions final_score read explicitly rejected with42501 (HTTP401). Public/private boundaries remain enforced.

**Not remotely verified:** authenticated score submission/update, private final_score column/storage behavior, exact historical private tie durations and independent concurrent transactions. Those require a legitimate logged-in session or operator DB connection. No auth tokens were extracted and no synthetic runs/scores were created. The earlier local SQL role/preservation tests remain the evidence for those implementation contracts, not a claim about live writes.

## Learning notes
- `startupUpdateEntry: playerUpdates.entries[0] ?? null` keeps one content source for guide and startup UI. No duplicate release strings need updating.
- `root.inert = blocked || startupUpdateOpen` composes orientation and modal restrictions; closing the popup cannot accidentally enable a portrait game screen. Consuming modal key events also prevents the same Space press from activating the background menu.
- Dedicated host outside menu-design-space avoids both desktop scaling on mobile and modal destruction during async auth repaints.
- Adjacent issue/debt found: no new unrelated changes required. The existing release-doc fingerprint gate remains intentionally pending the next deployment request.
