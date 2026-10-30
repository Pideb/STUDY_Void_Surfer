# 관리용 HTML · 최종 검증

- 날짜: 2026-10-30. 현재 배포 게임 기준0.01-b / 다음 게임 변경 릴리스0.01-c.
- 관리 문서: `docs/management/void-surfer-management.html` (약3.84MB), Downloads 동일 복사본.
- 발표용 최신 별칭: `docs/releases/void-surfer-latest.html`.0.01v와0.01-b 원본은 그대로 보존.
- 이 작업에서 게임 소스·자산·DB·계정·운영 배포를 변경하지 않았고 push하지 않았다.

## 구성

1. 게임 요소: 실제 속도·중력·상승 속도 표/그래프, 조작·점수·보스·해금 조건, 세 기체와 여섯 지역의 실제 이미지45개, 벽/탄막/레이저/포털/보스의 설명용 모션.
2. 튜닝 실험실:16×16 피격 박스와56×36 성공 영역 분리, 가로 접촉 타이밍/복합벽 구멍 조건, 벽 속도·위치·성공 시간/크기·피격 크기 슬라이더, 입력 테스트와0.7초 쿨타임, 중력·상승 속도·클릭 주기 궤적. 초기화와 제안 JSON 내보내기. 실제 게임에 자동 적용하지 않는다.
3. 업데이트 이력:0.01v와0.01-b의 추가/변경/수정 및b 후속 커밋, 검색/버전 필터, 검증/배포 실행 근거, 보관한 WARNING 설계 구분.

## 검증 결과

- `npm test -- --run tests/docs/management-model.test.js tests/docs/release-docs.test.js`:2파일13테스트 통과.
- 실제 게임 함수와 기본 속도·특수벽 경계·복합벽 구멍·60Hz 중력 적분을 비교했다.
- 버전 접미사 증가/rollover, 문서-only 및 재실행 시 버전 유지, stale-source 차단, 읽기 전용 dry-run, 실패 검증 시 기존 자료 유지, 쓰기 실패 복원, 오래된/잘못된 배포 근거 거부를 검사했다.
- 실제 두 템플릿으로 가상0.01-c를 메모리에서 생성해 제목/상태/변경 내역 동기화와 과거 스냅샷 미변경을 확인했다. 파일이나 계정에는 가상 릴리스를 쓰지 않았다.
- `npm run docs:build`, `npm run docs:check`, `npm run release:prepare -- --dry-run` 통과. 문서-only prepare도0.01-b를 유지했다.
- `npm run build`, `npm run verify:config` 통과. 실행 JS는 기존 운영 빌드와 SHA256이 동일하다.
- 전용 Edge 헤드리스 프로필에서 관리 HTML의3탭×375/768/1440px 및 발표 자료375/768/1440px를 검사했다. 가로 문서 넘침·깨진 이미지·중복 main·예외 없음.
- 판정 슬라이더 변경이 실제 eligibility를 바꾸는지, 복합벽 구멍 조건, AEGIS 중력1170/상승252, VELOCITY220점 목표700, 수동 프레임 진행, JSON previewOnly, 검색, 테마, ESC 메뉴 닫기를 확인했다.
- 인쇄에서3탭·6지역을 모두 표시. 오프라인에서 이미지/실험실/SVG 그래프 정상. reduced-motion에서는 자동 RAF를 멈추고 수동 진행 제공.
- 캡처: `elements-1440.png`, `elements-375.png`, `lab-1440.png`, `lab-light.png`, `lab-375.png`, `history-1440.png`, `history-375.png`, `objects-desktop.png`, `presentation-current-rules.png`.
- 자동 검사 결과: `verification.json`, `presentation-verification.json`.

## 보존 및 지문

- 현재 게임 지문: `b3597a5c9047f3c3719efa031ae55b63131152b65342e30af35a86b1a023a5c0`.
- 운영과 같은 JS: `a1ceebf2d0c90c3ddf7e9a86231a8a3c8d02999bf2704cdea5d68e31ceb9d9b7`.
- 0.01v 원본 SHA256: `42704308b359b173044a658af44201ed05467070fc24c1cc0ca2cf9e9ce15d34`.
- 0.01-b 원본 SHA256: `5baf9173dc856d119f8beda6f45814c497fcf2bfa1afbfdae132d5b26a35cc58`.
- Git의 Windows/CI 줄바꿈 차이만 허용하는 추가 정규화 지문을 기록했다. 원문 내용 수정은 여전히 차단한다.

## 다음 배포의 자동화 범위

`AGENTS.md`에 배포 요청 시 `release:prepare` 실행을 등록했다. 이 명령이 게임 소스 변경에 한해 전체 검증 후 버전을 올리고 두 HTML 및 새 버전 스냅샷을 생성한다. Azure workflow는 `docs:check`로 오래된 문서 배포를 차단한다. CI의 임의 커밋/자동 반복 push는 없다.

실제 Actions 성공과 운영 번들/HEAD를 확인한 후 증거 JSON으로 `release:record-deployment`를 실행하면 두 문서의 배포 상태를 함께 갱신한다. 이 명령은 증거 형식·버전·게임 지문·현재 HEAD·소스 계보를 검사하지만 Azure를 직접 조회하지 않는다. 실제 성공/번들 해시 확인은 배포를 수행하는 에이전트가 별도로 해야 한다. 소스를 고치기만 하면 운영에 자동 적용되는 도구는 아니다.

## 구현·학습 노트

- 핵심 변경: `game-catalog.mjs`가 게임 모듈의 값을 모으고 `build-management.mjs`가 이를 단일 HTML에 넣는다. `specialEligibility(...)`와 `simulateFlight(...)`는 DOM 없이 검증할 수 있는 모델이다. 내보내는 설정의 `previewOnly: true`는 제안임을 명시한다.
- 알아야 할 점: 수치를 실험해도 원본/서버는 바뀌지 않는다. 원본 템플릿을 수정해야 재생성 후에도 유지된다. 그림의 모션은 설명용이며 전체 실게임 렌더러 녹화가 아니다. CDN 차트가 없어도 SVG 대안이 작동하지만 PNG 내보내기는 인터넷이 필요하다. 과거 발표 자료 링크는 저장소 내 경로이므로 단독 HTML 공유 시 과거 문서는 별도 동봉해야 한다.
- 함께 처리한 필수 부분: 오래된0.01v의 CRLF와 CI의 LF 차이를 정규화해 보존 검사에 반영했고, AEGIS의 부동소수점 표기를252로 읽기 좋게 정리했다. 기존 버전 파일은 변경하지 않았다. 범위 밖의 게임 결함 수정은 수행하지 않았으며 새 특이사항은 없다.

## 커밋

- 계획: `989554d`.
- T01 카탈로그/모델: `317b818`.
- T02 관리 HTML: `0fe5fff`.
- T03 릴리스 동기화: `e884e40`.
