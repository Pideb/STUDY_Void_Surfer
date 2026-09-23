# Task: T08 Integration QA and Docs

## Status: pending

## Goal

새 런타임·렌더링·UI·Supabase 변경을 하나의 사용자 흐름으로 검증하고, 링크로 접속하는 사용자가 별도 로컬 DB/Docker 설정 없이 플레이할 수 있도록 운영 문서를 갱신한다.

## Decision Summary

- 검증은 기존 Vitest 스타일 단위·통합 테스트와 `npm run build`를 기본으로 한다.
- 실제 Entra/Supabase/Vercel 운영 검증은 환경변수가 있는 경우에만 수행하고, 비밀 값은 저장소에 넣지 않는다.
- 친구/외부 사용자는 배포 URL만 받고 로그인 후 플레이·리더보드 등록이 가능해야 한다.

## Implementation

### I01. Regression and integration coverage

- Related Files:
  - `tests/game/*` :: aircraft, stage, boss, laser, challenge, collision regression coverage
  - `tests/ui/*` :: hangar, HUD, accessibility, leaderboard coverage
  - `tests/integration/game-flow.test.js` :: login → hangar → tutorial → run → boss → game-over flow
  - `tests/integration/mobile-input.test.js` :: mobile-only controls and Space behavior

#### Details

- Add deterministic seeded scenarios for: first special wall, first five timing guides, WARNING after random 10–15 score delay, third-boss projectile/challenge, fifth-boss laser, seventh-boss optional second challenge, and boss HP clear.
- Assert pause subtracts 10 exactly once, immediate restart skips tutorial, menu return preserves account and aircraft selection, and game-over leaderboard loads immediately.
- Assert desktop HUD has no in-play action button, mute icon is accessible, logout is separate, and challenge overlay exposes readable status.
- Add a full run test with a fake clock/RNG so stage shuffle, transition completion, and projectile return are reproducible.

### I02. Build, configuration, and operator documentation

- Related Files:
  - `README.md` :: local/deployment setup and player sharing instructions
  - `docs/entra-vercel-deploy.md`, `docs/supabase-schema.md`, `docs/vercel-deploy.md` :: update environment/RPC/deploy details
  - `.env.example` :: document required public Vite variables only
  - `scripts/verify-config.mjs` :: validate new optional aircraft/feature settings if introduced

#### Details

- Document `npm install`, `npm run dev`, `npm run test -- --run`, `npm run build`, and the public Vercel URL workflow.
- State clearly that players do not install Docker or configure Supabase; only the operator configures Supabase/Entra/Vercel and runs the migration.
- Document redirect URI/environment variables for local and Vercel hosts, plus the no-secret-in-client rule.
- Include the six stage names, three aircraft unlock thresholds, boss progression, and known fallback behavior when leaderboard or profile data is unavailable.

## Acceptance Criteria

- [ ] Complete automated suite passes, including new gameplay and UI scenarios.
- [ ] Production build and config verification pass without secrets in tracked files.
- [ ] README gives a new player a single link-based play path.
- [ ] Operator docs describe Supabase migration, Entra redirect URIs, and Vercel environment variables.
- [ ] Manual smoke test confirms menu → hangar → game → boss → game-over leaderboard flow.

## Validation

- `npm run test -- --run`
- `npm run build`
- `npm run verify:config`
- `npm run dev` followed by manual desktop/mobile smoke check

## Commit Message

```text
test(docs): verify aircraft boss expansion and deployment flow

Plan: 2026-09-23-void-surfer-expansion
Phase: P03-data-qa-deployment
Task: T08-integration-qa-docs

- cover aircraft, stage, boss, laser, and challenge flows
- document public-link deployment and operator-only Supabase setup
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
