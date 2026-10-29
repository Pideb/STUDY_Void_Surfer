# Azure Public Build Configuration and Live Deployment

- Date:2026-10-29
- Origin: https://proud-grass-03a132e00.6.azurestaticapps.net
- Implementation commit: `a60634857fbe749b7d724271791b13e0bcafefd6`
- Matching [GitHub Actions run40828446428](https://github.com/Pideb/STUDY_Void_Surfer/actions/runs/40828446428): completed/success. Public-configuration check and Build And Deploy both succeeded; PR-close job correctly skipped on a main push.

## Completed

- Fast-forwarded Azure's generated workflow commit `673a9de`; kept its one workflow, deployment token reference and source/output/API settings.
- Created and read back both public GitHub repository variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Existing local public configuration was validated as HTTPS plus publishable/anon type. Stored Git authentication stayed in memory and was never printed or saved. No new private credentials were created.
- The upload job now receives `${{ vars.VITE_SUPABASE_URL }}` and corresponding key. A missing value fails before deployment, preventing another apparently successful guest-only build without a working backend configuration.
- Upload executes `npm run build && npm run verify:config`; callback routing is still exact and anonymous. Azure's default successful Node build path was retained; no dependency/action upgrade was needed.
- Local targeted auth/deployment tests:3 files/19 cases passed. Build and emitted-config checks passed. No game-rule changes.

## Live Evidence

`live-checks.json` records public HTTP observations, without account data or key values:

- Root and `/auth/callback`:200, same app HTML.
- Served JS `/assets/index-D5YLbpGp.js`: contains both expected public configuration values; SHA256 recorded, values omitted.
- Aircraft, background, evolved boss and approved siren files:200/nonempty.
- Anonymous `get_public_leaderboard` read:200, one row returned; no player data logged and no write performed. Azure browser origin allowed by CORS.
- Supabase public auth settings:200, Azure provider enabled.

These are deployed artifact/API checks, not a human gameplay, actual sign-in or authenticated score-write test. Speaker playback was not tested here.

## Operator Handoff

The Supabase administrative URL allow-list has not been changed by this work. In Authentication → URL Configuration, set Site URL to the actual Azure origin and add `https://proud-grass-03a132e00.6.azurestaticapps.net/auth/callback` to Redirect URLs, preserving the existing localhost callback where local testing is needed. Then verify real organization login, account best, score submission and logout/re-entry at the hosted URL. Keep Entra's existing Web/Supabase callback configuration.

Actual hosted auth verification remains pending this operator step. Source publication/build success is not described as proof that it has been completed. No unrelated adjacent changes were made.
