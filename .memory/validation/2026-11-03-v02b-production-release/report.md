# v0.2b release validation

- User explicitly named0.2b and authorized deployment after leaving audio unchanged.
- Manual guide prepends exactly2 authored bullets, with old v0.2 entries unchanged below. baseline.json holds previous parsed entries and protected snapshot hashes; verification succeeded.
- Full1,405 tests/85 files pass, build/config/docs/guide checks pass. Registry current/development0.2b, base0.2,next0.21; explicit version CLI preserves ordinary future sequence and refuses reused/invalid IDs.
- Chromium production preview: menuv0.2b, guide1200/375px versions ordered correctly, exact bullets, large bold headings, no overflow. Screenshots/browser.json alongside report.
- Public Supabase ranking read200/10 rows; no DB mutation or migration. Audio source unchanged from9f9161b. Runtime bug fixes from aeb3ac6/bc222f8/9f9161b included.
- Deployment Actions41556010277 succeeded at2026-11-03T00:55:01Z for exact HEAD3b80a57cc0f7ecc547a9f0fe015d227765773cf8. Production JS SHA2563c96ee6db5e29966863413b13c49f8e5bcbe2abd7a3e23ef739098fcbf9fa754 matches local verified bundle. Public guide exactly matches prepared source; old notes/snapshots preserved. Canonical record-deployment succeeded and0.2b snapshot is protected. Metadata follow-up remains to verify.
- A verifier originally assumed Vite would inline the currentVersion property string; Vite actually hoists JSON exports. Changed this diagnostic to inspect the version literal, backed by the exact SHA256 match and actual menu browser result. No game source change was needed. One Windows UNKNOWN alias-write error on docs:build cleared on retry; transactional outputs and docs:check converged.

## Final verification
- Canonical success record and official docs committedd59b5734637b3afa7b26bd90a389e748e847dd39 and pushed. Its exact Actions41556504860 succeeded2026-11-03T00:59:25Z; downloaded production JS/guide matched local again with unchanged SHA2563c96ee6db5e29966863413b13c49f8e5bcbe2abd7a3e23ef739098fcbf9fa754.
- metadata-proof.json/metadata-verification.json record this independent follow-up. Baseline protected snapshot hashes and old guide objects still identical. docs:check passed after recording. No new audio behavior, DB mutation or game source change during metadata follow-up.
- Close memory/evidence in a memory-only commit using the documented GitHub `[skip ci]` marker (https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs), avoiding a third redundant deployment. Both real deployment commits went through normal CI; no game/build/guide/official-doc change is skipped.
- Complete. Public game origin unchanged; player guide /guide/index.html contains0.2b2-bullet update above0.2's preserved7 bullets.
