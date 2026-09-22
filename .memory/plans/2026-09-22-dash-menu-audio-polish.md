# Plan: Dash, Menu, and Audio Polish

## Goal

Deliver one cohesive polish pass for the unimplemented decisions: clearer dash acceleration feedback, a lighter main-menu composition, and original procedural music that follows menu, gameplay, WARNING, and BOSS states. The shipped game must use no copied or bundled third-party recordings.

## Scope and constraints

- Includes the decisions in `2026-09-22-dash-menu-polish.md` and `2026-09-22-original-bgm.md` only.
- Does not reopen the completed `2026-09-21-gameplay-refinements` plan.
- Retains the existing Canvas renderer, DOM UI, and Web Audio architecture.
- Keeps audio opt-in to the browser's user-gesture unlock policy and honours the existing mute control.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Polish dash feedback and menu presentation, then add stateful original procedural music. | [P01](../phases/2026-09-22-dash-menu-audio-polish/P01-visual-menu-audio-polish/phase.md) |
