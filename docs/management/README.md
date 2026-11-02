# VOID SURFER 관리 자료

기본 파일: [게임 관리 레퍼런스](./void-surfer-management.html). 파일을 더블클릭하면 열립니다. 핵심 본문·실제 이미지·판정/물리 슬라이더는 파일 하나에 들어 있고 오프라인에서도 동작합니다. 글꼴·Chart.js와 PNG 내보내기만 CDN에 의존하며, 그래프에는 오프라인 SVG 대안이 있습니다.

현재 운영 식별자는 **0.01-b**, 표시 별칭은 **v0.1b**입니다. **v0.2 배포 준비본**을 생성했으며 아직 배포하지 않았습니다. 최신 변경은 [관리 자료](./void-surfer-management.html)와 [발표 자료](../releases/void-surfer-latest.html)에 반영합니다. 운영 성공 확인 전까지 v0.2는 배포 대기 상태이며, 기존 보호 스냅샷은 그대로 보존합니다.

로컬 게임의 버전 표시는 `releases.json`의 `developmentVersion`을 사용하여 **v0.2 · 개발**로 나옵니다. production 표시와 운영 배포 기록은 별도입니다. 시작 오디오는 페이지 load 시 기존 Web Audio 경로에서 한 번 자동 재생을 시도하고, 정책으로 차단되면 첫 클릭/키 입력으로 재개합니다. 별도 `<audio>` 예제 실험과 실제 브라우저 결과는 [시작 오디오 검증](../../.memory/validation/2026-11-02-startup-autoplay/report.md)에 기록했습니다.

슬라이더는 **문서 안의 가상 실험**입니다. 게임 코드·계정·서버·배포 값을 수정하지 않습니다. 제안 JSON을 내려받을 수 있습니다. 판정/물리 모델은 실제 게임 함수와 비교하는 테스트를 유지합니다. 모션 예시는 실제 자산으로 만든 설명용 애니메이션이며 실게임 전체 렌더러의 녹화가 아닙니다.

## 수정과 생성

- 자료/해금 설명: `scripts/game-catalog.mjs`. 수치는 게임 모듈에서 직접 읽습니다.
- 레이아웃/실험실: `content.html`, `style.css`, `browser.js`, `lab-model.mjs`.
- 버전·배포 근거 원본: `releases.json`.
- 실제 그림은 원본 SHA256이 일치할 때만 최적화 캐시를 재사용합니다. 자산이 바뀌면 원본을 포함하므로 오래된 그림을 조용히 보여주지 않습니다.

```powershell
npm run docs:build
npm run docs:check
node scripts/build-management.mjs --downloads
```

발표용 [최신 자료](../releases/void-surfer-latest.html)와 관리용 HTML이 함께 갱신됩니다. 기존0.01v·0.01-b는 당시 기록으로 보존합니다. 생성 파일을 직접 수정하면 재생성 시 사라지므로 원본 템플릿/카탈로그를 수정하세요.

## 다음 게임 배포

```powershell
npm run release:prepare -- --dry-run
npm run release:prepare -- --new-release --title "변경 요약" --change "첫 변경" --change "두 번째 변경"
npm run docs:check
```

사용자가 기준 변경을 승인하여 다음 배포는 **0.2**, 이후에는 **0.21 → 0.22 → 0.23**입니다. `versionBase: "0.2"` 뒤에 배포 순번을 붙입니다. 다른 기준으로의 변경은 사용자 요청 때만 적용합니다. 게임 소스/자산/의존성 변경을 감지한 경우 전체 테스트·빌드·설정 검사 후 다음 버전을 한 번만 준비합니다. 같은 소스 재실행이나 문서만의 변경은 버전을 올리지 않습니다. 검증 실패 시 이전 버전과 문서를 유지합니다. 실제 변경 내용은 `--change`로 제공하며 추측해서 업데이트 내역을 만들지 않습니다. Git HEAD/직전 변경 제목/작업 파일도 근거로 보관합니다.

