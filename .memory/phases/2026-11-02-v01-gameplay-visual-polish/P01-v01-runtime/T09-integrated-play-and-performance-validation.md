# Task: T09 실게임 통합·경로·시각·성능 검증

## Status: pending

## Goal
시안이 아닌 실제 엔진과 브라우저에서 전 기체·6지역·보스 차수 경계·모바일 입력·전체화면 렌더를 검증한다.

## Decision Summary
- 모든 기능은 T01~T08 결과를 대상으로 검사. fixture 무적/기체 전부 해금/가짜 물리로 회피 가능성을 증명하지 않는다. 계정/배포 검증을 조작 시뮬 결과와 구분한다.
- T08 완료·커밋 후 진행.
- [최종 결정](../../../decisions/2026-11-02-v01-gameplay-visual-polish.md). 범위 밖 물리·점수·계정·배포 변경 없음.
- world960×540 논리좌표, 실제화면의 CSS/물리픽셀과 구분. 프리뷰 fixture는 본게임 로직이 아니다.

## Implementation

### I01. 실게임 통합·경로·시각·성능 검증

- Related Files:
  - `tests/integration/v01-gameplay-polish.test.js` :: `end-to-end engine state transitions` — new
  - `tests/game/boss-unique-attacks.test.js` :: `deterministic path checks` — modify
  - `tests/integration/mobile-input.test.js` :: `real DOM input regression` — modify
  - `.memory/validation/2026-11-02-v01-gameplay-visual-polish/report.md` :: `actual verification and limitations` — new
  - `.memory/validation/2026-11-02-v01-gameplay-visual-polish/verification.json` :: `machine-readable checks and evidence` — new

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
type VerificationReport={schemaVersion:1;sourceHead:string;sourceHashes:Record<string,string>;tests:{command:string;exitCode:number}[];scenarios:ScenarioResult[];browser:{name:string;gpu:string;viewport:number[];renderBuffer:number[]};performance:Measurement[];limitations:string[]};
type ScenarioResult={stageId:string;aircraftId:string;bossNumber:number;seed:number;passed:boolean;evidence:string[]};
```
- **Data & Schema Fields**: report는 sourceHead+uncommitted file SHA 둘 다 기록(HEAD만으로 현재 소스 대체 금지). 모든 실제 command/exitcode/스크린샷 경로/타이밍/환경 기록. failed 항목이 있으면 전체 pass 금지. 실기기/실로그인 미실행은 limitation으로 명시. 새 DB 데이터 쓰기 없음.
- **Execution Flow / Logic**:
  1. 전 단위·통합·UI·오디오·계정·배포설정 테스트와 build/verify:config를 실행한다. 앞 작업별 통과 로그를 모으고 최종 소스 상태에서 전체 suite는 한 번 실행, 실패/새변경 때만 필요한 범위 반복.
  2. seed 고정 엔진 run:6지역, NOVA/AEGIS/VELOCITY, boss1/2/3/4/7, 최소·최대 실제속도, dt1/60·1/30·큰dt. first boss normalwalls, unique 미해금/해금, 세트clear/중첩, manual beamHP3/AEGIS3피해, QTEpause/recovery, 모든 공격 miss 후 다음블록 진행.
  3. 경로는 실제중력/클릭/히트박스로 확인한다. 얕은 fixedstep 충돌시뮬/입력탐색으로 예고 이후 유효 경로가 남는지 검토하고 가장 좁은 seed를 실제 브라우저로 재생한다. 유한 seed 통과를 모든 가능한 배치의 수학적 보장이라고 쓰지 않는다.
  4. 실브라우저에서6지역×5시각종류 및 파괴effect전수명/혼합/뒤로간벽/전환/준비후실플레이를 캡처한다. 초록안내 보존, PNG원본표시, 단일gap보호/전역wall0, boss위치에맞는총구 확인. window.artLab 등 fixture미사용.
  5. 모바일812×375/844×390,desktopFHD 및4K viewport→최대FHDbuffer를확인. 실pointer8키/잘못된키/동시fire+canvas/ArrowUp/blur를수행. 실제휴대폰하드웨어 미보유는 에뮬검증으로만 표기.
  6. 동일시나리오 performance 전후 p50/p95/p99·DOMwrites·버퍼·GPU 기록. 레이저 blur/해상도 불변 및 penalty+global 최악구간 pixel검증. 개선이 재현되지 않으면 그 사실을 보고하고 무근거FPS수치 만들지 않는다.
  7. 실계정기록쓰기 미검증은 기존대로남겨두고 guest/account/auth정책회귀만mock으로검증. 문제발견시해당청사진범위내수정후재검증; 승인모양/균형변경이필요할때만근거와새시안으로사용자에게돌아간다.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/integration/v01-gameplay-polish.test.js` :: `T09 behavioral coverage` — new

#### Details
- 위 매트릭스와 실제 .memory evidence를 대응시킨다. 브라우저 검증은 도구 가용성을 먼저 확인하며 자동화로 얻을 수 없는 실기기/실로그인 결과를 추측하지 않는다. source7/18assets 및 original-baseline SHA 기준과 비교.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [ ] 전체 테스트·빌드·설정 검증이 통과하고 실제화면·입력·성능 증거가 남아 있다.
- [ ] 회피 경로·세트 종료·초록 안내·모바일 동작의 경계 사례 및 미검증 한계가 명시된다.
- [ ] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run` — 종료코드0 및 대상 검증 통과.
- `npm run build` — 종료코드0 및 대상 검증 통과.
- `npm run verify:config` — 종료코드0 및 대상 검증 통과.
- 실제 브라우저 시각·입력 검증 및 승인 시안 비교 결과를 `.memory/validation/2026-11-02-v01-gameplay-visual-polish/`에 기록한다. 테스트 통과를 스크린샷 확인 대신 사용하지 않는다.

## Commit Message
```text
test(game): verify v0.1 gameplay visuals and performance

Plan: 2026-11-02-v01-gameplay-visual-polish
Phase: P01-v01-runtime
Task: T09-integrated-play-and-performance-validation

- 실게임 통합·경로·시각·성능 검증 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
