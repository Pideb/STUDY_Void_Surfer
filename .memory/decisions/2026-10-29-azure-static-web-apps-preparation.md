# Decisions: Azure Static Web Apps Preparation

- Date: 2026-10-29
- Status: Implemented and source published. Actual cloud creation/workflow wiring/hosted login remain pending.
- Context: user is at Review + create; resource has not yet been created.

## D01 Hosting
- Use the company resource group `grill-me-edu`, app `void-surfer`, Free SKU, East Asia regional services, no enterprise edge.
- GitHub source `Pideb/STUDY_Void_Surfer`, branch `main`; deployment-token policy; Custom build, app `/`, no API folder, output `dist`.

## D02 Existing login architecture
- Retain Supabase Auth as the Microsoft Entra broker and existing DB/RPCs. Azure only serves the frontend.
- Add an exact `/auth/callback` → `/index.html` rewrite in `public/staticwebapp.config.json`, which Vite copies to the output root. Preserve existing Vercel configuration. Do not enable a second Azure built-in login gate or change Entra/Supabase settings without the actual deployed origin.

## D03 Build and publication
- The local main branch is 128 commits ahead of origin/main at inspection. Publish the existing history by normal fast-forward push after validation; never force-push or rewrite history.
- Keep `.env` files excluded. Vite's URL and publishable/anon key must be passed as build-time variables by the generated GitHub Actions workflow, not only Azure runtime settings.
- Declare Node >=22.12.0 for the current toolchain while allowing the installed Node 24. Keep dependency versions and public release label 0.01v unchanged.
- Document the required workflow environment and final Supabase Site URL/redirect checks. Azure's generated workflow/token name and final site URL are not yet available, so do not fabricate them or claim remote deployment/login verified.

## D04 Scope
- This plan completes local hosting compatibility and source publication. Resource creation, generated-workflow wiring, hosted build, allowed redirect URL and real smoke tests remain the next guided deployment steps.
- No game balance, art, score schema or remote database changes. No additional design questions remain for this preparation.
