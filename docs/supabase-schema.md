# VOID SURFER Supabase 스키마

이 문서는 Microsoft 로그인 사용자의 표시 이름과 개인 최고 점수를 Supabase에 저장하기 위한 구조를 설명합니다.

## 적용 순서

1. Supabase 프로젝트를 생성합니다.
2. Supabase CLI를 설치하고 저장소 루트에서 `npx supabase init`을 실행합니다.
3. `.env.example`을 `.env`로 복사하고 Supabase의 Project URL과 anon/public key를 입력합니다.
4. `supabase/migrations/`의 migration 두 개를 순서대로 적용합니다. 두 번째 migration은 기체 정보를 추가하고 기존 점수는 `default`로 유지합니다.
5. `supabase/tests/leaderboard.sql`로 RPC, 기체 제약, 계정별 점수 격리와 쓰기 권한을 확인합니다.

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
| `aircraft_id` | `text` | `default`, `velocity`, `aegis` 중 하나. 기존 점수는 `default` |

순위는 항상 다음 순서를 사용합니다.

```text
best_score DESC, achieved_at ASC, user_id ASC
```

따라서 동점이면 먼저 달성한 점수가 높은 순위가 됩니다.

## RPC 계약

- `sync_profile(p_display_name text)`: 인증된 현재 사용자의 최신 표시 이름을 upsert합니다.
- `submit_score(p_score integer, p_display_name text, p_aircraft_id text)`: 기체 ID를 검증하고, 새 점수가 더 높을 때만 점수·달성 시각·기체를 함께 갱신합니다. 과거 클라이언트 호환용 2개 인자 버전은 `default` 기체로 전달합니다.
- `get_leaderboard(p_limit integer)`: 순위·점수와 기체 ID를 포함한 단일 상위 리더보드를 반환합니다. 제한값은 1~50으로 제한됩니다.
- `get_player_neighborhood(p_radius integer)`: 현재 로그인 사용자의 순위 전후 기록과 각 기체 ID를 반환합니다.
- `get_player_best_score()`: 현재 인증 사용자의 최고 점수만 반환하며, 기체 선택 화면의 해금 기준으로 사용합니다.

## 점수 migration 적용

점수 기능을 새 프로젝트에 설정하거나 이전 버전에서 갱신할 때는 아래 migration을 순서대로 적용해야 합니다.

1. `supabase/migrations/202609210001_void_surfer_leaderboard.sql`
2. `supabase/migrations/202609230001_aircraft_scores.sql`

최신 프론트엔드는 기체 ID까지 저장하는 3개 인자 `submit_score` RPC를 먼저 호출합니다. 두 번째 migration이 아직 적용되지 않은 프로젝트에서는 호환을 위해 기존 2개 인자 RPC로 한 번 재시도하여 점수 자체는 저장합니다. 이 구형 경로에서는 기체 ID를 기록하지 못하며, 새 기체 점수 정보와 `get_player_best_score()` 기능을 사용하려면 두 migration 모두 적용해야 합니다.

원격 migration은 프로젝트 담당자가 대상 Supabase 프로젝트를 확인한 뒤 다음 명령으로 적용합니다. 이 저장소 변경만으로 원격 데이터베이스가 자동 갱신되지는 않습니다.

```powershell
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

클라이언트는 테이블에 직접 `insert/update/delete`하지 않고 위 RPC만 호출해야 합니다.

## 보안 규칙

- `profiles`, `player_scores`는 RLS가 활성화되어 있습니다.
- 인증 사용자는 리더보드 SELECT만 할 수 있습니다.
- 쓰기 작업은 `SECURITY DEFINER` RPC 내부에서만 처리됩니다.
- 프론트엔드에는 `VITE_SUPABASE_URL`과 anon key만 사용합니다.
- Supabase service role key, Microsoft client secret은 절대 `.env`의 `VITE_*` 변수나 브라우저 코드에 넣지 않습니다.

## 검증 한계

`supabase/tests/leaderboard.sql`은 migration 구조, 계정별 RPC 동작과 테이블 직접 쓰기 차단을 검사합니다. 이 작업 환경에서 로컬 Docker/Supabase CLI 검증을 실행할 수 없는 경우 원격 프로젝트에 migration을 적용하기 전에 SQL을 검토하고, 실제 Microsoft OAuth와 다중 사용자 흐름은 배포 프로젝트에서 smoke test로 확인해야 합니다.
