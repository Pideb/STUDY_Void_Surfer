# Decisions: Warning Difficulty and Feedback

- Date: 2026-09-22
- Status: Confirmed

## D01. Center in-game card panels

- **Chosen**: Place every `.screen-panel` state (login, tutorial, pause, and game-over) in the geometric centre of the game viewport, vertically and horizontally.
- **Rationale**: The UI root currently does not guarantee that its panel children occupy the full viewport, so centring must be enforced at the shared panel layout level rather than per screen.

## D02. Transient WARNING and BOSS entry labels

- **Chosen**: On entry, show one centred `WARNING` or `BOSS` label for 1 second, then hide only the label. Remove the renderer's persistent top warning text.
- **Rationale**: A single short entry signal avoids the duplicate top-and-centre text while preserving the active segment's atmosphere.
- **Visual state**: A normal WARNING keeps the existing subtle red playfield tint for the segment. A BOSS segment uses a subtle black/dark overlay instead of the red tint.

## D03. WARNING recurrence spacing

- **Chosen**: Keep the first WARNING at 20 points. After each WARNING/BOSS segment completes, schedule the next one after a uniformly random whole-number score gain from 10 through 15 inclusive. BOSS remains every fifth WARNING.
- **Rationale**: This halves the prior fixed 10-point recurrence pressure while avoiding a predictable cadence.

## D04. Special-wall timing window

- **Chosen**: Halve both windows: normal play changes from 0.5 to 0.25 seconds; WARNING and BOSS change from 0.25 to 0.125 seconds.
- **Rationale**: The special-wall success condition should demand a more precise dash throughout the game, while retaining its relative WARNING/BOSS difficulty increase.

## D05. Special-wall success and destruction feedback

- **Chosen**: Enhance success with a bright double teal shockwave and short teal spark lines around the ship, without screen flash or shake. At the ship's crossing height, the special wall develops a small punched-through hole and purple fragments disperse left and right, fading within roughly 0.25 seconds.
- **Rationale**: The effect clearly identifies the precise successful crossing point without obscuring play or causing motion discomfort.

## D06. Passed obstacle lifetime

- **Chosen**: Obstacles remain rendered after passing the player and are removed only once their full width leaves the left edge of the playfield.
- **Rationale**: The player can visually follow a normal pass or the special-wall destruction effect through to the edge; scoring and collision completion stay independent of rendering lifetime.
