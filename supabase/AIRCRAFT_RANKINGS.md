# 기체별 랭킹 적용

현재 작업은 로컬 구현·검증이며 운영 DB에는 아직 적용하지 않았습니다. 기존 배포는 계속 사용할 수 있습니다.

1. Supabase SQL Editor에서 기존 마이그레이션이 모두 적용됐는지 확인합니다. 특히 `202609230001_aircraft_scores.sql`, `202611020001_private_play_sessions.sql`, `202611020002_private_ranking_duration.sql`이 필요합니다.
2. 적용 전 아래 조회 결과를 보관합니다. 점수·기체·시각·비공개 동점 시간을 확인하는 운영자 전용 조회입니다.

```sql
select ps.*, coalesce(t.duration_ms,0) as duration_ms
from public.player_scores ps left join public.player_score_timing t using(user_id)
order by ps.user_id;
```

3. `supabase/migrations/202611030001_aircraft_rankings_history.sql` 전체를 한 번 실행합니다. 기존 파일을 다시 실행하거나 테이블을 삭제하지 않습니다. 트랜잭션 실패 시 원래 상태로 롤백됩니다. 새 마이그레이션은 중복 실행용이 아닙니다.
4. 위 조회를 다시 실행하여 기존 값이 같은지 확인하고, 다음 불일치 조회가 0행인지 확인합니다.

```sql
select ps.user_id from public.player_scores ps
left join public.player_score_timing t using(user_id)
left join public.aircraft_scores a on a.user_id=ps.user_id and a.aircraft_id=ps.aircraft_id
where a.user_id is null or a.best_score<>ps.best_score or a.achieved_at<>ps.achieved_at
   or a.duration_ms<>coalesce(t.duration_ms,0);
select * from public.get_aircraft_leaderboard('default',50,0);
```

5. 새 클라이언트 배포 후 로그인·게스트 탭 조회, 다른 기체의 낮은 점수 저장, 결과창 종합 기록, 비공개 플레이 이력을 확인합니다. 마이그레이션 적용 전 새 기체 탭은 오류를 보여주며 종합 기록으로 위장하지 않습니다.

기존 계정 최고 기록은 당시 저장된 기체에 그대로 복사됩니다. 과거 최고점보다 낮았던 점수는 저장돼 있지 않아 복구하지 않습니다. 옛 플레이 이력의 `final_score`는 NULL이며, 새 점수 0과 구분합니다. 새 최종 점수·동점 시간·플레이 이력은 공개 조회할 수 없습니다. 기체별/종합 동점은 더 긴 플레이시간 우선이며 시간 자체는 화면에 표시하지 않습니다.

로컬 검증: `node .memory/validation/2026-11-03-aircraft-rankings/verify-sql.mjs`. PGlite 실제 SQL/역할·롤백 검증을 사용하지만 단일 연결이므로 독립 연결 간 동시성, 실제 JWT/PostgREST는 별도 운영 검증이 필요합니다. 서버는 계정 전체 점수 행을 먼저 잠근 후 기체 점수를 갱신합니다.
