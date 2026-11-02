# Task: T11 게임오버 재시작 입력·암전 안내·점수 저장 수명

## Status: done

## Goal
결과창밖터치/ESC외새키로빠르게재시작하고ESC로메뉴에가되이전run의점수저장이새run을덮어쓰거나누락되지않는다.

## Decision Summary
- D04. 버튼재시작제거/랭킹포인터전용/팝업내일반클릭은무시. 하단문구정확보존. 저장오류표시·재시도 유지.
- [최종 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md).
- 선행 T10 모든 메뉴 방향키·Space 탐색 완료·커밋 후 진행. 현재 작업은 자기 범위만 검증하며 실제 배포는 수행하지 않는다.
- DB·통신·브라우저 실패를 게임 자체 실패나 미검증 성공으로 바꾸지 않는다.

## Implementation

### I01. 게임오버 재시작 입력·암전 안내·점수 저장 수명

- Related Files:
  - `src/ui/screens.js` :: `renderGameOverScreen` — modify
  - `src/ui/app-controller.js` :: `finishGame / loadGameOverData / beginPlaying / handleKeyDown / pointer routing` — modify
  - `src/styles.css` :: `gameover scrim / footer / safe-area` — modify

#### Details
- **Signatures & Types** (실제 구현은 기존 JS, 다음은 계약):
```typescript
type FinishedRun={runId:string;userId:string|null;user:User|null;score:number;aircraftId:string;adminRun:boolean};
type ScoreSaveJob={run:FinishedRun;state:'queued'|'saving'|'saved'|'error';promise:Promise<unknown>|null};
queueRunScore(run:FinishedRun):Promise<void>;
```
- **Data & Schema Fields**: runId run당고유,종료시user/score/craft/admin확정. 저장job은화면requestId와별개로runId키Map;최대보관완료20건,진행중job삭제금지. no새DBmigration. 수치는구현메모리상한.
- **Execution Flow / Logic**:
  1. gameover root는 scrim/기존중앙panel/하단footer로구성. panel밖만pointer 재시작,footer도밖영역. panel menu/ranking이벤트는전파차단. 단추 '재시작' 삭제, footer정확문구네온가독성,게임외배경만약한암전.
  2. gameover에서반복아닌새keydown:Escape→메뉴,나머지→즉시재시작. window최상위회전/복귀모달은먼저처리. blur/keyup latches와결과진입전heldset으로사망전누른입력재사용방지;브라우저가전달하지않는OS단축키보장금지.
  3. rank/menu는pointer로유지,gameover에서는Space로nativefocused rankingclick가발동하지않게기본동작억제. 결과후랭킹화면으로이동하면그화면은일반키보드탐색복귀.
  4. finishGame에서run종료데이터를freeze한뒤scorejob1개를큐에넣는다. 기존submitBestScore 검증/게스트·관리자skip정책재사용. 재시작은network완료를기다리지않고준비흐름으로진입한다.
  5. 현재 loadGameOverData의savingguard/requestId는 UI용으로만. 이전run이saving중이어도새run저장job을거절하지않는다. 늦은응답은해당job만완료처리,같은run결과화면일때만UI갱신. 여러빠른재시작과save/ranking응답이독립적으로동작.
  6. 랭킹/기록재조회가선택기체나새runstate를변경하지않게한다. 오류는run별보존·원래재시도버튼으로같은payload재전송,최고점수upsert는기존idempotent동작사용. 새기체보너스/점수변경없음.
- **Error & State Boundary**: 위 절차의 유효성 검사/멱등성/생명주기·실패 처리를 구현한다. 오류를 무시하고 성공 상태를 쓰거나 새 run/다른 계정에 완료 응답을 적용하지 않는다.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/ui/screens.test.js` :: `T11 behavioral coverage` — modify
  - `tests/ui/app-controller.test.js` :: `T11 behavioral coverage` — modify
  - `tests/integration/game-over-restart.test.js` :: `T11 behavioral coverage` — new
  - `tests/integration/leaderboard-failure.test.js` :: `T11 behavioral coverage` — modify

#### Details
- popup밖/안/랭킹/menu/터치,ESC·Space·방향키·Enter·modifier+repeat·heldrelease,한이벤트한전환. deferredsaveA→restartB→saveB→A늦게완료 상태독립. 오류재시도samepayload·게스트관리자쓰기0. footer375높이·scrim가독성.
- UI/상태/권한의 실제 관찰 결과를 검증한다. 정적 SQL 문자열 검사와 실제 DB 역할별 동작 확인은 구분한다.
- 네트워크/원격 자원 접근이 없으면 미실행 사실·정확한 후속 명령·예상 결과를 기록하며 운영 완료로 보고하지 않는다.

## Acceptance Criteria
- [x] 결과창입력/버튼/하단안내가정확하고새run재시작을막지않는다.
- [x] 이전run의저장응답이새run/결과에영향없으며저장이중복·누락되지않는다.
- [x] 지정 검증 및 관련 한계 기록. 무관한 버전 승격/push/배포 없음.

## Validation
- `npm test -- --run tests/ui/screens.test.js tests/ui/app-controller.test.js tests/integration/game-over-restart.test.js tests/integration/leaderboard-failure.test.js` — 종료0.

- 실제 브라우저/승인 시안 비교 결과를 `.memory/validation/2026-11-02-v02-feedback-release/`에 기록한다.

## Commit Message
```text
feat(gameover): streamline restart controls and isolate score saves

Plan: 2026-11-02-v02-feedback-release
Phase: P01-game-experience
Task: T11-game-over-restart-and-save-lifetime

- 게임오버 재시작 입력·암전 안내·점수 저장 수명 구현 및 경계 검증
- 승인된 기존 규칙과 운영 기록 보존
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: see Git log (Task header)

## Execution evidence
- Vitest4 files/65 tests passed. Deferred A/B score saves complete independently; held/repeat/keyup/ESC/inside/outside input covered. Actual browser gameover captured1600x900 and844x390, footer inside viewport and no restart button. Job errors remain visible/retryable; no remote score writes used in verification.
