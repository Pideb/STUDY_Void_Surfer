# Decisions: Gameplay and Visual Polish

- Date: 2026-09-28
- Status: Confirmed

## D01. Tutorial copy and dash feedback
- **Chosen**: Change the SPACE control description to `대시 (회피)`. Remove the rectangular hitbox outline shown while dashing. Leave a faint, short glowing exhaust trail behind the ship during ordinary flight.
- **Rationale**: Keep controls clear and make movement feel fast without drawing debug-like collision geometry.

## D02. Dash timing windows
- **Chosen**: Increase all current timing windows by 20%: normal special wall 0.30 seconds, WARNING special wall 0.15 seconds, and boss projectile reflection 0.18 seconds.
- **Rationale**: Make dash interactions modestly more forgiving while preserving the relative difficulty between encounter types.

## D03. Player ship size and collision shape
- **Chosen**: Increase the visible ship artwork by about 20% without changing the shared aircraft hitbox. Exclude 3 px at the leading nose from collision checks. Revisit the nose trim after the user's playtest feedback.
- **Rationale**: Improve visibility and make special-wall contact clearer without changing aircraft balance; the nose trim is intentionally small and subject to hands-on feedback.

## D04. Background motion and stage transition
- **Chosen**: Scroll stage backgrounds right-to-left at about 25% of current obstacle speed, continuously repeating with a short overlap crossfade at the loop point. Slide a new stage background in from the right at the same speed as obstacles. Honor reduced-motion preferences.
- **Rationale**: Add a clear sense of forward flight while keeping the background slower than gameplay objects and avoiding a visible reset seam.

## D05. Stage order, stage changes, and obstacle art
- **Chosen**: Keep the per-run shuffled stage order (already present in `start()`). Remove time-based stage rotation. Change to the next stage only after a boss is cleared and two further obstacles have passed; count both ordinary and special walls. Obstacles already spawned keep their original `stageId` and artwork; newly spawned obstacles use the new stage. If the initial boss wall wave ends before the required reflections are complete, continue the boss encounter with another wave using the existing seven-wall mix and special-wall rules.
- **Rationale**: Tie the visual progression to meaningful boss milestones and avoid changing the appearance of obstacles already in play.

## D11. Continue boss waves until the required reflections are complete
- **Chosen**: Preserve the existing seven-obstacle boss wave, including its normal/special selection probability and minimum three special walls. If boss HP remains after the wave, continue another equivalent wave until all required projectile reflections are completed. Keep the existing cooldown of at least two normal walls passed between boss projectiles, and do not overlap a projectile attack with unresolved special walls.
- **Rationale**: Ensure every boss can actually be defeated while preserving the established wall mix, special-wall requirements, and projectile pacing.

## D06. Special wall unlock
- **Chosen**: Begin allowing special walls at score 10.
- **Rationale**: Match the requested earlier introduction point.

## D07. Boss idle animation
- **Chosen**: Give each of the six stage bosses a distinct, calm but clearly perceptible idle motion. Keep animation cosmetic and do not change collision or attack timing. Reduce/disable motion when the operating system requests reduced motion.
- **Rationale**: Make bosses feel alive while keeping their gameplay state readable and fair.

## D08. Title-screen aircraft preview
- **Chosen**: Show a larger visual preview of the currently selected aircraft on the title screen. Give it a slow floating idle motion and a subtle short exhaust glow behind it; update the preview immediately when aircraft selection changes.
- **Rationale**: Make the selected craft recognizable before launch and reinforce the sense of flight without crowding the menu.

## D09. Account score retrieval and result submission
- **Chosen**: Investigate and fix the hangar account-best-score retrieval and game-over score submission paths so scores reliably load and submit once, with clear success/error state. Keep the hosted leaderboard as the account record source; do not silently substitute local data.
- **Rationale**: The reported failures concern persistence and account-linked aircraft unlocks, so the UI must communicate backend results rather than imply a local score is authoritative.

## D10. Interview interaction preference
- **Chosen**: Present any future decision choices inline in assistant messages, one question at a time; do not use separate choice pop-up UI.
- **Rationale**: The user reports that the separate selection window repeatedly closes.
