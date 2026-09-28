# Decisions: Game Visual Asset Integration

- Date: 2026-09-28
- Status: Confirmed
- Scope: Replace placeholder-like procedural stage/menu visuals with the previously presented approved visual direction, integrate image assets into live gameplay, and simplify the gameplay HUD.

## D01. Image asset strategy

- **Chosen**: Use stage-specific full-screen background images plus separately rendered transparent image assets for the player aircraft, ordinary/special walls, boss, projectile, and laser. Create a separate main-menu scene asset. Use the previously presented images as visual references.
- **Rationale**: A single composite gameplay screenshot cannot support moving hazards or preserve gameplay readability; separate layers provide the approved illustrated look while keeping game objects dynamic.

## D02. Incremental implementation and review

- **Chosen**: First implement and review a complete vertical slice containing the main menu and the CRYSTAL GATES stage, including its background and stage-specific gameplay objects. After that slice is visibly integrated and reviewed, extend the same quality bar to the other five stages.
- **Rationale**: Validate that generated artwork reads correctly in the actual game before producing and wiring the full asset set.

## D03. Main menu composition

- **Chosen**: Follow the previously approved HUD COMMAND direction: no card panel; illustrated space scene and aircraft on the left; title and direct HUD-line menu on the right; logout separated below the primary actions. Keep the pilot identity prominent. Use the approved menu art as reference rather than retaining the current procedural placeholder scene.
- **Rationale**: The main menu should look like a designed game screen, not a presentation/card layout or recolored generic neon scene.

## D04. Gameplay HUD visibility

- **Chosen**: Do not display the active stage/region name or selected aircraft name in the in-play HUD. Retain score, mute/pause controls where applicable, BOSS health, WARNING/BOSS cues, attack telegraphs, and WASD challenge status.
- **Rationale**: Keep attention on flight and threats instead of persistent identity labels.

## D05. Stage transition

- **Chosen**: When changing stages, bring the incoming full-screen stage background from the right edge toward the left, pushing out the current background in the same direction as the scrolling gameplay. Use a 1.5-second transition; do not hard-cut, merely swap palette colors, or use the previously recorded crossfade-only approach. This supersedes the transition effect in the older D24 decision. Keep gameplay object motion and collision geometry independent of the visual transition.
- **Rationale**: Make stage changes feel like entering a new area while preserving the established right-to-left gameplay flow and fair collision rules.

## D06. Visual continuity and gameplay constraints

- **Chosen**: Preserve the approved six-stage visual identities and restrained, readable presentation. Artwork must not change the existing hitboxes, score rules, aircraft balance, or hazard timing. The first approved art references guide composition, silhouettes, and palette; mobile scaling must preserve readability.
- **Rationale**: Correct the gap between the approved concept direction and the current procedural-color implementation without changing the game design.
