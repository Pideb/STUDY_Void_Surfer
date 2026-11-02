# Task: T13 개발자 전용 플레이 기록 DB·쓰기 RPC

## Status: done

## Goal
로그인/게스트의시작·사망·이탈run을중복없이저장하고anon/authenticated사용자는어떤플레이로그도조회하지못하게한다.

## Decision Summary
- D07. 새private용테이블/RLS·쓰기전용RPC. 기존profiles/player_scores/랭킹권한은변경하지않는다. Docker로컬DB기동금지환경제약유지.
- [최종 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md).
- 선행 T12 PC 비율·모바일 확대·회전 중단과 수동 복귀 완료·커밋 후 진행. 현재 작업은 자기 범위만 검증하며 실제 배포는 수행하지 않는다.
- DB·통신·브라우저 실패를 게임 자체 실패나 미검증 성공으로 바꾸지 않는다.

## Implementation

### I01. 개발자 전용 플레이 기록 DB·쓰기 RPC

- Related Files:
  - `supabase/migrations/202611020001_private_play_sessions.sql` :: `play_sessions / start_play_session / finish_play_session` — new
  - `supabase/tests/private_play_sessions.sql` :: `role and idempotency assertions` — new
  - `docs/operations/play-records.md` :: `owner-only SQL verification and aggregates` — new
  - `tests/deployment/play-records-schema.test.js` :: `migration access contract checks` — new

#### Details
- **Signatures & Types** (실제 구현은 기존 JS, 다음은 계약):
```typescript
public.start_play_session(p_run_id uuid,p_write_nonce uuid,p_guest_id uuid,p_client_version text,p_aircraft_id text,p_is_admin_test boolean default false) returns void;
public.finish_play_session(p_run_id uuid,p_write_nonce uuid,p_duration_ms bigint,p_outcome text) returns void;
```
- **Data & Schema Fields**: public.play_sessions: run_id uuid PK;write_nonce uuid NOT NULL(고유run쓰기증표);user_id uuid NULL FKauth.users ON DELETE SET NULL;guest_id uuid NULL;actor_kind text NOT NULL('account'|'guest');client_version text NOT NULL(max32);aircraft_id text NOT NULL(default|aegis|velocity);is_admin_test bool NOT NULL defaultfalse;started_at timestamptz NOT NULL servernow;finished_at timestamptz NULL;duration_ms bigint NULL;outcome text NOT NULL default'started'(started|dead|abandoned). user_id삭제시 actor_kind보존. started는finish/durationnull,terminal은둘다nonnull. 최초actor식별을변경하는writeRPC없음. 집계는COUNT(DISTINCT run_id),미완료는started로분리.
- **Execution Flow / Logic**:
  1. BEGIN/COMMIT migration에서테이블제약·user/guest별시작시간index·RLS활성화. anon/authenticated/public의SELECT/INSERT/UPDATE/DELETE등직접권한을revoke,수행만허용할두RPC에만anon/authenticated EXECUTE. 함수는SECURITY DEFINER/search_path='' 및객체완전수식;기존랭킹RPC에play_sessions join추가금지.
  2. start는auth.uid()!=null이면account/user_id를서버결정·guest_id=null,그외guestuuid필수. client가user_id를전달하지못함. uuid/null/길이/기체명검증. write_nonce는client생성randomUUID별도증표이며서비스권한키아님.
  3. 동일run_id재시작요청은nonce/actor/payload가같을때no-op. 충돌시일반권한오류로거절하고기존row정보를반환하지않는다. 클라이언트의총횟수값을받아덮어쓰지않는다.
  4. finish는run_id+write_nonce일치로해당run에만terminal쓰기. 조회data반환없음. 로그인전환/로그아웃후에도해당run증표로마무리할수있으나소유자/score를바꾸지못한다. duration0..604800000ms(7일,서버검증안전상한)유한정수,outcome dead|abandoned만허용.
  5. 최초terminal전이한번,동일payload재시도no-op. 다른terminalpayload로덮어쓰기거절. 서버finished_at기록,client시간을공인실측이라주장하지않는다. 관리자test표시는분석용client표식이며보안권한판정에쓰지않는다.
  6. ownerSQL문서에익명/로그인합계·사망완료·미완료·버전별·기체별조회와테스트자료식별법작성. readRPC/개발자키를브라우저에추가하지않는다.
  7. 원격접근수단이있으면개발용seed run으로anon/auth 읽기거절/쓰기멱등성을실제검증하고식별가능하게테스트표시한다. 없으면SQL/계약검증과적용가이드를완료하고원격적용·권한검증을배포전필수gate로정확히남긴다. Docker를설치/기동하거나적용성공을가정하지않는다.
- **Error & State Boundary**: 위 절차의 유효성 검사/멱등성/생명주기·실패 처리를 구현한다. 오류를 무시하고 성공 상태를 쓰거나 새 run/다른 계정에 완료 응답을 적용하지 않는다.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/deployment/play-records-schema.test.js` :: `T13 behavioral coverage` — new
  - `tests/deployment/config.test.js` :: `T13 behavioral coverage` — modify

#### Details
- 정적계약검사는SECURITY DEFINER/search_path/revoke/RLS/PK/제약확인용이며실DB권한시험대체아님. SQL시험은anon/auth table SELECT거절,직접쓰기거절,RPC시작중복1row/악성타인nonce거절/종료재시도/invalidduration·craft거절/랭킹불변. 원격SQL적용여부증거구분.
- UI/상태/권한의 실제 관찰 결과를 검증한다. 정적 SQL 문자열 검사와 실제 DB 역할별 동작 확인은 구분한다.
- 네트워크/원격 자원 접근이 없으면 미실행 사실·정확한 후속 명령·예상 결과를 기록하며 운영 완료로 보고하지 않는다.

## Acceptance Criteria
- [x] 쓰기전용멱등RPC와역할별읽기차단스키마·검증SQL이준비된다.
- [x] 실제원격적용/권한검증의완료또는배포전미완료상태를명확히기록한다.
- [x] 지정 검증 및 관련 한계 기록. 무관한 버전 승격/push/배포 없음.

## Validation
- `npm test -- --run tests/deployment/play-records-schema.test.js tests/deployment/config.test.js` — 종료0.
- 원격 연결이 제공되면 프로젝트의 정상 SQL 도구/연결로 `supabase/tests/private_play_sessions.sql`을 실행한다. 미제공이면 원격 적용·읽기차단 검증을 배포 전 gate로 기록한다. Docker 요구 없음.


## Commit Message
```text
feat(db): add private write-only play session records

Plan: 2026-11-02-v02-feedback-release
Phase: P02-private-records
Task: T13-private-play-session-schema

- 개발자 전용 플레이 기록 DB·쓰기 RPC 구현 및 경계 검증
- 승인된 기존 규칙과 운영 기록 보존
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: see Git log (Task header)

## Execution evidence
- Vitest2 files/10 static deployment-contract tests passed. Added owner-only SQL role/idempotency test with rollback. Remote migration and live anon/auth role checks NOT executed: no administrator DB connection supplied; required pre-deployment gate documented in docs/operations/play-records.md. Docker not used.
