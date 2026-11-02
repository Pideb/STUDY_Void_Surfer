# 모바일 LAN 출격 준비 정지

## 원인과 수정

실제 `http://172.30.1.24:5174` 주소를 열고844×390 모바일 터치 환경에서 재현했습니다. 이 origin은 secure context가 아니며 `crypto.randomUUID`가 undefined였습니다. 비공개 플레이 기록을 시작하는 동기 코드에서 예외가 발생해, 준비 타이머가 이미 해제된 뒤에도 UI가 preparing으로 남았습니다. 음악 준비 Promise의 catch가 출격 중 예외까지 받아 화면에 오류가 나타나지 않았습니다.

`randomUUID`가 없는 경우 `getRandomValues`의 암호학적 난수16바이트로 UUIDv4를 생성합니다. nonce에 Math.random·시각 등 약한 대체값을 쓰지 않습니다. 안전한 난수 자체가 없는 환경에서는 원격 기록을 생략하고 로컬 생존시간 시계는 유지합니다. 선택 기능인 기록 시작 또는 음악 시작 예외가 게임 전환을 막지 않도록 출격 경계를 분리했습니다.

공식 API 조건: [randomUUID는 secure context에서 제공](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID), [getRandomValues는 insecure context에서도 사용 가능](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues).

## 실제 브라우저 결과

| 조건 | 환경 | 관찰 |
| --- | --- | --- |
| 수정 전 LAN HTTP | secure=false, randomUUID 없음 | 출격12초 후에도 preparing, HUD 없음 |
| 수정 후 같은 LAN HTTP | 같은 기능 조건, 실제 터치 | 약0.58초 후 playing/HUD, RAF 진행 |
| LAN HTTP에서 게임 WAV 요청 차단 | 실제 Network 차단, 기존 준비 제한 유지 | 약10.43초 후 무음 playing/HUD, RAF 진행 |
| PC localhost | secure=true, randomUUID 제공 | 약0.55초 후 playing/HUD, RAF 진행 |

브라우저는 PC의 Headless Edge 모바일 에뮬레이션입니다. 실제 LAN origin을 사용했으며 localhost에 크기만 바꾼 검사가 아닙니다. 실제 휴대폰 하드웨어를 조작한 것은 아니므로 사용자 기기에서 새로고침 후 확인이 필요합니다. 각 사례의 Runtime exception은0입니다. 원래 예외는 Promise catch에 흡수됐으므로 수정 전 exception0을 정상 출격의 증거로 해석하지 않습니다.

근거: [수정 전](before.json), [수정 후](after.json), [음원 차단](after-no-audio.json), [localhost](after-localhost.json), [재현 스크립트](verify-lan.mjs), [플레이 화면](after.png).

## 회귀 검사

- 전체82파일 **1,370개 테스트 통과**.
- build·verify:config 통과.
- native UUID와 CSPRNG 대체·v4/variant·약한 nonce 금지, 안전한 난수 부재 때 시계/회전 제외 유지, 진단 실패·기록 시작 예외·음악 시작 예외, 기존 준비 취소/10초 제한/재시작 검사.
- 게임 규칙·점수·운영 버전·보호 릴리스 스냅샷·DB는 변경하지 않았습니다. 커밋만 수행하며 push·배포는 하지 않습니다.
