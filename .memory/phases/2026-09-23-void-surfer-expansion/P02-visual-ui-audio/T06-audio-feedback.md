# Task: T06 Audio Feedback

## Status: pending

## Goal

기존 procedural Web Audio 구조를 확장해 메뉴·일반 플레이·WARNING·BOSS·투사체 charge·반사·레이저·WASD 성공/실패를 구분한다. 사용자 제공 또는 저작권 음악 파일을 번들하지 않고 기존 음소거 계약을 유지한다.

## Decision Summary

- 게임 배경음은 상태별 original procedural music을 사용한다.
- WARNING 진입은 짧은 경고 신호, BOSS는 별도 긴장감 있는 procedural 모드, 보스 투사체 charge와 반사 성공은 즉시 읽히는 효과음을 사용한다.
- 음소거는 메뉴와 플레이 HUD의 아이콘 버튼 하나로 동기화한다.

## Implementation

### I01. Extend audio event vocabulary

- Related Files:
  - `src/audio/audio-manager.js` :: `SFX`, `setMusicMode`, `play`, `destroy`; modify
  - `src/ui/app-controller.js` :: snapshot transition event calls; modify
  - `tests/audio/audio-manager.test.js`, `tests/ui/app-controller.test.js` :: extend

#### Details

- Add stable event names: `bossCharge`, `projectileReflect`, `bossHit`, `laserTelegraph`, `challengeSuccess`, `challengeFailureInk`, `challengeFailureGlitch`.
- All sounds are generated with oscillator/noise envelopes, respect `muted`, and are safe when AudioContext is locked or unavailable.
- Deduplicate events by attack ID/effect ID so each charge, reflection, hit, and failure plays once.

### I02. State-based music synchronization

- Related Files:
  - `src/audio/audio-manager.js` :: procedural mode patterns
  - `src/ui/app-controller.js` :: normal/warning/boss/stage transition synchronization
  - `tests/audio/audio-manager.test.js` :: mode transition assertions

#### Details

- Keep `menu`, `gameplay`, `boss`, and `none`; WARNING uses a one-shot warning cue layered over gameplay. BOSS switches to boss mode and returns to gameplay after clear.
- Stage changes crossfade procedural parameters rather than stopping/restarting the AudioContext.
- Pause pauses music time; restart and sign-out cleanly cancel scheduled nodes.

## Acceptance Criteria

- [ ] Every new audio event is muted correctly and does not throw without user gesture.
- [ ] WARNING/BOSS transitions play once per state entry.
- [ ] Boss charge, reflection, hit, laser, and challenge outcomes are distinguishable.
- [ ] Existing original BGM tests remain green and no external recording is bundled.

## Validation

- `npm run test -- --run tests/audio/audio-manager.test.js tests/ui/app-controller.test.js`
- `npm run build`

## Commit Message

```text
feat(audio): add boss hazard and challenge feedback

Plan: 2026-09-23-void-surfer-expansion
Phase: P02-visual-ui-audio
Task: T06-audio-feedback

- add procedural boss, projectile, laser, and challenge cues
- synchronize crossfaded music with stage and encounter states
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
