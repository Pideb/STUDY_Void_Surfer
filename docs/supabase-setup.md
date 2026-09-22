# Supabase와 Microsoft 로그인 설정

> 현재 배포 정책: VOID SURFER는 조직 전용 Microsoft Entra 로그인을 사용합니다.
> Entra 앱은 **단일 테넌트 Web 등록**으로 만들고, 테넌트 제한은 브라우저 환경
> 변수가 아니라 Supabase Azure Provider의 `Azure Tenant URL`에 설정합니다. 새
> 배포는 [Entra · Supabase · Vercel 운영 가이드](./entra-vercel-deploy.md)를 기준으로
> 진행하세요. Entra client secret은 Supabase에만 보관하며 저장소나 Vercel에 넣지
> 않습니다.

이 문서는 `VOID SURFER`의 리더보드와 Microsoft 로그인용 Supabase 프로젝트를 처음부터 설정하는 절차입니다. 브라우저에는 **Project URL과 anon key만** 전달합니다. Supabase service role key와 Microsoft client secret은 브라우저·`VITE_*` 변수·Git에 절대 넣지 않습니다.

## 1. Supabase 프로젝트와 데이터베이스

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트를 만듭니다.
2. Dashboard의 **Connect** 또는 **Project Settings → API**에서 Project URL과 anon/public key를 확인합니다. service role key는 이 앱에 필요하지 않습니다.
3. 저장소 루트에서 `.env.example`을 `.env`로 복사하고 아래 두 값만 채웁니다. `.env`는 Git에 커밋하지 않습니다.

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. [Supabase CLI](https://supabase.com/docs/guides/cli)를 설치·로그인한 뒤 원격 프로젝트를 연결하고 migration을 적용합니다.

   ```powershell
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

   적용 대상은 `supabase/migrations/202609210001_void_surfer_leaderboard.sql`입니다. Docker Desktop을 사용할 수 없는 환경에서는 `supabase start`, `db reset`은 건너뛰고 위 원격 적용만 수행해도 됩니다. 운영 프로젝트에서 `db reset`을 실행하면 안 됩니다.

5. Dashboard의 Table Editor 또는 SQL Editor에서 `profiles`, `player_scores`, `submit_score`, `get_leaderboard`, `get_player_neighborhood`가 생성됐는지 확인합니다.

이 migration은 RLS(Row Level Security, 행 단위 접근 제어)를 켜고, 테이블 직접 쓰기를 막습니다. 점수·프로필 갱신은 인증된 사용자가 RPC만 호출하도록 설계되어 있어 service role key가 필요 없습니다. 자세한 스키마 계약은 [supabase-schema.md](./supabase-schema.md)를 참고하세요.

## 2. Microsoft Entra 앱 등록

Supabase가 OAuth 서버 역할을 하므로, Microsoft Entra에는 앱의 `/auth/callback`이 아니라 **Supabase callback URL**을 등록합니다.

1. [Microsoft Entra admin center](https://entra.microsoft.com/)에서 **App registrations → New registration**을 엽니다.
2. 이름을 정하고, 지원 계정 유형으로 **이 조직 디렉터리의 계정만(단일 테넌트)**을 선택합니다.
3. **Web** 플랫폼의 Redirect URI에 아래 URL을 정확히 등록합니다.

   ```text
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

4. Overview에서 **Application (client) ID**를 기록합니다.
5. **Certificates & secrets → New client secret**에서 secret을 만들고, 표시되는 **Value**를 즉시 안전한 비밀 저장소에 보관합니다. Secret ID가 아니라 Value가 필요합니다. 만료일도 기록해 교체 전에 갱신합니다.

Redirect URI는 Entra에 등록된 값과 정확히 일치해야 합니다. 등록하지 않은 URL은 `AADSTS50011` 오류로 거절됩니다. 최신 Entra 안내는 [Microsoft redirect URI 문서](https://learn.microsoft.com/entra/identity-platform/reply-url)를 참고하세요.

## 3. Supabase Azure Provider와 앱 callback

1. Supabase Dashboard에서 **Authentication → Providers → Azure**를 엽니다.
2. Provider를 활성화하고 Entra의 Client ID와 Client Secret Value를 입력합니다.
3. Azure Tenant URL에 조직 테넌트만 허용하도록 아래 값을 설정합니다.

   ```text
   https://login.microsoftonline.com/<tenant-id>
   ```

4. **Authentication → URL Configuration**에서 Site URL과 Redirect URLs를 설정합니다. 이 값들은 코드의 `redirectTo`인 `/auth/callback`과 일치해야 합니다.

   | 환경 | Site URL / Redirect URL |
   | --- | --- |
   | Local | `http://localhost:5173` / `http://localhost:5173/auth/callback` |
   | Preview | 실제 Preview URL / `https://<preview-domain>/auth/callback` |
   | Production | `https://<production-domain>` / `https://<production-domain>/auth/callback` |

Preview URL은 배포마다 바뀔 수 있으므로, 로그인 테스트에 사용할 실제 URL을 추가한 뒤 테스트합니다. redirect allow-list를 과도하게 넓히지 마세요.

앱은 `azure` provider와 `openid profile email` scope를 사용합니다. Supabase의 Azure 설정 최신 항목은 [공식 Azure Provider 문서](https://supabase.com/docs/guides/auth/social-login/auth-azure)를 확인하세요.

## 4. 수동 smoke checklist

1. `npm run dev`로 Local 환경을 열고 Microsoft 로그인 팝업이 열리고 닫히는지 확인합니다.
2. 메뉴 → 튜토리얼 → 게임 시작 후 점수를 얻고 게임 오버 화면에서 점수가 제출되는지 확인합니다.
3. 다른 계정으로 로그인해 TOP 10과 내 주변 순위가 표시되는지 확인합니다.
4. 로그아웃 후 게임 시작 버튼이 다시 로그인 게이트에 막히는지 확인합니다.
5. 네트워크를 끊거나 RPC를 실패시켜 리더보드의 `다시 시도`가 점수·재시작 버튼을 가리지 않는지 확인합니다.

실계정 검증은 자동 테스트가 대신할 수 없습니다. 완료 후 Supabase Auth 로그와 브라우저 콘솔에 redirect mismatch 또는 provider 오류가 없는지 확인하세요.
