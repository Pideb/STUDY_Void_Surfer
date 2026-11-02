# 시작 오디오·로컬 개발 버전

- 사용자 요청: 페이지 load에서 play하는 제시 예제를 실제로 시험하고 가능한 경우 링크 진입 즉시 메뉴 BGM 시작. 직전 v0.2 표시 확인도 함께 처리.
- 실제 BGM은 Web Audio와 기존 audio-manager가 관리한다. 별도 HTMLAudioElement를 게임에 겹쳐 재생하지 않고 기존 경로에서 load 시 한 번 재생을 시도한다. literal audio/defer 예제는 로컬 검증 페이지에서 별도로 시험한다.
- 브라우저 정책을 우회하지 않는다. 허용된 환경은 즉시 재생하고 차단된 환경은 첫 실제 입력으로 재시도한다. 차단된 자동 resume Promise가 미해결 상태여도 첫 입력을 막으면 안 된다. 음소거·회전 중단·출격 시 메뉴 음악 차단·destroy와 늦은 완료 경계를 유지한다.
- 로컬 dev에서는 registry의 developmentVersion=0.2로 v0.2 · 개발 표시. 운영 currentVersion과 배포 증거는 변경하지 않고 production 표시는 실제 준비된 릴리스 기준을 유지한다.
- 커밋까지 진행하되 push·배포·release:prepare는 실행하지 않는다. 자동 재생은 실제 브라우저 정책 기본/명시 허용 조건을 구분해 기록하며 청취 확인을 가장하지 않는다.
