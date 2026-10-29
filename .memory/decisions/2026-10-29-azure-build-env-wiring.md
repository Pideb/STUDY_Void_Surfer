# Decisions: Azure Build Environment Wiring

- Date: 2026-10-29
- Status: Confirmed; continues the authorized Azure deployment.
- Actual origin: `https://proud-grass-03a132e00.6.azurestaticapps.net`
- Azure generated commit `673a9de` was fast-forwarded locally. First run40827799290 succeeded; live root and `/auth/callback` both returned200/app HTML.

## D01 Build configuration
- Keep Azure's one generated workflow and exact deployment secret reference `AZURE_STATIC_WEB_APPS_API_TOKEN_PROUD_GRASS_03A132E00`.
- Register only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` repository variables, using existing ignored local public configuration. Validate publishable/anon type and never output stored Git credentials or configuration values.
- GitHub connector does not support variable writes. Use the existing Git Credential Manager credential in memory with the documented GitHub repository-variable API; no new token or secret file. Fail clearly if stored credentials/permissions are unavailable.
- Pass variable expressions into the build job, fail early if either is empty, and run `npm run build && npm run verify:config` as the upload action's build command. No dependency or gameplay changes.

## D02 Verification boundary
- Verify the actual Actions run for the pushed commit, then live root/callback, bundle configuration, assets and safe anonymous ranking where possible.
- Supabase Site URL/redirect allow-list is an operator setting. If no authenticated administrative surface is available, give exact actual-origin instructions; do not use an anon key to attempt an admin mutation or claim real login/score submission verified.
- Preparation plan remains complete; this small follow-up has one independent task for configuration plus its actual deployment evidence.
