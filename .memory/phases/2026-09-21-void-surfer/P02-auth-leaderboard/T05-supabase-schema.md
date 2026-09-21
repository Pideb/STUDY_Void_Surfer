# Task: T05 Supabase Schema

## Status: pending

## Goal

Supabase PostgreSQL에 인증 사용자 프로필과 사용자별 최고 점수를 저장하고, 인증된 사용자만 자신의 이름·점수를 갱신하면서 리더보드 조회는 허용하는 RLS 정책과 RPC를 만든다.

## Decision Summary

- 점수는 사용자별 한 행만 유지하며 동점 시 먼저 달성한 `achieved_at`을 보존한다.
- 클라이언트가 테이블을 직접 갱신하지 못하도록 점수/프로필 변경은 `SECURITY DEFINER` RPC로 제한한다.

## Implementation

### I01. Migration schema

- Related Files:
  - `supabase/migrations/202609210001_void_surfer_leaderboard.sql` :: profiles, player_scores, indexes, RLS, RPC; new
  - `supabase/seed.sql` :: 로컬 개발용 선택적 seed 안내; new

#### Details
- **Data & Schema Fields**:
  - `public.profiles`: `user_id uuid primary key references auth.users(id) on delete cascade`, `display_name text not null`, `updated_at timestamptz not null default now()`.
  - `public.player_scores`: `user_id uuid primary key references public.profiles(user_id) on delete cascade`, `best_score integer not null default 0 check (best_score >= 0)`, `achieved_at timestamptz not null default now()`.
  - Index `player_scores_rank_idx` on `(best_score desc, achieved_at asc, user_id asc)`.
- **Signatures & Types**:
  ```sql
  create function public.sync_profile(p_display_name text)
  returns public.profiles;
  create function public.submit_score(p_score integer, p_display_name text)
  returns public.player_scores;
  create function public.get_leaderboard(p_limit integer default 10)
  returns table(rank bigint, user_id uuid, display_name text, best_score integer, achieved_at timestamptz);
  create function public.get_player_neighborhood(p_radius integer default 2)
  returns table(rank bigint, user_id uuid, display_name text, best_score integer, achieved_at timestamptz);
  ```
- **Execution Flow / Logic**:
  1. RPC는 `auth.uid()`가 null이면 예외를 반환한다.
  2. `sync_profile`은 표시 이름을 trim하고 빈 값·과도한 길이를 거부한 뒤 upsert한다.
  3. `submit_score`는 0 이상 정수만 허용하고 profile을 최신 이름으로 upsert한다. 신규 점수는 insert, 기존 점수가 낮을 때만 best_score와 achieved_at을 갱신한다. 같거나 낮은 점수에서는 기존 achieved_at을 유지한다.
  4. 순위는 `best_score desc, achieved_at asc, user_id asc`로 계산한다. `get_player_neighborhood`는 현재 사용자 rank 전후 `radius`개를 반환한다.
  5. RLS는 authenticated 사용자의 SELECT만 허용하고 profiles/player_scores 직접 INSERT/UPDATE/DELETE는 차단한다. RPC execute 권한만 authenticated에 부여한다.

### I02. SQL 검증

- Related Files:
  - `supabase/tests/leaderboard.sql` :: 로컬 Supabase 테스트 시나리오; new
  - `docs/supabase-schema.md` :: migration 적용과 정책 설명; new

#### Details
- 로컬 Supabase CLI가 있으면 두 테스트 사용자로 이름 동기화, 높은 점수 갱신, 낮은 점수 무시, 동점 선착순, anonymous 거부를 검증한다.
- migration은 반복 적용 시 실패하지 않도록 하나의 명확한 초기 migration으로 제공하되, 운영 DB에서 `drop`을 사용하지 않는다.

## Acceptance Criteria

- [ ] schema migration으로 두 테이블·index·RLS·RPC가 생성된다.
- [ ] 낮은 점수 재제출이 best_score와 achieved_at을 덮어쓰지 않는다.
- [ ] 같은 점수라도 먼저 달성한 사용자가 높은 순위가 된다.
- [ ] anonymous 또는 다른 사용자의 직접 테이블 mutation이 거부된다.

## Validation

- `npx supabase db reset` — migration과 SQL 테스트 환경 적용 성공
- `npx supabase test db` — leaderboard SQL 검증 통과

## Commit Message

```text
feat(data): add Supabase leaderboard schema and secure RPCs

Plan: 2026-09-21-void-surfer
Phase: P02-auth-leaderboard
Task: T05-supabase-schema

- add profile and personal-best score tables with ranking index
- add RLS and authenticated score/profile RPC contracts
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
