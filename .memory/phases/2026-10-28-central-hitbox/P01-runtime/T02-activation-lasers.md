# Task: T02 Independent success box and interior line lasers

## Status: pending

## Goal
Independent success box and interior line lasers with observable behavior defined below.

## Decision Summary
- D03/D07:56x36 intersects timing band, and entire damaging line stays inside middle80% of world.
- Source: .memory/decisions/2026-10-28-central-hitbox.md. Preserve other existing behavior.

## Implementation

### I01. Production contract
- Related Files (modify/new/read-only as stated): src/game/collision.js :: isSpecialTimingSuccess; src/game/game-engine.js :: dash; src/game/renderer.js :: getTimingGuideWidth/drawSpecialTimingGuide; src/game/boss-attacks.js :: findSafeLaserY/createSingleLaser; collision/laser-safety/renderer tests; new tests/integration/central-hitbox.test.js.

#### Details
- **Signatures, schema fields and flow**: Special timing arguments remain {playerX,wallX,speed,windowSeconds}; use56px horizontal box [x-28,x+28] and band [wallX-speed*windowSeconds,wallX], inclusive touch. Require small damage right<=barrierX and actual engine not dead/paused/challenge/firing/cooldown; no retroactive rescue or queued input. Hybrid opening containment is16px, unrelated to56x36 height. Big box may extend beyond barrier while small box is clear, still allow input. Keep.30/.15s band width and1.2s special passage spacing. Match guide progress using the big leading edge, clamp0..1, without permanently displaying boxes. For line placement, define BOSS_LINE_LASER_EDGE_FRACTION=.1; allowed damaging area [54,486], current18px core center [63,477]. findSafeLaserY restricts sample intervals BEFORE subtracting all protected moving-gap envelopes; reject invalid intervals and skip if none. Both selected ys obey this; second still has safe separation, fallback to1 if needed. Quarter laser unchanged. Test band entry x=wall-speed*T-28 exactly and just before, center out/large in, front pastwall/small clear, reject small solid overlap and hybrid-outsidegap. Cover1/2beam bounds across RNG and safety/no-fit.
- **Validation & errors**: reject invalid/non-finite coordinates/times without granting success; unavailable actions do not consume resources. Handle missing scene/context layouts safely. No backend/schema dependency.
- **State/return**: public snapshots remain detached; operations reflect real state without mutation hooks; visual and actual geometry agree.

### I02. Verification
- Related Files: associated existing tests listed above; new test paths are explicit.
- Exercise exact boundaries and changed behavior plus existing adjacent regressions. Do not silently delete meaningful checks.

## Acceptance Criteria
- [ ] Production behavior matches all stated values/edge cases.
- [ ] Specified validation passes.

## Validation
- `npm test -- --run tests/game/collision.test.js tests/game/laser-safety.test.js tests/game/renderer.test.js tests/integration/central-hitbox.test.js` - each command must succeed; semicolon-separated commands run sequentially.
- `git diff --check`

## Commit Message
```text
feat(game): activation lasers

Plan: 2026-10-28-central-hitbox
Phase: P01-runtime
Task: T02-activation-lasers

- Independent success box and interior line lasers
- Validate approved mechanics and preserve adjacent guarantees
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
