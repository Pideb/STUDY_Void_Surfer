# Task: T06 Microsoft Auth Service

## Status: pending

## Goal

Supabase Auth의 Microsoft OAuth를 팝업으로 열고 세션을 감지·복원·로그아웃하며, 로그인 때마다 Microsoft 표시 이름을 Supabase profile에 동기화한다.

## Decision Summary

- 로그인은 게임 시작의 필수 게이트이며 팝업 취소·실패·환경 변수 누락은 게임 시작을 막는 오류 상태로 표시한다.
- OAuth는 `window.open` 팝업을 사용하되, Supabase의 redirect URL과 세션 저장을 활용한다.

## Implementation

### I01. Supabase client와 OAuth popup

- Related Files:
  - `src/lib/supabase-client.js` :: T05에서 만든 browser client factory 사용; read-only
  - `src/services/auth-service.js` :: login/session/logout contract; new
  - `src/services/profile-service.js` :: profile sync; new
  - `src/auth/oauth-popup.js` :: popup lifecycle and timeout; new
  - `tests/services/auth-service.test.js` :: Supabase client mock tests; new

#### Details
- **Signatures & Types**:
  ```javascript
  export function createSupabaseClient(config: { url: string; anonKey: string }): SupabaseClient;
  export async function signInWithMicrosoftPopup(client, options?: { redirectTo?: string }): Promise<{ user: User | null; error: Error | null }>;
  export async function getSessionUser(client): Promise<User | null>;
  export function subscribeToAuth(client, callback: (user: User | null) => void): () => void;
  export async function signOut(client): Promise<void>;
  export async function syncDisplayName(client, displayName: string): Promise<Profile>;
  ```
- `signInWithMicrosoftPopup`은 popup blocker를 감지하고, `supabase.auth.signInWithOAuth({ provider: 'azure', options: { redirectTo }})`에서 받은 URL을 팝업으로 연다. Microsoft provider의 scope는 `openid profile email`로 제한한다.
- callback 경로는 `/auth/callback`으로 고정하고, 팝업은 동일 origin의 callback을 로드한 뒤 세션이 저장되면 `postMessage({ type: 'VOID_SURFER_AUTH_COMPLETE' })` 후 close한다. opener가 닫혔거나 popup이 막히면 명시적 오류를 반환한다.
- 앱 로딩 시 `getSessionUser`로 세션을 복원하고 `onAuthStateChange`를 통해 로그인·로그아웃 상태를 갱신한다.
- user metadata에서 `full_name` → `name` → `email` 순서로 표시 이름을 선택하고 `syncDisplayName`에서 trim/길이 제한을 다시 적용한다.

### I02. 인증 실패와 환경 오류

- Related Files:
  - `src/services/auth-errors.js` :: 사용자용 오류 매핑; new
  - `tests/auth/oauth-popup.test.js` :: popup close, timeout, blocker; new

#### Details
- Supabase URL/anon key가 없으면 `CONFIG_MISSING`, popup이 null이면 `POPUP_BLOCKED`, 사용자가 닫으면 `AUTH_CANCELLED`, provider 오류는 `AUTH_FAILED`로 정규화한다.
- 이 Task에서는 오류를 DOM에 표시하지 않고 typed error/result로 반환한다. P03이 로그인 게이트 화면에서 한국어 안내를 렌더링한다.

## Acceptance Criteria

- [ ] Microsoft OAuth가 popup으로 열리고 성공 시 세션이 앱에 복원된다.
- [ ] popup 차단·취소·provider 오류·환경 변수 누락이 구분된 결과로 반환된다.
- [ ] 로그인할 때마다 최신 표시 이름이 `sync_profile` RPC로 갱신된다.
- [ ] 로그아웃 후 세션이 제거되고 auth subscription이 null 사용자 상태를 전달한다.

## Validation

- `npm run test -- --run tests/services/auth-service.test.js tests/auth/oauth-popup.test.js` — mocked auth flow 통과
- 수동 검증: Supabase/Microsoft 설정 후 `npm run dev`에서 로그인·취소·로그아웃 확인

## Commit Message

```text
feat(auth): add Microsoft OAuth popup and session service

Plan: 2026-09-21-void-surfer
Phase: P02-auth-leaderboard
Task: T06-auth-service

- add Supabase browser client and Microsoft popup flow
- sync display names and normalize auth/config errors
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
