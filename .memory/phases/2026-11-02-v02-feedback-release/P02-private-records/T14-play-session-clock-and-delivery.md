# Task: T14 플레이시간·총횟수 측정·안정적인 기록 전송

## Status: done

## Goal
실제출격1회당run을만들고QTE포함·pause/회전제외시간을사망순간고정하여즉시재시작/네트워크실패에서도중복없이전송한다.

## Decision Summary
- D07/D11. 게스트통계는최고점수저장이아니다. 조회UI없음,게임/점수저장경로와별개. 승인된측정경계그대로.
- [최종 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md).
- 선행 T13 개발자 전용 플레이 기록 DB·쓰기 RPC 완료·커밋 후 진행. 현재 작업은 자기 범위만 검증하며 실제 배포는 수행하지 않는다.
- DB·통신·브라우저 실패를 게임 자체 실패나 미검증 성공으로 바꾸지 않는다.

## Implementation

### I01. 플레이시간·총횟수 측정·안정적인 기록 전송

- Related Files:
  - `src/services/play-record-service.js` :: `createPlayRecordService` — new
  - `src/services/play-session-tracker.js` :: `createPlaySessionTracker` — new
  - `src/services/play-record-outbox.js` :: `durable queue / identity` — new
  - `src/main.js` :: `wire Supabase client and tracker dependency` — modify
  - `src/ui/app-controller.js` :: `finishDeparture / renderFrame / orientation/pause / finishGame / unmount` — modify
  - `src/game/game-engine.js` :: `snapshot death boundary and run status` — modify

#### Details
- **Signatures & Types** (실제 구현은 기존 JS, 다음은 계약):
```typescript
createPlayRecordService(client:SupabaseClient,options?:{anonymousClient?:SupabaseClient}):{start(record:RunStart):Promise<Result>;finish(record:RunEnd):Promise<Result>};
createPlaySessionTracker(deps:{now:()=>number;service:PlayRecordService;storage:Storage|null}):{begin(data:RunIdentity):string;suspend(reason:string):void;resume(reason:string):void;finish(outcome:'dead'|'abandoned'):Readonly<RunEnd>|null;getFinishedRun(runId:string):Readonly<RunEnd>|null;flush():Promise<void>;destroy():void};
type RunStart={runId:string;writeNonce:string;ownerUserId:string|null;actorKind:'account'|'guest';guestId:string|null;version:string;aircraftId:string;isAdminTest:boolean};
type RunEnd={runId:string;writeNonce:string;durationMs:number;outcome:'dead'|'abandoned'};
type Result={ok:boolean;retryable:boolean;errorCode?:string};
```
- **Data & Schema Fields**: run 내부ownerUserId:string|null/actorKind/guestId/aircraft/version/test플래그는실제시작때고정. runId/nonce는각crypto.randomUUID. guestId는통계전용localStorage key'void-surfer.analytics.guest-id.v1',없거나storage거부시탭메모리fallback. outbox key'void-surfer.analytics.outbox.v1',한run당start+end상태,cap100runs/최대30일안전보관(구현상한). 토큰/JWT/이메일/프로필사진/관리자키저장금지. 로컬큐는미전송쓰기자료이며조회용사용자통계없음.
- **Execution Flow / Logic**:
  1. finishDeparture/실제playing활성화에서만begin. 준비시engine.start()가PLAYING객체를만들어도계정/음악대기중에는시작집계하지않는다. 시작RPC를즉시큐에저장/전송하고owner/craft/version은run수명고정.게스트로그인후기존guest기록병합금지.
  2. performance.now 기반monotonicclock과suspension reason set으로실제활성구간을누적. 물리delta클램프/engine.elapsed재사용금지. WASD는suspend사유아님. manualpause/orientation 각중복중첩해제후set비었을때만재개,일시정지·회전시간제외.
  3. snapshot에deathEffect가처음생기는프레임/stop사망이벤트에서끝시간고정. 폭발끝finishGame까지기다려시간을늘리지않는다. 사망뒤재시작/ESC/pagehide는동일dead결과만재전송하며abandoned로덮지않는다.
     finish는네트워크와무관하게동기frozen RunEnd를반환하고getFinishedRun으로같은run값을읽을수있다. T15 동점랭킹제출도이durationMs를사용한다. 통계송신ack를기다리지않으며다른run시간으로대체하지않는다.
  4. 정상중도메뉴이동/탭이탈신호는abandoned를best-effort저장. BFCache pagehide.persisted는즉시종료로판정하지않고복원수명관리. 강제종료로종료신호가없으면serverstartedrow를미완료로남긴다. 정확한이탈시각보장금지.
  5. outbox는startack후finish순서,동일run중복합치기,성공시삭제. offline/timeout/5xx는1·5·30초후등bounded backoff,online/초기마운트에재시도. invalid/permission/schema missing은무한루프금지·개발자진단만. 실패가게임시작/결과창/기체선택을막지않는다.
  6. account start재전송은소유user로그인일때만,계정이바뀌었다고다른auth로기존start를보내지않는다. 이미ack된run의nonce종료는RPC계약대로사용. guest start를나중auth로그인으로다른owner에쓰기금지:전송시점principal맞지않으면원guest요청용anonclient경로/서비스DI로구분하되관리자secret사용없음.
     anonymousClient는 같은 publishable 설정의 별도 client로 persistSession/autoRefreshToken/detectSessionInUrl=false를 사용하고 사용자 session/JWT를 복사하지 않는다. Supabase 익명 계정 생성(signInAnonymously)을 새로 수행하지 않는다. ownerUserId는 전송 경로 검증용 클라이언트 필드이며 RPC에 p_user_id로 전달하지 않는다.
  7. pagehide송신은보장안됨;출발시start를먼저저장하고localoutbox로종료후복구. cap/expiry에걸린미전송자료는진단에누락을표기하며서버총횟수를임의보정하지않는다. storage예외시메모리fallback.
  8. 진단log에nonce/JWT/개인정보출력금지. 게임화면·랭킹·가이드에플레이시간/총횟수노출없음. destroy리스너·timer정리,진행request late결과는새run상태를바꾸지않는다.
