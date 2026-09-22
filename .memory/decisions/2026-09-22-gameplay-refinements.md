# Decisions: Gameplay Refinements

- Date: 2026-09-22
- Status: Confirmed

## D01. Desktop gameplay controls

- **Chosen**: Hide every in-play HUD button on PC; retain keyboard controls. Keep touch controls available on mobile layouts.
- **Rationale**: The desktop play field should remain visually unobstructed while mobile play still needs touch-accessible controls.

## D02. Player and obstacle visual distinction

- **Chosen**: Brighten the player ship to white and retain the normal-wall teal palette.
- **Rationale**: The ship remains clearly distinguishable from ordinary obstacles without changing the existing world visual language.

## D03. Special-wall unlock and collision contract

- **Chosen**: Unlock special walls at 15 points. The first and every subsequent special wall is a 24px full-height dash-only barrier; normal walls never receive dash immunity.
- **Rationale**: A thinner barrier reads as something to jump/dash through, while the collision contract prevents the first spawned special wall from behaving like an ordinary passable obstacle.

## D04. Moving-gap normal walls

- **Chosen**: From 50 points onward, 50% of normal walls receive a vertically moving gap. The gap follows a sinusoidal path with a maximum 90px offset from its generated center: 2.4-second cycles in regular play and 1.6-second cycles in WARNING and BOSS segments.
- **Rationale**: The motion is readable and predictable, while WARNING and BOSS segments increase pressure through a faster cycle. Special walls remain dash-only barriers rather than moving-gap walls.
