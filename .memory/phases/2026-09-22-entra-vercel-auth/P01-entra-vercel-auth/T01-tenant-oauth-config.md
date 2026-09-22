# Task: T01 Tenant OAuth Configuration

## Status: done

## Goal

Keep the existing Supabase popup OAuth and leaderboard session intact while documenting and validating the operator-owned Entra single-tenant configuration that Supabase enforces server-side.

## Implementation

- Related Files:
  - `.env.example` :: non-secret variable names and comments; modify
  - `docs/entra-vercel-deploy.md` :: provider configuration checklist; new
  - `tests/auth/oauth-popup.test.js` :: preserve popup OAuth provider and callback-origin coverage; modify only if needed

### Details

- Preserve `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as the only browser runtime configuration. Do not add `VITE_ENTRA_TENANT_ID`, MSAL, Graph scopes, image storage, or any client secret.
- Preserve the current `azure` Supabase OAuth provider, popup callback, session restoration, sign-out, and leaderboard RPC contract without passing tenant query parameters from the SPA.
- Document the required operator setup: Entra single-tenant web registration; Entra redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`; Supabase Azure provider Client ID/Client Secret; and Supabase Azure Tenant URL `https://login.microsoftonline.com/<tenant-id>`.
- Document Supabase Auth URL Configuration redirect allow-lists for `http://localhost:5173/auth/callback` and the final Vercel production `/auth/callback` URL.
- Test that the OAuth request remains `provider: 'azure'` with `email` scope and that callback origin validation and popup errors remain unchanged.

## Acceptance Criteria

- [ ] Existing Supabase login session continues to authorize leaderboard writes.
- [ ] The deployment guide directs operators to configure the tenant restriction in Supabase, not browser code.
- [ ] No Entra secret, tenant URL, or Graph permission is added to browser environment files.

## Validation

- `npm run test -- --run tests/auth/oauth-popup.test.js`
- `npm run test -- --run`
- `npm run build`

## Commit Message

```text
docs(auth): document Entra tenant OAuth configuration

Plan: 2026-09-22-entra-vercel-auth
Phase: P01-entra-vercel-auth
Task: T01-tenant-oauth-config

- document Supabase-managed Azure tenant restriction
- preserve Supabase leaderboard sessions
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending
