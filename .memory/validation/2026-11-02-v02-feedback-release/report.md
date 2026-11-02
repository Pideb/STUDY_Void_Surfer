# v0.2 로컬 통합 검증

구현·커밋 검증 결과입니다. 배포 승격·push·운영 데이터 변경은 수행하지 않았습니다. 현재 운영 릴리스 식별자는 `0.01-b`, 화면 별칭은 `v0.1b`입니다. 다음 배포 기준만 사용자 승인에 따라 `0.2`로 준비되어 있습니다.

## 검사 결과

| 검사 | 실제 결과 | 근거 |
|---|---|---|
| 전체 단위·통합·UI·오디오·서비스·문서 | 79파일, 1,347개 통과 | [all-tests.json](all-tests.json) |
| 실제 물리 회피 탐색 | 6지역 × 3기체 × 보스2/3/4/7 × 3프레임 간격 × 최저/최고속도 = 432경로 통과 | [finite-path-scenarios.json](finite-path-scenarios.json) |
| 빌드·호스팅 설정·가이드 최신 여부 | build / verify:config / guide:check 종료0 | [verification.json](verification.json) |
| 실제 렌더러 자산 | 6지역의 이동벽·특수벽·혼합벽·투사체·단일/전역 레이저 및 파괴 전후 48캡처, 예외0 | [렌더러 검사](../2026-11-02-v01-gameplay-visual-polish/runtime-visual-check.json) |
| PC 메뉴 | 6해상도 기준 비율 유지 | [layout-orientation.json](layout-orientation.json) |
| 모바일 | 5개 가로 크기, 52px 이상 메뉴 터치 대상·회전 안내·수동 재개 | [layout-orientation.json](layout-orientation.json) |
| 네이티브 터치 입력 | 8키 챌린지, 오입력 재시도, 회전30초 시간 동결·감점0 | [qte-touch-browser.json](qte-touch-browser.json) |
| 결과창 | PC·모바일, 팝업 바깥 재시작·네온 안내 | [gameover-browser.json](gameover-browser.json) |
| 플레이어 가이드 | 375폭 스크롤 넘침0, 메뉴 Space로 새 탭 열림, dist HTTP200·원본과 동일 | [player-guide-browser.json](player-guide-browser.json) |
| 개발 시안 목록 | 원본12개, 상태필터·키보드 탭, 원격·Downloads 차단 | [archive-browser.json](archive-browser.json) |
| 로컬 PostgreSQL | PGlite에 변경 없는 migration5개·역할 테스트2개 실행 성공 | [sql-local.json](sql-local.json) |
| 원본 보존 | 성능 변경 전 원본5개 SHA256 일치, 확정 릴리스 스냅샷 보존 | [verification.json](verification.json) |

## 회피 경로의 범위

실제 `createPlayer/applyLift/updatePlayer`와 고유 공격·충돌 함수를 사용했습니다. 피격 박스16px, 중력·상승력은 각 기체의 실제 값, 대시는0.6초·쿨타임0.7초로 제한했습니다. 무조건 무적·중력0으로 회피 가능성을 증명하지 않았습니다. `dt`는1/60·1/30·0.1초이며, 일반 기체240~575와 VELOCITY480~770 범위를 확인했습니다.

단순 위치 유지 정책이 경로를 찾지 못한 산업 지역 AEGIS 조합은 대시 시점 탐색을 넓혀 통과했습니다. 게임 수치는 변경하지 않았습니다. 가장 좁은 화면 경계 여유는24.25 논리px였으며 실제 브라우저에서 같은 입력 궤적을 재생했습니다. [재생 정보](path-browser.json), [화면](narrow-path-4k.png).

