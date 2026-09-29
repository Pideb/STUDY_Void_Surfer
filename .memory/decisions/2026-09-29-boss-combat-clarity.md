# Decisions: BOSS Combat Clarity

- Date: 2026-09-29
- Status: Confirmed

## D01. BOSS speed multipliers
- **Chosen**: Slow BOSS uses `0.75x`, fast BOSS uses `1.25x`, and shift BOSS alternates between `0.75x` and `1.25x`.
- **Rationale**: Reduce the abrupt pace increase while preserving recognizable speed profiles for each BOSS pattern.
- **Existing behavior**: The current slow/fast values are `0.5x`/`1.8x`; shift alternates those values every two seconds. VELOCITY's aircraft-specific movement multiplier remains separate.

## D02. BOSS pattern preview
- **Chosen**: Show the upcoming BOSS pattern about 1.5 seconds before BOSS gameplay begins, while gameplay continues. Use a label such as `BOSS — 고속` or `BOSS — 변속`.
- **Rationale**: Give the player time to understand the speed profile before the encounter begins without freezing play.

## D03. Projectile and trajectory visibility
- **Chosen**: Add a bright outline and glow to the projectile; make the pre-fire trajectory thicker and more visible with larger dotted markers.
- **Rationale**: Make both the incoming threat and its predicted route readable against all stage backgrounds.
- **Implementation constraint**: Generate the parabolic preview from the same curve amplitude and path formula used by the flying projectile. The current preview uses a fixed amplitude while the actual projectile amplitude is randomized, so the two paths can diverge.

## D04. Tutorial BOSS clear instructions
- **Chosen**: Add the following information to the pre-flight instructions: reflect projectiles with a precisely timed SPACE dash until BOSS HP reaches zero; BOSS 1–4 require 3 reflections and BOSS 5 onward require 5; WASD challenges are separate and do not damage the BOSS.
- **Rationale**: Explain the actual clear condition and prevent the challenge sequence from being mistaken for a damage mechanic.
- **Existing behavior**: The BOSS HP is reduced by projectile reflections only. WASD challenge success allows the encounter to continue but does not lower HP.
