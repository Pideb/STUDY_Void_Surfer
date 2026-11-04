# v0.2d production release

- Date:2026-11-04
- Status: v0.2d deployed and verified, including the metadata synchronization HEAD.
- Origin:https://proud-grass-03a132e00.6.azurestaticapps.net
- Prepared HEAD:c47a0edef8889df1dbb6a35b823f1f7bfdfd3c38.
- [Primary successful Azure Actions run41787120805](https://github.com/Pideb/STUDY_Void_Surfer/actions/runs/41787120805).

## User-authored notes

Latest v0.2d contains exactly:
- 보스 난이도 추가 완화
- AEGIS 기체 밸런스 조정

Previous v0.2c, v0.2b and v0.2 entries are unchanged. Guide and startup popup share the same source entry.

## Local validation and preparation

- Automatic release:prepare selected0.2d, kept base0.2 and set next0.2e; no explicit version override.
- Full validation:89 files /1,450 tests passed, production build and configuration passed.
- Post-preparation build, guide:check, docs:check and git diff --check passed.
- Five old protected snapshot bytes and all previous guide/release entries preserved; baseline/preparation JSON provide evidence.
- The record-deployment command adds the new snapshot to the registry after rendering outputs, so docs:build was rerun to synchronize its newly protected map; docs:check then passed. Production gate was not bypassed.

## Primary operating evidence

- Exact prepared HEAD workflow completed success at2026-11-04T06:42:38Z.
- Operating JS/CSS URLs and SHA256 match the local build:
  - `/assets/index-CR5Bub-o.js`:72521104f79b7de9dc8149a6a65f70718cdeaabfe132055ef7fdeb29336e062e.
  - `/assets/index-DKapGXDU.css`:703b2d70edb6489fa2d9c8fa02ae7b804b42e6e03b5497edeed0b4b743a14ed4.
- Guide normalized bytes exactly match local public/guide/index.html; parsed history matches all four authored entries.
- [Fresh primary proof](./deployment-proof.json) / [operating-byte verification](./deployment-verification.json).
- Release game fingerprint:144aba685c9db6c5048c082fb3255c9d3b05e6a1992608ef6232165344414519.
- record-deployment accepted the fresh proof; registry marks0.2d deployed-verified and protects its snapshot.

## Metadata completion

- Metadata HEAD:d55e08b467fdc3e3fe71df075bf5400e941b686d.
- [Metadata successful Azure Actions run41787608734](https://github.com/Pideb/STUDY_Void_Surfer/actions/runs/41787608734), completed2026-11-04T06:46:49Z.
- Metadata operating JS/CSS/guide also match the local build exactly; game bundle SHA256 is unchanged from the primary deployment.
- [Secondary fresh proof](./metadata-proof.json) / [verification](./metadata-verification.json).
- Primary registry proof remains historical first-deployment evidence; secondary proof is separate to avoid a proof/metadata commit recursion.
- Final docs:check/guide:check passed. All6 protected snapshots verify. Next default version0.2e, base0.2 unchanged.
- Final memory-only closure is pushed with [skip ci] and changes no source/bundle/guide/release evidence.

## Limits

- No remote SQL/schema changes or authenticated score writes were performed; this release has no new SQL migration.
- No physical-device FPS or subjective balance measurement is claimed. Automated gameplay and exact deployed-file checks are the verification scope.
- Existing unrelated untracked previews/logs were not staged or deleted.
