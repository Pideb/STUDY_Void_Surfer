# Decisions: Boss Flow and Speed Feedback

- Date: 2026-10-21
- Status: Confirmed

## D01. Boss attack and wave progression
- **Chosen**: Keep the existing boss rules (two normal walls between projectile shots; special walls and projectiles do not overlap), and add integrated regression coverage for repeated projectile waves and continued wall spawning. Fix any deadlock exposed by that coverage.
- **Rationale**: The reported infinite progression must be addressed without changing boss combat cadence unless a reproducible state bug requires it. Deterministic simulation currently advances across multiple bosses and attack waves.

## D02. WASD challenge keyboard routing
- **Chosen**: Route W/A/S/D to an active challenge even when a game button currently has keyboard focus; preserve input-field safeguards where relevant. Add UI-level tests for focused-button input and engine-level tests for challenge completion/timeout followed by boss progression.
- **Rationale**: The controller currently returns early for focused buttons before it checks active challenge input, so keyboard events can be discarded while a button retains focus.

## D03. Moving-gap wall motion
- **Chosen**: Increase the full vertical oscillation period to 4.8 seconds in normal play and 3.2 seconds in WARNING/BOSS.
- **Rationale**: The current periods are 2.4 and 1.6 seconds; the selected values make the same motion 50% slower without changing its amplitude or collision geometry.

## D04. Speed transition duration and indicator
- **Chosen**: Smooth target speed changes over 1 second. During the transition, show a concise top-of-screen `>> 가속` indicator when speed is increasing and `<< 감속` when speed is decreasing.
- **Rationale**: This reduces sudden, difficult-to-react-to changes while keeping acceleration/deceleration legible.

## D05. Boss speed profile
- **Chosen**: Capture the boss's base scroll speed on boss entry. Slow and fast patterns keep that speed target for the whole encounter. Shift patterns alternate slow/fast targets every 2 seconds and interpolate over 1 second.
- **Rationale**: Score-based progression should not unexpectedly alter a slow/fast boss encounter; the explicit shift pattern remains the deliberate exception.
