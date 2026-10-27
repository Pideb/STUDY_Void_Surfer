# Decisions: Laser Light Integration

- Date: 2026-10-27
- Status: confirmed; implementation authorized by the user.
- Apply the approved v2 cyan/white light animation from `.memory/previews/2026-10-27-lasers/laser-animations.template.html`: blurred round rays, luminous filaments, moving highlights and a soft leading flare, firing right to left.
- Single laser: fixed random Y per shot, 0.7s warning, 1s active, 0.4s front travel, 0.15s harmless fade. It may fire while normal walls move. Protect the entire gap of every visible normal wall, including its moving-gap envelope and player-height margin; skip the shot if no safe height exists. Keep special-wall response separate.
- Quarter laser: one fixed safe quarter, 2s warning, same active/travel/fade. Wait until every on-screen wall has left; pause wall spawning for the whole attack. Restart the normal boss wave afterwards.
- Use the same front position for drawing and collision. The warning/fade never damages the player.
- Preserve the three-success WASD clear loop; consume at most one laser opportunity per wave and do not restart an unfinished wave after a single laser.
- Remaining combat/audio-polish proposals (HP label, hybrid wall, stage transitions, BGM and dash variants) retain their separate pending workflow.
