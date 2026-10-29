# Plan: Fullscreen FHD and Music-Ready Start

## Goal
Implement confirmed decisions: maximum1920×1080 buffer with native RAF; selected stage BGM readiness gate with10s automatic silent fallback; commit and deploy the validated0.01-b update.

| Phase | Status | Blueprint |
| --- | --- | --- |
| P01 | done | [Runtime, evidence and deployment](../phases/2026-10-29-fullscreen-fhd-music-start/P01-runtime/phase.md) |

## Tasks
1. T01: record matched fullscreen baseline, cap canvas resolution, regression checks and matched final measurement.
2. T02: loading/readiness lifecycle across music player, audio manager, engine and controller; targeted race/timeout/cancellation tests.
3. T03: full validation, current HTML/README/version evidence, publish through the existing Azure workflow and verify actual served artifacts/audio.

Single phase; the audio contract and UI/engine consumers stay in one task so no incomplete start flow is committed. Rendering is independent and measurable. No new FPS cap, paid resources, DB migration, game balance changes or new version label.

## Completion
- T01 `dda1732`, T02 `e90bb76`, T03 `d245fee`. Full60 files741 tests/build/config, native slow/fail/cancel/cache startup and responsive HTML verified.
- Azure Actions40841808122 success. Public bundle hash matches tested dist; actual public4K viewport/FHD buffer and stage music start verified.0.01-b retained, old0.01v immutable. Final publication of docs follows the same workflow.
