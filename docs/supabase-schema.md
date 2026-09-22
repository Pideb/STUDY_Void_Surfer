# VOID SURFER Supabase 스키마

이 문서는 Microsoft 로그인 사용자의 표시 이름과 개인 최고 점수를 Supabase에 저장하기 위한 구조를 설명합니다.

## 적용 순서

1. Supabase 프로젝트를 생성합니다.
2. Supabase CLI를 설치하고 저장소 루트에서 `npx supabase init`을 실행합니다.
3. `.env.example`을 `.env`로 복사하고 Supabase의 Project URL과 anon/public key를 입력합니다.
4. `supabase/migrations/202609210001_void_surfer_leaderboard.sql`을 migration으로 적용합니다.
5. `supabase/tests/leaderboard.sql`로 테이블·인덱스·함수·RLS 구조를 확인합니다.

현재 컴퓨터에서 Docker/Podman을 사용할 수 없다면 로컬 DB 단계를 건너뛰고 원격 프로젝트에 연결한 뒤 `npx supabase db push`로 migration을 적용할 수 있습니다. 적용 전에는 Supabase Dashboard에서 대상 프로젝트와 백업 상태를 확인하세요.

```powershell
# 로컬 확인용 (Docker 또는 Podman 필요)
npx supabase start
npx supabase db reset
npx supabase test db

# 원격 Supabase 프로젝트 적용
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`.env.example`을 `.env`로 복사한 뒤 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 채웁니다. 실제 Supabase 프로젝트가 아직 없으면 값을 채울 수 없으므로 앱 인증 기능은 연결 전까지 동작하지 않습니다. 운영 데이터가 있는 데이터베이스에서 임의로 `db reset`을 실행하지 마세요.

## 데이터 모델

### `public.profiles`

| 필드 | 타입 | 규칙 |
| --- | --- | --- |
| `user_id` | `uuid` | `auth.users(id)` 외래 키, 기본 키 |
| `display_name` | `text` | 1~80자, Microsoft 표시 이름 |
| `updated_at` | `timestamptz` | 로그인 시 갱신 |

### `public.player_scores`

| 필드 | 타입 | 규칙 |
| --- | --- | --- |
| `user_id` | `uuid` | `profiles(user_id)` 외래 키, 기본 키 |
| `best_score` | `integer` | 0 이상, 사용자별 최고 점수 |
| `achieved_at` | `timestamptz` | 최고 점수 달성 시각 |

순위는 항상 다음 순서를 사용합니다.

```text
best_score DESC, achieved_at ASC, user_id ASC
```

따라서 동점이면 먼저 달성한 점수가 높은 순위가 됩니다.

## RPC 계약

- `sync_profile(p_display_name text)`: 인증된 현재 사용자의 최신 표시 이름을 upsert합니다.
- `submit_score(p_score integer, p_display_name text)`: 표시 이름을 먼저 동기화하고, 새 점수가 더 높을 때만 최고 점수와 달성 시각을 갱신합니다.
- `get_leaderboard(p_limit integer)`: 상위 리더보드를 반환합니다. 제한값은 1~50으로 제한됩니다.
- `get_player_neighborhood(p_radius integer)`: 현재 로그인 사용자의 순위 전후 기록을 반환합니다.

클라이언트는 테이블에 직접 `insert/update/delete`하지 않고 위 RPC만 호출해야 합니다.

## 보안 규칙

- `profiles`, `player_scores`는 RLS가 활성화되어 있습니다.
- 인증 사용자는 리더보드 SELECT만 할 수 있습니다.
- 쓰기 작업은 `SECURITY DEFINER` RPC 내부에서만 처리됩니다.
- 프론트엔드에는 `VITE_SUPABASE_URL`과 anon key만 사용합니다.
- Supabase service role key, Microsoft client secret은 절대 `.env`의 `VITE_*` 변수나 브라우저 코드에 넣지 않습니다.

## 검증 한계

`supabase/tests/leaderboard.sql`은 migration 구조와 RLS 정책을 자동 검사합니다. 실제 Microsoft OAuth와 두 사용자 간 점수 경쟁은 Supabase 프로젝트를 만든 뒤 로그인하여 수동 smoke test로 확인해야 합니다.
