# Task: T19 게임 관리 모델·개발 검토본·실행 기록 동기화

> 이 작업은 [v0.2 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md)에 포함된다. 아래 기존 게임·시각 결정 링크는 원래 승인 세부를 보존한다. 버전·임시 해금·첫3보스·회전·메뉴·기록에 관한 충돌은 v0.2 통합 결정이 우선한다.

## Status: pending

## Goal
바뀐 실제규칙을 관리문서 데이터모델에반영하고 배포전검토본을생성하되 공식배포기록/보호스냅샷을올리지않는다.

## Decision Summary
- 현재 운영 내부0.01-b(표시v0.1b), 다음 실제배포v0.2. T09가 사용자 승인한 base/next/표시alias를 갱신했으며 이 Task는 실제currentVersion 승격/배포를 하지 않는다. docs:check 운영fingerprint gate를 보존한다.
- T18 완료·커밋 후 진행.
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
  - `scripts/release-docs.mjs` :: `documentOutputs add archival alias outputs; preserve check/prepare gates` — modify
  - `scripts/build-presentation.mjs` :: `presentationOutput display-version usage` — modify
  - `scripts/release-labels.mjs` :: `archivalAliasOutput` — new
  - `docs/management/releases.json` :: `current deployed registry` — read-only
  - `.memory/validation/2026-11-02-v02-feedback-release/` :: `draft HTML, report and hashes` — new

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
collectGameCatalog():GameCatalog; // preserve schemaVersion1 and extend explicit named fields
GameCatalog additions: bossWallRules:Array<{boss:number;gapHeight:number;spawnIntervalSeconds:number;specialChance:number;timingWindowSeconds:number;inlineProjectile:boolean;inlineLaser:boolean}>;
projectileSpeed:{reference:number;minBase:number;maxBase:number;gain:number;min:number;max:number};
uniqueAttacks:Array<{stageId:string;unlockBoss:number;count:string;intervalSeconds:number|null}>;
feedbackAccess:{temporaryEnabled:boolean;expiresAtBase:string;notice:string};
menuLayout:{referenceWidth:number;referenceHeight:number;mobilePrimaryFont:number;mobilePrimaryHeight:number;rotationResume:'manual'};
bossCadence:{firstWalls:20;repeatWalls:15;resetAt:'stage-arrival';excludeBossWalls:true;excludeTransitionWalls:true};
ranking:{order:['score-desc','private-duration-desc','achieved-asc','user-id-asc'];durationVisible:false};
archivalAliasOutput(root:string,release:ReleaseEntry):string;
```
- **Data & Schema Fields**: catalog의 상수/실규칙은src함수에서읽는다. keycount/time,4penalty/8초/.18,freeze160,uniqueunlock2,inline3/4,success.30,movingart선택을표시. 문서슬라이더는previewOnly:true이며게임파일/DB쓰기없음. 배포currentVersion/fingerprint/snapshot해시읽기전용.
- **Execution Flow / Logic**:
  1. 현재collectGameCatalog의boss벽50%/간격1.4일괄설명과이전QTE시각을새실제rules로동기화한다. 기존속도·중력·히트박스랩과새데이터가모순되지않게하고제외한speedcap기체설명을재도입하지않는다.
  2. 실제게임src변경후docs:check는현재배포fingerprint불일치로차단됨이정상이다. 배포완료나공식문서최신검증통과라고보고하지않고그gate를최종report에명시한다. fingerprint를손으로덮어쓰거나검사우회옵션을추가하지않는다.
  3. 공식registry를메모리에서clone하고 version0.2의 검토용 release 항목(status='draft-not-deployed',실제source fingerprint,검증결과)을 명시 추가한 뒤 documentOutputs(root,clone)를 호출한다. 출력은 전부 .memory/validation/.../draft-docs/ 아래로만 쓴다. 실제0.2 release/snapshot/versions.json/공식latest/management에는 쓰지 않는다.
  4. 관리/발표 검토본을실브라우저로열어tab/슬라이더/공격시각·버전표시와오프라인자산을확인한다. 원본0.01v/0.01-b 및확정snapshotSHA불변검증. docs모델tests는실src수치와비교하여중복공식오류방지.
  5. 후속배포체크리스트에실제요청후 release:prepare -- --new-release --title ... --change ... →전체검증·docs:check→커밋/push→Actions/HEAD/운영bundleSHA직접확인→record-deployment증거기록을남긴다. 지금그절차를자동실행하지않는다.
  6. T01~T19 진행률/current/모든승인링크와원격DB gate를정리한다. 개발검증완료와v0.2배포완료를구분한다. 원본·폐기시안·성능rollback자료를보존한다.
  7. 관리catalog에 임시해금(실제기록은유지),첫보스3유형,메뉴키보드/회전복귀,비공개통계의규칙설명만 반영한다. 로그 원본/nonce/사용자총횟수를 HTML에 임베드하지 않는다. 가이드 수동업데이트 원고는 수정하지 않는다. 로컬archive탭 동작 유지.
     보스소개/해금표의'첫20점/다음+15~20점'은첫20벽/새스테이지후15벽으로바꾸고보스·전환벽제외를설명한다. 동점정렬은시간비공개규칙만설명하고실사용자시간을관리/발표/public가이드데이터에넣지않는다. 수동업데이트원고는여전히자동작성하지않는다.
  8. 과거 표기는 새 발표/관리출력에서 getDisplayVersion으로 v0.1/v0.1b로 표시한다. 필요 별도 문서인 void-surfer-0.1.html/void-surfer-0.1b.html은 immutable 원본에서 만든 표시용 alias다. 과거 게임내용을 현재catalog로 재작성하지 말고 제목/표시텍스트·표시metadata만 변경, sourceReleaseId/원본SHA/과거검증·배포증거는 그대로 둔다. 원본0.01v/0.01-b는 덮어쓰지 않는다.
  9. archivalAliasOutput은 신뢰된 로컬 원본의 태그/텍스트를 구분해 script/style/asset URL을 보존하고 텍스트·title의 버전 라벨만 변환한다. releaseMetadata는 JSON으로 읽어 displayVersion/sourceReleaseId/원본SHA를 추가하되 version/sourceCommit/validation/deployment를 바꾸지 않는다. 동적표시는 표시용 사본의 label map으로만 변환하고 브라우저에서 제목·보이는버전과 원본 게임내용을 비교한다. CI docs:check가 npm 설치 전에 실행되므로 외부 DOM 파서에 새로 의존하지 않는다.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/docs/management-model.test.js` :: `T19 behavioral coverage` — modify
  - `tests/docs/release-docs.test.js` :: `T19 behavioral coverage` — modify
  - `tests/docs/player-guide.test.js` :: `manual source preservation` — modify
  - `tests/docs/preview-catalog.test.js` :: `local-only preview links` — modify

