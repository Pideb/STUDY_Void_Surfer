# Decisions: Aircraft and Boss Gameplay Expansion

- Date: 2026-09-23
- Status: Confirmed
- Scope: Main-menu redesign, aircraft selection, speed balance, boss projectiles, and WASD challenges

## D01. Main menu composition

- **Chosen**: Remove card panels from the main screen. Place the space/ship presentation on the left and a direct HUD-like title, pilot identity, and vertical menu on the right.
- **Rationale**: Avoid a presentation-like card layout while preserving a clear entry point and a strong arcade-game composition.

## D02. Overall game speed

- **Chosen**: Increase the normal, WARNING, and BOSS base scroll speed and time-based acceleration by 15%.
- **Rationale**: Make the whole game feel more energetic without changing the existing obstacle rules.

## D03. Aircraft roster and unlocks

- **Chosen**: Provide three aircraft: the existing default aircraft, a high-speed aircraft, and a precision/heavy aircraft. The default is initially available. The precision aircraft unlocks at an account best score of 50, and the high-speed aircraft unlocks at 100.
- **Rationale**: Give progression a clear goal while allowing the initial run to remain readable.

## D04. Aircraft unlock persistence

- **Chosen**: Derive unlock status from the player's Supabase account best score so it persists across browsers and devices.
- **Rationale**: Reuse the account-based leaderboard identity instead of creating a device-local progression record.

## D05. Aircraft performance

- **Chosen**:
  - Default: existing movement and score behavior.
  - High-speed: obstacle/boss-projectile movement and spawn rhythm are 2x; wall score is 2x; player gravity and lift remain at default values.
  - Precision/heavy: gravity is 2x and click lift is 35% of the default lift.
- **Rationale**: Each aircraft changes the risk profile without changing the shared hitbox or requiring separate controls.

## D06. Aircraft visuals and hitboxes

- **Chosen**: Use the finalized roster design: DEFAULT keeps the compact balanced triangular silhouette with a bright cyan contour; VELOCITY uses a long, slender aerodynamic silhouette with a cyan outer rim and magenta central energy strip; AEGIS uses a broad armored silhouette with a bright amber/gold contour. All aircraft use the same collision hitbox, with their visual geometry contained inside it. Each aircraft gets layered geometric neon detailing inspired by arcade geometric styles; no third-party artwork is copied.
- **Rationale**: The choice should be visually legible without making the aircraft's collision footprint unpredictable.

## D07. Hangar screen

- **Chosen**: Open a full-screen hangar from the main menu. Show aircraft silhouettes, stats, selection state, unlock score, and locked-state styling. Locked aircraft remain visible but darkened.
- **Rationale**: A dedicated screen gives the three distinct silhouettes enough space and keeps the main menu free of panels.

## D08. Leaderboard aircraft display

- **Chosen**: Keep one integrated leaderboard and show the aircraft name/icon alongside each score.
- **Rationale**: Preserve one competition while making the 2x high-speed score modifier transparent.

## D09. Boss projectile combat

- **Chosen**: Bosses fire projectiles directly toward the player or along an up/down parabolic path. Projectile speed is randomized per shot between 0.7x and 1.6x of the current base scroll speed. Direct projectiles occur 60% of the time and parabolic projectiles 40% of the time.
- **Rationale**: The two trajectory types create readable but variable Space timing challenges.

## D10. Projectile telegraph and timing

- **Chosen**: The boss shows a 0.6-second muzzle charge and warning sound before every shot. A faint dotted trajectory is shown during the charge for parabolic projectiles. The Space success window is approximately 0.15 seconds around impact.
- **Rationale**: The visual telegraph makes the short reaction window learnable without removing the challenge.

## D11. Projectile reflection and boss damage

- **Chosen**: A successful Space dash reflects the projectile in a straight line back to the boss. The projectile visibly travels to the boss, the boss shows a hit reaction, and the boss loses one HP. The projectile is not simply deleted.
- **Rationale**: Reflection creates a clear cause-and-effect attack loop.

