# VOID SURFER 0.01-b Azure 배포

- 날짜: 2026-10-29 (Asia/Seoul)
- 사용자 요청: 로컬 검증을 마친0.01-b 배포 진행. 이 요청으로 이전의 미배포 제한이 해제됐습니다.
- 주소: https://proud-grass-03a132e00.6.azurestaticapps.net
- 게임 코드: `e0eaacf` (보스 재등장15~20점 후속 수정 포함).
- 최초 배포 HEAD: `435bc6e5b3fd9fd95d7893938d0a2daacfc9528f`.
- [GitHub Actions40836282096](https://github.com/Pideb/STUDY_Void_Surfer/actions/runs/40836282096): completed/success. 구성 검사와 Build And Deploy 모두 성공, PR 종료 job은 예상대로 skipped.

## 처리와 검증

- origin/main을 fetch한 뒤 원격 선행 변경0개, 로컬7개 커밋을 fast-forward push했습니다. 강제 push나 자격 증명 변경은 하지 않았습니다.
- 기존 Azure/GitHub workflow·Free 리소스·저장소 공개 변수·Supabase 설정을 유지했습니다. 새 유료 리소스나 DB 마이그레이션은 없습니다.
- 직전 전체718개 테스트·빌드·설정 검사가 통과한 소스를 배포했습니다. 이번에는 게임 코드 변경이 없어 전체 검사를 반복하지 않았습니다.
- `/`와 `/auth/callback`200 및 같은 app HTML을 확인했습니다.
- 공개 JS `/assets/index-6Nle5Si8.js`의 SHA256이 검증한 로컬 dist와 정확히 일치합니다: `78e71b913f237048eb13b5a7f820ffe443f92187bcb3b685beba7dcddb102658`.
- 기체·배경·보스·메뉴곡·진입 사이렌200/nonempty, 두 공개 Supabase 구성 값 포함 여부를 확인했습니다. 값은 출력/기록하지 않았습니다.
- Azure Origin으로 공개 랭킹 RPC200/CORS 허용을 확인했고 계정 정보나 점수 쓰기는 실행하지 않았습니다.
- 실제 운영 페이지의 별도 Edge 프로필에서 첫 메뉴 클릭 후 AudioContext running, ORBIT RUN 반복 재생, 메뉴곡 한 개 요청을 확인했습니다. 메뉴 갱신의 같은 hero/motion/Animation 객체와 시각 유지, 동작 줄이기, 브라우저 예외0을 확인했습니다.
- 소프트웨어 헤드리스1440px/180프레임 중앙값16.7ms·p95 약16.8ms·33ms 초과0입니다. 물리 GPU의 FPS 향상이나 스피커 청취를 의미하지 않습니다.
- `actions-run.json`, `actions-jobs.json`, `live-checks.json`, `final-1440.json/png`에 증거를 남겼습니다.
- 0.01-b HTML·버전 목록·README·메모리의 미배포 표기를 배포 완료로 갱신합니다. 이전0.01v는 보존하며 새 HTML Downloads 사본도 동일하게 유지합니다.

## 한계

사용자가 앞서 실제 운영 Microsoft 로그인과 이름 표시를 확인했습니다. 이번 배포에서는 실제 조직 계정의 새 점수 제출을 별도로 하지 않았습니다. 공개 랭킹 읽기와 배포 완료를 실계정 점수 쓰기 성공으로 표현하지 않습니다.
