# VOID SURFER

현재 배포 버전은 **0.01-b**입니다. 일반 비행과 보스전이 번갈아 이어지며, 이전 독립 WARNING 규칙은 [보관 문서](./.memory/archive/2026-10-29-warning-0.01v.md)에 남겨 향후 재설계에 사용할 수 있습니다. 버전 자료는 [릴리스 목록](./docs/releases/README.md)에서 확인합니다.

0.01-b는 2026-10-29 Azure에 배포했습니다. [바로 플레이](https://proud-grass-03a132e00.6.azurestaticapps.net) — 설치 없이 게스트로 시작하거나 Microsoft 계정으로 로그인할 수 있습니다.

## Guest, ranking, and administrator test modes

- Visitors can start immediately as `GUEST` using NOVA only. Guest scores appear during the current run and its result screen; no guest best is saved or shown in the hangar/ranking. The old dedicated browser record is removed without touching account sessions/settings. AEGIS/VELOCITY require sign-in and the existing account-best unlock thresholds. Guests can still browse the public ranking.
- The public Pilot Ranking is read-only and exposes display name, score, date, rank, and aircraft. Account score submission still requires signing in.
- The administrator test controls appear only for the signed-in `gh.lee@dexconsulting.net` account. Administrator mode skips leaderboard submission; invincibility suppresses wall and laser collision deaths, while screen boundaries remain fatal and failed WASD challenges still apply the ink/glitch visibility penalty.
- These administrator controls are a client-side testing convenience, not a security feature. A modified browser can bypass score suppression; never use this toggle as server-side access control or as proof that submitted scores are trustworthy.

## Apply the public ranking migration

The migration file [`202609300001_public_leaderboard_read.sql`](./supabase/migrations/202609300001_public_leaderboard_read.sql) adds the safe, paged anonymous ranking RPC. It must be applied to the hosted Supabase project by the project operator, after the earlier leaderboard migrations:

1. Open the project's Supabase Dashboard and go to **SQL Editor**.
2. Copy the full contents of the migration file and run it once.
3. Verify that `get_public_leaderboard(integer, integer)` is available and that an anonymous request can read ranking rows but cannot execute score-write or account-only RPCs.

This repository change does not apply the migration remotely. The SQL assertions in `supabase/tests/leaderboard.sql` require a Supabase test database/CLI and are separate from running the migration in the hosted project.

## 다른 사람에게 공유하기

회사 Azure 배포는 [Azure Static Web Apps 가이드](./docs/azure-deploy.md)를 사용합니다. 기존 Microsoft Entra·Supabase 인증/리더보드를 유지하며, Azure 로그인 콜백 경로와 GitHub Actions의 빌드 시점 공개 설정값을 함께 적용합니다. 아래 Vercel 문서는 기존 대안 배포 절차입니다.

배포된 Vercel 링크를 전달하면 됩니다. 플레이어는 저장소를 clone하거나
`.env`·Supabase 계정을 준비할 필요 없이, 링크를 열고 조직의 Microsoft Entra
계정으로 로그인해 플레이할 수 있습니다. 점수와 리더보드는 Supabase에 공유됩니다.

배포 담당자는 [Entra · Supabase · Vercel 운영 가이드](./docs/entra-vercel-deploy.md)를
한 번만 완료하세요. 이 가이드는 Entra 단일 테넌트 설정, Supabase OAuth 설정,
Vercel 환경 변수, 배포 후 점검까지 포함합니다. Microsoft Graph나 프로필 사진
권한은 이 게임에서 사용하지 않습니다.

네온 우주를 배경으로 하는 브라우저 아케이드 게임입니다. Microsoft 로그인과 Supabase 리더보드를 사용합니다.

## 로컬 실행 및 검증

```bash
npm install
npm run dev
npm run test -- --run
npm run test -- --coverage
npm run build
npm run verify:config
```

로컬 로그인과 리더보드에는 `.env.example`을 `.env`로 복사해 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정해야 합니다. 실제 설정과 배포는 아래 문서를 순서대로 따르세요.

- [Supabase·Microsoft Entra OAuth 설정](./docs/supabase-setup.md)
- [Vercel 배포와 callback 검증](./docs/vercel-deploy.md)
- [Supabase 스키마/RLS/RPC 계약](./docs/supabase-schema.md)

## 게임 진행과 해금

- 클릭/터치로 상승하고, Space를 한 번 눌러 대시합니다. 사용 순간부터 쿨타임은 0.7초이며 기체 왼쪽 위의 지름 16px 흰 충전 링이 차는 동안 다시 사용할 수 없습니다. 완충되면 링이 사라집니다. 길게 눌러도 반복 발동하지 않습니다. 대시 효과 0.6초 동안 보스 투사체에만 무적이며, 일반벽·레이저·화면 경계의 충돌은 유지됩니다. P 또는 Escape로 일시정지하며 한 번에 10점을 잃습니다.
- 기본 기체는 항상 사용 가능하고, 최고 점수 50점에서 AEGIS, 100점에서 VELOCITY가 해금됩니다. 해금은 계정 최고 점수에 연결되어 다른 기기에서도 유지됩니다.
- 스테이지는 CRYSTAL GATES, INDUSTRIAL VOID, SIGNAL MONOLITHS, GRAVITY WELL, ABYSSAL BEAST, SOLAR FORGE 여섯 테마를 무작위 순서로 사용합니다. 보스는 현재 스테이지의 정체성을 유지하고, 클리어 후 포털을 통과하면 다음 스테이지와 그에 맞는 보스가 등장합니다.
- 첫 보스 진입은 20점부터 시작합니다. 이후에는 보스 클리어 → 다음 스테이지 포털 전환 완료 → 그 시점 점수에서 무작위 15~20점 추가 획득 순서로 다음 보스가 나타납니다. 클리어 보너스 10점은 새 대기 구간에 포함하지 않습니다. 포털 전환 중에는 다음 보스 판정도 시작하지 않습니다. 일반 → 보스 → 일반 → 보스 순서이며 독립 WARNING은 비활성화했습니다. 첫·두 번째 보스 클리어 해금은 실제 보스 클리어 횟수로 판단합니다.
- 피격 영역은 기체 중심의 16×16 정사각형이며, 기체 그림·날개 크기와 별개입니다. 특수벽은 별도의 공통 56×36 성공 영역이 벽 앞 타이밍 구간에 닿은 상태에서 Space를 눌러 통과합니다. 복합벽의 세로 구멍 통과는 작은 피격 영역으로 검사합니다.
- 게임 캔버스는 창 전체를 채우되, 기체·보스까지 포함한 전체 그리기 버퍼는 최대 FHD(1920×1080) 안에 맞춥니다. DPR은 최대2 범위에서 상한을 적용하며 초광폭·세로 비율도 보존합니다. 모니터 주사율 기반 RAF를 유지하고60FPS 제한은 넣지 않았습니다. 플레이 공간은 기존960×540 논리 좌표이며 기체 크기·피격 판정·보이는 영역은 바뀌지 않습니다.
- FHD 버퍼를 기준으로 배경은 가로·세로50%, 벽75%, 투사체50%, 레이저35%의 재사용 레이어에서 그린 뒤 합성합니다. 기체·보스·얇은 판정 안내와 경로·안전 경계는 FHD 주 버퍼에서 그립니다. DOM UI와 충돌 판정·입력·물리 갱신 빈도는 유지합니다. 동일 조건 비교와 한계는 `.memory/validation/2026-10-29-fullscreen-fhd-music-start/render-report.md`에 기록합니다.
- 보스전 배경은 진입 시점의 이동 속도를 저장해 일정하게 오른쪽에서 왼쪽으로 흐릅니다. 벽의 저속·고속·변속과 무관하며 배경의 상하 흔들림도 제거했습니다. 보스 클리어 후 풍경이 교체될 때까지 속도를 유지하고, 일시정지·WASD 동안에는 배경 이동도 멈춥니다.
- 두 번째 보스 클리어 후에는 일반 구간에서도 비행 시간 3초마다 70% 확률로 줄 레이저를 시도합니다. 1줄 70%·2줄 30%이며 안전한 위치가 없으면 줄이거나 건너뛰고 몰아서 발사하지 않습니다. 예고·발사·잔광 동안 새 벽 생성을 잠시 멈추며, 기존 벽과 레이저가 모두 끝난 뒤 보스 진입을 시작합니다.
- 보스 진입 경고음은 낮고 넓은 기계식 사이렌이 0.7초씩 세 번 울립니다. 사이 간격은 0.15초, 전체 길이는 2.4초이며 보스 알림과 배경음 낮추기도 같은 길이로 동기화됩니다.
- 보스전에서는 비행 시간 10초마다 레이저 1발이 충전됩니다. 하단 게이지가 완충되면 빛나며, 최대 1발만 저장합니다. Shift/Ctrl 또는 모바일 전용 발사 버튼으로 발사하고 NOVA·VELOCITY는 3발, AEGIS는 1발 명중으로 클리어합니다. HP는 모든 기체에서 3칸으로 시작하며 AEGIS 레이저는 3칸을 한 번에 깎습니다. WASD 성공은 충전·발사·피해와 별개이며, 일시정지와 WASD 중에는 충전도 멈춥니다.
- 발사를 누르면 기체가 오른쪽을 똑바로 보고 0.7초 멈춥니다. 0.5초 충전한 뒤 오른쪽으로 직진하는 레이저를 0.2초 동안 쏩니다. 이 동안 보스 몸체 전체와 실제로 겹쳤을 때만 한 번 피해를 주며, 빗나가도 탄환은 환불되지 않습니다. 벽과 적 공격은 계속 움직이고 별도 무적은 생기지 않으므로 발사할 틈을 골라야 합니다. 누르고 있어도 자동 재발사하지 않습니다.
- WASD는 키보드 또는 모바일 터치 버튼으로 첫 보스 5초, 이후 보스 2.8초 안에 순서대로 입력합니다. 첫 보스 4키, 두 번째 4~5키, 세 번째 4~6키, 네 번째 5~7키, 다섯 번째부터 6~8키입니다. 실패하면 부분 먹물 또는 움직이는 센서 글리치가 8초간 적용되고 마지막 1.2초 동안 걷힙니다. 성공·실패 후 다음 공격 블록으로 이어지며 보스 HP에는 영향을 주지 않습니다.
- 보스전은 벽 웨이브·벽 없는 고유 탄막·전역 레이저·포효/WASD 블록을 한 주기마다 한 번씩 무작위로 섞습니다. 첫 보스는 전역 레이저를 제외합니다. 어느 블록이든 첫 순서가 될 수 있고, 다음 주기는 직전 마지막 블록으로 시작하지 않습니다. 벽과 탄환을 끝까지 처리한 뒤 다음 블록을 시작하며, 보스 HP가 남아 있으면 다음 주기를 반복합니다. 포효 중에도 비행은 계속되고 실제 WASD 시작 시에만 일반 게임 시간이 정지합니다.
- 벽 웨이브 도중 발사하는 투사체는 한 번에 1발로 제한하며, 특수벽 존재나 대시 타이밍을 이유로 발사를 막지 않습니다. 벽 없는 탄막 블록은 스테이지별 고유 탄막을 무작위로 1~3회 연속 사용합니다. 이전 탄환이 모두 사라지면 다음 궤도를 1.1초 예고한 뒤 다시 발사합니다. 발사 전 궤도는 움직이는 보스 발사구를 따라가며 각 탄환은 자기 발사 순간의 궤도로 확정되어, 발사 뒤에는 유도되지 않습니다.
- 벽 없는 구간의 고유 탄막은 매 발사마다 3~6발 중 같은 확률로 정합니다. Crystal 부채꼴 파편, Industrial 상·하단 교대, Signal 순차 레인, Gravity 곡선 구체, Abyss 교대 곡사, Solar 열탄의 형태는 유지하며 선택한 발수에 맞춰 배치합니다. 연속 탄막 횟수는 기존 1~3회이며, 벽 웨이브 중에는 여전히 한 번에 1발입니다. 탄속은 월드 속도와 별개로 220~360px/s이며, 비행이나 대시 무적으로 피할 수 있습니다. Space 반사는 없습니다. 실제 접촉은 치명적이고 빗나간 탄환은 화면 밖까지 이동합니다. 전역 레이저와 다중 탄막은 모두 벽 없는 상태에서 진행합니다.
- 보스전 중 벽 통과와 챌린지에는 점수가 붙지 않고, 클리어 시 10점을 받습니다. 이 10점은 속도용 진행 점수에도 반영됩니다. 세 기체 모두 진행 점수 10점마다 실제 일반 속도가 정확히 10px/s씩 늘고, 220점에서 증가를 멈춥니다. NOVA·AEGIS는 240→460px/s, VELOCITY는 480→700px/s이며 VELOCITY의 증가분까지 두 배가 되지는 않습니다. 보스전에서는 기존 저속·고속·변속 배율을 별도로 적용하므로 일반 최고속도를 넘을 수 있습니다. 실제 점수는 계속 오르며 VELOCITY 최종 점수 배율은 속도 상한 기준에 쓰지 않습니다. 모든 가속·감속은 2초에 걸쳐 완만하게 전환되며, 보스 클리어 후에도 해당 기체의 상한을 적용한 일반 속도로 돌아갑니다. 일시정지 감점으로 속도가 내려가지는 않습니다.
- 첫 보스 클리어 후부터 일반벽의 움직이는 구멍(50% 확률)이 해금됩니다. 줄 형태 레이저는 첫 보스부터 발사 가능한 벽 전투 시간 2초마다 90% 확률로 시도합니다. 한 줄 70% / 두 줄 30%이며 두 줄 모두 먼저 위치를 예고합니다. 안전한 두 위치가 없으면 한 줄로 줄이고, 안전한 높이가 없거나 임박한 특수벽 대응과 충돌하면 건너뜁니다. 놓친 발사는 쌓아 두지 않습니다. 레이저의 예고·발사·잔광 중에는 새 벽 생성을 멈춥니다. 이 레이저 안전 검사는 투사체 발사 제한으로 사용하지 않습니다.
- 단일·두 줄 레이저는 위·아래 각 15%를 제외한 영역에 피해 부분 전체가 들어가도록 생성합니다. 일반벽이 이동하는 중에도 0.7초 예고 후 발사하며, 움직이는 구멍의 전체 이동 범위까지 피해서 높이를 고릅니다. 안전한 안쪽 위치가 없으면 해당 공격을 건너뜁니다. 두 번째 보스부터는 매 주기에 전역 레이저 블록을 반드시 포함하고, 1~3발 중 같은 확률로 고른 수만큼 연속 발사합니다. 매 발마다 직전과 다른 안전한 1/4 구역을 최소 2초간 예고하며, 이동에 더 긴 시간이 필요하면 예고를 늘립니다. 이전 발사의 피해와 잔광이 모두 끝나야 다음 예고를 시작하며, 전체 연속 공격 동안 벽과 다른 공격은 등장하지 않습니다. 두 레이저 모두 오른쪽에서 왼쪽으로 0.4초에 걸쳐 뻗어나가며 총 1초간 활성화되고, 이후 0.15초 동안 피해 없이 잔광만 사라집니다.
- 보스 체력은 `BOSS HP 3 / 3`으로 표시됩니다. 기존 벽이 왼쪽 화면 밖으로 모두 나간 뒤 0.4초 동안 배경을 어둡게 합니다. 기체와 꼬리는 계속 보이고 조작도 가능합니다. 2.4초 보스 알림/사이렌 뒤 보스곡과 함께 보스가 오른쪽 밖에서 1초에 걸쳐 들어오며 배경이 서서히 밝아집니다. 이후 첫 무작위 공격 블록이 시작됩니다.
- 보스는 화면 높이 20~80% 사이를 6초 주기로 왕복합니다. 일시정지와 실제 WASD 동안에는 이동도 멈춥니다. 보스마다 관절·날개·꼬리의 대기/충전/반동/포효/피격 동작과 고유 포효음을 사용하며, 발사구와 포효 효과도 같은 보스 위치를 기준으로 합니다.
- 레이저 충전은 하단 중앙의 지름 80 논리 픽셀 원자로형 게이지로 표시합니다. 전역 레이저는 청록색 안전 경계/화살표와 붉은 사선 위험 구역으로 구분하며 별도 안전/위험 문장을 띄우지 않습니다. 화면에는 점수·발사 UI·등장 알림·BOSS HP·WASD 키/시간·필수 조작과 `>> 가속`/`<< 감속`을 남기고 중복 보스 패턴/적 레이저 안내 문구는 제거했습니다.
- 초반 특수벽의 판정 안내 폭은 플레이어를 지나간 순간에 고정되어 화면 밖까지 유지됩니다. 앞으로 오는 특수벽은 현재 속도에 맞는 폭을 표시하고, 움직이는 구멍 자체는 계속 움직입니다.
- 첫 보스 클리어 후 기존 특수벽 선택의 절반이 혼합 벽으로 바뀝니다. 일반벽의 구멍 안에 얇은 특수 장벽이 있으므로 구멍에 맞춰 비행하면서 대시해야 합니다. 대시 중에도 위아래 일반벽은 충돌합니다.
- 모든 대시에는 짧은 흰색·청록색 충격파 링이 나타나고, 평소의 곡선 비행 궤적은 유지됩니다.
- 특수벽·복합벽의 필수 대시 대응 시점은 이후 가속까지 고려해 최소 1.2초 이상 떨어지도록 생성합니다. 일반벽은 기존 생성 간격을 유지하며, 특수벽 최소 개수를 채워야 할 때는 해당 벽의 생성을 기다려 쿨타임 때문에 불가능한 배치를 막습니다.
- 포탈은 세로 중앙에 고정되어 기체 높이를 따라가지 않으며, 내부 통과 영역은 화면 높이 전체를 덮습니다. 기존 오른쪽→왼쪽 접근과 목적지 장식·백색 전환·새 벽 생성 재개 흐름은 유지됩니다.
- 지정 관리자 계정의 설정에는 무적과 별도로 `플레이어 히트박스 표시` 스위치가 있습니다. 관리자 모드에서만 실제 충돌 사각형을 그리며, 일반 플레이에는 자동 표시되지 않습니다. 표시 자체는 충돌 판정을 바꾸지 않습니다.
- 보스 클리어 후 새 벽 생성을 즉시 멈추고, 기존 벽은 원래 디자인을 유지한 채 화면 밖으로 나갈 때까지 이동합니다. 이후 0.45초 준비 뒤 다음 스테이지의 장식과 풍경을 담은 포털이 실제 벽 속도를 따라 960px 접근합니다. 플레이어를 통과하면 0.2초 동안 하얗게 밝아지고, 0.1초의 불투명한 흰 화면 아래에서 스테이지를 교체한 뒤 0.6초 동안 새 풍경을 드러냅니다. 전환 완료 전에는 새 벽·보스가 등장하지 않으며, 완료 후 벽을 최대 1개부터 재개해 누적 스폰이 몰리지 않습니다.
- 여섯 지역마다 서로 다른 일반곡과 보스곡이 반복 재생됩니다. 출격 시 메뉴곡·임시 합성 음악을 끊고 선택 스테이지의 게임곡을 먼저 준비합니다. 준비 중에는 기체·벽·점수·보스 시간이 멈추며, 음악이 준비되면 함께 출격합니다. 최대10초가 지나면 무음으로 자동 출격하고 같은 곡이 늦게 준비되면 재생합니다. 재시작도 같은 흐름이며 준비 취소·계정 변경 후 옛 결과는 무시합니다. 로딩에는 일시정지 감점이 없습니다. 기존 지역/보스 곡 전환과 일시정지 재생 위치·전체 음소거는 유지합니다.
- 메인 화면의 첫 클릭·터치 완료·일반 키 입력에서 소리를 활성화하므로, 게임에 들어갔다 나올 필요가 없습니다. 브라우저 정책에 따라 첫 사용자 동작 전에는 무음일 수 있습니다. 메뉴에서는 메뉴곡만 준비하며, 음소거·계정 상태 갱신 때 같은 기체의 움직이는 DOM을 유지해 부유 모션이 처음으로 튀지 않게 합니다. 기체와 배기는 같은 3D 변환 래퍼에서 함께 움직입니다.
- 리더보드 연결에 실패해도 현재 점수와 재시작/메뉴 버튼은 사용할 수 있습니다. 기체 최고 점수 조회가 실패하면 기본 기체로 안전하게 진행합니다.

오디오를 다시 생성하려면 `node scripts/build-game-audio.mjs`를 실행합니다. 승인된 시안의 선율·음색을 확인한 뒤 반복 구간의 잔향을 앞부분에 이어 붙여 `public/assets/audio/`의 12곡과 진입 사이렌을 만듭니다. 비교 시안과 재생 페이지는 `.memory/previews/2026-10-27-stage-bgm/`, `2026-10-27-stage-boss-bgm/`, `2026-10-27-boss-entry-siren/`에 보관합니다.

승인된 전투 자산을 다시 패키징하려면 `node scripts/build-combat-assets.mjs`를 실행합니다. 승인 시안 폴더에서 보스 교체 이미지 4종, 다음 스테이지별 포털 장식 6종, 고유 포효 WAV 6종을 복사하고, 관절 리그·포효 합성 모듈과 자산 해시 목록을 생성합니다. 원래 보스 이미지는 보존하며 Industrial과 Gravity는 기존 이미지를 사용합니다. 패키징에는 `.memory/previews/`의 승인 원본이 필요하고, 생성된 프로덕션 파일로 실행하는 게임은 시안 폴더에 의존하지 않습니다.

배포 URL을 받은 플레이어는 저장소 clone, Docker, Supabase 설정이 필요 없습니다. Entra 조직 계정으로 로그인하면 됩니다. Supabase migration, Entra redirect URI, Vercel 변수는 위 운영 가이드에서 배포 담당자만 설정합니다.

---

# 🚀 Project Memory Starter Kit

> **"AI에게 대화창으로 매번 길게 설명하지 마세요. 파일 기반 메모리로 세션을 영구 유지하세요."**

이 스타터킷은 프로젝트에 복사해 넣는 것만으로 **3가지 전문 AI 스킬(`/grill-me`, `/memory-plan`, `/memory-execute`)**과 **파일 기반 메모리 구조**를 즉시 활성화해 주는 경량 패키지입니다.

---

## ⚡ 1분 설치법

1. 이 `project-memory-starter` 폴더 안에 있는 아래 2개 폴더를 **내 프로젝트 루트**에 복사합니다:
   - **`.agents/`**: 3대 AI 스킬 정의 폴더
   - **`.memory/`**: 메모리 파일들이 저장될 폴더

*(Cursor, Antigravity 등 스킬 지원 도구에서 즉시 슬래시 커맨드로 인식됩니다.)*

---

## 🔄 3단계 워크플로우

```text
  [1단계: 요구사항 인터뷰]        [2단계: 계획 및 청사진 생성]          [3단계: 순차 실행 및 포인터 전진]
    /grill-me <기능명>    ───→    /memory-plan <기능명>      ───→    /memory-execute (또는 "current 보고 진행해줘")
  (decisions/ 확정)              (plans/ & Task 청사진 생성)        (구현 ➔ 테스트 ➔ 커밋 ➔ 포인터 이동)
```

### 1단계: `/grill-me <기능명>`
- AI가 한 번에 딱 1개씩 추천 선택지와 함께 질문을 던집니다.
- 답변을 고르면 애매한 점이 모두 해결될 때까지 인터뷰를 진행하고, 확정된 결정을 `.memory/decisions/{기능명}.md`에 저장합니다.

### 2단계: `/memory-plan <기능명>`
- **(철칙: 이 단계에서는 코드를 전혀 작성하지 않습니다.)**
- 앞서 확정된 결정을 바탕으로 전체 계획(`plans/`), 마일스톤(`phases/`), 그리고 각 Task의 상세 스펙/테스트 명령어가 적힌 **Task 청사진(`T01...md`)**을 일괄 생성합니다.
- `.memory/current.md` 포인터를 첫 번째 작업(T01)으로 자동 초기화합니다.

### 3단계: `/memory-execute` 또는 `"current 보고 이어서 해줘"`
- `.memory/current.md`가 가리키는 Task 청사진만 읽고 정답 코드를 구현합니다.
- 테스트 커맨드를 실행하여 통과하면 자동으로 커밋하고, 상위 `phase.md` 진행률을 올린 뒤, **`current.md` 포인터를 다음 Task(T02)로 자동 전진**시킵니다.
- **퇴근 후 다음 날 새 채팅창을 열고 `"current 보고 이어서 해줘"` 한 줄만 치면 1초 만에 다음 작업으로 직행합니다.**

---

## 📂 폴더 구조 및 역할

```text
.memory/
├── current.md                          ← [포인터] 지금 어디를 작업 중인지 가리키는 20줄 파일
├── decisions/
│   └── YYYY-MM-DD-{기능명}.md          ← [결정] 인터뷰로 확정된 기술 결정 박제
├── plans/
│   └── YYYY-MM-DD-{기능명}.md          ← [계획] 전체 목표 및 Phase 마일스톤 목록
└── phases/
    └── YYYY-MM-DD-{기능명}/            ← [청사진] 날짜별 계획 하위 폴더
        └── P01-{마일스톤}/
            ├── phase.md                ← 진행률 대시보드
            ├── T01-{작업명}.md         ← 파일, 심볼, 모델 스키마, 테스트 커맨드
            └── T02-{작업명}.md

.agents/skills/
├── grill-me/SKILL.md                   ← 인터뷰 스킬
├── memory-plan/SKILL.md                ← 계층 계획 수립 스킬
└── memory-execute/SKILL.md             ← 순차 실행 및 포인터 전진 스킬
```

---

## 📁 예시 살펴보기

`examples/` 폴더에 세미나에서 설명한 **'쇼핑몰 상품 API 구축'** 실물 파일들이 들어있습니다. 어떻게 계획되고 작성되는지 참고해 보세요!


## 토큰 사용량 조회
프로젝트 루트에 압축 해제 후:
# CLI 실행
& .\.codeburn\codeburn.ps1 sessions -p today --provider copilot --no-pager
# VS Code MCP 등록
& .\.codeburn\install.ps1


## 시각화 스킬
/visualize 내용입력
