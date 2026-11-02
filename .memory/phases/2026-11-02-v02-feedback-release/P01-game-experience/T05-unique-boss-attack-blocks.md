# Task: T05 6지역 고유 공격·차수별 공격 해금

> 이 작업은 [v0.2 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md)에 포함된다. 아래 기존 게임·시각 결정 링크는 원래 승인 세부를 보존한다. 버전·임시 해금·첫3보스·회전·메뉴·기록에 관한 충돌은 v0.2 통합 결정이 우선한다.

## Status: pending

## Goal
두 번째 보스부터 지역별 고유 공격을 기존 패턴과 섞고 세트 예고·반복·탄 수명·종료를 분리하여 무한 진행을 방지한다.

## Decision Summary
- 최종결정§2/5~7. 기존공통블록보존,unique추가. random1~3세트, boss2 warning2s/3+1.5s;2~3은위험탄정리후,4+는마지막실발사후다음예고. 벽동반탄3차/레이저4차부터.
- T04 완료·커밋 후 진행.
- [최종 결정](../../../decisions/2026-11-02-v01-gameplay-visual-polish.md). 범위 밖 물리·점수·계정·배포 변경 없음.
- world960×540 논리좌표, 실제화면의 CSS/물리픽셀과 구분. 프리뷰 fixture는 본게임 로직이 아니다.

## Implementation

### I01. 6지역 고유 공격·차수별 공격 해금

- Related Files:
  - `src/game/boss-unique-attacks.js` :: `createUniqueAttack / updateUniqueAttack / isUniqueAttackResolved` — new
  - `src/game/boss-patterns.js` :: `createBossPatternRound` — modify
  - `src/game/boss.js` :: `createBossEncounter / advanceBossEncounter` — modify
  - `src/game/game-engine.js` :: `activateBossPattern / scheduleBossAttack / updateBossAttack / completeBossPattern / getSnapshot` — modify
  - `src/game/renderer.js` :: `drawEnemy / projectile and telegraph dispatch` — modify
  - `src/game/projectile-speed.js` :: `sampleProjectileSpeed` — read-only
  - `src/game/boss-geometry.js` :: `actual muzzle and core geometry` — read-only
  - `.memory/validation/2026-10-30-v01-projectile-speed/sim.js` :: `unique visual reference` — read-only

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
createUniqueAttack(options:{stageId:string;bossNumber:number;rng:()=>number}):UniqueAttack;
updateUniqueAttack(attack:UniqueAttack,dt:number,player:Player,options:{originAt:(seconds:number)=>BossGeometry;scrollSpeedAt:(seconds:number)=>number;rng:()=>number;projectileImmune:boolean}):void;
isUniqueAttackResolved(attack:UniqueAttack):boolean;
type UniqueAttack={type:'unique';setsPlanned:number;setsStarted:number;elapsedSeconds:number;sets:UniqueSet[];resolved:boolean};
```
- **Data & Schema Fields**: UniqueSet: id/phase(warning|firing|clearing|resolved)/warningRemainingSeconds/lockedAim:Point|null/lastLaunchAt:number|null/projectiles:Shot[]. Shot: id/parentId:null|string/state(waiting|orbiting|flying|resolved)/delaySeconds/launchOrigin:null|Point/target:null|Point/previous:Point/speed:null|number/speedSampled/flightElapsedSeconds/hitPlayer. setsPlanned 정수1..3, 명시한 nullable 외 전부 비null. DB·영구 저장 없음.
- **Execution Flow / Logic**:
  1. createBossPatternRound에 bossNumber>=2 unique를한번포함. 기존shuffle/직전블록연속방지 유지. unique는벽없는독립블록이며입장/기존벽/발사잠금/도전진행종료대기 기존guard를준수.
  2. 한세트형태: 수정1모탄→3자탄동시;산업3발.30s;신호6발×2파/1.15s;중력5발.30s;심연6발.18s;태양열린고리6동시. 세트수random1..3뿐자동탄수/간격증가없음.
  3. actualmuzzle/core 기준으로승인sim의방향/형태변환. 구현초안: 수정split x625/중앙높이와140·270·400목표;신호시안의2개116높이통로/12개표적;중력orbit69×55;심연amp80/wavelength145/초기blend180;태양각도[-.75,-.5,-.28,.28,.5,.75]. 시안의고정총구좌표를복사하지말고월드내안전배치/실총구로변환. 크기·통로폭은확정새밸런스라주장하지않고T09경로검증.
  4. 산업warning절반은player추적,중간에world target고정,3발동안다시player조회금지. 움직이는보스에서는각실총구→고정target으로예고선/경로일치시킨다(월드고정표적은구현기술정의). 다른직선/곡선탄도사전표시와실제path일치.
  5. 각실발사/분열child에서T04helper로속도샘플링. 분열/지연발사/궤도대기탄은초반세트clear판정에포함.4차부터lastactual launch 이벤트이후다음warning만시작하며이전flying탄보존. 분열모탄발사만으로lastlaunch완료처리금지.
  6. 탄마다 sweptcollision과offscreen정리,대시projectile면역만기존대로. QTE중시간정지,포효중정상진행,보스HP0후기존완료가드충족전까지잔여공격정리. restart/newrun으로모든set상태폐기. allsets발사완료+위험탄0일때만resolved,completeBossPattern한번.
  7. 기존walls블록inline은boss3+1탄,boss4+기존line가능으로gate. line이미random비유도임;15%/gap보호/필수입력간격유지. 독립signature3..6발/global/ambient해금변경없음. snapshot은중첩sets/projectiles/points복제.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/game/boss-unique-attacks.test.js` :: `T05 behavioral coverage` — new
  - `tests/game/boss-patterns.test.js` :: `T05 behavioral coverage` — modify
  - `tests/game/boss-flow.test.js` :: `T05 behavioral coverage` — modify
  - `tests/integration/combat-evolution.test.js` :: `T05 behavioral coverage` — modify
  - `tests/integration/projectile-phases.test.js` :: `T05 behavioral coverage` — modify

#### Details
- 6지역×boss2/3/4/7×1/2/3세트,splitchild포함lastlaunch,3차wait/4차overlap과모든세트예고. 고정탄수·간격·산업절반lock,actualmuzzle/path정합,무적없을때피격과dash면역,miss화면밖/전탄정리뒤블록진행. boss1inline없음/3차탄/4차laser. 수천프레임bounded simulation으로무한대기없음.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [ ] 6지역고유공격이승인된탄수·간격·세트예고로나온다.
- [ ] 보스차수별대기/중첩·inline해금과잔여탄정리가정확하다.
- [ ] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run tests/game/boss-unique-attacks.test.js tests/game/boss-patterns.test.js tests/game/boss-flow.test.js tests/integration/combat-evolution.test.js tests/integration/projectile-phases.test.js` — 종료코드0 및 대상 검증 통과.

## Commit Message
```text
feat(boss): add six regional unique attack blocks and progression gates

Plan: 2026-11-02-v02-feedback-release
Phase: P01-game-experience
Task: T05-unique-boss-attack-blocks

- 6지역 고유 공격·차수별 공격 해금 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
