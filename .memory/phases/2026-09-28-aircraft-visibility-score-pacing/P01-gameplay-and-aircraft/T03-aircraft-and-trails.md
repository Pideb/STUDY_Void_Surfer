# Task: T03 Aircraft Tuning, Visibility, and Flight-Path Trail

## Status: done

## Goal
Make aircraft more visible without changing their shared collision hitbox; apply confirmed names/order/stats; replace three short straight marks with one long, bright trail following the ship's recent curved path and tapering toward its oldest end.

## Decision Summary
- Keep internal ID `default` but display NOVA; order NOVA, AEGIS, VELOCITY.
- AEGIS uses 2x gravity and 60% default lift; all aircraft retain 36 x 24 logical hitboxes.
- Enlarge ship drawing to about 1.5x current size. Use one smooth cyan/magenta/amber trail, thick near ship and thin/faint at the oldest end.

## Implementation

### I01. Apply names, ordering, lift, colors, and ship visibility
- Related Files:
  - `src/game/aircraft.js` :: `definitions`, `AIRCRAFT_CATALOG`; display `default` as NOVA; order definitions default, aegis, velocity; preserve IDs/unlock scores.
  - `src/game/constants.js` :: `AEGIS_LIFT_MULTIPLIER = 0.6`; retain 2x gravity and shared `PLAYER_WIDTH=36`, `PLAYER_HEIGHT=24`.
  - `src/game/renderer.js` :: `drawShip`; increase loaded image and vector fallback drawing to 1.5x current render size without mutating player dimensions.
  - `src/game/visual-theme.js` :: `AIRCRAFT_VISUALS`; keep NOVA cyan/teal, VELOCITY bright magenta, AEGIS bright amber/gold.
  - `src/ui/app-controller.js` :: `getHangarAircraft`; show NOVA, AEGIS lift 60%/gravity x2, VELOCITY final score x1.5.
  - `src/ui/leaderboard-view.js` :: catalog-based presentation; ensure legacy `aircraft_id=default` shows NOVA.
  - `tests/game/aircraft.test.js`, `tests/game/game-engine.test.js`, `tests/game/renderer.test.js`, `tests/ui/screens.test.js`, `tests/ui/app-controller.test.js`, `tests/services/leaderboard-service.test.js` :: update expectations and cover render/hangar/leaderboard names.

#### Details
- IDs and unlocks stay unchanged: `default`/0, `aegis`/50, `velocity`/100.
- Catalog order is `['default','aegis','velocity']`; unlock membership and selection validation remain unchanged.
- Current asset drawing uses 1.2x. Use total factor 1.8x (`1.2 * 1.5`) for loaded assets; use corresponding factor in canvas fallback. Preserve logical collision bounds and 3-unit forward trim.
- Use existing color identities: NOVA cyan (`#55f6e5` family), VELOCITY magenta (`#ff55cf` family), AEGIS amber (`#ffc45c` family), with bright highlights.

### I02. Store and render a curved path-following trail
- Related Files:
  - `src/game/game-engine.js` :: run state, `start`, `update`, `getSnapshot`; maintain `flightTrail: Array<{x:number,y:number,ageSeconds:number}>`; age points, shift older points left by current scroll speed, append at ship rear/y during active flight, expire after 1.2 s or outside viewport, reset per run.
  - `src/game/renderer.js` :: `drawShipExhaust`, `createRenderer().render`; replace three fixed lines with one continuous smooth curve from snapshot `flightTrail`, rendered behind ship in aircraft accent color, rounded caps, bright core/glow and age taper (about 6 px near ship to under 1 px at oldest point).
  - `src/game/visual-theme.js` :: aircraft accent/trail constants if needed; honor existing reduced-motion behavior.
  - `tests/game/game-engine.test.js`, `tests/game/renderer.test.js` :: sample path, scroll, expiry, reset, draw style, snapshot immutability.

#### Details
- The player's x remains screen-fixed; each old point shifts left by `difficulty.scrollSpeed * deltaSeconds` to represent travel through space while y records vertical steering.
- Append points after physics update during active play; do not add samples while paused or ordinary flight is frozen by a WASD challenge. On resume retain points without a large delta jump.
- Snapshot exposes a defensive `flightTrail` copy; renderer does not mutate it.
- Render one continuous stroke (smoothed path or densely sampled polyline), not parallel lines or a straight nozzle flame. Width and alpha narrow/fade toward oldest points; cap history at 1.2 s and viewport.

## Acceptance Criteria
- [x] NOVA/AEGIS/VELOCITY order and names appear consistently without changing stored IDs.
- [x] AEGIS lifts stronger and retains 2x gravity.
- [x] Ship art is about 1.5x more visible; hitbox is unchanged and equal across aircraft.
- [x] One long curved trail follows vertical movement, uses distinct bright colors, tapers/fades at its oldest end, and remains bounded/resettable.

## Validation
- `npm test -- --run tests/game/aircraft.test.js tests/game/game-engine.test.js tests/game/renderer.test.js tests/ui/screens.test.js tests/ui/app-controller.test.js tests/services/leaderboard-service.test.js`
- `git diff --check`

## Commit Message
```text
feat(aircraft): improve visibility and add curved flight trails

Plan: 2026-09-28-aircraft-visibility-score-pacing
Phase: P01-gameplay-and-aircraft
Task: T03-aircraft-and-trails

- Rename and reorder the aircraft catalog while preserving IDs
- Enlarge ship art and draw a tapered path-following trail
```

## Progress
- [x] Implementation complete
- [x] Validation passed: focused 6-file suite (106 tests), `git diff --check`
- commit: `feat(aircraft): improve visibility and add curved flight trails`
