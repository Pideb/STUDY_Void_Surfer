# Task: T02 Portable Management HTML

## Status: done

## Goal
Deliver docs/management/void-surfer-management.html and identical Downloads copy for the user's review.

## Implementation
- New `scripts/build-management.mjs` starts by reading complete visualize skeleton, adding content/styles/scripts, repairing duplicate nested main IDs without removing menu/themes/accessibility. Current game catalog and release JSON feed the document. Inline CSS/JS/assets; use var at JS top level, ChartManager, guarded Chart defaults and SVG fallback, Inter/Noto fonts, light+dark, print/reduced-motion, semantic sections and >=48px major spacing.
- New authoring files under `docs/management/`: template content/CSS/browser JS. Tabs `게임 요소`, `튜닝 실험실`, `업데이트 이력` with aria roles and keyboard navigation. Live values/craft table, speed graph/score slider, unlock stages actual counts, boss patterns and deprecated rules. Show all six actual theme backgrounds/bosses/walls/projectiles/lasers/portal assets with stage selector and searchable/filterable object cards. Background-derived display may be dark to preserve asset contrast; light-theme document intentional.
- Lab uses shared model text stripped of exports for standalone inline use. Damage-box/success-box overlays, baseline/window width and actual eligibility, speed/time/cooldown/hybrid check. Real ship image drawn in lab and palette. Controls bounded and labelled, reset current baseline, export proposed settings JSON. Preview labels clearly distinguish from production settings. Canvas animation only while visible/playing; stop when hidden/tabbed, reduced motion defaults paused; all scenes have manual step/pause. Physics gravity/lift/click interval trajectory shows actual discrete model and limits. No audio auto-play required.
- Object motion demos: wall opening sine, non-homing3..6 signature and right-to-left laser/safe-quarter preview with actual images/colors, portal demonstration; label explanatory motion as such. Do not claim simplified animation is actual rig rendering. Hitbox is unrotated central16square even when art tilts; success geometry separate. No incorrect legacy projectile reflection success claims.
- History has current deployment/source/validation, version filter/search, grouped added/changed/fixed, b follow-up chronology, preserved old presentation links. Tabs print all panels/figures/values; offline content/controls/images and SVG chart remain functional. Self-contained core; CDN-only export/fonts caveat explicit.
- Auto-open final HTML with Invoke-Item; return clickable workspace path. No runtime asset modifications, network writes or deployment.

## Acceptance Criteria
- [x] Requested elements and sliders interactive with source-derived baselines; actual six-stage art and explanatory motion, preview-only export.
- [x] Standalone HTML/Downloads equal, themes/tabs/print/offline and responsive375/768/1440 pass. Native Edge verification.json and screenshots recorded.5 source-model parity tests pass.

## Validation
- Generator command; native Edge private-profile CDP browser checks (tabs/slider outputs/charts/reset/export/objects/history/print/reduced motion/offline/image decode/overflow), visual screenshots at desktop/mobile. `git diff --check`.

## Commit Message
```text
docs(management): add the interactive game reference and tuning console

Plan: 2026-10-30-management-console
Phase: P01-console
Task: T02-management-html
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit:pending
