# Task: T07 Wire All Stage Art

## Status: pending

## Goal

Connect the remaining five stage image packs to the renderer so every stage identity selects the correct background, wall textures, boss, projectile, and laser assets.

## Decision Summary

- Stage IDs and runtime keys remain the source of identity. Art selection is a render-only lookup.
- Existing engine geometry, warning/boss progression, collision, score, randomized pattern and laser-safety behavior must be unchanged.

## Implementation

### I01. Extend the asset manifest and renderer lookup

- Related Files:
  - `src/game/visual-assets.js` :: `VISUAL_ASSET_MANIFEST`, nested stage map — add five complete stage entries.
  - `src/game/renderer.js` :: stage background, obstacle, boss, projectile, and laser asset resolvers — change.
  - `src/game/stages.js` :: read-only reference for exact IDs and style keys; modify only if a stable asset key is genuinely absent.
  - `tests/game/visual-assets.test.js`, `tests/game/renderer.test.js` — extend all-stage mappings and draw selection assertions.

#### Details

- Add exact manifest entries for `industrial-void`, `signal-monoliths`, `gravity-well`, `abyssal-beast`, and `solar-forge`, each with keys `background`, `bossBackground`, `normalWall`, `specialWall`, `boss`, `projectile`, and `laser` under `/assets/game/stages/{id}/`.
- Keep shared aircraft paths at the top-level aircraft catalog. `stage.id` selects stage artwork; `snapshot.aircraft.id` selects the ship sprite; `boss.attack.type`/`kind` selects projectile or laser treatment.
- Continue using current renderer layer order: background/transition → obstacles → laser/projectile telegraphs and entities → boss → dash effects → aircraft → challenge overlay. Layer changes may be made only to prevent art hiding important telegraphs/player.
- Missing or unknown stage IDs use the same documented default stage as `getStageDefinition`, and missing image files use per-asset procedural fallback with a recorded failure path.
- Do not change `src/game/collision.js`, `src/game/game-engine.js`, or hazard-generation behavior for art selection.

## Acceptance Criteria

- [ ] All six stage IDs resolve to six complete asset packs.
- [ ] Every stage-specific background, obstacle texture, boss/projectile/laser image is drawn for the right stage ID.
- [ ] Unknown/missing keys safely fall back without a crash or image bleed from a different stage.
- [ ] Snapshot state, entity bounds, score, collision, and laser safe-path results are identical before/after rendering.

## Validation

- `npm run test -- --run tests/game/visual-assets.test.js tests/game/renderer.test.js tests/game/stages.test.js tests/game/laser-safety.test.js` — all six themes resolve and preserve gameplay contracts.
- `npm run build` — all static public assets are addressable in the production output.

## Commit Message

```text
feat(render): wire image art for all six stages

Plan: 2026-09-28-game-visual-asset-integration
Phase: P02-stage-expansion
Task: T07-wire-all-stage-art

- map all stage identities to their artwork layers
- preserve engine-owned collision and hazard behavior
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