- **Error & State Boundary**: 위 절차의 유효성 검사/멱등성/생명주기·실패 처리를 구현한다. 오류를 무시하고 성공 상태를 쓰거나 새 run/다른 계정에 완료 응답을 적용하지 않는다.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/services/play-record-service.test.js` :: `T14 behavioral coverage` — new
  - `tests/services/play-session-tracker.test.js` :: `T14 behavioral coverage` — new
  - `tests/services/play-record-outbox.test.js` :: `T14 behavioral coverage` — new
  - `tests/integration/play-record-lifecycle.test.js` :: `T14 behavioral coverage` — new
  - `tests/integration/prepared-run.test.js` :: `T14 behavioral coverage` — modify
  - `tests/integration/guest-access.test.js` :: `T14 behavioral coverage` — modify

#### Details
- fakeclock 준비취소0/실출발1/10초QTE포함/pause·회전중첩제외/사망연출제외. 빠른A종료B시작·A늦은ack·중복pagehide/오프라인재시도1row. storage거부·로그아웃·계정전환·guest→account·nonce권한·큐상한. 로그/DOM/랭킹에통계없음. 강제종료유실범위명시.
- UI/상태/권한의 실제 관찰 결과를 검증한다. 정적 SQL 문자열 검사와 실제 DB 역할별 동작 확인은 구분한다.
- 네트워크/원격 자원 접근이 없으면 미실행 사실·정확한 후속 명령·예상 결과를 기록하며 운영 완료로 보고하지 않는다.

## Acceptance Criteria
- [x] 승인한시간·횟수·종료상태가run별중복없이측정·전송된다.
- [x] 기록실패가게임을막거나다른계정/새run에데이터를섞지않는다.
- [x] 지정 검증 및 관련 한계 기록. 무관한 버전 승격/push/배포 없음.

## Validation
- `npm test -- --run tests/services/play-record-service.test.js tests/services/play-session-tracker.test.js tests/services/play-record-outbox.test.js tests/integration/play-record-lifecycle.test.js tests/integration/prepared-run.test.js tests/integration/guest-access.test.js` — 종료0.


## Commit Message
```text
feat(analytics): track private run duration and reliable delivery

Plan: 2026-11-02-v02-feedback-release
Phase: P02-private-records
Task: T14-play-session-clock-and-delivery

- 플레이시간·총횟수 측정·안정적인 기록 전송 구현 및 경계 검증
- 승인된 기존 규칙과 운영 기록 보존
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: see Git log (Task header)

## Execution evidence
- Vitest7 files/28 tests passed and production build passed. Tests cover real death-before-explosion timing, canceled preparation0 starts, overlapping pause/orientation, owner-aware guest/account transport, timeout/backoff, storage rejection and queue cap. Live RPC acknowledgment not verified until T13 migration gate is applied.
