# Plan: Flight Performance, Ambient Lasers, Siren and Guest Access

## Goal
Implement the six [confirmed decisions](../decisions/2026-10-29-flight-performance-lasers-siren.md): cap220, safe ambient line lasers after boss2, stable boss background, differentiated render density, approved2.4s siren, and NOVA-only guests without saved records. Measure rendering cost rather than assuming lower image density fixes all lag.

## Phases
| Phase | Status | Summary | Blueprint |
| --- | --- | --- | --- |
| P01 | done | Existing game runtime, renderer, audio and guest UI | [P01](../phases/2026-10-29-flight-performance-lasers-siren/P01-runtime/phase.md) |

## Sequential Tasks
1. T01: cap220 and a fixed boss-background clock/vertical anchor.
2. T02: safe ambient line-laser lifecycle, rendering and combat audio.
3. T03: capture original rendering baseline; implement reusable density layers; compare matched scenes.
4. T04: package/synthesize the approved three-pulse siren and synchronize alert/pause clocks.
5. T05: enforce guest NOVA-only, remove guest record persistence/visibility, migrate the old key safely.
6. T06: full regressions, actual PC/landscape captures, performance evidence and completion sync.

## Why One Phase
All work modifies the existing local application. There is no DB migration, hosting change or external authorization milestone. Separate tasks isolate simulation, rasterization, audio and guest policy while each task remains independently verifiable.

## Safeguards
- Preserve live hitboxes/coordinates, input/physics update rate, scoring/account unlocks, admin score exclusion, boss HP/aimed beam and shuffled pattern rules.
- Density ratios scale raster width/height, not world sizes, collision geometry or frame rate. Player/boss/UI stay at existing native density.
- Ambient hazards must drain before boss darkening; no wall-spawn backlog, missing collision/audio or frozen attacks without a boss.
- Rendering baseline must be collected BEFORE T03 source changes. Keep matched post-change reference/full and balanced measurements; report CPU/headless/GPU limitations honestly.
- Approved audio is `03-broad-triple.wav`, SHA256 `925ffc1b9ef079dd9dca52260398af72b9224ff633479a7b3111b6d50efb18b2`; do not regenerate a different sound accidentally.
- Retire only `void-surfer:guest-record:v1`; never clear account/session/settings storage.
- Each task validates and commits before pointer advance. Final memory-sync commit records the last task hash.

## Adjacent Findings
- `handleSignOut` contains duplicated admin-reset assignments. Record only; no unrelated cleanup task is added.
- Existing tests use `guestMode:true` to unlock non-default aircraft. T05 must move those non-policy fixtures to unlocked account configuration, preserving rather than weakening their aircraft assertions.
- Audio pause logic hardcodes1.5s independently of the game alert constant; T04 must synchronize both.
- A shared full-resolution canvas currently draws every category; lower source-file dimensions alone are insufficient. T03 changes actual raster work and checks composition cost.
