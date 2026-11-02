# Task: T02 WASD 오입력 피드백·시간·복귀 보호

## Status: pending

## Goal
오타로 챌린지가 종료되지 않고 오류음/붉은 현재키를 표시하며 성공·실패 후 짧은 중력 복귀와 즉시 상승 입력을 보장한다.

## Decision Summary
- 최종결정§3. boss1=4초,2+=2.5초; 키 개수 기존 곡선 유지. 회복.15초는 무적이 아니다. 터치도 같은 엔진 이벤트 사용.
- T01 완료·커밋 후 진행.
- [최종 결정](../../../decisions/2026-11-02-v01-gameplay-visual-polish.md). 범위 밖 물리·점수·계정·배포 변경 없음.
- world960×540 논리좌표, 실제화면의 CSS/물리픽셀과 구분. 프리뷰 fixture는 본게임 로직이 아니다.

## Implementation

### I01. WASD 오입력 피드백·시간·복귀 보호

- Related Files:
  - `src/game/wasd-challenge.js` :: `createChallenge / handleChallengeKey / updateChallenge` — modify
  - `src/game/constants.js` :: `challenge time constants` — modify
  - `src/game/game-engine.js` :: `resolveChallenge / lift / update / getSnapshot` — modify
  - `src/game/player.js` :: `applyLift / updatePlayer` — modify
  - `src/ui/game-hud.js` :: `WASD feedback render` — modify
  - `src/ui/app-controller.js` :: `submitChallengeKey / audio feedback` — modify
  - `src/audio/audio-manager.js` :: `AUDIO_EVENTS / SOUND_CONFIG / play` — modify

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
type ChallengeFeedback = {wrongKeyEventId:number;wrongKeyIndex:number|null;wrongKeyFlashRemaining:number};
type Recovery = {remainingSeconds:number;durationSeconds:number};
handleChallengeKey(challenge:Challenge,code:string):'pending'|'success'|'failure'|'ignored'; // existing return contract
// engine.submitChallengeKey and UI mapping preserve existing API; wrong key keeps result pending
updatePlayer(player:Player,dt:number,gravity?:number):void; // existing contract retained
```
- **Data & Schema Fields**: Challenge 추가 필드 wrongKeyEventId=0, wrongKeyIndex=null, wrongKeyFlashRemaining=0. engine.playerRecovery={remainingSeconds:0,durationSeconds:.15}. snapshot은 복사본. 오류 flash .18초/오류 tone .12초는 사용자 승인값이 아닌 구현 기본값으로 상수 분리한다. 영구 저장 없음.
- **Execution Flow / Logic**:
  1. 유효 WASD 오입력은 eventId증가+현재cursor 붉은flash만. cursor/sequence/active/result는 유지. 비WASD/repeat는 무시. 시간은 실챌린지 dt로 계속 감소하고 timeout에만 failure.
  2. 성공/실패 한 번 resolve에서 현재 vy>0이면0으로, vy<=0이면유지. .15s 동안 gravityScale=1-remaining/.15로 정상 복원. player y/score/dash에는 새로운 보정 없음.
  3. 회복 중 lift는 remaining=0으로 초기화한 뒤 정상 applyLift를 한 번 호출. AEGIS도 정상기체계수 적용. 회복 dt경계를 넘어서는 프레임의 중력 적분이 과도하지 않게 구간 분할.
  4. 오류음은 새 eventId당 한번. mute/AudioContext미준비/noop 경로는 기존정책 유지하며 챌린지 입력을 await로 지연시키지 않는다. UI는 현재 눌러야 할 키만 잠시 붉게, 오류 시 정답처럼 진도 증가 금지.
  5. pause/restart/새run에서 회복과flash/event소비상태를 정리. QTE 중 상승/대시/발사 차단 및 챌린지시간을 pause 중 동결하는 기존규칙 보존.
  6. 검증실패나 음원오류는 gameplay를 중단하지 않는다. full snapshot으로 mutable 내부상태 노출 금지.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/game/wasd-challenge.test.js` :: `T02 behavioral coverage` — modify
  - `tests/game/player.test.js` :: `T02 behavioral coverage` — modify
  - `tests/game/game-engine.test.js` :: `T02 behavioral coverage` — modify
  - `tests/ui/game-hud.test.js` :: `T02 behavioral coverage` — modify
  - `tests/ui/app-controller.test.js` :: `T02 behavioral coverage` — modify
  - `tests/audio/audio-manager.test.js` :: `T02 behavioral coverage` — modify

#### Details
- 오타→정답→시간초과/성공 각각, 오타 연타와 held key, event당오류음1회, 첫boss4/다음2.5 및 길이곡선. 성공·실패 하강0/상승유지,.15s 후정상, 중간lift가즉시상승, AEGIS·저fps·pause·restart 상태누출 없음.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [ ] 오타 직후 실패하지 않으며 현재키 붉은색/오류음과 시간 경과가 함께 작동한다.
- [ ] QTE 종료 직후 낙하 완화와 회복 중 입력이 모든 기체에서 정상 동작한다.
- [ ] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run tests/game/wasd-challenge.test.js tests/game/player.test.js tests/game/game-engine.test.js tests/ui/game-hud.test.js tests/ui/app-controller.test.js tests/audio/audio-manager.test.js` — 종료코드0 및 대상 검증 통과.

## Commit Message
```text
feat(challenge): allow wrong-key retries and smooth flight recovery

Plan: 2026-11-02-v01-gameplay-visual-polish
Phase: P01-v01-runtime
Task: T02-challenge-input-and-recovery

- WASD 오입력 피드백·시간·복귀 보호 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
