# Task: T01 Hosting Configuration

## Status: done

## Goal
Make an Azure-hosted direct OAuth callback return the existing app and detect missing/mismatched deployment config before publication.

## Implementation
- New `public/staticwebapp.config.json`: `{ "routes": [{ "route": "/auth/callback", "rewrite": "/index.html" }] }`. Exact rewrite keeps location and callback code/query/hash unchanged; no redirect, custom Azure authentication, wildcard asset fallback or API implementation.
- Modify `scripts/verify-config.mjs`: preserve existing checks; read the source config and emitted `dist/staticwebapp.config.json`; require a matching exact callback rewrite, and reject source/output mismatch or invalid JSON with a nonzero result. Keep existing restricted values out of console output.
- Modify root `package.json` and root lock metadata only: engines.node `>=22.12.0`; no dependency upgrades, no release-label change.
- New `tests/deployment/config.test.js`: exercise the verifier in isolated temporary build fixtures. Valid dual-host config passes; missing emitted config, missing callback, source/output mismatch and malformed JSON fail. Existing public env restrictions remain required. No real cloud/API writes in tests.
- New `docs/azure-deploy.md`: confirmed portal fields; build-time env `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from repository variables; retain Azure-generated token secret name; Node >=22.12; source `/`/dist or explicit setup-node build+skip_app_build variant; final Site URL and `<origin>/auth/callback`; exact callback hosting config; real guest/login/ranking/update smoke tests. Do not invent deployed origin or token name.
- README and `.env.example` comments: link Azure guide, accurately separate build-time configuration from runtime settings, retain Vercel support.

## Validation
- `npm test -- --run tests/deployment/config.test.js tests/auth/oauth-popup.test.js tests/services/auth-service.test.js`
- `npm run build` then `npm run verify:config`
- `git diff --check`; inspect package lock diff and exact emitted config; no game balance changes.

## Acceptance Criteria
- [x] Callback config emitted correctly; verifier rejects incomplete artifacts.
- [x] Target tests/build/config checks pass; no secrets or invented Azure domain committed.

## Commit Message
```text
feat(deploy): prepare Azure static hosting and OAuth callback

Plan: 2026-10-29-azure-static-web-apps-preparation
Phase: P01-hosting
Task: T01-hosting-configuration

- Emit and validate the exact Azure callback rewrite
- Document build-time public configuration and the remaining portal handoff
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 9b72d23
