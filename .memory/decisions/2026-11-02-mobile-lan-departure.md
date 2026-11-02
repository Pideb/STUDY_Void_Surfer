# 모바일 LAN 출격 정지 수정

- 실제 LAN HTTP·844×390 터치 환경에서 재현: isSecureContext=false, crypto.randomUUID=undefined, getRandomValues=function. 출격12초 후에도 preparing 화면 유지, HUD 없음.
- 기록 ID와 nonce 생성이 출격의 동기 경로에서 예외를 발생시켰고 음악 준비 Promise의 catch가 이를 오디오 오류로 취급하여 전환이 중단됐다.
- native randomUUID가 없으면 crypto.getRandomValues의16바이트로 UUIDv4를 생성한다. Math.random 등 약한 nonce 대체는 금지한다.
- 안전한 난수 자체가 없으면 해당 run의 원격 통계만 생략하고 로컬 생존시간 시계와 게임 진행은 유지한다. 선택 기능인 기록 시작·음악 시작 예외는 게임 출격을 막지 않는다.
- 점수·밸런스·권한·운영 배포 버전은 변경하지 않는다. 실제 LAN HTTP와 localhost 환경, 음원 준비 실패/타임아웃을 구분해 확인하고 커밋한다. 원격 DB 적용·push·배포 없음.
