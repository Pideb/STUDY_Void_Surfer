# Decisions: Aircraft Visibility, Score, and Pace

- Date: 2026-09-28
- Status: Confirmed

## D01. Default aircraft identity and hangar order
- **Chosen**: Rename the default aircraft to `NOVA`; display aircraft in the order NOVA, AEGIS, VELOCITY.
- **Rationale**: Give the balanced starter craft a recognizable name and swap VELOCITY/AEGIS positions in the aircraft selection screen.

## D02. Player aircraft visibility and collision
- **Chosen**: Enlarge the rendered aircraft while keeping the shared collision hitbox unchanged for all aircraft. Visible art may slightly overlap a wall while the unchanged hitbox still clears it.
- **Rationale**: Improve readability without changing aircraft-to-aircraft collision fairness; slight visual overlap is acceptable.
- **Implementation detail**: Target approximately 1.5x the current rendered size, adjusting after visual verification.

## D03. AEGIS lift
- **Chosen**: Set AEGIS lift velocity to 60% of the default lift; retain its 2x gravity.
- **Rationale**: Make upward control more effective without removing its heavy, precise handling.

## D04. Special-wall timing guide duration
- **Chosen**: Keep the special-wall timing guide visible until the first boss is defeated, rather than limiting it to the first five special walls.
- **Rationale**: Preserve guidance during the initial learning portion of a run.

## D05. Special-wall success effect
- **Chosen**: Add a clearly visible shock ring and large outward-flying fragments centered at the player's crossing height.
- **Rationale**: Make successful special-wall destruction immediately readable.

## D06. Score-based speed progression
- **Chosen**: Replace elapsed-time speed increases with a 10% speed increase for each 10 points of unmultiplied progression score.
- **Chosen**: Speed progression is monotonic during a run; a pause penalty can reduce the displayed/run score but never reverses a speed increase already reached.
- **Rationale**: Tie pace to play progress while preserving earned difficulty across pause penalties.

## D07. Gap-center continuity at high speed
- **Chosen**: From 60 progression points onward, constrain the next wall's gap center to within 70% of the active gap height from the prior wall's center. Apply this limit to VELOCITY from the start of the run.
- **Rationale**: Prevent abrupt, impossible vertical transitions at high speed while retaining random gap placement.
- **Implementation detail**: Use the prior wall's generated/base gap center as the anchor so moving-gap animation does not destabilize later spawns.

## D08. VELOCITY score multiplier
- **Chosen**: Apply a 1.5x multiplier to VELOCITY's base run score at run completion and round with standard nearest-integer rounding (`Math.round`).
- **Chosen**: Show `base score × 1.5 = final score` in the result screen, and use the final score for account records, leaderboard submission, and aircraft unlock checks.
- **Rationale**: Keep VELOCITY's reward meaningful but below the former 2x bonus, with one consistent recorded score.

## D09. WARNING/BOSS cadence
- **Chosen**: Alternate regular WARNING and BOSS events, beginning with a regular WARNING, then BOSS, and repeating.
- **Rationale**: Increase boss frequency and game tempo.

## D10. Player path trail
- **Chosen**: Replace the short straight exhaust marks with one long, thick, smooth trail that follows the player's recent vertical path; taper and narrow it toward the oldest/farthest section.
- **Chosen**: Use bright distinct colors: NOVA cyan/teal, VELOCITY magenta, AEGIS amber/gold, with a bright core/edge so each remains readable on dark stages.
- **Rationale**: Convey movement through the actual traveled path and make aircraft identities distinct.

## D11. Main-menu title treatment
- **Chosen**: Restyle `VOID SURFER` as a clean, wide geometric sci-fi wordmark with restrained cyan edge light, matching the first generated concept.
- **Rationale**: Integrate the title with the game's neon-space visual language while keeping the exact text crisp and readable.
- **Implementation detail**: Render as native text/vector styling rather than using generated lettering as a bitmap.

## D12. Pause explanation
- **Chosen**: Add a pause-screen note that the pause penalty reduces score but does not lower speed.
- **Rationale**: Explain the one-way speed progression clearly to players.
