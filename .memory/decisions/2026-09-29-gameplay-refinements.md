# Decisions: Gameplay Refinements

- Date: 2026-09-29
- Status: Confirmed

## D01. Death feedback before the game-over screen
- **Chosen**: On death, play a brief ship flash and debris/explosion effect, then show the game-over screen after about 0.5 seconds.
- **Rationale**: Make the failure readable and impactful without delaying retry for long.
- **Implementation constraints**: Freeze gameplay and inputs once lethal damage occurs; only the death effect runs during the delay. Apply to all existing death causes.

## D02. VELOCITY speed during fast BOSS patterns
- **Chosen**: Target an effective speed of `2.2x` base speed for VELOCITY during fast BOSS periods, including the fast phase of shift-pattern BOSS encounters. Keep other aircraft and non-fast BOSS phases unchanged.
- **Rationale**: Preserve VELOCITY's speed identity while reducing its current `2.5x` combination (`2x` aircraft × `1.25x` fast BOSS) to a more manageable level.

## D03. Special-wall timing guide visibility
- **Chosen**: Keep the existing guide availability window, but render its actual successful timing band brighter, add clear boundary lines, and pulse it as the wall approaches.
- **Rationale**: The current guide is enabled before the first BOSS is cleared, but its low-opacity fill is easy to miss.
- **Implementation constraints**: Do not widen or otherwise alter the actual timing judgment window; visuals must represent the existing window exactly.

## D04. AEGIS handling
- **Chosen**: Reduce AEGIS gravity from `2x` to `1.5x` and keep its current lift multiplier (`0.6x`).
- **Rationale**: Ease its heavy downward pull while retaining the deliberate, precise lift response that distinguishes the craft.

## D05. Main-menu title image
- **Chosen**: Replace the current title text at its existing menu position with a real transparent-background title image asset.
- **Art direction**: Preserve the previously selected wide geometric sci-fi wordmark, restrained cyan edge light, and exact `VOID SURFER` lettering. Keep accessible semantic title text available to assistive technology.
- **Rationale**: The user expects the previously selected title treatment to appear as an actual image asset in the game, not only as styled live text.
- **Supersedes**: The earlier D11 implementation choice to use native text/vector styling rather than a bitmap.

## D06. Responsive game viewport
- **Chosen**: Let the game fill the available browser viewport on PC and mobile, stretching the game scene to match the viewport dimensions.
- **Rationale**: The current 960px maximum-width, 16:9 frame leaves too much unused space and appears small in the centered app window.
- **Implementation constraints**: Do not letterbox or crop gameplay; scale the canvas and UI overlay to the same full-viewport rectangle. This means the 960×540 logical scene may stretch on non-16:9 screens. Do not invoke browser/OS fullscreen APIs.

## Confirmed Existing Behavior to Preserve
- Special-wall guide remains enabled until the first BOSS is cleared.
- AEGIS's lift multiplier remains `0.6x`; only gravity changes.
- Only VELOCITY's fast-BOSS speed combination is adjusted; base speed, slow BOSS, non-VELOCITY fast BOSS, score multiplier, and aircraft unlock conditions stay unchanged.
