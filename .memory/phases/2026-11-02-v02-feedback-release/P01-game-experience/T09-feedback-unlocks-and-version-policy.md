# Task: T09 v0.2 버전·임시 해금·보스 순서와20/15벽 간격

## Status: pending

## Goal
과거 표시v0.1/v0.1b·다음배포v0.2,모든사용자임시기체해금,첫3보스저속/고속/변속 및 첫20벽/다음스테이지도착후15벽 보스간격을 일관되게 적용한다.

## Decision Summary
- D01/D02/D08/D13. currentVersion0.01-b 유지, base/next만0.2. 보스 간격은 점수가 아닌 일반구간 벽 통과수20/15이며보스·전환대기벽은제외. 원본snapshot/증거보존.
- [최종 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md).
- 선행 T08 HUD·레이어 최적화 완료·커밋 후 진행. 현재 작업은 자기 범위만 검증하며 실제 배포는 수행하지 않는다.
- DB·통신·브라우저 실패를 게임 자체 실패나 미검증 성공으로 바꾸지 않는다.

## Implementation

### I01. v0.2 버전 표기·임시 기체 해금·초반 보스 순서

- Related Files:
  - `AGENTS.md` :: `explicitly approved version-base policy only` — modify
  - `src/game/aircraft.js` :: `canSelectAircraft / getUnlockedAircraftIds / isAircraftUnlocked` — modify
  - `src/game/feedback-policy.js` :: `FEEDBACK_AIRCRAFT_POLICY / getAircraftAccess` — new
  - `src/game/difficulty.js` :: `chooseBossPattern / getDifficulty` — modify
  - `src/game/game-engine.js` :: `start / startWarningIfNeeded / beginWarningSession` — modify
  - `src/ui/app-controller.js` :: `getHangarAircraft / loadAccountBestScore / beginPlaying / auth handlers` — modify
  - `src/ui/screens.js` :: `renderHangarScreen / temporary notice / renderMenuScreen version` — modify
  - `src/lib/release-version.js` :: `getDisplayVersion` — new
  - `docs/management/releases.json` :: `versionBase / nextVersion / displayVersion aliases` — modify
  - `scripts/release-core.mjs` :: `nextVersion compatibility` — read-only

#### Details
- **Signatures & Types** (실제 구현은 기존 JS, 다음은 계약):
```typescript
type AircraftAccess={allowedIds:string[];temporary:boolean;notice:string|null};
getAircraftAccess(options?:{guestMode?:boolean;bestScore?:number;versionBase?:string}):AircraftAccess;
chooseBossPattern(rng?:()=>number,bossNumber?:number):string;
getDisplayVersion(releaseId:string,registry:ReleaseRegistry):string;
getUnlockedAircraftIds(bestScore?:number,policy?:{temporaryUnlock?:boolean}):string[];
isAircraftUnlocked(id:string,bestScore?:number,policy?:{temporaryUnlock?:boolean}):boolean;
canSelectAircraft(id:string,options?:{guestMode?:boolean;bestScore?:number;temporaryUnlock?:boolean}):boolean;
```
- **Data & Schema Fields**: registry currentVersion은0.01-b 유지, versionBase0.2/nextVersion0.2. release.displayVersion은0.01v→0.1/0.01-b→0.1b. temporaryEnabled=true/expiresAtBase='0.3'/notice='다음 버전까지 임시 해금'. 숫자 실수 비교 금지. bossNumber=completed+1. DB 변경 없음.
- **Execution Flow / Logic**:
  1. 기체 원래unlockBestScore/성능을 보존하고 공통 policy에서만 임시 허용한다. UI/엔진/늦은 기록 응답 모두 같은 함수 사용. 임시 중 record 실패가 '기본만 사용 가능'이라고 표시하거나 기체를NOVA로 되돌리지 않게 한다.
  2. beginPlaying의 guest?'default':selected 강제를 제거하여 임시 게스트 선택도 run 시작에 고정한다. 실행 중 계정/기록 응답은 현재 run 기체를 바꾸지 않는다. 게스트 점수 저장/최고기록 노출은 여전히 금지.
  3. 0.3을 준비하는 기준 버전에서는 임시 허용이 꺼지고 원래 계정50/100·게스트NOVA로 돌아가는 시험을 추가한다. release 문자열0.21 등을 실수로 파싱하지 않는다. 현재 notice는 사용자 지정 문구 그대로.
  4. getDisplayVersion으로 메뉴/HTML 생성기에서 내부 id와 표시를 분리. 보호된 과거 파일/메타데이터/운영 증거는 수정하지 않는다. versionBase정책 갱신은 배포준비 실행이 아니며 새release 항목/currentVersion을 만들지 않는다.
     AGENTS의 버전 기본값도 이번 사용자 명시 변경에 맞춰0.2로 동기화하고 다른 워크플로/검증보호 규칙은 보존한다. release-version helper는 registry를 인자로 받는 순수 함수로 유지해 Node 문서 생성기와 Vite 양쪽에서 쓴다. 정책 모듈이 canonical JSON을 직접 읽는 경우 Node22의 JSON import 계약까지 빌드로 검증한다.
  5. chooseBossPattern(rng,bossNumber)에서1/2/3은slow/fast/shift로 고정,4+는 기존독립균등. 인자 생략은 기존호출계약 유지. difficulty와 입장선택 양쪽에 차수 전달, 보스 진행 동안 저장한 패턴 재사용.
  6. 고정3차수는 RNG소모 없이 선택. 기존배율/변속주기/보간/벽drain·지역랜덤은 유지. 새run으로 차수 초기화. 잘못된기체id는 기존fallback유지.
