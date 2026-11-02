# 시작 오디오 자동 재생 실험

## 결과

제안된 `audio id → defer script → window.onload → play()` 구조를 실제 메뉴 WAV로 시험했습니다. 새 프로필 Edge156의 기본 정책에서는 **NotAllowedError**로 차단됐습니다. 테스트용 자동 재생 허용 정책에서는 클릭 없이 재생됐습니다. `defer`는 DOM 로딩 순서를 해결하며 자동 재생 권한을 부여하지 않습니다. [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay).

| 환경 | 제안된 HTMLAudio 예제 | 실제 게임 진입 | 첫 실제 클릭 뒤 |
| --- | --- | --- | --- |
| 새 Edge 기본 정책 | NotAllowedError | AudioContext suspended, BGM 시작0회 | running, 메뉴 BGM1회 |
| 테스트용 명시 허용 | playing | running, 클릭 전 BGM1회 | 중복 없이1회 유지 |
| production 로컬 preview·기본 정책 | NotAllowedError | suspended | 클릭 후 메뉴 BGM1회 |

허용 환경은 검증용 브라우저만 `--autoplay-policy=no-user-gesture-required`로 실행했습니다. 이 플래그를 게임·배포·사용자 브라우저에 적용하지 않았으며 일반 방문자에게 무조건 자동 재생이 된다는 의미가 아닙니다. 실제 음향 청취 검증은 하지 않았고 context 상태·BufferSource 시작·메뉴 유지·unhandled rejection0을 검사했습니다.

## 구현

- 게임에 별도 HTMLAudioElement를 추가하지 않고 기존 audio-manager에 `tryAutoplay()`를 연결했습니다. 페이지 load 후 메뉴·음소거 해제·회전 비차단 상태에서만 한 번 시도합니다.
- 자동 `resume()`가 차단되어 미해결 상태로 남아도 첫 사용자 입력의 `unlock()`을 기다리게 하지 않습니다. 거부는 처리하며 음소거·일시정지·destroy·출격 준비의 최신 음악 선택을 유지합니다.
- 로컬 dev는 `developmentVersion: "0.2"`를 읽어 **v0.2 · 개발**을 표시합니다. 실제 `currentVersion: "0.01-b"`는 보존했고 production 로컬 preview에는 **v0.1b**가 표시됐습니다. 실제 릴리스 준비 시 두 버전을 동기화합니다.
- 운영 Supabase, 배포 성공 기록, 보호 스냅샷은 변경하지 않았습니다. push·배포·release:prepare 미실행입니다.

## 검증 근거

- 전체81파일 **1,361개 테스트 통과**, build·verify:config 통과.
- [기본 정책](default-policy.json), [명시 허용](explicit-allow.json), [production preview](production-default.json).
- [제안된 HTML 예제](literal-audio.html), [defer script](literal-audio.js), [재현 브라우저 스크립트](verify-autoplay.mjs).
- 사용자 브라우저의 자동 재생 권한·기존 사이트 사용 이력·모바일 정책에 따라 결과가 달라질 수 있습니다. 로컬 검토 후 배포 여부는 사용자가 결정합니다.
