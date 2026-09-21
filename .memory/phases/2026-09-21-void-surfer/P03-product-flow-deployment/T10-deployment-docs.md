# Task: T10 Deployment Documentation

## Status: pending

## Goal

Supabase 프로젝트·Microsoft Entra OAuth·Vercel 배포를 처음부터 재현할 수 있는 설정 문서와 환경 변수 예시를 제공하고, 민감한 값을 저장소에 노출하지 않은 production build를 검증한다.

## Decision Summary

- 사용자는 Supabase 프로젝트와 Microsoft OAuth 앱을 아직 보유하지 않으므로 설정 절차를 문서화한다.
- 브라우저에는 Supabase URL과 anon key만 공개하고, service role key는 절대 사용하지 않는다.

## Implementation

### I01. 환경 변수와 설정 문서

- Related Files:
  - `.env.example` :: Vite public environment variable names; new
  - `docs/supabase-setup.md` :: project, migration, Auth provider, redirect setup; new
  - `docs/vercel-deploy.md` :: Vercel project/env/domain steps; new
  - `README.md` :: quick start, scripts, architecture links; modify

#### Details
- `.env.example`는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`만 포함하고 실제 값은 빈 placeholder로 둔다.
- `docs/supabase-setup.md`에 Supabase project 생성, SQL migration 적용, Microsoft Entra 앱 등록(redirect URI/SPA 설정), client ID/secret을 Supabase Azure provider에 등록, Supabase Auth URL Configuration의 redirect allow-list 설정을 순서대로 작성한다.
- popup callback은 local `http://localhost:5173/auth/callback`와 Vercel production URL을 모두 등록해야 함을 명시한다.
- `docs/vercel-deploy.md`에는 Vercel에 동일한 `VITE_*` 값을 Preview/Production별로 입력하고 재배포하는 절차, env 값 노출 점검, Supabase redirect URL 일치 점검을 포함한다.
- SQL 문서에는 RLS/RPC가 service role key 없이 동작하고, service role key를 프론트 환경 변수에 넣지 말아야 함을 명시한다.

### I02. 배포 검증

- Related Files:
  - `scripts/verify-config.mjs` :: required env name and build artifact check; new
  - `package.json` :: `verify:config` script; modify

#### Details
- **Signatures & Types**:
  ```javascript
  // node scripts/verify-config.mjs
  // exits 0 when required names/build expectations are present, non-zero otherwise
  ```
- verify script는 `.env` 값을 출력하지 않고 key 이름과 build output existence만 검사한다.
- production build에 `SUPABASE_SERVICE_ROLE_KEY`, Microsoft client secret, raw OAuth secret 문자열이 포함되지 않는지 문자열 검사한다.
- 실제 provider가 준비된 경우 수동 smoke checklist를 문서에 제공한다: Microsoft login popup, tutorial, score save, leaderboard rank, logout, retry.

## Acceptance Criteria

- [ ] 새 개발자가 문서만 읽고 Supabase·Microsoft OAuth·Vercel 설정을 완료할 수 있다.
- [ ] `.env.example`에 비밀 값이 없고 service role key 사용 예가 없다.
- [ ] local/preview/production callback URL이 문서에 구분되어 있다.
- [ ] config verification과 production build가 통과한다.
- [ ] `README.md`가 실행·테스트·배포 문서로 연결된다.

## Validation

- `npm run build` — production build 성공
- `npm run verify:config` — 산출물·환경 변수 이름·비밀 문자열 점검 통과
- `git diff --check` — 문서 및 설정 whitespace 오류 없음

## Commit Message

```text
docs(deploy): document Supabase Microsoft OAuth and Vercel setup

Plan: 2026-09-21-void-surfer
Phase: P03-product-flow-deployment
Task: T10-deployment-docs

- add environment, Supabase, Microsoft OAuth, and Vercel setup guides
- add safe production config verification and quick-start links
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