- **Error & State Boundary**: 위 절차의 유효성 검사/멱등성/생명주기·실패 처리를 구현한다. 오류를 무시하고 성공 상태를 쓰거나 새 run/다른 계정에 완료 응답을 적용하지 않는다.

### I02. 벽 기준 보스 주기와 생성 budget

- Related Files:
  - `src/game/boss-cadence.js` :: `createBossCadence / canSpawnNormalWall / recordNormalWallSpawn / recordNormalWallPass` — new
  - `src/game/constants.js` :: `FIRST_BOSS_WALL_COUNT / REPEAT_BOSS_WALL_COUNT` — modify
  - `src/game/obstacles.js` :: `createObstacle encounterCycleId` — modify
  - `src/game/game-engine.js` :: `spawnObstacle / updateSpawning / processPassedObstacles / startWarningIfNeeded / updateStage / getTargetDifficulty / start / getSnapshot` — modify
  - `src/game/difficulty.js` :: `getDifficulty explicit bossActive context` — modify
  - `tests/helpers/engine-fixtures.js` :: `wall-cadence seeded boss test setup` — new
  - `tests/game/boss-cadence.test.js` :: `pure counter/budget tests` — new
  - `tests/game/boss-flow.test.js` :: `seeded boss setup` — modify
  - `tests/game/boss-patterns.test.js` :: `seeded boss setup` — modify
  - `tests/integration/boss-entry.test.js` :: `last wall drains before entry` — modify
  - `tests/integration/boss-background.test.js` :: `boss setup` — modify
  - `tests/integration/ambient-lasers.test.js` :: `boss setup` — modify
  - `tests/integration/central-hitbox.test.js` :: `boss setup` — modify
  - `tests/integration/combat-evolution.test.js` :: `boss setup` — modify
  - `tests/integration/manual-boss-fire.test.js` :: `boss setup` — modify
  - `tests/integration/mobile-input.test.js` :: `boss setup` — modify
  - `tests/integration/boss-only-loop.test.js` :: `fixed wall cadence replacing score thresholds` — modify

#### Details
- **Signatures & Types**:
```typescript
type BossCadence={target:20|15;cycleId:number;phase:'normal'|'draining'|'boss'|'transition';spawnedIds:Set<number>;passedIds:Set<number>};
createBossCadence(target?:20|15,cycleId?:number):BossCadence;
canSpawnNormalWall(c:BossCadence):boolean;
recordNormalWallSpawn(c:BossCadence,id:number):boolean;
recordNormalWallPass(c:BossCadence,id:number):boolean; // true iff this unique pass completes target
// getDifficulty gains a final optional context:{bossActive:boolean}; existing9 positional args preserved.
```
- **Data & Schema Fields**: 첫target20/cycleId1/phase normal/빈Sets. 다음일반구간은 stageTransition.phase=complete에서target15/cycleId+1로초기화. obstacle.encounterCycleId:number|null이며보스/전환대기벽은null. snapshot은counts/phase만복사하고Set을공유하지않는다. 테스트전용deps.initialBossCadence로경계상태seed가능,실제UI/score에설정노출없음.
- **Execution Flow / Logic**:
  1. score/progressionScore와독립. 실제첫run은20,스테이지도착완료부터15시작. 포탈swap시점/클리어직후초기화금지. 보스벽/클리어후추가벽제외.
  2. normal phase에서만spawn슬롯발급,목표수만큼생성했으면새벽을만들지않는다. 생성성공·배열push때id등록,구멍/간격거절때슬롯소비없음. 같은id생성/통과no-op,일반/특수/이동/혼합각1벽.
  3. 기존passed경계에서cycleId일치벽만통과기록. 마지막통과후draining으로전환,일반벽/ambient신규공격중단. 기존화면내벽과진행중ambient가끝난뒤기존boss entry로진입. 도중사망하면보스로건너뛰지않는다.
  4. startWarningIfNeeded는passedCount>=target으로판정,warningIndex는clearedBossCount+1. 활성engine의모든getDifficulty호출에bossActive context를명시해고득점만으로isBoss가되지않게한다. 독립함수의기존9인자fallback은호환/이력으로남길수있으나실제엔진에서는사용하지않는다.
  5. nextWarningScore/도착후random15..20점은활성런타임에서제외하고이력보존. 점수/보너스10/pause-10/속도progression/특수unlock10은유지. 클리어→추가2벽→포탈→도착흐름도유지한다.
  6. 초기score로보스를만들던시험은명시cadence fixture로이관하고본게임에점수트리거를남기지않는다. 첫19/20·이후14/15,모든점수동일카운트,생성20/15상한,화면끝drain,전환대기제외,재시작reset,pause/큰dt중복0검증.
