# Decisions: Menu and Dash Feedback

- Date: 2026-09-22
- Status: Confirmed

## D01. Main menu presentation

- **Chosen**: Replace the leftover game-over canvas appearance on the main menu with a static VOID SURFER scene: star field, nebula, depth treatment, and a stationary ship silhouette.
- **Rationale**: The signed-in menu needs its own intentional identity rather than inheriting the previous run's final frame.

## D02. Always-available dash

- **Chosen**: Space always triggers a short visual dash with a trail. Collision immunity remains exclusive to a correctly timed dash targeted at a special wall.
- **Rationale**: Players receive responsive input feedback without allowing an ordinary dash to bypass normal walls or mistimed special walls.

## D03. Successful special-wall feedback

- **Chosen**: A successful special-wall dash adds a teal ring burst and a stronger trail. The first five special walls of every new game display a translucent teal vertical timing zone ahead of the wall.
- **Rationale**: The effect clearly confirms successful timing, while the limited per-run guide teaches the mechanic without permanently cluttering later play.

## D04. Tutorial navigation

- **Chosen**: Add a secondary “main menu” action to the tutorial screen in addition to its start action.
- **Rationale**: Players can inspect controls without being forced to begin a run.

## D05. Menu controls

- **Chosen**: Use speaker and muted-speaker SVG icons for the sound toggle while retaining state-specific accessible labels. Move logout into its own lower, spaced auxiliary section below the core menu actions.
- **Rationale**: Icons keep primary controls compact and recognizable; spacing makes account-ending behavior distinct from ordinary game navigation.