#### Details
- src rules↔catalog↔랩값일치,0.2검토본은draft상태,공식currentVersion/snapshotSHA불변. 과거alias표시와원본내용·원고보존,개발archive로컬제약,docs:check는예상sourcefingerprint오류만분리한다. 다른오류를함께무시하지않는다.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [ ] 실제 새 규칙과 맞는 관리·발표 개발검토본을 .memory에서 확인할 수 있다.
- [ ] 공식 버전은0.01-b이고 배포 전 문서 gate 및 후속 배포 절차가 명확하다.
- [ ] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run tests/docs/management-model.test.js tests/docs/release-docs.test.js` — 종료코드0 및 대상 검증 통과.
- `npm run docs:check` — 게임 소스가 달라졌다는 fingerprint gate 차단을 기록한다. 통과로 위조하거나 다른 오류를 묵살하지 않는다.
- 실제 브라우저 시각·입력 검증 및 승인 시안 비교 결과를 `.memory/validation/2026-11-02-v02-feedback-release/`에 기록한다. 테스트 통과를 스크린샷 확인 대신 사용하지 않는다.

## Commit Message
```text
docs(game): synchronize v0.2 references aliases and draft handoff

Plan: 2026-11-02-v02-feedback-release
Phase: P03-docs-validation
Task: T19-documentation-and-handoff

- 게임 관리 모델·개발 검토본·실행 기록 동기화 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
