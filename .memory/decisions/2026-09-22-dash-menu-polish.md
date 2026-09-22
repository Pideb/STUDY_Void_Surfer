# Decisions: Dash and Menu Polish

- Date: 2026-09-22
- Status: Confirmed

## D01. Dash acceleration feedback

- **Chosen**: Replace the solid dash trail with four short, thin, differently sized teal acceleration lines. During every dash, the ship gains a stronger teal outline glow and a subtly pulsing core.
- **Rationale**: Multiple thin streaks communicate speed more clearly without obscuring the player or collision area.

## D02. Menu layout

- **Chosen**: Remove the main-menu card panel. Place title, bold player name, and greeting on the left over the canvas scene; place the start and sound actions on the right. Put logout lower than both columns with extra separation.
- **Rationale**: The menu becomes part of the space scene rather than a second boxed layout, while sign-out remains visually distinct from game actions.

## D03. Menu content

- **Chosen**: Remove the controls action from the main menu. Render the greeting as `{displayName}파일럿, 다시 도전하는 것을 환영합니다.` with the player name in bold.
- **Rationale**: The start path no longer needs a separate controls screen entry, and the greeting gives the signed-in player stronger visual ownership.