## D12. Boss health and clear condition

- **Chosen**: The first four bosses have 3 HP; the fifth and later bosses have 5 HP. Bosses are cleared by reflecting enough projectiles to deplete their HP, not by merely passing a fixed number of walls. Wall passage points continue to be awarded, and clearing any boss grants a fixed 10-point reward.
- **Rationale**: Boss progress is tied directly to the new combat mechanic while normal scoring remains meaningful.

## D13. Boss walls and hazard separation

- **Chosen**: Normal and special walls remain active during boss fights. Special walls and boss projectiles never share the same response window. After a special wall passes, projectile firing is blocked for 1 second; after a projectile is resolved, special-wall creation is blocked for 1 second. A projectile cannot be fired until at least two normal walls have passed since the previous shot.
- **Rationale**: Preserve the base game while preventing overlapping precision reactions and projectile spam.

## D14. WASD challenge trigger

- **Chosen**: Starting with the third boss, a WASD challenge occurs after one or two successful normal projectile reflections. It is independent of normal-wall timing. Bosses 3 through 6 get one challenge; from boss 7 onward, a second challenge is added with 70% probability.
- **Rationale**: Introduce the challenge after the player understands projectile reflection and add late-game variation without making every boss stop twice.

## D15. WASD challenge difficulty

- **Chosen**: Difficulty scales by boss number. The third boss starts at a maximum of 4 keys and 5 seconds; later bosses progress toward a maximum of 8 keys and 2.3 seconds. The actual sequence length is randomized from maximum minus 2 through maximum, with a floor of 3 keys. Repeated keys are allowed, but no key may appear 4 times consecutively.
- **Rationale**: The challenge grows with boss progression while preserving randomized, bounded difficulty.

## D16. WASD challenge behavior and presentation

- **Chosen**: The challenge pauses the normal game simulation. A dark translucent overlay keeps the gameplay visible underneath. The full random sequence appears in the center; correctly entered keys are highlighted/cleared. Only WASD input is accepted. A wrong key or timeout ends the challenge but does not end the run or deal boss damage. Instead, one random failure effect is shown: a dark ink-like splatter temporarily obscures part of the screen, or a neon glitch/static distortion briefly disrupts the view. The game resumes after the effect.
- **Rationale**: Make the challenge readable and tense without hiding the game state or turning it into a separate scene. Failure creates temporary risk and feedback rather than an abrupt game over.

## D17. Boss HUD and feedback

- **Chosen**: Show a `BOSS HP` gauge at the top. Each reflected projectile removes one segment and triggers a boss hit flash, recoil/retreat animation, and a visible return path for the projectile.
- **Rationale**: Players can immediately understand remaining boss progress and the result of each successful defense.

## D18. Boss pattern progression

- **Chosen**: Assign patterns by boss number: boss 1 uses the existing setup; boss 2 uses separated top/bottom walls; boss 3 uses heat-wave/wobbling walls; boss 4 uses limited visibility; bosses 5 and 6 cycle through the available patterns; boss 7 and later may combine limited visibility with separated or wobbling walls.
- **Rationale**: Fixed early progression teaches one new threat at a time, while later combinations create variation.

## D19. Standard laser pattern

- **Chosen**: Add the laser pattern to the boss pattern cycle from boss 5. One horizontal laser appears at a time from a random Y position rather than a fixed top or bottom lane. The next laser also chooses its Y position within valid bounds. The generator must verify that at least one safe movement path remains compatible with the active wall gap; if not, it rerolls the laser position.
- **Rationale**: Random Y positions make the pattern less predictable while the safe-path check prevents impossible wall-and-laser combinations.

## D20. Quarter-screen laser pattern

