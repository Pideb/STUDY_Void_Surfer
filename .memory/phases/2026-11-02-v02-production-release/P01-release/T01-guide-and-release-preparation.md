# T01 guide and release preparation

## Status: done

## Results

- 1,376 tests / 84 files passed; production build, verify:config, docs:check and guide:check passed.
- Browser: 1200px heading36px/800; 375px heading32px/800; exact seven authored notes and no horizontal overflow.
- Remote DB recheck 2026-11-02T09:21:27Z: start/finish RPC reject nulls with22023; anonymous four-argument submit is denied42501. Previously missing RPCs now exist. Probes do not write records. Actual account/concurrent remote score submissions were not tested; local SQL role tests were completed in the prior implementation.
- Deployment audit fields are excluded from the runtime bundle; real Vite before/after metadata test passes.

## Implementation

- `vite.config.mjs`: project release JSON to stable runtime version/display fields before bundling; deployment proof/status must not change the game bundle. `tests/deployment/runtime-release.test.js`: compile before/after audit metadata changes and compare exact JS output. Retry the unpublished 0.2 preparation from the original committed registry after this fix; do not increment the user's requested release.

- `docs/player/updates.json`: schemaVersion1, entry version/title v0.2, date2026-11-02, 사용자7개 문구 그대로.
- `scripts/build-player-guide.mjs`: update의 version을 h3.update-version(32px이상/800)로, date는 보조. title이version과 같으면 중복 제목 생략, 다른title은 별도부제.
- `tests/docs/player-guide.test.js`: 원고빈state는 fixture에서 명시 entries=[]로 구성. 실제 사용자 원고가 있을 때 버전 제목/7항목·큰볼드 CSS·escape/결정성 확인.
- `docs/management/README.md`: 현재 배포 절차·13개 개발 시안·수동 원고 존재에 맞게 설명. 실제 배포 여부를 앞서 성공으로 쓰지 않음.
- `npm run release:prepare -- --new-release --title ... --change ...`로0.2 준비. 전체test/build/config 후 공식관리·발표·가이드·과거표시alias·0.2검토 스냅샷 생성, docs:check, 커밋.
- 운영Supabase의 새 RPC/테이블 gate를 검증한다. 관리자 접근 가능하면 migration001/002 순서 적용·역할 검사, 없으면 명확한 진행 한계와 적용할 SQL을 준비한다. 사용자 점수는 임의 수정하지 않음.

## Validation

- guide 관련 및 전체release:prepare 검사, build/config/docs:check/guide:check.
- 브라우저375px·PC에서 v0.2 제목크기/볼드와7개 문구 확인.
- 원격DB schema probe와 조치, 원격main 관계 확인. 모든 증거는 `.memory/validation/2026-11-02-v02-production-release/`.

## Commit

```text
release: prepare v0.2 and publish the player update notes

Plan: 2026-11-02-v02-production-release
Phase: P01-release
Task: T01-guide-and-release-preparation
```
