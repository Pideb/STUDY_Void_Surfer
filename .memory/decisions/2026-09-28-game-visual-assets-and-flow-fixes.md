# Decisions: Game Visual Assets and Flow Fixes

- Date: 2026-09-28
- Status: Confirmed

## D01. Stage artwork scope
- **Chosen**: Expand the approved Crystal Gates visual direction to all six existing stages, with seven project-local PNG assets per stage: normal background, BOSS background, normal wall, special wall, boss, projectile, and laser.
- **Rationale**: The user explicitly approved proceeding with the remaining five stage packs so the runtime no longer falls back to the procedural neon renderer for ordinary stages.

## D02. Collision-guide visibility
- **Chosen**: Hide collision/debug-style hitbox visuals during play, while keeping the existing first-five-special-wall timing guide visible.
- **Rationale**: The timing guide teaches the early special-wall mechanic; it is distinct from exposing a player or collision hitbox.

## D03. Aircraft selection presentation
- **Chosen**: Replace aircraft glyphs in the hangar with the real transparent aircraft PNGs already used by the renderer, contained inside each option button.
- **Rationale**: Players should evaluate the approved silhouettes and color treatments directly before selecting a craft.

## D04. Stage transition ownership
- **Chosen**: Keep the existing 1.5-second right-to-left background push, but bind each obstacle to the stage that spawned it. Existing obstacles retain their original art; only newly spawned obstacles use the incoming stage art.
- **Rationale**: Visual transition must not rewrite active gameplay entities or create an abrupt mixed-stage obstacle swap.

## D05. Account best-score loading
- **Chosen**: Treat the account best score as an explicit asynchronous state with loading/error presentation, refresh it when opening the hangar, and repaint when the request resolves.
- **Rationale**: The current screen can be opened before the sign-in-time request resolves, which makes the account score appear as zero and can incorrectly show aircraft as locked.

## D06. Score submission reliability
- **Chosen**: Submit the score before fetching leaderboard rows, expose a saving/saved/error state, prevent duplicate in-flight submissions, and let retry repeat the score submission when the initial submission failed.
- **Rationale**: A leaderboard refresh retry must not silently skip a failed score write.

## D07. Existing account controls
- **Chosen**: Keep the logout action visible in the main menu and visually separated below the gameplay actions.
- **Rationale**: The existing menu already has the intended control; implementation and regression tests must preserve it while other menu changes land.
