# 비공개 플레이 기록 운영

로컬 실행 검증: Docker 대신 [PGlite의 메모리 PostgreSQL](https://pglite.dev/docs/)에서 마이그레이션 5개를 실제 실행하고 익명/로그인 역할의 두 SQL 검증 파일을 통과했습니다. 증거는 `.memory/validation/2026-11-02-v02-feedback-release/sql-local.json`입니다. 이 환경은 `auth.uid()`를 테스트용으로 구성하며 단일 연결을 사용하므로, 실제 Supabase JWT·PostgREST 관계 조회·독립 연결의 경쟁 상태 검증을 대체하지 않습니다.

## 동점 순위 추가 마이그레이션

`202611020001_private_play_sessions.sql` 다음에 `202611020002_private_ranking_duration.sql`을 적용해야 합니다. 원격 적용·실제 역할별 조회 차단·동시 제출 검증은 아직 실행하지 않았으며 **배포 전 필수 확인 항목**입니다. 점수 저장은 새 함수가 없을 때에만 기존 3인자→2인자 함수로 호환됩니다. 호환 저장 성공을 시간 정렬 적용 성공으로 간주하면 안 됩니다.

```powershell
psql "$env:VOID_SURFER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/private_ranking_duration.sql
```

이 파일은 점수 우선·동점 긴 시간 우선·낮은 점수 거절·구형 제출 시간 0·비공개 반환 열을 순차 검증하고 롤백합니다. 실제 경쟁 상태는 별도의 두 세션에서 동일한 테스트 계정으로 확인해야 합니다. 한 세션에서 `BEGIN` 후 `submit_score(100,'Concurrency test','default',300000)`을 실행하고 COMMIT을 잠시 보류합니다. 다른 세션에서는 같은 계정으로 시간 200000을 제출하고, 첫 세션을 COMMIT한 뒤 두 요청이 모두 종료되는지 확인합니다. 소유자 조회에서 최종 시간은 300000이어야 합니다. 순서를 반대로 바꾼 경우와 점수 101/시간 1000을 경쟁 제출한 경우도 확인합니다. 테스트 계정은 별도로 생성하며 실제 사용자 최고 기록을 수정하지 않습니다.

시간은 공개 `player_scores`의 새 열이 아니라 조회 권한 없는 `player_score_timing`에만 저장합니다. 공개 랭킹·로그인 TOP·자기 주변 순위가 같은 내부 정렬을 사용하지만 반환하는 열은 기존과 동일합니다. 기존 미측정 기록은 0이며, 새 기록의 시간으로 과거 기록을 임의 보충하지 않습니다.

로컬 코드·정적 권한 계약 검증과 실제 DB 적용은 별개입니다. 이번 작업에서는 원격 관리자 DB 연결을 제공받지 않아 원격 마이그레이션과 역할별 SQL 실행은 **미실행**입니다. Docker를 설치하거나 기동하지 않습니다.

배포 전 Supabase SQL Editor에서 migration을 시간순으로 실행한 뒤, 개발/검증 프로젝트의 소유자 연결로 다음을 실행하세요.

```powershell
psql "$env:VOID_SURFER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/private_play_sessions.sql
```

성공 조건: 예외 없이 종료되고 마지막 `ROLLBACK`으로 테스트 자료가 남지 않습니다. 테스트를 운영 SQL Editor에 붙여넣을 때도 BEGIN부터 ROLLBACK까지 전체를 실행합니다. `schema-test-v0.2`는 검증 자료 식별용입니다. DB 접속 문자열과 서비스 키는 브라우저 환경변수에 넣지 않습니다.

`play_sessions`는 직접 읽기·쓰기 권한과 RLS 정책을 제공하지 않습니다. 익명/로그인 모두 시작/종료 RPC의 EXECUTE만 허용합니다. 계정 ID는 `auth.uid()`로 결정하며 종료는 무작위 run ID와 별도 nonce로 해당 run만 수정합니다. 이 구조는 [Supabase 함수 권한 안내](https://supabase.com/docs/guides/database/functions) 및 [RLS 안내](https://supabase.com/docs/guides/database/postgres/row-level-security)를 따릅니다.

소유자 전용 집계 예시:

```sql
select actor_kind, count(distinct run_id) as total_plays,
 count(*) filter(where outcome='dead') as completed_deaths,
 count(*) filter(where outcome='abandoned') as abandoned,
 count(*) filter(where outcome='started') as incomplete
from public.play_sessions group by actor_kind;

select client_version,aircraft_id,count(distinct run_id) as total_plays,
 sum(duration_ms) as duration_ms
from public.play_sessions where not is_admin_test
group by client_version,aircraft_id order by client_version,aircraft_id;

select coalesce(user_id::text,guest_id::text) as actor,actor_kind,
 count(distinct run_id) as total_plays
from public.play_sessions group by actor,actor_kind;
```

시작은 실제 출격 때 한 번만 기록하며 종료하지 못한 세션은 `started`로 남습니다. 시간은 클라이언트가 보고한 생존 시간입니다. 공인된 치트 방지 검증 수치가 아니며, 서버는 형식·0~7일 범위·중복 전이만 검증합니다. 사용자 화면이나 공개 랭킹 RPC에 이 시간을 노출하지 않습니다.
