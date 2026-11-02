# Task: T10 게임 관리 모델·개발 검토본·실행 기록 동기화

## Status: pending

## Goal
바뀐 실제규칙을 관리문서 데이터모델에반영하고 배포전검토본을생성하되 공식배포기록/보호스냅샷을올리지않는다.

## Decision Summary
- AGENTS 버전규칙 및 최종결정§12. 현재 배포0.01-b, 다음0.1. 실제 배포 요청 없음: release:prepare/registry변경/push/배포 금지. source변경으로 docs:check가차단되는상태는배포전필수gate로명시한다.
- T09 완료·커밋 후 진행.
- [최종 결정](../../../decisions/2026-11-02-v01-gameplay-visual-polish.md). 범위 밖 물리·점수·계정·배포 변경 없음.
- world960×540 논리좌표, 실제화면의 CSS/물리픽셀과 구분. 프리뷰 fixture는 본게임 로직이 아니다.

## Implementation

### I01. 게임 관리 모델·개발 검토본·실행 기록 동기화

- Related Files:
  - `scripts/game-catalog.mjs` :: `collectGameCatalog` — modify
  - `docs/management/lab-model.mjs` :: `existing speed/physics/success simulation model` — modify
  - `docs/management/browser.js` :: `challenge and attack rule descriptions` — modify
  - `docs/management/content.html` :: `approved rule explanations` — modify
  - `tests/docs/management-model.test.js` :: `catalog/simulator parity` — modify
  - `tests/docs/release-docs.test.js` :: `existing release protections` — read-only
  - `scripts/release-docs.mjs` :: `documentOutputs / check / prepare` — read-only
  - `docs/management/releases.json` :: `current deployed registry` — read-only
  - `.memory/validation/2026-11-02-v01-gameplay-visual-polish/` :: `draft HTML, report and hashes` — new

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
collectGameCatalog():GameCatalog; // preserve schemaVersion1 and extend explicit named fields
GameCatalog additions: bossWallRules:Array<{boss:number;gapHeight:number;spawnIntervalSeconds:number;specialChance:number;timingWindowSeconds:number;inlineProjectile:boolean;inlineLaser:boolean}>;
projectileSpeed:{reference:number;minBase:number;maxBase:number;gain:number;min:number;max:number};
uniqueAttacks:Array<{stageId:string;unlockBoss:number;count:string;intervalSeconds:number|null}>;
```
- **Data & Schema Fields**: catalog의 상수/실규칙은src함수에서읽는다. keycount/time,4penalty/8초/.18,freeze160,uniqueunlock2,inline3/4,success.30,movingart선택을표시. 문서슬라이더는previewOnly:true이며게임파일/DB쓰기없음. 배포currentVersion/fingerprint/snapshot해시읽기전용.
- **Execution Flow / Logic**:
  1. 현재collectGameCatalog의boss벽50%/간격1.4일괄설명과이전QTE시각을새실제rules로동기화한다. 기존속도·중력·히트박스랩과새데이터가모순되지않게하고제외한speedcap기체설명을재도입하지않는다.
  2. 실제게임src변경후docs:check는현재배포fingerprint불일치로차단됨이정상이다. 배포완료나공식문서최신검증통과라고보고하지않고그gate를최종report에명시한다. fingerprint를손으로덮어쓰거나검사우회옵션을추가하지않는다.
  3. 공식registry를메모리에서clone한검토전용데이터(currentVersion='0.1',status='draft-not-deployed',actual source fingerprint)로 documentOutputs(root,clone)를호출하고출력은전부 .memory/validation/.../draft-docs/ 아래로만쓴다. 실제0.1release/snapshot/versions.json/공식latest/management파일로쓰지않는다. draft가운영반영처럼보이지않게표시한다.
  4. 관리/발표 검토본을실브라우저로열어tab/슬라이더/공격시각·버전표시와오프라인자산을확인한다. 원본0.01v/0.01-b 및확정snapshotSHA불변검증. docs모델tests는실src수치와비교하여중복공식오류방지.
  5. 후속배포체크리스트에실제요청후 release:prepare -- --new-release --title ... --change ... →전체검증·docs:check→커밋/push→Actions/HEAD/운영bundleSHA직접확인→record-deployment증거기록을남긴다. 지금그절차를자동실행하지않는다.
  6. T01~T10진행률·current포인터·승인결정링크를정리한다. 완료는개발구현/검토완료이고0.1배포완료와구분한다. 이전원본/폐기시안/성능rollback자료는보존한다.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/docs/management-model.test.js` :: `T10 behavioral coverage` — modify
  - `tests/docs/release-docs.test.js` :: `T10 behavioral coverage` — modify

#### Details
- src rules↔catalog↔랩값일치,0.1검토본은draft상태,공식registry/snapshot불변,SHA일치. docs:check 예상오류는sourcefingerprint불일치인지확인하고HTML누락/그외오류를같이무시하지않는다. 새문서탭/슬라이더기본동작검증.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [ ] 실제 새 규칙과 맞는 관리·발표 개발검토본을 .memory에서 확인할 수 있다.
- [ ] 공식 버전은0.01-b이고 배포 전 문서 gate 및 후속 배포 절차가 명확하다.
- [ ] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run tests/docs/management-model.test.js tests/docs/release-docs.test.js` — 종료코드0 및 대상 검증 통과.
- `npm run docs:check` — 게임 소스가 달라졌다는 fingerprint gate 차단을 기록한다. 통과로 위조하거나 다른 오류를 묵살하지 않는다.
- 실제 브라우저 시각·입력 검증 및 승인 시안 비교 결과를 `.memory/validation/2026-11-02-v01-gameplay-visual-polish/`에 기록한다. 테스트 통과를 스크린샷 확인 대신 사용하지 않는다.

## Commit Message
```text
docs(game): synchronize v0.1 rule models and draft handoff

Plan: 2026-11-02-v01-gameplay-visual-polish
Phase: P01-v01-runtime
Task: T10-documentation-and-handoff

- 게임 관리 모델·개발 검토본·실행 기록 동기화 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
