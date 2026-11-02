# 추가 요청: 고정 벽 간격 보스 / 비공개 플레이시간 동점 정렬

- Date: 2026-11-02
- Status: confirmed. 사용자1번으로 새 스테이지 도착 후15벽 기준 확정. D13/D14 및 실행 청사진에 통합한다. 기존 v0.2 설계·시각 승인은 유지.
- 기준: [v0.2 계획](../plans/2026-11-02-v02-feedback-release.md), [확정 결정](../decisions/2026-11-02-v02-feedback-release.md).
- 아직 src/public/DB migration/배포를 변경하지 않는다.

## R01 사용자 요청: 보스 첫20벽 / 이후15벽

- 기존 점수 간격을 대체하여 실제 벽 통과 횟수를 쓴다. 첫20벽, 이후15벽마다 보스.
- 일반/특수/이동/혼합 등 벽 오브젝트 하나 통과를1회로 세는 방향. 보너스 점수·VELOCITY최종배율·pause감점에 영향받지 않도록 score/progressionScore와 별도 카운터를 둔다.
- 새run/재시작은 첫20벽부터. 기존 첫저속/둘고속/셋변속/4이후랜덤과 보스 기존벽 drain→진입 규칙은 유지한다.
- 사용자1번 확정: 새 스테이지 도착 후 일반 구간부터15벽, 보스전·전환대기 벽 제외. 클리어 직후부터 세는2번은 채택하지 않는다.

## R02 사용자 요청: 같은 점수면 더 긴 사망 플레이시간 우선

- 최고점수 내림차순, 동점이면 해당 점수를 기록한 같은 run의 사망 플레이시간 내림차순. 랭킹창에는 시간 열/툴팁/텍스트를 표시하지 않는다.
- 이미 확정된 시간 정의(준비·pause·회전 제외, WASD포함, 사망판정에서 고정)를 공통 사용한다. 더 낮은 점수의 장시간 기록을 최고점수에 붙이지 않는다.
- 같은 계정이 자기 최고점수와 동일한 점수로 더 오래 생존하면 순위용 부가 기록도 갱신하는 방향. 시간까지 같을 때는 기존 achieved_at ASC/user_id ASC로 안정 정렬한다.
- 과거 최고기록에는 생존시간이 없다. 임의 추정·다른run시간 backfill 금지. 미측정은0/unknown으로 취급해 기존 동률 보조정렬을 보존하는 구현안을 검토한다.
- 전체 랭킹/결과 top/자기 주변 순위/고정 자기 기록은 같은 서버 정렬을 사용한다. 게스트·관리자 테스트 점수의 랭킹 제외 규칙은 유지.

## 코드 조사와 필수 함정

1. 현재 startWarningIfNeeded/getCurrentDifficulty/updateStage는 score/nextWarningScore 기반이고 새 스테이지 완료 시 +random15..20점이다. active 진입 조건을 벽 카운터로 통일하지 않으면 pause/보상으로 다시 보스가 나온다.
2. processPassedObstacles는 obstacle.passed 및 bossNumber로 중복·보스벽을 구분한다. 벽 종류별성공 보정과 별도로 id별카운트1회를 보장해야 한다.
3. 생성 중 in-flight 벽을 고려하지 않으면20번째를 통과할 때 이미21·22번째가 생성돼 실제 간격이 늘어난다. 일반구간 spawn budget/통과 budget을 함께 관리하고 마지막 벽이 화면 밖으로 갈 때까지 새벽 생성은 멈춘다.
4. 현재 player_scores는 authenticated SELECT USING(true) 및 테이블 SELECT grant가 있다. 여기에 duration_ms를 추가하고 UI만 숨기면 시간 비공개 요구를 충족하지 않는다.
5. 현재 submit_score는 더 높은 점수만 갱신한다. 새 동점시간 개선은 서버 트랜잭션에서 공개 최고점수와 비공개 시간 부가레코드를 함께 갱신해야 한다.
6. get_leaderboard/get_player_neighborhood는 security invoker, get_public_leaderboard는 definer다. 비공개 부가테이블로 정렬할 때 조회 RPC가 권한을 가질 수 있도록 제한된 definer와 빈 search_path/명시 열을 사용하되 호출자 역할 제한·현재 계정 제한을 보존한다.
7. SELECT/RETURN 타입에 duration 필드를 추가하지 않는다. submit_score 반환 public.player_scores도 시간 없는 기존 shape 유지. 일반 사용자용 RPC/JSON/랭킹 타입에 시간 원본이 흘러나오지 않아야 한다.
8. 실제 score 제출 시간은 T11의 종료run job과 T14의 frozen duration을 연결해야 한다. 비공개 통계 전송이 늦거나 실패해도 다른 run의 시간을 사용하거나 기존 점수 저장을 영구 대기시키지 않는다.
9. 새 migration/쓰기 서비스/기존2·3인자RPC 호환/0시간 legacy 처리·동시 제출 경쟁 및 읽기거절 검증이 필요하다. 기존 migration 원본을 소급 수정하지 않는다.

## 계획 반영

- 기존 T09 보스 패턴 순서와 함께 벽 간격 카운터를 반영하고 기존 점수조건을 비활성 이력으로 남긴다.
- 비공개 기록 Phase에 동점 정렬용 private 부가레코드·score RPC 변경 작업을 추가, 이후 문서·최종검증 작업 번호와 current/Phase를 일관되게 갱신한다.
- rank 시간은 공개 player_scores에 새 컬럼을 넣지 않고 read 차단된 별도 테이블을 사용하는 방향. 클라이언트 시간은 기존 점수처럼 검증 범위 내 제출값이며 공인 anti-cheat를 새로 주장하지 않는다.
- 원격 migration/권한 검증은 기존과 같은 배포 전 gate. Docker 없이 작성/검증·실제 적용 여부를 구분한다.

- T09에벽카운터/생성budget/순서회귀를추가, T14에서frozen종료시간을scorejob에연결, 새T15에private동점정렬migration/서비스를추가한다. 문서4Task는T16~T19로이동해전체19Task로동기화한다. 구현은아직시작하지않았다.
