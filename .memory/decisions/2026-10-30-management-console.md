# Decisions: Management Console and Release Documentation

- Date:2026-10-30 (Asia/Seoul)
- Status: Confirmed from user request and inspected current code. No game-balance change or deployment requested.
- Build a separate portable HTML for review, with game elements, interactive tuning lab, and release history tabs. Keep current deployed0.01-b and original0.01v intact. Use visualize's full skeleton and real assets/data.

## D01 Source and coverage
- Import current game modules to generate values: constants, aircraft, speed targets, hitboxes, physics, bosses/weapons, stage assets, pattern and unlock rules. Source-link every rule group. Distinguish target speed from2s smoothing/mandatory-spacing corrections and archived WARNING/reflection mechanics.
- Include three aircraft, six stage themes and actual normal/special walls/boss/projectile/laser/portal images; show animated geometry demos for moving openings, projectiles/lasers/portal and hitbox timing. Label diagrams as demonstrations when not the actual renderer.
- Source values include normal max460/velocity700, velocity fast-boss adjustment.88, hitbox16square and special-success56×36. Actual special timing is horizontal overlap plus not-yet-collided condition, not player-center entry. Hybrid opening containment still uses small damage box.

## D02 Tuning lab
- Preview only: sliders do not modify game files, account scores, DB or deployed game. Keep baseline and reset; permit JSON export of proposed settings, with explicit preview status.
- Hitbox/success-window/speed/wall-position/gap sliders immediately update the diagram, success eligibility and effective duration. Animation play/pause/step and Space test with cooldown; reduced-motion static by default.
- Physics preview uses the game's discrete velocity reset and Euler update, with gravity/lift/click interval controls. Speed graph uses fixed10-point/+10 progression and220 cap; aircraft/boss selectors apply actual multipliers. Offline SVG fallback supplements CDN chart.

## D03 Layout and portable media
- Primary tabs: game elements, tuning lab, version history; accessible keyboard navigation. History filters/search and release detail cards; current deployment status/source/evidence shown separately from historical decisions.
- Use light-first management typography, restrained colors and real art thumbnails. Whole skeleton/theme/menu/print/export retained; all content/images/labs work offline, optional fonts/Chart.js/PNG-export CDN may need network. Stop hidden animations and support reduced motion.
- Seed a thumbnail cache from already generated presentation thumbnails, keyed by original source SHA. On changed/new artwork fall back to embedding the actual source bytes rather than stale thumbnails. No art regeneration.

## D04 Future deployment versioning
- Single release catalog feeds management HTML plus current presentation alias/new version snapshots. Preserve old0.01v and current0.01-b presentation files; create a latest presentation alias for regenerated current facts. Next changed-game release0.01-c, then suffixes throughz before0.02; docs-only generation is idempotent and does not bump.
- Provide a release preparation command that computes game fingerprint, validates, advances catalog once and generates both documents; a verified-deployment record command updates status only for matching successful run/head/artifact evidence. CI checks that game source and generated docs/catalog agree, rather than silently deploying stale version material.
- Record requirement in AGENTS.md so future agent-driven deployments must run this process. No push/deploy now; the user wants to inspect the draft first. Do not alter runtime gameplay.
