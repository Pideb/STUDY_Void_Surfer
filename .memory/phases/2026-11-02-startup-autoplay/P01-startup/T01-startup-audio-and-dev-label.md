# T01 startup audio and dev label

## Status: done

## Implementation

- `src/audio/audio-manager.js`: `tryAutoplay():boolean`, menu에서만 1회 unlockAudio 시도·rejection 처리. 반환 false가 첫 gesture unlock을 차단하지 않음. no-op에도 지원.
- `src/ui/app-controller.js`: mount 후 load once listener 또는 readyState complete이면 시도. gesture Promise와 분리, destroy에서 제거. 회전 중에는 시작하지 않음.
- `docs/management/releases.json`: `developmentVersion:string='0.2'` 추가. currentVersion·배포증거 유지.
- `src/lib/release-version.js`: `getGameVersion(registry,{development:boolean}):string`, dev 원본과 운영 표시 구분.
- `src/ui/screens.js`: import.meta.env.DEV인 경우 v0.2 · 개발, production은 currentVersion 표시.
- `scripts/release-docs.mjs`: 실제 배포 prepare 시 developmentVersion도 그 버전으로 동기화. 지금 명령을 실행하지 않음.
- tests/audio·ui·lib: load허용/차단/미해결 resume·첫 입력·destroy/음소거·출격 중 메뉴 재생 부활 방지와 버전 분기 검증.
- `.memory/validation/2026-11-02-startup-autoplay/`: 사용자가 제안한 audio id/defer/load 예제, 실제 게임 브라우저 검사와 결과. HTMLAudioElement 예제와 Web Audio 정책을 구분. 기본 정책과 테스트용 허용 정책을 명시.

## Validation

- `npm test -- --run` 전체 검사.
- `npm run build`, `npm run verify:config`.
- 브라우저 literal sample과 실제 app의 policy 허용/차단, 첫 입력 복구, dev v0.2 · 개발 및 production v0.1b 표시 확인.
- 오디오 청취·정책 제한, 운영 currentVersion 유지, push·배포 없음 기록.

## Results

- 전체81파일1361개 통과, build·verify:config 통과.
- 실제 새 Edge 기본 정책에서 literal HTMLAudio 예제는 NotAllowedError. 게임은 suspended 상태에서 첫 실제 클릭 후 running·메뉴 BGM1회. 테스트용 명시 허용 정책에서는 첫 입력 전부터 BGM1회.
- 로컬 v0.2 · 개발 / production preview v0.1b 확인. 운영 currentVersion과 보호 스냅샷 보존. [근거](../../../validation/2026-11-02-startup-autoplay/report.md).
- 청취·실제 배포·사용자 브라우저별 자동 재생 보장은 검증하지 않았음. 별도 HTMLAudio 중복 재생 없이 기존 Web Audio 경로만 사용.
- commit: see Git log (Plan/Task header)

## Commit

```text
fix(audio): attempt startup playback and label the development build

Plan: 2026-11-02-startup-autoplay
Phase: P01-startup
Task: T01-startup-audio-and-dev-label
```
