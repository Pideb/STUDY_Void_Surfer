# Task: T15 동점 플레이시간 정렬·비공개 최고기록 시간

## Status: done

## Goal
동일 점수에서 해당 사망 run의 긴 플레이시간이 높은 순위가 되며 사용자 화면/API로 시간 원본이 노출되지 않게 한다.

## Decision Summary
- [통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md) D07/D14. 점수 DESC→같은 최고기록 run 시간 DESC→달성시각 ASC→user_id ASC.
- T14 완료·커밋 후 진행. 시간은 T14의 frozen 종료값이며 통계 전송 성공을 기다리지 않는다.
- 기존 최고점수/게스트·관리자 제외/구형 RPC 호환을 보존한다. 현재 player_scores의 사용자 SELECT 권한을 새 시간 컬럼에 확대하지 않는다.

## Implementation

### I01. 비공개 시간 테이블과 원자적 최고기록 갱신

- Related Files:
  - `supabase/migrations/202611020002_private_ranking_duration.sql` :: `player_score_timing / submit_score overloads / ranking RPCs` — new
  - `supabase/tests/private_ranking_duration.sql` :: `role/ordering/concurrent update checks` — new
  - `docs/operations/play-records.md` :: `ranking duration migration verification` — modify

#### Details
- **Signatures & Types**:
```typescript
// SQL contracts; public.player_scores shape must remain unchanged.
public.submit_score(p_score integer,p_display_name text,p_aircraft_id text,p_duration_ms bigint) returns public.player_scores;
// Existing2/3-argument overloads call4-argument with duration0.
// get_leaderboard(integer), get_player_neighborhood(integer),
// get_public_leaderboard(integer,integer): keep exact existing output columns.
```
- **Data & Schema Fields**: public.player_score_timing: user_id uuid PRIMARY KEY REFERENCES public.player_scores(user_id) ON DELETE CASCADE; duration_ms bigint NOT NULL DEFAULT0 CHECK(0<=duration_ms AND duration_ms<=604800000). 한user의현재best_score에대응하는시간만저장. 과거미측정/구형제출은0,다른run자료로backfill금지. 기존public.player_scores에시간/총횟수컬럼추가금지.
- **Execution Flow / Logic**:
  1. 새migration의transaction에서private용부가테이블RLS활성화,public/anon/authenticated의직접권한전부revoke,사용자SELECTpolicy미생성. score/RPC별기존공개열과기존profiles/RLS는보존한다.
  2. 4인자submit_score는auth.uid필수·이름/점수/기체기존검증·duration정수범위검증. sync_profile후score행이없으면현재제출로INSERT ON CONFLICT DO NOTHING,그다음해당user의player_scores행SELECT FOR UPDATE로경쟁제출직렬화. private시간행없으면0으로초기화한다.
  3. 후보점수가더높거나,같은점수이며후보시간이기존private시간보다길때만공개score/achieved_at/aircraft와private duration을한transaction에서함께갱신. 낮은점수/같은시간은원기록유지. 최고점수가높아졌으나시간미측정0이면그새점수의시간0으로갱신하며낮은옛점수시간을붙이지않는다.
  4. 동일payload재시도는순위/달성시각을계속바꾸지않는다. 두동점제출의순서와무관하게긴시간이남아야한다. 실패시두테이블모두rollback,반환은시간없는기존public.player_scores행뿐.
  5. 구형2/3인자RPC는새4인자로0을전달해호환. 같은점수에이미긴시간이있으면0제출이이를지우지못한다. 기존 SQL migration을소급수정하지않는다. 새migration은player_scores.aircraft_id와기존RPC가있는순서에서적용한다.
  6. 세종류랭킹RPC는private표LEFT JOIN,COALESCE(duration_ms,0) DESC를best_score뒤에삽입하고동일정렬로ROW_NUMBER/최종ORDER BY를구성한다. 시간컬럼은SELECT/RETURN에서제외. 자기주변은auth.uid의순위를같은전체집합에서찾는다. get_player_best_score 정수조회는그대로.
  7. 기존invoker함수는private표를일반사용자가읽지못해실패하므로필요한랭킹함수를SECURITY DEFINER/search_path=''와명시schema/반환열로변환. 로그인top/주변은auth.uid확인및authenticated만EXECUTE,공개목록만anon/authenticated EXECUTE. public기본EXECUTE는매overloadrevoke후최소grant. user-id를외부에서받아주변순위권한을우회하지않는다.
  8. 현재authenticated SELECT가능한player_scores응답·PostgREST관계embed로도duration을읽지못하는지확인. SQL오류/반환JSON/진단로그에타인의private시간을실어보내지않는다. RPC내부정렬은허용하되명시된공개필드만노출한다.
- **Error & State Boundary**: auth/권한오류42501,잘못된값22023,동시갱신은row lock으로직렬화. RLS/스키마실패를성공으로위장하지않는다. 서버는client점수/시간의형식·범위를검증할뿐공인anti-cheat보장은추가하지않는다.

### I02. 같은 종료 run 시간으로 제출 / 사용자 응답 숨김

- Related Files:
  - `src/services/leaderboard-service.js` :: `validateSubmission / submitBestScore / missing-RPC fallback` — modify
  - `src/services/leaderboard-types.js` :: `public record/row whitelist` — modify
  - `src/services/play-session-tracker.js` :: `getFinishedRun immutable duration` — modify
  - `src/ui/app-controller.js` :: `FinishedRun score job / finishGame / loadGameOverData` — modify
  - `src/ui/leaderboard-view.js` :: `rank/top/personal rendering` — read-only

