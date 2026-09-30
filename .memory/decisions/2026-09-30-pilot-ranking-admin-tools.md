# Decisions: Pilot Ranking and Admin Tools

- Date: 2026-09-30
- Status: Confirmed

## D01. Reflected Boss Projectile and Hit Detection
- **Chosen**: Keep reflected shots on a straight return path toward the BOSS. A projectile that passes the player without overlapping is a miss and does not cause game over. A physical overlap causes game over unless invincibility is enabled. Use a centered `16x11px` projectile-body hitbox against the existing player hitbox; ignore the decorative glow. Keep the reflection judgment window independent from collision bounds.
- **Rationale**: Reflection should visibly hit the BOSS, while a projectile that misses the player should not be treated as a hit. The compact hitbox makes visual contact fair and distinct from the dash timing window.
- **Repository finding**: `updateReturningProjectile` already linearly interpolates from the player location to the recorded BOSS coordinates. The incoming projectile currently sets `hitPlayer` merely when crossing the target X coordinate; the new actual-overlap test replaces this false-positive behavior.

## D02. First-BOSS Reflection Guide
- **Chosen**: During the first BOSS encounter, visibly show the reflection-success window for every projectile until that BOSS is defeated. Later BOSS encounters do not receive this beginner guide.
- **Rationale**: Teach the dash timing repeatedly through the first encounter, consistent with the early special-wall judgment guide.

## D03. Pilot Ranking Screen
- **Chosen**: Add a dedicated `파일럿 랭킹` view accessible from both the main menu and game-over screen. Show all pilots in a vertically scrollable ranking table, loading additional pages as the list is scrolled. Pin the current player's rank, pilot name, aircraft, and best score below the table.
- **Rationale**: Allow access outside of a run, preserve game-over access, and keep the player's own standing visible while browsing.
- **Repository finding**: Existing ranking RPC caps each response at 50 rows; use up to 50 rows per page and extend the RPC/query contract for offset or cursor pagination. Existing rank ordering and aircraft identity should be preserved.

## D04. Admin Access and Controls
- **Chosen**: Show an admin control button only to the signed-in account `gh.lee@dexconsulting.net`. Place it at the top-left corner of the main menu, separate from regular menu actions. Clicking it opens an admin settings dialog with admin-mode ON/OFF and invincibility ON/OFF controls.
- **Rationale**: Keep test controls isolated and unavailable to other signed-in players.
- **Chosen**: Admin mode and invincibility settings stay active across retries until manually turned off. Admin mode remains independent from invincibility; an admin run continues scoring locally but skips leaderboard submission in the client.
- **Security limitation**: Client-side suppression matches the selected scope but is not tamper-proof; an authenticated user who alters the browser can still call the score RPC directly. The existing score system also trusts client-submitted scores.

## D05. Invincibility Exceptions and Boss Progression
- **Chosen**: Invincibility prevents ordinary wall, laser, and actual projectile-collision game-over outcomes. Contact with the top or bottom world boundary remains fatal. Preserve the existing WASD challenge failure penalty (ink/glitch feedback); challenge failure does not become a fatal collision.
- **Chosen**: In invincibility mode, a missed BOSS projectile does not damage the player or BOSS; resolve it as a miss and let the encounter continue to its next attack/wave. BOSS health still requires successful reflections to decrease.
- **Rationale**: Admin invincibility permits extended testing without bypassing boss combat progression or removing the explicitly retained boundary and challenge penalties.

## D06. Existing Warning/Boss Pacing
- **Chosen**: Keep the current first-BOSS timing and alternating WARNING/BOSS schedule unchanged.
- **Rationale**: The user chose to retain the current pacing after reviewing the first BOSS's approximate 35–40 point appearance.

## D07. Pagination Batch Size
- **Chosen**: Load additional ranking rows on scroll in batches of up to 50.
- **Rationale**: The current leaderboard RPC already caps a single response at 50 rows; paging preserves that limit and avoids loading every score at once.

## D08. Guest Mode and Initial Screen
- **Chosen**: App startup always lands on the main title/menu even when no account is signed in. The account action in the menu is `로그인` for guests and `로그아웃` for signed-in users; the guest identity is displayed as `GUEST`. The guest login action starts Microsoft sign-in from the menu rather than forcing an initial login gate.
- **Rationale**: Let players try the game without account setup while keeping account access available from the title screen.

## D09. Guest Score and Aircraft Access
- **Chosen**: Guest runs save a separate best score in browser local storage, never submit scores to the global leaderboard, and never auto-transfer the guest record to an account on sign-in. Guests can use every aircraft without unlock requirements. Store the best final score and the aircraft that achieved it under a versioned guest-local record; malformed stored data falls back safely to zero.
- **Rationale**: Preserve guest progress on that browser without treating an unverified client-side score as an account leaderboard result.

## D10. Guest Leaderboard Visibility
- **Chosen**: Guests can open Pilot Ranking and read the global leaderboard, but cannot submit scores. The signed-in player's account best remains pinned for signed-in users; guests see their local best in the pinned personal panel with no global rank.
- **Rationale**: Ranking remains discoverable to guests while clearly distinguishing local-only scores from verified account entries.
- **Security requirement**: Expose only public ranking fields to the anonymous role through a dedicated read-only query/RPC; do not grant anonymous score writes or expose auth/profile internals beyond display name, score, achieved time, and aircraft.
