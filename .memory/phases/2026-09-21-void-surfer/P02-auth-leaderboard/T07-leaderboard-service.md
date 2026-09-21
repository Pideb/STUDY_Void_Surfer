# Task: T07 Leaderboard Service

## Status: pending

## Goal

게임 세션의 점수를 인증된 사용자의 개인 최고 기록으로 제출하고, 게임 오버 화면에 상위 10명과 사용자 주변 순위를 제공하는 typed 서비스와 오류 처리를 구현한다.

## Decision Summary

- 클라이언트는 서버 RPC만 호출하며 테이블에 직접 쓰지 않는다.
- 실패 시 caller가 점수·버튼을 먼저 표시할 수 있도록 리더보드 조회와 점수 제출을 독립된 결과로 반환한다.

## Implementation

### I01. 점수 제출 API

- Related Files:
  - `src/services/leaderboard-service.js` :: score submit and queries; new
  - `src/services/leaderboard-errors.js` :: auth/network/database error mapping; new
  - `tests/services/leaderboard-service.test.js` :: RPC contract tests; new

#### Details
- **Signatures & Types**:
  ```javascript
  export async function submitBestScore(client, { score, displayName }): Promise<{ updated: boolean; record: ScoreRecord | null; error: ServiceError | null }>;
  export async function fetchTopScores(client, limit?: number): Promise<{ rows: LeaderboardRow[]; error: ServiceError | null }>;
  export async function fetchPlayerNeighborhood(client, radius?: number): Promise<{ rows: LeaderboardRow[]; error: ServiceError | null }>;
  export function normalizeLeaderboardRows(rows): LeaderboardRow[];
  ```
- `score`는 정수이고 0 이상이어야 하며, displayName은 빈 값이면 거부한다. client-side validation은 UX용이고 최종 검증은 RPC가 담당한다.
- 제출 순서는 game-over 진입 후 `submitBestScore` 실행, 완료와 무관하게 top/neighborhood 조회를 병렬 실행한다. auth error는 재로그인 상태로, network error는 retry 가능한 상태로 분류한다.
- `limit`은 1~50으로 clamp하고 UI 기본값은 10, `radius` 기본값은 2다. RPC 응답 순서와 rank를 그대로 유지하며 프론트에서 임의 정렬하지 않는다.

### I02. 타입·순위 표시 모델

- Related Files:
  - `src/services/leaderboard-types.js` :: service DTO; new
  - `tests/services/leaderboard-service.test.js` :: missing/self-neighbor edge cases; modify

#### Details
- **Data & Schema Fields**:
  - `ScoreRecord`: `userId: string`, `bestScore: number`, `achievedAt: string`.
  - `LeaderboardRow`: `rank: number`, `userId: string`, `displayName: string`, `bestScore: number`, `achievedAt: string`, `isCurrentUser: boolean`.
- 빈 top list, current user가 top 10 밖인 경우, neighborhood가 한 명뿐인 경우, RPC error를 테스트한다.
- 사용자 표시 이름은 HTML에 직접 innerHTML로 삽입하지 않고 textContent 경로로 전달 가능한 평문으로 유지한다.

## Acceptance Criteria

- [ ] 개인 최고 점수 제출은 `submit_score` RPC만 호출한다.
- [ ] 낮은 점수 제출 후 `updated=false`와 기존 record를 처리한다.
- [ ] top 10과 current user 주변 순위를 각각 조회할 수 있다.
- [ ] RPC/network/auth 오류가 UI가 구분할 수 있는 서비스 오류로 변환된다.

## Validation

- `npm run test -- --run tests/services/leaderboard-service.test.js` — submit/query/error/edge case 통과

## Commit Message

```text
feat(leaderboard): add secure score and ranking client services

Plan: 2026-09-21-void-surfer
Phase: P02-auth-leaderboard
Task: T07-leaderboard-service

- submit personal bests through Supabase RPC
- fetch top ten and current-player neighborhood with retryable errors
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
