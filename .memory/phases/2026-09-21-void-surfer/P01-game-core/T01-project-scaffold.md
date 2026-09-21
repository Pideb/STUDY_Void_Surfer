# Task: T01 Project Scaffold

## Status: done

## Goal

Vite + Vanilla JavaScript + Canvas 기반의 실행 가능한 앱 셸과 테스트 환경을 만들고, 16:9 게임 영역·한국어 UI 컨테이너·반응형 기본 스타일을 제공한다.

## Decision Summary

- 빌드 도구는 Vite, 언어는 Vanilla JavaScript, 테스트 러너는 Vitest + jsdom을 사용한다.
- 실제 게임·인증 구현은 다음 Task에서 진행하며, 이 Task는 프로젝트가 `npm run dev`, `npm run test`, `npm run build`를 실행할 수 있는 상태를 만드는 데 한정한다.

## Implementation

### I01. 프로젝트 메타데이터와 앱 진입점

- Related Files:
  - `package.json` :: scripts와 의존성 정의; new
  - `index.html` :: Vite 문서 셸과 앱 마운트 지점; new
  - `src/main.js` :: 앱 초기화 진입점; new
  - `src/app/create-app.js` :: DOM 셸 생성 함수; new
  - `src/app/config.js` :: 런타임 환경 변수 읽기; new

#### Details
- **Signatures & Types**:
  ```javascript
  export function createApp(root: HTMLElement): { canvas: HTMLCanvasElement; uiRoot: HTMLElement };
  export function readRuntimeConfig(env?: Record<string, string | undefined>): {
    supabaseUrl: string | null;
    supabaseAnonKey: string | null;
  };
  ```
- **Data & Schema Fields**:
  - `RuntimeConfig.supabaseUrl`: `string | null`, 기본값 `null`.
  - `RuntimeConfig.supabaseAnonKey`: `string | null`, 기본값 `null`.
  - `#app` 내부에 `canvas#game-canvas`, `div#ui-root`, `div#live-region`을 만든다.
- **Execution Flow / Logic**:
  1. `main.js`는 `#app` 존재 여부를 검증하고 `createApp`을 한 번만 호출한다.
  2. Canvas는 CSS 크기와 무관하게 논리 좌표 `960x540`을 기본으로 설정한다.
  3. 환경 변수가 없을 때도 게임 코어 테스트와 정적 셸이 실행되어야 하며, 인증 기능의 오류는 P02에서 처리한다.
  4. 초기 DOM에는 의미 있는 `aria-live` 영역을 두되, 화면을 가리는 오류 모달은 생성하지 않는다.

### I02. 기본 스타일과 테스트 설정

- Related Files:
  - `src/styles.css` :: 네온 테마, 16:9 Canvas, 버튼과 기본 반응형 규칙; new
  - `vitest.config.js` :: jsdom 환경 및 테스트 패턴; new
  - `tests/setup.js` :: Canvas·Audio 최소 브라우저 API mock; new
  - `tests/app/create-app.test.js` :: 셸 생성·환경 변수 테스트; new

#### Details
- 16:9 Canvas는 `aspect-ratio: 16 / 9`, `max-width: 100vw`, `max-height: 100vh`를 사용하고 작은 화면에서는 화면 안에 맞춰 축소한다.
- 네온 토큰은 CSS custom property로 정의한다. 기본 배경은 어두운 남색, 일반 UI는 청록, WARNING/BOSS는 붉은 계열이다.
- 터치 대상 버튼은 최소 44px 정사각 영역을 갖는다.
- 테스트는 `createApp`이 필수 DOM을 생성하는지, `readRuntimeConfig`가 값이 없을 때 null을 반환하고 값이 있을 때 그대로 읽는지 검증한다.

## Acceptance Criteria

- [ ] 새 환경에서 `npm install` 후 `npm run dev`로 Vite 개발 서버가 열린다.
- [ ] `npm run test`가 통과하고 테스트 환경에서 Canvas API 부재로 실패하지 않는다.
- [ ] `npm run build`가 `dist/`를 생성한다.
- [ ] 16:9 게임 영역이 데스크톱·좁은 화면에서 잘리지 않고 축소된다.

## Validation

- `npm install` — 의존성 설치 성공
- `npm run test -- --run tests/app/create-app.test.js` — 앱 셸 테스트 통과
- `npm run build` — Vite production build 성공

## Commit Message

```text
feat(scaffold): initialize Vite canvas game shell

Plan: 2026-09-21-void-surfer
Phase: P01-game-core
Task: T01-project-scaffold

- add Vite, Vitest, and responsive canvas app shell
- add runtime config reader and browser test setup
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: unavailable — `git` 명령이 현재 환경에 설치되어 있지 않음
