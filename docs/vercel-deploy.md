# Vercel 배포 절차

## 1. 프로젝트 연결과 환경 변수

1. [Vercel](https://vercel.com/new)에서 Git 저장소를 Import합니다. Framework Preset은 Vite를 선택하거나 자동 감지를 사용합니다.
2. **Project Settings → Environment Variables**에 아래 두 값만 추가합니다.

   | 이름 | Preview | Production | 브라우저 노출 |
   | --- | --- | --- | --- |
   | `VITE_SUPABASE_URL` | Preview용 Supabase URL 또는 운영 URL | 운영 Supabase URL | 예, URL은 공개 값 |
   | `VITE_SUPABASE_ANON_KEY` | 해당 프로젝트 anon key | 운영 anon key | 예, anon key는 RLS/RPC와 함께 사용 |

`VITE_` 접두사가 붙은 값은 Vite가 브라우저 번들에 포함합니다. 따라서 `SUPABASE_SERVICE_ROLE_KEY`, Microsoft client secret, Entra tenant secret 같은 민감한 값은 Vercel 환경 변수에도 이 접두사로 만들지 말고 이 정적 앱에 등록하지 않습니다.

Vercel 환경 변수는 값을 바꾼 뒤 기존 배포에 소급 적용되지 않으므로 반드시 새 배포를 만드세요. Preview는 Production Branch가 아닌 브랜치 배포에 적용되고, Production은 Production Branch 또는 `vercel --prod` 배포에 적용됩니다. 자세한 환경 구분은 [Vercel Environment Variables 문서](https://vercel.com/docs/environment-variables)를 참고하세요.

## 2. OAuth callback route와 도메인 연결

저장소의 `vercel.json`은 `/auth/callback` 요청을 `index.html`로 rewrite합니다. 팝업이 직접 이 경로를 열어도 Vite SPA가 OAuth 완료 코드를 실행할 수 있게 하는 설정입니다.

1. Preview 배포 URL을 하나 선택하고 `https://<preview-domain>/auth/callback`을 Supabase Redirect URLs에 추가합니다.
2. Production 도메인을 연결한 뒤 `https://<production-domain>/auth/callback`을 Supabase Redirect URLs에 추가하고 Site URL을 Production 도메인으로 바꿉니다.
3. Microsoft Entra 앱에는 계속 `https://<project-ref>.supabase.co/auth/v1/callback`만 OAuth callback으로 유지합니다. 앱 도메인의 `/auth/callback`은 Supabase가 인증 후 사용자를 돌려보내는 redirect URL입니다.
4. 대소문자, 프로토콜, 경로까지 일치하는지 확인합니다. 하나라도 다르면 Microsoft 로그인은 실패합니다.

## 3. 배포 전·후 검증

로컬 또는 Vercel Build Command에서 아래를 실행합니다.

```bash
npm run test -- --run
npm run build
npm run verify:config
```

`verify:config`은 `.env.example`이 공개 변수 이름만 가진 빈 템플릿인지, `dist/`가 존재하는지, build output에 service-role/client-secret 식별자가 없는지를 검사합니다. 실제 환경 변수 값은 읽거나 출력하지 않습니다.

배포 후에는 다음을 확인합니다.

1. Preview와 Production 각각에서 로그인 팝업과 `/auth/callback` 복귀가 성공한다.
2. Vercel 로그와 브라우저 Network 탭에서 404 callback, `AADSTS50011`, Supabase redirect 오류가 없다.
3. 게임 오버 후 score 저장, TOP 10, 내 주변 순위, 리더보드 재시도, 로그아웃이 동작한다.
4. 빌드 산출물·Git history·Vercel 변수 목록에 service role key나 Microsoft client secret이 없는지 재확인한다.

Vercel의 Local/Preview/Production 환경 동작은 [공식 Environments 문서](https://vercel.com/docs/deployments/environments)를 참고하세요.