새 버전은 처음에는 `validated-pending-deployment`이며 커밋/push 후 기존 Azure Actions가 배포합니다. CI의 `docs:check`는 게임 소스와 두 문서가 맞지 않으면 배포를 막습니다. CI가 임의 커밋을 만들지는 않습니다. 배포 요청을 수행하는 에이전트는 AGENTS.md에 따라 이 절차를 자동으로 실행합니다.

실제 다음 배포를 준비할 때는 `--new-release`를 사용합니다. 이전 버전이 배포 완료라면 게임 소스가 같아도 다음 버전을 만듭니다. 이미 배포 대기 중인 버전의 준비를 다시 실행하면 같은 소스에는 버전을 추가하지 않습니다. `docs:build`만으로는 배포 버전을 올리지 않습니다.

배포가 성공하면 **실제로 확인한** 증거 JSON을 다음 형태로 저장합니다. 값은 예시 형식이므로 그대로 실행하지 않습니다.

```json
{
  "version": "0.2",
  "gameFingerprint": "해당 releases.json의 64자리 지문",
  "conclusion": "success",
  "headSha": "성공한 배포의 40자리 Git HEAD",
  "runId": 123,
  "runUrl": "https://github.com/Pideb/STUDY_Void_Surfer/actions/runs/123",
  "bundleSha256": "직접 내려받아 확인한 운영 JS 번들의 64자리 SHA256",
  "origin": "https://proud-grass-03a132e00.6.azurestaticapps.net",
  "completedAtUtc": "2026-10-30T01:00:00Z"
}
```

```powershell
npm run release:record-deployment -- --proof .memory/validation/배포증거.json
npm run docs:check
```

운영 번들과 로컬 빌드 해시, Actions 성공/HEAD/완료시간은 명령 실행 전에 직접 확인해야 합니다. 이 명령은 Git HEAD·계보·게임 지문·증거 필드의 일치를 검사하고 배포 상태를 기록하며, Azure에 직접 접근하거나 배포 자체를 수행하지 않습니다. 기록 갱신도 커밋합니다. 이 초안 작업은0.01-b를 유지하며 push하지 않습니다.

## 플레이어 가이드와 개발 시안

`docs/player/guide-content.json`은 조작 원고, `docs/player/updates.json`은 개발자가 직접 쓰는 업데이트 내역입니다. 사용자가 작성한 v0.2의7개 항목을 반영했으며 자동 분석 문구는 섞지 않습니다. 버전명은 큰 굵은 제목으로 표시합니다. `npm run guide:build`로 공개 가이드 `public/guide/index.html`을 만들고 `npm run guide:check`로 확인합니다. 배포 준비 시 가이드를 먼저 동기화한 뒤 게임 지문을 확정하고, 검증 실패 시 가이드도 되돌립니다. dry-run은 가이드를 쓰지 않고 `guideStale`을 알려줍니다.

관리 문서의 **개발 예시** 탭은 `preview-catalog.json`에 선별한 원본13개를 연결합니다. 로컬 프로젝트 안의 문서에서만 작동합니다. Downloads 사본이나 원격 도메인에서는 링크를 활성화하지 않습니다. `.memory` 시안은 공개 빌드에 복사하지 않습니다. 예전0.01v·0.01-b 내용은 보존하며,0.1·0.1b 별칭은 원본 코드·자산·배포 증거를 유지하고 표시만 바꾸는 사본입니다.

배포 전에는 [비공개 기록·랭킹 DB 운영 절차](../operations/play-records.md)의 새 migration2개를 적용하고 실제 역할·로그인·동시 제출을 확인해야 합니다. [최종 로컬 검증 보고서](../../.memory/validation/2026-11-02-v02-feedback-release/report.md)에 실기기·GPU·원격 검증 범위를 구분했습니다. 소스가 바뀐 현재 `docs:check`의 배포 지문 오류는 정상적인 차단이며 우회하지 않습니다.
