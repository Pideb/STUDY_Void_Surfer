# Task: T01 Version Policy

## Status: done

## Goal
다음 배포0.1, 이후0.11/0.12 순서로 두 문서와 배포 준비가 동작한다.

## Implementation
- `scripts/release-core.mjs::nextVersion(version:string,baseVersion:string='0.1'):string`: 기존0.01-b에서base로 이동. base 단독이면 뒤에1을 붙이고, base 뒤 순번은 문자열 BigInt로1 증가.0.19→0.110. 유효하지 않은 버전이나 다른 기준 계열은 오류. 기준 형식은 정수.major와 한 자리 minor(`0.1`, `0.2`, `1.0`). 자동 기준 승격 없음.
- `scripts/release-docs.mjs::prepare`: `old.versionBase||'0.1'`를 nextVersion의 두 번째 인자로 사용. 현재 버전/미배포 상태 유지. docs-only/no-change idempotence 유지. 실제 배포를 위한 `--new-release`는 직전 상태가deployed-verified이면 소스가 같아도 다음 버전을 준비하고, 이미pending인 같은 소스 재시도는 유지. CLI/AGENTS/README에 연계. 새 배포 의도 dry-run과 pending 재실행 테스트 포함.
- `docs/management/releases.json`: `versionBase:string='0.1'`, `nextVersion:string='0.1'`, policy 설명 변경. releases의 실제 과거 이력과 snapshot 지문 수정 금지.
- `scripts/release-docs.mjs::documentOutputs`: 호환 versions.json의 versionPolicy도 원본 registry.policy와 일치. `scripts/build-presentation.mjs`: 현재 발표 자료에 다음 버전 및 기준 변경은 요청 시만이라는 설명 표시. 현재 버전0.01-b와 역사 피드백 보존.
- AGENTS.md, docs/management/README.md, 관리 HTML 템플릿의 규칙 설명 갱신. 이전 초기화 스크립트가 옛 정책으로 덮어쓰지 않도록 기존 catalog가 있으면 종료. 신규 초기화 정책도0.1로 설정.
- `tests/docs/release-docs.test.js`: 기존 suffix/rollover 검사를0.01-b→0.1→0.11→0.12 및0.19→0.110, 큰 순번, 다른 계열 거부로 교체. 준비→재실행 유지→다음 소스 변경0.11까지 검사. 실제 템플릿 가상 미래 버전0.1 검사. fixture nextVersion 변경. 기존 rollback/proof/snapshot 검사는 유지.
- `npm run docs:build`, Downloads 복사본 갱신. 새 게임 릴리스/공개 push 없음.

## Validation
- `npm test -- --run tests/docs/release-docs.test.js tests/docs/management-model.test.js`
- `npm run docs:check`; `npm run release:prepare -- --dry-run` (read-only, unchanged current0.01-b).
- Generated HTML JSON에서nextVersion0.1, current0.01-b 확인. 원본0.01v/b hashes 유지, Downloads 동일. `git diff --cached --check`.

## Commit
```text
fix(release): use the requested 0.1 version series

Plan: 2026-10-30-release-version-policy
Phase: P01-policy
Task: T01-version-policy
```

## Progress
- [x] Implementation complete
- [x] Validation passed:2files14tests, docs:check, read-only next-release dry-run and two HTML/Downloads/archive assertions.
- commit:pending
