# Task: T03 Validation, Documentation and Deployment

## Status: pending

## Goal
Verify combined changes, record0.01-b follow-up and deploy through existing Azure main workflow; do not stop at a local build.

## Implementation
- Run full `npm test -- --run` once after T01/T02 integration; fix relevant regressions, then `npm run build` followed by `npm run verify:config`. Preserve actual logs/counts under `.memory/validation/2026-10-29-fullscreen-fhd-music-start/`.
- Browser actual application or production engine/audio/controller fixture: full screen dimensions/DPR and logical coordinates; cached/slow gameplay music, menu stop, preparation snapshot/timefreeze,10s fallback and late track, restart/cancel. Record source/run conditions; no credentials/real account score writes. Supplement deterministic tests, not a universal physical-GPU FPS claim.
- `README.md`, `docs/releases/README.md`, current0.01-b HTML generator/versions: globalFHD/nativeRAF/music-ready10s rules, actual source revision and test count. Keep old0.01v immutable and current0.01-b version label. New feedback/followup notes may append without rewriting historical measurements. Portable HTML/Downloads copy equal; validate affected interactions/layout/metadata and hash. Avoid claiming new code alreadydeployed based on olddeployment evidence; point newpublication to matching run/livebundle only.
- Existing `.github/workflows/azure-static-web-apps-proud-grass-03a132e00.yml` stays; GitHub config/secret/Supabase schema unchanged. Fetchmain, ensure fastforward, commitandpush authorized code; query matching push-triggered Actions via existing storedGit API helper if connector cannot listpushruns. Use connected GitHub jobs tool where available. Inspect failures/fix scoped issue rather than returning pending.
- Verify live `/`, `/auth/callback`, JS hash equals local tested dist, gameaudio/art and anonymous publicranking/CORS; actual production firstgesture/musicstart read-only browser check. Record matching Actions/runhead/hash. Accountwrite/login not newly verified; user previously confirmedlogin.
- Publish accurate deployed metadata/HTML/report in a followupdocscommit if needed, push andwait for that workflow too; appbundle remains identical. No unrelated code, branchforcepush, paidresource or secretlogging. Finalclean local tree, memoryTask/phase/plan/currentdone andcommithashes. Stop only ownbrowserhelpers; auto-open currentHTML and provide actualplaylink.

## Acceptance Criteria
- [ ] Fullchecks and actual combined browser evidence pass; docsaccurate/old0.01v preserved.
- [ ] Mainpush/Actions/live0.01-b confirmed, all commits published, clean tree and pointerscomplete.

## Validation
- `npm test -- --run`; `npm run build`; `npm run verify:config`; runtime/HTML/publicdeployment harness; `git diff --check`.

## Commit Message
```text
docs(release): verify FHD rendering and synchronized game music startup

Plan: 2026-10-29-fullscreen-fhd-music-start
Phase: P01-runtime
Task: T03-validation-deployment

- Record full regression and actual fullscreen/audio evidence
- Update0.01-b release material and deploy the validated build
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit:pending