- **Chosen**: Add a separate laser attack that divides the screen vertically into four zones. Three zones are covered by laser and one randomly selected zone remains safe. The safe zone is telegraphed 0.7 seconds in advance with a bright outline and directional cue. Walls are paused during this attack, then the next wall is scheduled with a short follow-up delay so the player must immediately judge it after the laser ends.
- **Rationale**: Create a strong positioning test without overlapping wall generation, while preserving the intended quick transition back to wall play.

## D21. Main-menu visual direction

- **Chosen**: Use the `HUD COMMAND` composition: a left-side space scene with the aircraft and a right-side menu built from thin HUD lines and scanline accents. Do not use card panels or a centered presentation layout. Keep logout separated below the primary menu.
- **Rationale**: Preserve the requested right-side navigation while making the main screen feel like an arcade game interface instead of a slide or dashboard.

## D22. Main-menu background motion

- **Chosen**: Animate the background aircraft with slow left-right cruising, a short engine trail, and parallax stars/asteroids moving at different speeds.
- **Rationale**: Add life to the menu without distracting from the navigation.

## D23. Main-menu selection feedback

- **Chosen**: Mark the active menu item with a neon triangular cursor and a short horizontal scanline. The same state is used for mouse and keyboard focus.
- **Rationale**: Make the focused action immediately readable while reinforcing the HUD identity.

## D24. Background transitions

- **Chosen**: Background state changes must transition continuously rather than switching on a single frame. Crossfade the outgoing and incoming layers while interpolating palette, particle density, and edge energy. Keep the central gameplay corridor readable during the transition.
- **Rationale**: Preserve immersion when entering WARNING or BOSS and avoid a visible hard cut in the arcade presentation.

## D25. Wobbling special-wall fairness

- **Chosen**: Special walls use a mostly straight, readable base silhouette. Their visible energy surface may wobble slightly, but the collision geometry, gap position, and special timing window remain fixed. The visual wobble is limited to a small amplitude so it does not imply a moving hitbox.
- **Rationale**: Preserve the special-wall identity while keeping the success timing and collision result predictable.

## D26. Stage background rotation and coverage

- **Chosen**: Use all six stage backgrounds in a randomized order: CRYSTAL GATES, INDUSTRIAL VOID, SIGNAL MONOLITHS, GRAVITY WELL, ABYSSAL BEAST, and SOLAR FORGE. Every background fills the entire play area rather than leaving a deliberately empty center. Keep contrast and particle density controlled so the player, walls, projectiles, and telegraphs remain readable. WARNING uses a warning-atmosphere treatment, while BOSS always switches to the dedicated BOSS atmosphere for the active stage.
- **Rationale**: Give runs visual variety while preserving a consistent gameplay field and clear hazard visibility.

## D27. New-stage boss, projectile, and laser visual direction

- **Chosen**: Use the approved side-view visual direction for the three new themes. GRAVITY WELL uses a crescent/black-hole boss with violet gravity rings, a dark violet projectile, and a thin lensing laser. ABYSSAL BEAST uses a restrained alien leviathan with teal shell/tentacle contours, an organic cyan projectile, and a thin ripple laser. SOLAR FORGE uses a heavy obsidian-and-amber mechanical boss, an angular molten-amber projectile, and a thin heat-shimmer laser. The player is readable on the left, the boss is on the right, and projectile/laser presentation communicates the right-to-left threat direction.
- **Rationale**: Align each threat set with its stage identity while making the gameplay direction understandable at a glance.

## D28. Existing-stage boss, projectile, and laser visual direction

- **Chosen**: Use the approved side-view visual direction for the three established themes. CRYSTAL GATES uses a faceted crystal gate guardian with shard projectiles and a thin prism-refraction laser. INDUSTRIAL VOID uses a heavy orbital factory/mech boss with segmented bolt projectiles and a thin industrial beam. SIGNAL MONOLITHS uses a tall monolithic signal sentinel with geometric pulse projectiles and a thin waveform scanline laser. In every theme the player remains readable on the left, the boss is on the right, and incoming threats communicate right-to-left travel.
- **Rationale**: Complete the six-theme visual language with distinct silhouettes and coherent threat readability.
