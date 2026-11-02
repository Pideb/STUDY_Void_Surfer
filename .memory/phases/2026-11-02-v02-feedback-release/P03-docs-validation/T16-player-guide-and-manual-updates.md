# Task: T16 플레이어 가이드 HTML·수동 업데이트·메뉴 링크

## Status: pending

## Goal
실제배포URL에서조작법과개발자수동업데이트를읽을수있고승인한메뉴링크로새탭을연다.

## Decision Summary
- D05/D09/D10. 자동소스분석으로플레이어업데이트문구생성금지. 기존관리/발표자동내역과원고분리.
- [최종 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md).
- 선행 T15 비공개 동점 랭킹 완료·커밋 후 진행. 현재 작업은 자기 범위만 검증하며 실제 배포는 수행하지 않는다.
- DB·통신·브라우저 실패를 게임 자체 실패나 미검증 성공으로 바꾸지 않는다.

## Implementation

### I01. 플레이어 가이드 HTML·수동 업데이트·메뉴 링크

- Related Files:
  - `docs/player/guide-content.json` :: `manual player-facing copy` — new
  - `docs/player/updates.json` :: `developer-authored changelog` — new
  - `scripts/build-player-guide.mjs` :: `playerGuideOutput / check` — new
  - `public/guide/index.html` :: `generated self-contained player HTML` — new
  - `src/ui/screens.js` :: `renderMenuScreen guide anchor` — modify
  - `src/styles.css` :: `approved utility row/hover` — modify
  - `package.json` :: `guide:build / guide:check` — modify
  - `scripts/release-docs.mjs` :: `documentOutputs includes guide output` — modify
  - `scripts/release-core.mjs` :: `gameFingerprint read-only ordering contract` — read-only

#### Details
- **Signatures & Types** (실제 구현은 기존 JS, 다음은 계약):
```typescript
type ManualUpdate={version:string;date:string;title:string;body:string[]};
type GuideContent={schemaVersion:1;controls:Array<{input:string;description:string}>;notes:string[]};
playerGuideOutput(root:string):string;
buildPlayerGuide(root:string,options?:{check?:boolean}):void;
```
- **Data & Schema Fields**: updates.json은 schemaVersion1/entries:ManualUpdate[], 초기entries=[]. 수동 원고 문구를 자동 변경하지 않는다. 버전은 개발자가 entries에 작성한 값이며 공개 가이드에 자동 currentVersion/해시/commitid/생성시각을 넣지 않는다. 개인정보/통계/개발archive/내부proof 미포함.
- **Execution Flow / Logic**:
  1. 사용자용조작원고는현재승인키(클릭/터치/↑상승,Space대시,Shift/Ctrl보스발사,메뉴방향키/Space,게임오버ESC예외)와모바일가로·회전계속하기를설명. 정밀보스HP/WASD안내제거등기존출격전안내제약을튜토리얼에다시삽입하지않는다.
  2. 업데이트원고빈상태는'업데이트 내역은 준비 중입니다.'처럼정직하게표시. 실제원고를작성해달라는사용자요청/개발자작성전에는새v0.2변경리스트를자동채워넣지않는다. JSONschema검증·HTMLescape로원고내script삽입방지.
  3. 기존우주/네온기조로읽기쉬운자체HTML생성. 작은모바일/키보드focus/reducedmotion/print지원. 안내페이지는문서이므로세로에서도읽을수있고게임전용가로게이트로차단하지않는다.
  4. 실제메뉴에guide anchor target_blank/relnoopener로public/guide/index.html연결. 가이드왼쪽/음량오른쪽같은행,승인PC/모바일크기유지. T10탐색에서자동대상포함·실usergesture새탭열림.
  5. 가이드는 public 앱 자산이므로 gameFingerprint에 포함된다. 출력은 수동 원고/템플릿만으로 결정하고 현재 registry버전/해시/생성시간을 주입하지 않아 자기참조를 막는다. documentOutputs에도 가이드 출력 검사를 포함하되 공식 발표/관리 문서는 기존처럼 검증 후 생성.
  6. prepare 실제 실행에서는 가이드 최신화를 먼저 임시 생성·검증하고 public에 동기화한 뒤 fingerprint를 고정해 전체 검증을 시작한다. 검증 실패 시 버전·공식 문서는 그대로, 가이드도 이전 bytes로 rollback. dry-run은 절대 쓰지 않으며 stale가이드면 guideStale=true를 보고한다. 원고가없던기존fixture는비생성경로로호환. 이후 생성이 같은bytes로수렴하는 시험필수.
  7. guide:build/check로독립개발가능,build/dist/guide/index.html과직접URL확인. /auth/callback rewrite유지,원격게시·배포는실제후속요청에서만. 가이드 수정은배포fingerprint에반영되며개발자료공개를유발하지않는다.
- **Error & State Boundary**: 위 절차의 유효성 검사/멱등성/생명주기·실패 처리를 구현한다. 오류를 무시하고 성공 상태를 쓰거나 새 run/다른 계정에 완료 응답을 적용하지 않는다.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/docs/player-guide.test.js` :: `T16 behavioral coverage` — new
  - `tests/ui/screens.test.js` :: `T16 behavioral coverage` — modify
  - `tests/ui/menu-navigation.test.js` :: `T16 behavioral coverage` — modify
  - `tests/deployment/config.test.js` :: `T16 behavioral coverage` — modify

#### Details
- 수동entries원본bytes보존/빈state/escape/잘못된schema/staleoutput/결정적동일생성·공개fingerprint자기참조없음. 새탭키보드/터치,dist직접URL,공개HTML에analytics/privatearchive없음.375폭/세로문서읽기·게임가로제약분리.
- UI/상태/권한의 실제 관찰 결과를 검증한다. 정적 SQL 문자열 검사와 실제 DB 역할별 동작 확인은 구분한다.
- 네트워크/원격 자원 접근이 없으면 미실행 사실·정확한 후속 명령·예상 결과를 기록하며 운영 완료로 보고하지 않는다.

## Acceptance Criteria
- [ ] 게임메뉴에서배포가능한플레이어HTML을새탭으로열수있다.
- [ ] 수동업데이트원고가자동생성에덮어쓰이지않고버전표시만동기화된다.
- [ ] 지정 검증 및 관련 한계 기록. 무관한 버전 승격/push/배포 없음.

## Validation
- `npm test -- --run tests/docs/player-guide.test.js tests/ui/screens.test.js tests/ui/menu-navigation.test.js tests/deployment/config.test.js` — 종료0.
- `npm run build` — 종료0.
- `npm run guide:check` — 종료0.

- 실제 브라우저/승인 시안 비교 결과를 `.memory/validation/2026-11-02-v02-feedback-release/`에 기록한다.

## Commit Message
```text
feat(docs): add player guide and manual update source

Plan: 2026-11-02-v02-feedback-release
Phase: P03-docs-validation
Task: T16-player-guide-and-manual-updates

- 플레이어 가이드 HTML·수동 업데이트·메뉴 링크 구현 및 경계 검증
- 승인된 기존 규칙과 운영 기록 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
