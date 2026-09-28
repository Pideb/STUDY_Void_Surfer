# Task: T05 Boss Idle Animations

## Status: done

## Goal
Make all six stage bosses visibly alive at idle through six distinct, calm canvas animations, without changing boss combat coordinates, collisions, attack timing, or health.

## Decision Summary
- Reuse the six existing stage boss PNGs; do not replace or generate assets.
- Give each stage a unique motion signature: crystal orbiting shards; industrial rotating ring; signal-sentinel scanning halo; gravity-well orbit/lensing pulse; abyssal tendril undulation; solar-forge core/vent pulse.
- Preserve current low-amplitude body float; all added pieces are decorative.

## Implementation

### I01. Stage-specific cosmetic animation
- Related Files:
  - `src/game/renderer.js` :: `drawBoss`, `getStageAsset`, and `createRenderer().render`; modify.
  - `src/game/stages.js` :: stage `bossStyle`/IDs; read-only unless adding an explicit presentation-only animation key to definitions.
  - `tests/game/renderer.test.js`; modify.

#### Details
- **Inputs**: use `stageId` (one of the six IDs), `elapsedSeconds`, `boss.hitEffect`, and the existing loaded boss image. Add a `reducedMotion` boolean argument to `drawBoss` from the renderer preference.
- **Mapping / animation**:
  - `crystal-gates`: slow orbit of 2–3 small accent shards around the existing image.
  - `industrial-void`: low-speed rotation of a thin ring behind the core; keep the core mostly steady.
  - `signal-monoliths`: gently bob the body and sweep a halo/scan line vertically.
  - `gravity-well`: orbit a few particles and pulse the crescent/ring glow.
  - `abyssal-beast`: animate decorative tendril strokes with offset sine waves while the body breathes subtly.
  - `solar-forge`: pulse core glow and alternate a subdued vent/plate highlight.
- Motion should be perceptible at gameplay canvas scale: generally 4–8 px secondary-part displacement or a clear slow rotation/pulse with a 2–4 second cycle. Use elapsed-time formulas only (no random per-render flicker).
- Keep boss image anchor near x=842 and existing display size 192×128. Do not expose visual animated coordinates to collision or attack logic.
- Keep hit effect visually dominant over idle accents. Under reduced motion, draw a static composition (no rotation, bob, pulsing, or scanning), while retaining hit effects.
- Tests: table-driven renderer tests exercise all six stage IDs and assert each has animated draw commands/coordinates that differ across two elapsed times; assert reduced motion produces stable idle transforms; assert boss attack/health snapshots are not mutated.

## Acceptance Criteria
- [x] Six bosses use visibly distinct idle movement motifs.
- [x] Motions are slow and calm but perceptible at the actual game canvas size.
- [x] Reduced-motion mode freezes decorative idle movement.
- [x] No combat state, hitbox, projectile, laser, or boss HP behavior changes.

## Validation
- `npm test -- --run tests/game/renderer.test.js tests/game/boss.test.js tests/game/boss-attacks.test.js` — all 26 tests pass.
- `npm run build` — production build passes.

## Commit Message
```text
feat(render): animate distinct boss idle motions

Plan: 2026-09-28-gameplay-visual-polish
Phase: P02-visual-motion
Task: T05-boss-idle-animations

- Add six stage-specific cosmetic boss motion signatures
- Respect reduced motion and preserve combat state
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
