# T01 compatible identities and departure

## Status: done

## Implementation

- `src/lib/random-uuid.js`: `createRandomUUID(cryptoRef=globalThis.crypto):string`. native 우선, CSPRNG16바이트 UUIDv4 대체. 둘 다 불가하면 CRYPTO_UNAVAILABLE. 약한 난수 금지.
- `src/services/play-session-tracker.js`: 기본 randomUUID dependency 교체. begin 실패 때 기록 미전송·생존시간 시계 유지. durationMs와 nonce는 유효한 start가 있을 때만 outbox로 보냄. 진단 callback 실패도 무시하고 게임에 전파하지 않음.
- `src/ui/app-controller.js`: `finishDeparture`의 선택 통계 begin 및 `activatePreparedStart`의 음악 시작 실패를 게임 전환과 분리. 기존 준비10초 타임아웃·취소·회전·계정 소유권 규칙 유지.
- 회귀 시험: helper v4/variant/암호학적 난수만 사용, 난수 부재와 저장 실패, 실제 engine/controller 출격 및 사망시간·빠른 재시작, 오디오 실패·타임아웃.
- `.memory/validation/2026-11-02-mobile-lan-departure/`: 실제 LAN origin과 PC localhost를 직접 열고 터치 입력으로 시작해 준비창 탈출·playing/HUD 확인. before/after 환경·결과·미검증 실기기 한계 기록.

## Validation

- 관련 helper/tracker/lifecycle/controller/audio 준비 테스트.
- `npm test -- --run` / `npm run build` / `npm run verify:config`.
- 실제 LAN HTTP 브라우저 before/after 재현. 기존 운영 snapshot·버전·DB·배포 상태 보존.

## Results

- 전체82파일1370 tests, build/config 통과.
- 실제 LAN HTTP before12초 준비 정지 / after0.58초 playing. 음원 요청 차단 시10.43초 무음 playing. localhost0.55초 playing. RAF와 HUD 확인, 예외0.
- CSPRNG UUIDv4 대체 및 선택 기록 실패가 출격을 막지 않음. 안전 난수 미지원 때 기록 미전송·사망시간 시계 유지 검증.
- [보고서](../../../validation/2026-11-02-mobile-lan-departure/report.md). 실물 휴대폰 하드웨어·실제 로그인 검증은 별도. push/deployment 없음.
- commit: see Git log (Task header)

## Commit

```text
fix(game): allow mobile LAN departure without secure-context UUID APIs

Plan: 2026-11-02-mobile-lan-departure
Phase: P01-departure
Task: T01-compatible-identities-and-departure
```
