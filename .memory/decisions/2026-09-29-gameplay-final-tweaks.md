# Decisions: Gameplay Final Tweaks

- Date: 2026-09-29
- Status: Confirmed

## D01. AEGIS Balance and Selection Copy
- **Chosen**: Set AEGIS gravity to `1.3x` and lift to `0.7x`; display `중력 ×1.3 · 상승력 70%` in the aircraft-selection description.
- **Rationale**: The current values (`1.5x` gravity, `0.6x` lift, and `중력 ×2 · 상승력 60%`) do not match the requested balance.

## D02. Pre-flight Guide Copy
- **Chosen**: Rename the panel to `출격 전 안내`; remove the BOSS reflection-count sentence and WASD challenge sentence.
- **Rationale**: Keep the launch guidance focused on core controls and omit the two specifically unwanted details.

## D03. Viewport Fit
- **Chosen**: Fit the game to the available browser viewport on PC and landscape mobile, without game content extending beyond visible screen bounds. Preserve the full-viewport, no-letterbox presentation and do not add portrait gameplay.
- **Rationale**: The player should be able to see the entire active game area on their display.

## D04. UI Vertical Placement
- **Chosen**: No UI vertical-centering change is requested; exclude the title, aircraft-selection, guide, and game-over UI repositioning proposal from this work.
- **Rationale**: The user explicitly withdrew this requirement.

## Constraints
- Do not change other aircraft balance, boss rules, challenge logic, or remaining tutorial content.
- Preserve the 960x540 logical game scene and existing full-viewport display policy while fixing overflow.
