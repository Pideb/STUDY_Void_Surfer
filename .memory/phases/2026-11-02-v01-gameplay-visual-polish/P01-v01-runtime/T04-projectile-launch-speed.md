# Task: T04 실제 발사 순간 기준 투사체 속도

## Status: pending

## Goal
기존·고유 탄의 속도를 실제 게임속도에 연결하고 지연 발사와 비행 중 위치 연속성을 보장한다.

## Decision Summary
- 최종결정§5. clamp(base220..360+(actualScroll-240)*.35,80,800), 실제발사때각탄샘플/비행중고정. T05새공격도같은helper사용.
- T03 완료·커밋 후 진행.
- [최종 결정](../../../decisions/2026-11-02-v01-gameplay-visual-polish.md). 범위 밖 물리·점수·계정·배포 변경 없음.
- world960×540 논리좌표, 실제화면의 CSS/물리픽셀과 구분. 프리뷰 fixture는 본게임 로직이 아니다.

## Implementation

### I01. 실제 발사 순간 기준 투사체 속도

- Related Files:
  - `src/game/boss-signatures.js` :: `createSignatureAttack / moveProjectile / updateSignatureAttack` — modify
  - `src/game/game-engine.js` :: `launchSignatureAttack / updateBossAttack` — modify
  - `src/game/projectile-speed.js` :: `sampleProjectileSpeed` — new

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
sampleProjectileSpeed(actualScrollSpeed:number,rng:()=>number):number;
type ProjectileLaunchState={speed:number|null;speedSampled:boolean;flightElapsedSeconds:number};
updateSignatureAttack(attack:SignatureAttack,dt:number,player:Player,options?:{projectileImmune?:boolean;immuneSeconds?:number;originAt?:(seconds:number)=>Point;scrollSpeedAt?:(seconds:number)=>number}):void;
```
- **Data & Schema Fields**: 생성전 speed=null, speedSampled=false, flightElapsedSeconds=0. 기존공격생성시난수경로선택은보존; launchspeed용rng를명시전달/보관. 함수/클로저는snapshot에내보내지않는다. 예고표시는220..360기준범위이지미확정속도단정이아니다.
- **Execution Flow / Logic**:
  1. purehelper로base범위와reference240/gain.35/min80/max800을단일관리. 입력actualScroll은현재보간중 engine.speed이지 progression목표값아님.
  2. delay+charge경계를넘는 dt에서는프레임을발사전후로분할하여 실제launch시각/actualmuzzle을얻는다. speed는그때한번샘플, 이후절대덮어쓰지않는다. delayedshot마다현재속도가달라도정상.
  3. 기존절대elapsed×speed경로에서비행거리=flightElapsed×sampledspeed로분리하여변경순간jump방지. sweptcollision/면역범위/화면밖resolve는유지한다.
  4. scrollSpeedAt미제공의기존단위호출은reference240기준으로기존범위유지. engine은정상callback전달. 비정상입력은finite reference로방어하며새공격은helperimport.
  5. 예고/charging중boss가움직여도originAt로실발사총구사용. 비행중homing이나속도재샘플없음. parent/child는독립launch.
  6. snapshot의null속도를renderer가NaN곱셈하지않게전발사분기유지. run종료지연탄/콜백폐기.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/game/boss-signatures.test.js` :: `T04 behavioral coverage` — modify
  - `tests/integration/projectile-phases.test.js` :: `T04 behavioral coverage` — modify
  - `tests/game/game-engine.test.js` :: `T04 behavioral coverage` — modify
  - `tests/game/projectile-speed.test.js` :: `T04 behavioral coverage` — new

#### Details
- 240/460/700/770의최소최대/80·800 clamp, charge중속도변경, delayedshot각각다른값, flying후속도변경영향없음, coarse/fine dt위치동등, immune/sweptcollision/offscreen완료. helper시험은경계검증으로하고동일공식복제만검사하지않는다.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [ ] 700px/s에서실발사탄범위381~521이된다.
- [ ] 발사후스크롤이변해도그탄의속도·위치는연속적으로유지된다.
- [ ] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run tests/game/boss-signatures.test.js tests/integration/projectile-phases.test.js tests/game/game-engine.test.js tests/game/projectile-speed.test.js` — 종료코드0 및 대상 검증 통과.

## Commit Message
```text
feat(projectiles): sample scroll-linked speed at actual launch

Plan: 2026-11-02-v01-gameplay-visual-polish
Phase: P01-v01-runtime
Task: T04-projectile-launch-speed

- 실제 발사 순간 기준 투사체 속도 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
