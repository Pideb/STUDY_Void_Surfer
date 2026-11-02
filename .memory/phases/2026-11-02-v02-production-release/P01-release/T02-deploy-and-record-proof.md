# T02 deploy and record proof

## Status: done

## Results

Verified on2026-11-03: Actions41420130260 success at2026-11-02T09:46:27Z, exact HEADfd82ff458572c1eaa49d3391f21a813ccf9cbc49, production JS SHA256cca98444faf29925fbe1ad7397be23e2856c1a239e3ac48d657e6b94c2eec5f8 matches local build; public guide matches exact local bytes (normalized CRLF). record-deployment succeeded. Metadata follow-up push is part of the original deployment authorization; subsequent gameplay bug fixes are local only until a new deployment request.

## Implementation

- T01 커밋과 운영DB필수 gate 이후 origin/main fast-forward 관계 확인 후 `git push origin main`. force 금지.
- 정확한 배포 commit SHA로 GitHub Actions push 실행을 조회한다. connected tool이push runs를 지원하지 않으면 공개GitHubREST/정상Git CLI를 사용한다. credential은 출력/기록하지 않음.
- 실패 시 정확한 job logs·원인에 한해 수정하고 검사 후 배포. 성공 시 actual runId/head_sha/conclusion/completedAt를 저장.
- 운영 `https://proud-grass-03a132e00.6.azurestaticapps.net`의 index·JS·가이드를 직접 내려받아 로컬dist JS SHA256과 비교. v0.2와7문구·버전명 스타일 확인.
- `npm run release:record-deployment -- --proof <JSON>` 실행. docs:check 후 metadata·증거 커밋/push, 필요 후속Actions 성공도 확인. 최종source와운영payload가같은지 확인.
- release registry와 보호스냅샷으로 증거를 기록하고 phase/current 완료. 실제로 수행하지 못한 DB·계정 검증은 성공으로 쓰지 않음.

## Validation

- 정확한HEAD의 Actions success·운영bundle SHA256·guide v0.2 및7개 사용자문구.
- record-deployment와docs:check 통과. 배포 실패/필수 gate 미충족 시 미완료로 기록하고 구체적 이유 안내.

## Commit

```text
release: record verified v0.2 Azure deployment

Plan: 2026-11-02-v02-production-release
Phase: P01-release
Task: T02-deploy-and-record-proof
```
