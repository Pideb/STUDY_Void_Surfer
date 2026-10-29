# Task: T03 Version HTML and Final Evidence

## Status: done

## Implementation
- `README.md`: current boss-only rules and first-gesture menu audio/motion behavior; archive link, exact public version0.01-b.
- `docs/releases/void-surfer-0.01-b.html`: derive from the complete existing visualization skeleton/style/assets. Preserve old0.01v HTML byte-for-byte. Update current rules from WARNING↔BOSS to normal↔BOSS, first20 and5..8, boss count unlocks, menu sound restriction, four-change version notes, actual verification/source commit and local-not-deployed status. Historical21 feedback cases remain identified as0.01v history; add four0.01-b cases and adjust search counts. Keep themes/menu/print/PNG/meaningful filters/stage tabs and inline assets. Do not relabel old game screenshots as fresh0.01-b runtime.
- Generator under new validation folder produces only new HTML, updates `docs/releases/versions.json` (append0.01-b, currentVersion, preserve0.01v metadata), release README/current links, and identical Downloads copy. Do not rerun the old baseline builder, which overwrites old files.
- Actual browser evidence: clean menu sound after first click/key, current boss1 at20 and later boss count, no standalone warning, stable menu repaint, responsive HTML375/768/1440 and print/tab/filter checks. Use actual engine fixtures for long boss transitions; label synthetic score/setup state. Benchmark observations must distinguish baseline and final.
- Run full suite once after integration, build then verify:config; fix relevant regressions. Record full counts, screenshot/hash evidence, remaining physical-GPU/audio limitations. User already confirmed production login; no new real account score-write claim.
- Auto-open the new HTML in browser, return its clickable path. Commit, sync task/phase/plan/current and final local memory commit; no Git push or production deployment claimed.

## Validation
- `npm test -- --run`
- `npm run build` then `npm run verify:config`
- Runtime/HTML verification harness; old0.01v hash unchanged; Downloads copy equal; `git diff --check`; clean final local tree.

## Acceptance Criteria
- [x] Four requirements implemented and actual evidence reviewed; WARNING recoverable from archive.
- [x] New0.01-b HTML/history complete and old snapshot intact.
- [x] Full suite/build/config pass; local versus deployed status explicit. Commit and pointer finalization follows below.

## Commit Message
```text
docs(release): document and verify VOID SURFER 0.01-b

Plan: 2026-10-29-001b-boss-menu
Phase: P01-runtime
Task: T03-version-evidence

- Record boss-only pacing and menu audio/motion fixes in the version HTML
- Preserve the 0.01v snapshot and verified local release evidence
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit:7e7b15a

## Evidence
- `.memory/validation/2026-10-29-001b-boss-menu/report.md`: full716, build/config, menu gesture/motion comparison, first20 boss runtime and HTML1440/768/375/offline/print checks.
- 0.01v SHA unchanged, Downloads copy equal; only embedded asset change is the actual new menu screenshot. Version-copy action contains3928989 and local-not-deployed status.
- Task commit complete; phase/plan/current finalized in the following memory synchronization commit. No push.