#### Details
- **Signatures & Types**:
```typescript
type ScoreSubmission={score:number;displayName:string;aircraftId:string;durationMs?:number};
submitBestScore(client:SupabaseClient,payload:ScoreSubmission):Promise<ScoreSubmissionResult>;
// Bound service.submitBestScore(user,payload) preserves its existing call shape.
type FinishedRunScore={runId:string;score:number;aircraftId:string;user:User|null;adminRun:boolean;durationMs:number};
```
- **Data & Schema Fields**: 새run은사망경계에서Math.floor한0이상durationMs를frozen job에고정. 기존호출의생략은0,명시NaN/Infinity/음수/비정수/7일초과는검증거절. 반환ScoreRecord/LeaderboardRow에는duration필드추가없음. 숨김data속성·tooltip·aria-label에도시간없음.
- **Execution Flow / Logic**:
  1. tracker의같은run종료값을T11 scorejob에동기적으로보관한다. private 통계start/finish의네트워크완료를기다리거나SQL에서다른run시간을조회해붙이지않는다. A저장중B재시작도A시간이변하지않아야한다.
  2. 새4인자RPC에p_duration_ms전송. 오직정확한missing-function(PGRST202/42883)일때만기존3→2인자fallback. 권한/검증/통신오류를구형으로fallback하여숨기지않는다. fallback은점수호환일뿐시간정렬원격적용완료를뜻하지않아개발자migration gate에남긴다.
  3. normalizeScoreRecord/normalizeLeaderboardRows는기존공개필드만허용. 입력에예상외duration이있어도뷰타입으로전달하지않는다. 서버순서/순위를사용하고client achieved_at재정렬로새시간우선을뒤집지않는다.
  4. 공개파일럿랭킹/결과top/자기주변/고정자기순위가같은기준인지확인. 사용자는점수·순위만보며duration확인UI를추가하지않는다. 게스트/관리자테스트 score쓰기제외와표시수정은없음.

### I03. 권한·정렬·호환 검증

- Related Files:
  - `tests/deployment/ranking-duration-schema.test.js` :: `migration constraints and role contracts` — new
  - `tests/services/leaderboard-service.test.js` :: `4-argument and fallback submissions / private-field whitelist` — modify
  - `tests/ui/leaderboard-view.test.js` :: `time remains absent` — modify
  - `tests/integration/ranking-duration.test.js` :: `same-run frozen-time and ordering integration` — new
  - `supabase/tests/private_ranking_duration.sql` :: `real database role and ordering cases` — new

#### Details
- score100/time300s가score100/time200s보다위,score101/time1s는둘보다위. 같은score/time이면기존achieved/user_id보조정렬. 같은계정동점긴시간만갱신/낮은점수긴시간은거절/같은payload시간·achieved불변.
- 과거시간없음0,구형same score0이기존긴시간보존,구형더높은score는새시간0. 동시두RPC에서긴시간/높은점수winner와기체/달성시각/private값원자성검증.
- auth/anon table SELECT·관계embed거절,public/auth ranking JSON과score반환키에시간없음. 세조회RPC같은순위/페이지offset/주변/자기고정순위. duration이DOM/aria/tooltip에없음.
- fakeclock에서QTE포함/pause회전제외/폭발제외,frozenA가B재시작후에도동일. missingRPC만fallback·진짜오류는표면화,통계송신실패와score쓰기독립.
- 실제동시제출은독립세션2개또는동시RPC호출로검증한다. 단일SQL파일순차시험만으로경쟁상태검증까지통과했다고쓰지않는다.

## Acceptance Criteria
- [x] 전체랭킹이점수우선·동점긴사망시간우선이며같은계정동점개선도저장된다.
- [x] 사용자화면/반환RPC/일반직접조회에서시간원본이노출되지않는다.
- [x] 구형클라이언트/과거미측정기록/동시제출/빠른재시작을검증하고원격migration상태를기록한다.

## Validation
- `npm test -- --run tests/deployment/ranking-duration-schema.test.js tests/services/leaderboard-service.test.js tests/ui/leaderboard-view.test.js tests/integration/ranking-duration.test.js tests/integration/play-record-lifecycle.test.js` — 종료0.
- 접근가능한원격개발DB에서 `supabase/tests/private_ranking_duration.sql` 실행. 접근불가면SQL/계약검증과원격적용·권한·경쟁검증gate를분리,통과를가정하지않음. Docker설치/기동없음.
- 실제UI에서랭킹3조회/자기순위와숨김상태확인. 실제계정최고점수를임의로바꾸지말고명시된테스트자료를사용한다.

## Commit Message
```text
feat(leaderboard): rank tied scores by private run duration

Plan: 2026-11-02-v02-feedback-release
Phase: P02-private-records
Task: T15-private-ranking-duration-tiebreak

- Use same-run survival duration for tied best scores
- Keep duration private and retain legacy submission compatibility
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: see Git log (Task header)

## Execution evidence
- Vitest7 files/95 tests passed. All5 migrations and2 role/idempotency/ordering SQL test files executed successfully on in-memory PostgreSQL via PGlite (no Docker). Client durations/legacy fallback/private whitelists/frozenA vsB verified. Remote Supabase/JWT/PostgREST/concurrent independent-session verification remains a documented deployment gate; real account scores unchanged.