- **Error & State Boundary**: 미등록id/이전cycle/이미passed는거절·무시하며NaN/무한상태방지. retry로슬롯만늘거나강제점수변경으로보스가나오지않게한다.

### I03. 동작·회귀 검증

- Related Files:
  - `tests/game/aircraft.test.js` :: `T09 behavioral coverage` — modify
  - `tests/game/difficulty.test.js` :: `T09 behavioral coverage` — modify
  - `tests/game/game-engine.test.js` :: `T09 behavioral coverage` — modify
  - `tests/ui/app-controller.test.js` :: `T09 behavioral coverage` — modify
  - `tests/ui/screens.test.js` :: `T09 behavioral coverage` — modify
  - `tests/docs/release-docs.test.js` :: `T09 behavioral coverage` — modify
  - `tests/integration/guest-access.test.js` :: `T09 behavioral coverage` — modify

#### Details
- best0/record오류/게스트/계정전환으로3기체 선택→타이틀→준비→실제run 일치,늦은응답불변. 임시off/기준0.3 원정책복구. boss1..3다양한rng모두고정/4+3결과·전투중불변/재시작저속. alias와immutableSHA/currentVersion보존.
- UI/상태/권한의 실제 관찰 결과를 검증한다. 정적 SQL 문자열 검사와 실제 DB 역할별 동작 확인은 구분한다.
- 네트워크/원격 자원 접근이 없으면 미실행 사실·정확한 후속 명령·예상 결과를 기록하며 운영 완료로 보고하지 않는다.

## Acceptance Criteria
- [ ] 게스트 포함 전 기체가 임시 선택·실제 출격되며 기록은 조작되지 않는다.
- [ ] 첫3보스 순서와 다음 배포0.2·과거 표시 alias가 정확하다.
- [ ] 첫20벽/도착후15벽이점수변동에영향없고보스·전환대기벽제외·생성상한·화면끝drain을지킨다.
- [ ] 지정 검증 및 관련 한계 기록. 무관한 버전 승격/push/배포 없음.

## Validation
- `npm test -- --run tests/game/aircraft.test.js tests/game/difficulty.test.js tests/game/game-engine.test.js tests/ui/app-controller.test.js tests/ui/screens.test.js tests/docs/release-docs.test.js tests/integration/guest-access.test.js` — 종료0.
- `npm run build` — 종료0.
- `npm test -- --run tests/game/boss-cadence.test.js tests/game/boss-flow.test.js tests/game/boss-patterns.test.js tests/integration/boss-entry.test.js tests/integration/boss-background.test.js tests/integration/ambient-lasers.test.js tests/integration/central-hitbox.test.js tests/integration/combat-evolution.test.js tests/integration/manual-boss-fire.test.js tests/integration/mobile-input.test.js` — 종료0, 기존 score 기반 fixture를 새 cadence로 이관.


## Commit Message
```text
feat(feedback): unlock aircraft and schedule bosses by passed walls

Plan: 2026-11-02-v02-feedback-release
Phase: P01-game-experience
Task: T09-feedback-unlocks-and-version-policy

- v0.2 버전 표기·임시 기체 해금·초반 보스 순서 구현 및 경계 검증
- 승인된 기존 규칙과 운영 기록 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
