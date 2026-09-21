# Plan: VOID SURFER

## Goal

브라우저에서 실행되는 `VOID SURFER`를 완성한다. 사용자는 Microsoft 계정으로 로그인한 뒤 네온 우주선을 클릭·터치·SPACE로 조작하고, 점점 빨라지는 일반 장애물·특수 벽·WARNING·BOSS 구간을 통과한다. 게임 오버 직후 개인 최고 점수를 Supabase에 안전하게 갱신하고 상위 10명과 자신의 주변 순위를 볼 수 있어야 한다. 구현 완료 기준은 `npm run test`와 `npm run build`가 통과하고, Vercel·Supabase·Microsoft OAuth 설정을 따라 실제 배포할 수 있는 문서가 제공되는 것이다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Vite 앱 셸과 Canvas 게임 코어, 장애물 난이도, 오디오·일시정지 기반 구현 | [P01](../phases/2026-09-21-void-surfer/P01-game-core/phase.md) |
| P02 | `pending` | Supabase 스키마·RLS/RPC, Microsoft OAuth 팝업, 점수·순위 서비스 구현 | [P02](../phases/2026-09-21-void-surfer/P02-auth-leaderboard/phase.md) |
| P03 | `pending` | 로그인부터 튜토리얼·게임 오버·리더보드까지 화면 흐름 통합 및 배포 문서 작성 | [P03](../phases/2026-09-21-void-surfer/P03-product-flow-deployment/phase.md) |

## Implementation Order

1. P01에서 외부 서비스 없이 테스트 가능한 게임 규칙과 렌더링 기반을 만든다.
2. P02에서 인증·데이터베이스 계약을 먼저 고정한 뒤 클라이언트 서비스를 붙인다.
3. P03에서 화면 상태와 서비스를 통합하고, 설정 문서와 최종 빌드 검증으로 마무리한다.

## Cross-cutting Constraints

- 화면은 16:9 가로 Canvas를 기준으로 하되 반응형으로 축소한다.
- UI 문구는 한국어로 작성하고 `WARNING`, `BOSS WARNING`, `VOID SURFER` 고유명사는 유지한다.
- 일반 장애물의 SPACE 입력은 무효이며, 특수 벽 판정 구간에서만 대시를 실행한다.
- 점수 제출은 인증된 사용자만 가능하고, 사용자의 최고 점수와 최초 달성 시각만 갱신한다.
- Supabase 자격 증명은 소스에 하드코딩하지 않고 Vercel 환경 변수로 주입한다.
