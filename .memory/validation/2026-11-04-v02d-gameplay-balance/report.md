# v0.2d local gameplay balance validation

- Date: 2026-11-04
- Status: implemented and locally validated; not prepared for deployment, not pushed or deployed.
- Operating release: verified0.2c. Local development/next candidate:0.2d.
- Plan: [four completed task blueprints](../../plans/2026-11-04-v02d-gameplay-balance.md).

## Implemented behavior

| Area | Result |
| --- | --- |
| Recovery | Both WASD outcomes and the player's firing lock end cancel downward momentum and start a0.3s gravity ramp. Upward velocity survives. Lift immediately applies its ordinary impulse and cancels recovery. No added immunity. |
| AEGIS | First and subsequent charges30s; normal craft10s. One stored shot, one-hit boss defeat preserved. Selected aircraft is passed into encounter weapon creation. |
| Boss walls | Gap/interval/chance/minimum specials per7: boss1=180/2s/20%/0; boss2=165/1.8s/30%/1; boss3=150/1.6s/40%/2; boss4+=135/1.4s/50%/3. Special timing stays0.30s. |
| Unique patterns | Boss2+ has one unique block per round plus50% chance of a second. No adjacent unique blocks, including across round boundaries. Other blocks remain and internal1–3 sets unchanged. |
| Line lasers | Warning0.7s, emission0.2s, sweep0.1s, fade0.1s. Emission requires horizontal clearance from every wall column for the whole shot. Warning may overlap walls and remains harmless while waiting. Heights fixed/random, top/bottom15% excluded. Two cores have135px clear gap at540px world height. |
| Wall cadence | Inline/ambient line lasers no longer pause spawns or reset the spawn accumulator. Global laser blocks remain wall-free with their original clocks. |
| Versions/documents | Alphabetic patches advance0.2c→0.2d→0.2e, with no automatic numeric-base advance. Local menu shows0.2d development. References and control guide synchronized; historical player-authored update entries preserved. |

## Evidence

- Full suite: **88 files /1,443 tests passed**, zero failures. [Vitest report](./tests.json).
- `npm run build`: passed,121 modules. Local generated JS `/assets/index-BQMkxPl6.js`, CSS `/assets/index-DKapGXDU.css` (build output only, not operating deployment proof).
- `npm run verify:config`: passed.
- `npm run guide:check`: passed.
- `npm run docs:build`: generated latest references and guide without changing operating release ID.
- Canonical `documentOutputs()` equality:7 generated files match; `protectSnapshots()` verifies all5 protected snapshots.
- Operating registry release entries, original source fingerprint and protected snapshot map match the pre-task registry exactly. No deployment evidence promoted.
- `git diff --check`: passed after normalizing memory trailing newlines.
- Targeted tests cover10,000 seeded pattern rounds, normal/VELOCITY identical spawn times with/without line lasers, all wall kinds, supported speed bounds through875px/s, harmless delayed warnings, emission/fade frame boundaries, both WASD outcomes, firing unlock fraction, immediate input, pause and AEGIS recharge/reset behavior.
- Headless Firefox1440×1000 file-open screenshot visually inspected: [management reference](./management.png). This verifies the document's initial layout and local/operating labels, not interactive manual gameplay.

## Expected release gate

`npm run docs:check` exits with the existing **game source fingerprint changed** message. This is intentional until the user requests release preparation. Generated reference equality is checked separately above; the production gate was not weakened, the old fingerprint was not overwritten, and no new deployment entry was created. On an actual deployment request run `release:prepare` with the new alphabetic sequence, then normal checks and fresh production proof.

## Limits and adjacent integration

- No physical mobile or fullscreen GPU performance measurement, subjective difficulty playtest, authenticated remote score submission or live DB migration was performed.
- Existing Supabase data/history and SQL were untouched.
- Necessary companion corrections: visible charge descriptions/progress use the selected craft's recharge; short laser collision retains the damaging portion of frames that also enter fade. These prevent misleading UI and skipped fast-shot hits.
- No unrelated implementation scope was added. Pre-existing untracked previews/logs were not staged, modified or removed.

## Commits

- Planning:832e0aa.
- T01:a5f60d1.
- T02:a46c1d5.
- T03:0538251.
- T04:9b32cce.
