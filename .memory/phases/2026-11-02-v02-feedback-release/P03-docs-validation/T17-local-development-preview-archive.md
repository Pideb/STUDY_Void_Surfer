# Task: T17 관리 HTML 개발 예시 링크 탭

## Status: done

## Goal
기존시안·조절도구를관리HTML의로컬전용탭에서찾고승인/폐기/실행조건을알수있게한다.

## Decision Summary
- D06. 개발예시게임배포미포함. 공개플레이어문서와분리. 기존시안복제/삭제없이작동하는링크목록.
- [최종 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md).
- 선행 T16 플레이어 가이드 HTML·수동 업데이트·메뉴 링크 완료·커밋 후 진행. 현재 작업은 자기 범위만 검증하며 실제 배포는 수행하지 않는다.
- DB·통신·브라우저 실패를 게임 자체 실패나 미검증 성공으로 바꾸지 않는다.

## Implementation

### I01. 관리 HTML 개발 예시 링크 탭

- Related Files:
  - `docs/management/preview-catalog.json` :: `curated preview entries` — new
  - `docs/management/content.html` :: `preview archive tab/section` — modify
  - `docs/management/browser.js` :: `archive filtering and local links` — modify
  - `docs/management/style.css` :: `archive list styles` — modify
  - `scripts/build-management.mjs` :: `inject preview catalog with resolved paths` — modify
  - `tests/docs/preview-catalog.test.js` :: `existence/privacy/generation checks` — new

#### Details
- **Signatures & Types** (실제 구현은 기존 JS, 다음은 계약):
```typescript
type PreviewEntry={id:string;date:string;title:string;purpose:string;path:string;status:'approved'|'superseded'|'comparison';requiresServer:boolean;dependencies:string[]};
type PreviewCatalog={schemaVersion:1;entries:PreviewEntry[]};
validatePreviewCatalog(root:string,catalog:PreviewCatalog):void;
```
- **Data & Schema Fields**: 카탈로그초기목록은기존prototype중독립html을선별. 예: glitch/penalty editor,unique bosses,projectile speed,movingwalls,performance review,mobile controls,asset v3,guidev2,responsive,mobilelarge. 폐기v1/v2도status구분해필요항목만. 경로는workspace상대·개인절대경로/Downloads계정명저장금지.
- **Execution Flow / Logic**:
  1. 실제파일과연결된JS/이미지의존성존재검사. hiddenfixture/content/debug/reportHTML은의도한독립문서일때만명시추가. 자동glob전체공개목록생성금지. 승인상태는decision/evidence기반으로기록.
  2. 관리HTML에기존tab기능과같은키보드/ARIA새tab추가,제목/날짜/상태/목적검색·필터. 상대href는docs/management위치기준으로workspace.memory를가리키고새탭noopener사용.
  3. 일반관리HTML을project경로에서열때링크정상. Downloads독립복사본은원project루트를잃으므로원본경로복사안내/로컬프로젝트에서열기설명을표시하고성공을가정하지않는다. 브라우저보안을우회하거나file권한요청없음.
  4. http원격origin에서는로컬예시탭/링크내용을제외하거나'로컬전용'안내만표시. build/dist에.memory파일이나개발catalog를복사하지않고플레이어HTML에는미주입. 새catalog는관리문서생성기만읽는다.
  5. 과거시안원본/기존성능backup SHA보존. 중복대형HTML을inlineembed하지않아관리파일크기를불필요하게늘리지않는다. 해당탭은다른기본랩·history동작을깨지않는다.
- **Error & State Boundary**: 위 절차의 유효성 검사/멱등성/생명주기·실패 처리를 구현한다. 오류를 무시하고 성공 상태를 쓰거나 새 run/다른 계정에 완료 응답을 적용하지 않는다.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/docs/preview-catalog.test.js` :: `T17 behavioral coverage` — new
  - `tests/docs/management-model.test.js` :: `T17 behavioral coverage` — modify
  - `tests/docs/release-docs.test.js` :: `T17 behavioral coverage` — modify

#### Details
- entry경로·종속자산존재/경로탈출금지/중복id거절/상태필터/원격guard/Downloads한계설명. dist와guide에archive자산0,기존관리tabs/슬라이더정상,원본snapshotSHA불변.
- UI/상태/권한의 실제 관찰 결과를 검증한다. 정적 SQL 문자열 검사와 실제 DB 역할별 동작 확인은 구분한다.
- 네트워크/원격 자원 접근이 없으면 미실행 사실·정확한 후속 명령·예상 결과를 기록하며 운영 완료로 보고하지 않는다.

## Acceptance Criteria
- [x] 관리용로컬HTML에서선별한개발예시들을찾아열수있다.
- [x] 개발예시자산·링크목록이게임공개배포에섞이지않는다.
- [x] 지정 검증 및 관련 한계 기록. 무관한 버전 승격/push/배포 없음.

## Validation
- `npm test -- --run tests/docs/preview-catalog.test.js tests/docs/management-model.test.js tests/docs/release-docs.test.js` — 종료0.

- 실제 브라우저/승인 시안 비교 결과를 `.memory/validation/2026-11-02-v02-feedback-release/`에 기록한다.

## Commit Message
```text
feat(docs): archive local development preview links

Plan: 2026-11-02-v02-feedback-release
Phase: P03-docs-validation
Task: T17-local-development-preview-archive

- 관리 HTML 개발 예시 링크 탭 구현 및 경계 검증
- 승인된 기존 규칙과 운영 기록 보존
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: see Git log (Task header)

## Execution evidence
- 3 targeted files / 18 tests passed. Real browser: 12 local links, status filter, keyboard ARIA tab navigation and zero runtime errors.
- Curated original self-contained HTMLs are preserved and committed once, not embedded in management output. Remote/Downloads guard tested; no archive in public guide or dist.
- Generated browser-check document removed after inspection; official release documents are not regenerated before deployment request.
