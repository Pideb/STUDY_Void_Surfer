# Azure Static Web Apps Source Preparation

- Date: 2026-10-29
- Hosting implementation: `9b72d23`
- First publication: normal push advanced GitHub main `eaf5a19` → `9b72d23`; remote HEAD confirmed equal to local.
- This publication includes the original 128 unpushed commits plus the preparation plan and implementation. No force-push or history rewrite.

## Verified

- Targeted deployment/auth suites: 3 files, 19 tests passed.
- `npm run build`: passed, 100 modules; game JS399.54kB, CSS19.51kB, about119MiB of deployed assets.
- `npm run verify:config`: passed after build, including Azure source/output callback agreement and existing Vercel checks.
- `git diff --check`: passed.
- Lockfile changed only root Node engine metadata; dependency versions unchanged.
- Outgoing audit: 1,809 blobs, 1,498 text blobs; largest blob8,048,326 bytes. No tracked `.env`/private-key files or high-confidence credential findings. This heuristic audit is not proof that every possible secret is absent. Public Supabase publishable/anon configuration is not a server secret.

## Core Change

`public/staticwebapp.config.json` is copied by Vite to the deployment output:

```json
{"routes":[{"route":"/auth/callback","rewrite":"/index.html"}]}
```

The browser retains the callback location/query/hash while the current OAuth completion code loads. Existing Vercel config and Supabase-brokered Entra login are preserved. Node engine floor is22.12, compatible with the installed Node24. No game rules or DB migration changes.

The artifact verifier rejects missing/malformed/stale callback config and login-gated callback routes. Test fixtures use explicit temporary-directory bounds before deletion. Their verifier path uses the repository working directory to avoid the existing JSDOM/Vite URL transformation; the shared canvas test setup was left unchanged.

## Still Pending: Actual Deployment

The user is at Azure Review + create: `void-surfer`, `grill-me-edu`, Free, East Asia, GitHub main, Custom `/` → `dist`, no API, deployment token. Source preparation is complete; the resource/site has not been created or verified by this work.

Next: user clicks Create and returns the resource Overview URL. Then inspect the Azure-generated workflow, preserve its token secret name, wire Vite build-time URL/publishable-key variables, register the real `<origin>/auth/callback` in Supabase, and perform hosted guest/login/save/ranking smoke tests. Azure runtime settings alone do not populate the Vite build. Do not fabricate the site URL or claim remote auth/score storage verified.

See [deployment guide](../../../docs/azure-deploy.md). No unrelated adjacent refactors were included. Cloud creation, workflow wiring and real login remain explicit follow-up work.