이 검사는 벽 없는 고유 공격의 유한 표본입니다. 총구는750,270으로 고정했고 무작위값0.6으로2세트를 발생시켰습니다. 모든 벽과의 중첩·모든 보스 위치·모든 난수·사람의 반응에 대한 보장은 아닙니다. 보스1의 일반벽 규칙, 최초20벽·이후15벽, 첫3보스 순서, HP/발사·미스 후 다음 블록, 빠른 재시작 저장 격리는 별도 전체 테스트에 포함되어 있습니다. 터치 챌린지 화면 검사에서만 완료된 cadence·중력0·무적 fixture를 사용했으며 회피 증거와 분리했습니다.

## 성능 측정

Headless Edge156 / Microsoft Basic Render Driver / 동일1920×1080 조건입니다. 4K viewport3840×2160와 DPR2에서도 내부 버퍼는1920×1080 이내입니다. 레이어 해상도·레이저 blur·게임 프레임 제한은 승인 값 그대로입니다.

| 같은 장면 | 변경 전 | 변경 후 |
|---|---:|---:|
| 동일 HUD1000회 갱신 DOM변경 | 24,000 | 0 |
| 렌더 p50 | 67.6ms | 62.4ms |
| 렌더 p95 / p99 | 200.8 / 209.3ms | 188.3 / 207.0ms |
| 글리치+전역 레이저 p50 | 69.3ms | 70.7ms |
| 글리치+전역 레이저 p95 / p99 | 238.3ms | 196.6ms |

동일 프레임 픽셀은 일치합니다. 소프트웨어 렌더러 측정이므로 실제 PC FPS나 전체화면 프레임드랍 해소를 보장하지 않습니다. 최악 구간 p50은 소폭 악화했고 p95는 개선됐습니다. 한 번의 측정을 통계적 개선 보장으로 해석하지 않습니다. [원시 측정](../2026-11-02-v01-gameplay-visual-polish/performance-comparison.json).

## 운영 검증과 배포 전 조건

운영 Supabase에는 새 migration을 적용하지 않았습니다. [운영 절차](../../../docs/operations/play-records.md)에 따라 `202611020001_private_play_sessions.sql`, `202611020002_private_ranking_duration.sql`을 순서대로 적용하고 원격 역할 검사를 수행해야 합니다. 로컬 PGlite는 실제 SQL·RLS/권한 검증이지만 실제 JWT/PostgREST, Entra 로그인, 독립 연결 동시 제출 검증은 아닙니다.

실제 휴대폰 하드웨어·사용자 GPU·음향 청취 검증도 별도입니다. 통계 전송은 재시도 가능한 최선 노력 방식이며 브라우저 강제 종료·저장소 부족·여러 탭 간 경쟁까지 전달을 보장하지 않습니다. 일반 사용자에게 비공개 플레이시간·횟수를 노출하지 않습니다.

공식 배포 문서의 지문 불일치는 현재 의도된 상태입니다. 배포 요청 전에는 `release:prepare`로 버전을 올리거나 운영 스냅샷을 덮어쓰지 않습니다. 플레이 후 수정할 사항이 있으면 먼저 반영합니다.

## T19 문서 인계 검증

게임 소스는 위 검증 이후 변경하지 않았습니다. 문서 생성기·카탈로그·과거 표시 별칭을 갱신한 뒤 문서 테스트5파일30개를 추가 검증했습니다. [문서 테스트](t19-doc-tests.json), [브라우저 검사](draft-docs-browser.json), [검토본 생성 SHA](draft-docs/manifest.json).

실제 브라우저에서 v0.2 미배포 표기, 보스 판정 슬라이더 초기값0.30과 즉시 변경, 개발 시안12개 URL의 HTTP200, v0.1·v0.1b 별칭의 표시/원본 metadata 보존을 확인했습니다. 원본 공식 관리·발표 HTML, currentVersion, 수동 플레이어 업데이트 원고는 변경하지 않았습니다. `docs:check` 종료1은 정확히 게임 지문 불일치 오류였고 다른 실패를 묵살하지 않았습니다. [인계 및 실행 순서](HANDOFF.md).
