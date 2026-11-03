# Decisions: startup update dialog

- User approved the actual-menu preview at validation/2026-11-03-startup-update-popup/preview.html and requested checking the applied aircraft-ranking migration.
- Show a restrained cyan-bordered dark modal over the dimmed existing title menu. Use the latest entry (`entries[0]`) from docs/player/updates.json, identical to the player guide; include version/date/exact bullets, Confirm and player-guide link.
- Default: once per fresh app/controller mount, without persisted dismissal; do not repeat on auth refresh, return-menu or immediate restart. No new release/version bump/deployment requested.
- Keep readable native-viewport mobile layout from the approved preview, with44px+ actions, scrollable change list and orientation gate taking priority. Trap modal focus; background inert; Space/Enter/Escape dismissal must not start gameplay.
- Verify remote SQL through public read RPCs and permission-denied reads only. Never fabricate scores, invoke write RPCs, retrieve user auth tokens or claim private writes verified from a public key. Save aggregate counts/statuses rather than pilot names.
- Current production remains v0.2b; new local changes and previous aircraft-ranking commits are not deployed. Commit implementation and evidence locally through memory workflow.
