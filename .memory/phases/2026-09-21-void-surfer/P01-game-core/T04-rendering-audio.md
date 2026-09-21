# Task: T04 Rendering and Audio

## Status: done

## Goal

게임 코어 snapshot을 어두운 우주·네온 스타일 Canvas에 렌더링하고, 우주선·구조물·WARNING/BOSS 상태·점수·일시정지를 시각적으로 확인할 수 있게 하며 Web Audio 기반 피드백을 연결한다.

## Decision Summary

- 외부 이미지·오디오 파일 없이 Canvas 도형과 Web Audio API로 초기 리소스를 구현한다.
- 오디오 재생은 사용자 gesture 이후에만 시작하며, 메인 메뉴와 게임 화면에서 음소거를 토글할 수 있어야 한다.

## Implementation

### I01. Canvas 렌더러

- Related Files:
  - `src/game/renderer.js` :: logical 960x540 Canvas renderer; new
  - `src/game/visual-theme.js` :: neon palette and effect constants; new
  - `tests/game/renderer.test.js` :: draw call contract; new

#### Details
- **Signatures & Types**:
  ```javascript
  export function createRenderer(canvas: HTMLCanvasElement): {
    resize(): void;
    render(snapshot: GameSnapshot): void;
    destroy(): void;
  };
  export function drawShip(ctx, player, theme): void;
  export function drawObstacle(ctx, obstacle, theme): void;
  ```
- Canvas 내부 좌표는 항상 960x540으로 유지하고 `devicePixelRatio`를 반영해 선명도를 확보한다.
- 일반 구조물은 청록 네온, 특수 구조물은 보라/주황 문양, WARNING은 붉은 overlay와 중앙 배너, BOSS는 오른쪽 큰 적 캐릭터 실루엣과 패턴 라벨로 표현한다.
- renderer는 DOM 상태를 변경하지 않고 snapshot을 그리기만 한다. UI 텍스트는 P03에서 담당한다.

### I02. Web Audio 사운드

- Related Files:
  - `src/audio/audio-manager.js` :: AudioContext lifecycle, mute, SFX/BGM; new
  - `tests/audio/audio-manager.test.js` :: mock AudioContext에서 상태 테스트; new

#### Details
- **Signatures & Types**:
  ```javascript
  export function createAudioManager(AudioContextCtor?: typeof AudioContext): {
    unlock(): Promise<void>;
    setMuted(muted: boolean): void;
    isMuted(): boolean;
    play(event: 'lift' | 'dash' | 'score' | 'warning' | 'boss' | 'collision' | 'pause'): void;
    destroy(): void;
  };
  ```
- `unlock`는 첫 click/touch/keyboard gesture에서 AudioContext를 resume한다. AudioContext를 자동 생성해 autoplay 정책을 위반하지 않는다.
- SFX는 oscillator/gain envelope로 짧게 생성하고, BGM은 저음 반복 패턴을 scheduler로 만든다. mute는 SFX와 BGM gain 모두에 적용한다.
- 오디오 API가 없는 테스트 환경이나 브라우저에서는 no-op fallback을 사용하여 게임 진행을 막지 않는다.

## Acceptance Criteria

- [ ] Canvas가 16:9 logical space에 우주선·구조물·틈·WARNING/BOSS 연출을 렌더링한다.
- [ ] Canvas resize 후 좌표 왜곡 없이 선명하게 표시된다.
- [ ] 사용자 gesture 전에는 AudioContext를 재생하지 않고 gesture 후 효과음이 재생된다.
- [ ] mute 상태에서 모든 SFX/BGM이 들리지 않고 다시 켜면 재생 가능하다.

## Validation

- `npm run test -- --run tests/game/renderer.test.js tests/audio/audio-manager.test.js` — 렌더러 계약·오디오 상태 통과
- `npm run build` — renderer/audio 모듈 포함 production build 성공

## Commit Message

```text
feat(game): render neon world and add web audio feedback

Plan: 2026-09-21-void-surfer
Phase: P01-game-core
Task: T04-rendering-audio

- add responsive neon canvas renderer for ship, obstacles, warning, and boss
- add gesture-safe Web Audio effects and mute control
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
