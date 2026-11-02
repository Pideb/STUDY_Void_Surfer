# 비공개 플레이 기록 운영

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
