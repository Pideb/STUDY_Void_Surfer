# Project Memory Workflow Rules

## 배포 버전과 문서 자동 동기화

- 사용자가 명시한 다음 배포 버전은 `0.2`다. `versionBase`는 `0.2`이며 뒤의 배포 순번을 문자열로 붙인다 (`0.21 → 0.22`, `0.29 → 0.210`). `0.3`이나 `1.0`으로 기준 버전을 올리는 것은 사용자 명시 요청 때만 한다. 현재 실제 배포 `0.01-b`는 다음 배포 전까지 유지하고 과거 화면 표시는 `v0.1` / `v0.1b`로 구분한다. 기체 임시 해금은 `0.3` 기준 버전 전까지만 적용한다.

- 게임 배포를 요청받으면 `npm run release:prepare -- --new-release --title "변경 요약" --change "실제 변경 내용"`를 먼저 실행한다. 실제 새 배포 요청은 같은 게임 소스라도 다음 버전으로 준비한다. 이미 배포 대기 중인 같은 소스의 준비 재시도는 버전을 유지한다. 전체 테스트·빌드·설정 검증 후 문서를 생성하며, 단순 문서 수정은 `npm run docs:build`로 버전을 유지한다.
- 버전 원본은 `docs/management/releases.json`이다. 관리용 `docs/management/void-surfer-management.html`, 발표용 `docs/releases/void-surfer-latest.html`와 새 버전 스냅샷을 함께 생성하고 `npm run docs:check` 후 커밋한다. CI도 오래된 문서를 차단한다.
- 기존 `void-surfer-0.01v.html`, `void-surfer-0.01-b.html` 및 확정된 배포 스냅샷을 덮어쓰지 않는다. 자동 배포 성공을 확인하기 전에는 배포 완료로 쓰지 않는다.
- 실제 GitHub Actions 성공·배포 HEAD·운영 번들 SHA256을 직접 확인한 증거 JSON으로 `npm run release:record-deployment -- --proof <증거파일>`을 실행하고 두 문서와 기록을 다시 커밋한다. 공개 주소나 확인 안 된 이전 실행을 새 버전 성공 증거로 재사용하지 않는다. 절차는 `docs/management/README.md`를 따른다.
- 이 관리 초안은0.01-b를 설명하며, 사용자가 검토를 요청한 현재 작업에서는 push·배포·게임 밸런스 변경을 하지 않는다. 실제 배포 요청이 오면 해당 요청에 따라 진행한다.

당신은 아래 3가지 단계(명령어)에 따라 순차적으로 작업해야 합니다.

---

## [1단계: 인터뷰] `/grill-me <기능명>`

코딩을 시작하기 전에 애매한 요구사항과 아키텍처 결정을 확정합니다.

1. **한 번에 딱 1개씩 질문하세요.** (질문 폭탄 금지)
2. **질문할 때 추천 답안(Recommended)과 2~3개 선택지를 함께 제시하세요.**
3. 기존 코드베이스를 뒤져서 알 수 있는 내용은 묻지 말고 직접 확인하세요.
4. 모든 설계 분기가 확정되면 `.memory/decisions/YYYY-MM-DD-{기능명}.md` 파일로 저장하고 종료합니다.

---

## [2단계: 계획] `/memory-plan <기능명>`

`decisions/`를 바탕으로 계획을 물리적 파일로 쪼갭니다.
**(이 단계에서는 절대로 코드를 치지 마세요!)**

1. 전체 로드맵을 `.memory/plans/YYYY-MM-DD-{기능명}.md`로 작성합니다.
2. 각 Phase 폴더(`phases/YYYY-MM-DD-{기능명}/P01.../`)를 만들고 `phase.md`를 생성합니다.
3. 각 Task 파일(`T01...md`)에 아래 내용을 포함한 상세 청사진을 작성합니다:
   - 수정할 파일 경로 및 심볼(클래스/함수)
   - 모델 스키마, 필드명, 타입
   - 검증 커맨드 (테스트 명령어)
   - 커밋 메시지 (Plan: YYYY-MM-DD-{기능명} 헤더 포함)
4. `.memory/current.md`를 생성하여 첫 번째 Task(P01-T01)를 가리키게 세팅합니다.

---

## [3단계: 순차 실행] `/memory-execute` 또는 `"current 보고 이어서 해줘"`

`.memory/current.md` 포인터를 기준으로 작업을 1개씩 순차 구현합니다.

1. `.memory/current.md`를 읽고 현재 `Active Task` 청사진 파일을 확인합니다.
2. 청사진에 지정된 파일에 코드를 구현하고 검증 커맨드를 실행합니다.
3. 테스트 통과 시:
   - Task 파일의 `Status`를 `done`으로 변경
   - Git 커밋 (청사진에 적힌 커밋 메시지 사용)
   - 상위 `phase.md`의 진행률 갱신
   - `.memory/current.md`의 `Active Task`를 다음 Task로 전진
