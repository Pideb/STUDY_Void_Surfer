# Task: T02 Menu Audio and Motion

## Status: done

## Implementation
- `src/ui/app-controller.js`: mount global capture-phase first-audio-gesture listeners on pointerdown(mouse), pointerup(touch/pen), eligible nonrepeat keydown. Invoke audioManager.unlock synchronously within the event; use an in-flight promise to deduplicate and retry after rejection, remove on success/destroy. Preserve existing gameplay unlock/resume and mute settings; a menu action should not require starting a run. Ignore unmounted callbacks and no new overlay dialog.
- During menu paint, reuse the currently connected `.menu-aircraft-preview` if selected ID is unchanged. Keep hero in the existing menu while replacing nonhero controls/status/admin children; do not disconnect it or reset its animation. Skip unchanged menu canvas redraw on such updates. Different-aircraft or return-from-other-screen creates a normal fresh menu. Preserve handlers, labels, admin focus and selection security.
- `src/ui/screens.js`/`src/styles.css`: preview dataset.aircraftId; transform-only `.menu-aircraft-motion` wrapper contains image/exhaust. Static sprite filters; modest translate3d float and scoped will-change; exhaust moves with ship. Retain existing dimensions/selected colors/reduced-motion support.
- `src/audio/audio-manager.js`: menu unlock selects menu track without first-stage preload; gameplay retains preload. Normalize scene IDs before change detection, avoid setMusicScene(null) repeated preload while repainting menu. Existing async generation/pause/dedupe lifecycle unchanged.
- Tests in controller/audio/menu UI: first background pointer and keyboard interaction unlock before game start; touch-end path; rejection retry, concurrent dedupe, destroy cleanup; muted state remains respected; menu repaint preserves hero identity and clock, craft switch correct; stage audio not fetched until gameplay and no duplicated loop voice.
- Actual menu benchmark `.memory/validation/2026-10-29-001b-boss-menu/measure-menu.mjs`: keep baseline source artifacts, run final from a clean strict-autoplay browser profile. Check real AudioContext running/menu loop after first gesture, no unrelated audio preloads, native animation phase continuity during menu status/mute repaints, screenshot and frame metrics. Report software/headless limits, no unmeasured global FPS claim.

## Validation
- `npm test -- --run tests/ui/app-controller.test.js tests/audio tests/ui/screens.test.js` (use actual available screen test path).
- Real menu harness before/after; `git diff --check`.

## Acceptance Criteria
- [x] Menu BGM works on first eligible menu gesture and mute/retry/cleanup remain correct.
- [x] Menu hero stays connected across same-craft repaints and animation uses a shared compositor wrapper.
- [x] Target tests and honest actual-browser measurements recorded.

## Commit Message
```text
fix(menu): unlock audio on first interaction and stabilize aircraft motion

Plan: 2026-10-29-001b-boss-menu
Phase: P01-runtime
Task: T02-menu-audio-motion

- Start menu music without entering gameplay and avoid unused preloads
- Retain animated hero DOM and separate motion from static sprite effects
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit:3928989
