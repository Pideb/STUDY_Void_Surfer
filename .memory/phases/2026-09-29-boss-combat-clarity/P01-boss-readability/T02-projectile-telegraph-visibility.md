# Task: T02 Projectile and Trajectory Telegraph Visibility

## Status: done

## Goal
Make incoming BOSS projectiles and their pre-fire paths easy to distinguish on every stage while ensuring the visible preview exactly matches the projectile's actual direct or parabolic flight path.

## Decision Summary
- Use a bright stage-colored glow/outline around the projectile, with a white/high-contrast core edge. Draw a thicker glowing trajectory and larger dotted markers during charge.
- Share the projectile position formula between trajectory sampling and live flight; do not change speed, collision, charge, or reflection windows.

## Implementation

### I01. Share a single projectile path calculation between preview and flight
- Related Files:
  - `src/game/boss-attacks.js` :: `createBossProjectile`, `updateFlyingProjectile`, new `getBossProjectilePoint`; precompute direct and parabolic telegraph points from the same model fields.
  - `tests/game/boss-attacks.test.js` :: verify the preview points lie on the path at matching normalized flight progress for direct and parabolic projectiles, including positive/negative curve directions and amplitude bounds.

#### Details
- Introduce a pure helper with signature:
  ```ts
  function getBossProjectilePoint(projectile, progress) {
    // returns { x: number, y: number }
  }
  ```
- Clamp progress to `[0, 1]`; use `distance = max(1, abs(bossX - targetX))` and `x = bossX - distance * progress`.
- Use linear interpolation `startY + (targetY-startY)*progress`; for `kind === 'parabolic'`, add `sin(progress * PI) * curveAmplitude`.
- Assign `curveAmplitude` before generating preview points. Direct projectiles use amplitude zero. Generate nine ordered preview points for both direct and parabolic shots at `progress = index / 8`, index 0..8.
- In `updateFlyingProjectile`, retain existing x advancement and normalized progress calculation, then set projectile x/y from the shared helper. Preserve the existing miss/hit transition and reflection state behavior.
- Avoid consuming additional random values for the preview; retain the current projectile's single randomized curve amplitude and speed.

### I02. Increase charge-path and projectile sprite contrast
- Related Files:
  - `src/game/renderer.js` :: `drawProjectile`; draw a high-contrast thick path with larger spaced markers while charging; add a colored outer halo and light inner outline around loaded/fallback projectile while flying/returning.
  - `tests/game/renderer.test.js` :: assert increased path width/marker radius, glow/outline draw calls, charging/flying states, and stage-asset rendering.

#### Details
- Charging trajectory:
  - Draw sampled path in `theme.projectile` with glow blur 16–20 and line width 4, alpha at least 0.85.
  - Overlay a thinner light core (`#f4ffff`, width 1.5, alpha at least 0.85) for contrast on both light and dark backgrounds.
  - Draw every sampled marker as a 4-pixel radius accent dot with a 2-pixel light center. Path begins at `(bossX,bossY)` and ends at `(targetX,targetY)`.
- Charging direct shots also use the sampled points; do not fall back to a separate approximate straight-line formula.
- Flying/returning projectile:
  - Preserve existing asset dimensions and rotation; before drawing image/fallback core, draw a `theme.projectile` halo ring around `(attack.x, attack.y)` at radius 18, with 3px line and 18px glow blur; draw a light inner outline radius 12 at 1.5px.
  - Keep existing return-beam and `attack.state` alpha semantics unless the new outline requires local alpha save/restore.
- Restore canvas alpha, line width, dash state (if used), styles, and shadow before leaving `drawProjectile`; do not leak drawing state into boss, laser, or ship passes.
- Visual-only: no changes to projectile hitbox, art file, attack schedule, speed, reflection timing, or damage.

## Acceptance Criteria
- [ ] Preview ends and begins at projectile endpoints and matches sampled flight coordinates for all curve amplitudes/directions.
- [ ] Direct and parabolic charge previews are visible; trajectory and marker contrast is stronger than the existing thin, faint line/dots.
- [ ] Loaded and fallback projectile sprites have a readable halo/outline in flight and return states.
- [ ] Projectile movement, collision, and reflection behavior are unchanged.

## Validation
- `npm test -- --run tests/game/boss-attacks.test.js tests/game/renderer.test.js` — pass trajectory/path equivalence and rendering assertions.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
feat(boss): clarify projectile and trajectory telegraphs

Plan: 2026-09-29-boss-combat-clarity
Phase: P01-boss-readability
Task: T02-projectile-telegraph-visibility

- Match predicted paths to actual projectile trajectories
- Add high-contrast projectile outlines and charge markers
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`28` focused tests; `git diff --check`)
- commit: pending

## Learning Notes
- Sampling the preview from the same helper used by in-flight updates prevents curve direction/amplitude drift without extra random draws.
- Drawing a colored glow plus a thin light core improves contrast while the renderer's save/restore keeps style state local.
