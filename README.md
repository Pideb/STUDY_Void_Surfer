# VOID SURFER

## Guest, ranking, and administrator test modes

- Visitors can start immediately as `GUEST`. Guest best scores are stored only in that browser's local storage, are not submitted to the shared leaderboard, and do not transfer to an account after sign-in. Guests can use every aircraft.
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

- 클릭/터치로 상승하고, Space를 한 번 눌러 대시합니다. 사용 순간부터 쿨타임은 1초이며 흰 충전 링이 차는 동안 다시 사용할 수 없습니다. 완충되면 링이 사라집니다. 길게 눌러도 반복 발동하지 않습니다. 대시 효과 0.6초 동안 보스 투사체에만 무적이며, 일반벽·레이저·화면 경계의 충돌은 유지됩니다. P 또는 Escape로 일시정지하며 한 번에 10점을 잃습니다.
- 기본 기체는 항상 사용 가능하고, 최고 점수 50점에서 AEGIS, 100점에서 VELOCITY가 해금됩니다. 해금은 계정 최고 점수에 연결되어 다른 기기에서도 유지됩니다.
- 스테이지는 CRYSTAL GATES, INDUSTRIAL VOID, SIGNAL MONOLITHS, GRAVITY WELL, ABYSSAL BEAST, SOLAR FORGE 여섯 테마를 무작위 순서로 사용합니다. 보스는 현재 스테이지의 정체성을 유지하고, 클리어 후 포털을 통과하면 다음 스테이지와 그에 맞는 보스가 등장합니다.
- WARNING은 20점부터 시작해 구간을 끝낼 때마다 완료 점수에서 5~8점 뒤 다시 나타나며, 일반 WARNING과 BOSS가 한 번씩 번갈아 등장합니다.
- 보스전에서는 비행 시간 10초마다 레이저 1발이 충전됩니다. 하단 게이지가 완충되면 빛나며, 최대 1발만 저장합니다. Shift/Ctrl 또는 모바일 전용 발사 버튼으로 발사하고 보스에게 3발을 맞히면 클리어합니다. WASD 성공은 충전·발사·피해와 별개이며, 일시정지와 WASD 중에는 충전도 멈춥니다.
- 발사를 누르면 기체만 0.3초 멈춥니다. 보스를 향해 정렬해 0.2초 충전한 뒤 반드시 명중하는 레이저를 쏘고 0.1초 후 조작이 돌아옵니다. 벽과 적 공격은 계속 움직이고 별도 무적은 생기지 않으므로 발사할 틈을 골라야 합니다. 누르고 있어도 자동 재발사하지 않습니다.
- WASD는 키보드 또는 모바일 터치 버튼으로 첫 보스 5초, 이후 보스 2.8초 안에 순서대로 입력합니다. 첫 보스는 3~4키이며 이후 최대 8키까지 늘어납니다. 실패하면 부분 먹물 또는 움직이는 센서 글리치가 5초간 적용되고 마지막 1.2초 동안 걷힙니다. 성공·실패 후 다음 공격 주기로 이어지며 보스 HP에는 영향을 주지 않습니다.
- 벽 웨이브 도중 발사하는 투사체는 한 번에 1발로 제한하며, 특수벽 존재나 대시 타이밍을 이유로 발사를 막지 않습니다. 벽이 화면 밖으로 모두 지나간 뒤에는 스테이지별 고유 탄막을 무작위로 1~3회 연속 사용합니다. 이전 탄환이 모두 사라지면 다음 궤도를 1.1초 예고한 뒤 다시 발사합니다. 이후 조건에 따른 전역 레이저 → 0.8초 포효 → WASD로 이어집니다. 포효 중에도 비행은 계속되고 실제 WASD 시작 시에만 일반 게임 시간이 정지합니다.
- 벽 없는 구간의 고유 탄막은 Crystal 부채꼴 파편 5발, Industrial 상·하단 교대 3발, Signal 순차 3레인, Gravity 곡선 구체 3발, Abyss 교대 곡사 3발, Solar 열탄 4발입니다. 탄속은 월드 속도와 별개로 220~360px/s이며, 비행이나 대시 무적으로 피할 수 있습니다. Space 반사는 없습니다. 실제 접촉은 치명적이고 빗나간 탄환은 화면 밖까지 이동합니다. 전역 레이저와 다중 탄막은 모두 벽 없는 상태에서 진행합니다.
- 보스전 중 벽 통과와 챌린지에는 점수가 붙지 않고, 클리어 시 10점을 받습니다. 이 10점은 속도용 진행 점수에도 반영됩니다. 진행 점수 10점마다 기본 속도가 10%씩 증가하되 150점에서 증가를 멈추고, 이후 기체·보스 패턴 배율을 적용합니다. 모든 가속·감속은 2초에 걸쳐 완만하게 전환되며, 보스 클리어 후에도 이 상한을 적용한 일반 속도로 돌아갑니다. 일시정지 감점으로 속도가 내려가지는 않습니다.
- 첫 보스 클리어 후부터 일반벽의 움직이는 구멍(50% 확률)이 해금됩니다. 줄 형태 레이저는 첫 보스부터 발사 가능한 벽 전투 시간 2초마다 90% 확률로 시도합니다. 한 줄 70% / 두 줄 30%이며 두 줄 모두 먼저 위치를 예고합니다. 안전한 두 위치가 없으면 한 줄로 줄이고, 안전한 높이가 없거나 임박한 특수벽 대응과 충돌하면 건너뜁니다. 놓친 발사는 쌓아 두지 않습니다. 레이저의 예고·발사·잔광 중에는 새 벽 생성을 멈춥니다. 이 레이저 안전 검사는 투사체 발사 제한으로 사용하지 않습니다.
- 단일 레이저는 일반벽이 이동하는 중에도 0.7초 예고 후 발사하며, 움직이는 구멍의 전체 이동 범위까지 피해서 높이를 고릅니다. 두 번째 보스부터는 고유 탄막 종료 후 공격 주기마다 60% 확률로 전역 레이저를 발동하고, 1~3발 중 같은 확률로 고른 수만큼 연속 발사합니다. 매 발마다 직전과 다른 안전한 1/4 구역을 최소 2초간 예고하며, 이동에 더 긴 시간이 필요하면 예고를 늘립니다. 이전 발사의 피해와 잔광이 모두 끝나야 다음 예고를 시작하며, 전체 연속 공격 동안 벽과 다른 공격은 등장하지 않습니다. 두 레이저 모두 오른쪽에서 왼쪽으로 0.4초에 걸쳐 뻗어나가며 총 1초간 활성화되고, 이후 0.15초 동안 피해 없이 잔광만 사라집니다.
- 보스 체력은 `BOSS HP 3 / 3`으로 표시됩니다. 보스 진입 전 1.5초 동안 사이렌이 세 번 울리고, 보스곡이 시작되면서 보스가 화면 오른쪽 밖에서 1초에 걸쳐 들어옵니다. 자리를 잡은 뒤 새 벽과 공격이 시작됩니다. 보스마다 승인된 관절 애니메이션과 고유 포효음을 사용합니다.
- 첫 보스 클리어 후 기존 특수벽 선택의 절반이 혼합 벽으로 바뀝니다. 일반벽의 구멍 안에 얇은 특수 장벽이 있으므로 구멍에 맞춰 비행하면서 대시해야 합니다. 대시 중에도 위아래 일반벽은 충돌합니다.
- 모든 대시에는 짧은 흰색·청록색 충격파 링이 나타나고, 평소의 곡선 비행 궤적은 유지됩니다.
- 특수벽·복합벽의 필수 대시 대응 시점은 이후 가속까지 고려해 최소 1.2초 이상 떨어지도록 생성합니다. 일반벽은 기존 생성 간격을 유지하며, 특수벽 최소 개수를 채워야 할 때는 해당 벽의 생성을 기다려 쿨타임 때문에 불가능한 배치를 막습니다.
- 포탈은 세로 중앙에 고정되어 기체 높이를 따라가지 않으며, 내부 통과 영역은 화면 높이 전체를 덮습니다. 기존 오른쪽→왼쪽 접근과 목적지 장식·백색 전환·새 벽 생성 재개 흐름은 유지됩니다.
- 지정 관리자 계정의 설정에는 무적과 별도로 `플레이어 히트박스 표시` 스위치가 있습니다. 관리자 모드에서만 실제 충돌 사각형을 그리며, 일반 플레이에는 자동 표시되지 않습니다. 표시 자체는 충돌 판정을 바꾸지 않습니다.
- 보스 클리어 후 새 벽 생성을 즉시 멈추고, 기존 벽은 원래 디자인을 유지한 채 화면 밖으로 나갈 때까지 이동합니다. 이후 0.45초 준비 뒤 다음 스테이지의 장식과 풍경을 담은 포털이 실제 벽 속도를 따라 960px 접근합니다. 플레이어를 통과하면 0.2초 동안 하얗게 밝아지고, 0.1초의 불투명한 흰 화면 아래에서 스테이지를 교체한 뒤 0.6초 동안 새 풍경을 드러냅니다. 전환 완료 전에는 새 벽·보스가 등장하지 않으며, 완료 후 벽을 최대 1개부터 재개해 누적 스폰이 몰리지 않습니다.
- 여섯 지역마다 서로 다른 일반곡과 보스곡이 반복 재생됩니다. 현재 지역의 두 곡을 미리 준비하고, 곡 전환 시 짧게 겹쳐 부드럽게 이어줍니다. 일시정지는 재생 위치를 유지하고 음소거는 BGM과 효과음 모두에 적용됩니다. 음원 로딩 실패 시에는 기본 합성 음악으로 플레이를 계속할 수 있습니다.
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
