# Azure Static Web Apps 배포

회사 Azure에 게임 화면을 배포하고, 기존 Supabase Auth·Microsoft Entra 로그인·리더보드를 유지한다. Azure 내장 로그인을 추가로 켜는 구성은 아니다. 공개 자료 버전은 `0.01v`를 유지한다.

실제 생성된 원본 주소는 **https://proud-grass-03a132e00.6.azurestaticapps.net** 이다. 자동 생성 워크플로는 `.github/workflows/azure-static-web-apps-proud-grass-03a132e00.yml`이며 기존 배포 토큰 참조를 유지한다. 생성 직후 첫 배포는 성공했지만, 이것만으로 실제 계정 로그인·점수 저장이 검증된 것은 아니다.

## 1. 포털에서 확인한 값

| 항목 | 값 |
| --- | --- |
| 리소스 그룹 | `grill-me-edu` |
| 앱 이름 | `void-surfer` |
| 요금제 | Free |
| 지역 서비스 | East Asia |
| 엔터프라이즈급 에지 | 사용 안 함 |
| GitHub | `Pideb/STUDY_Void_Surfer` / `main` |
| 배포 권한 정책 | 배포 토큰 |
| 빌드 사전 설정 | Custom |
| 앱 위치 / API 위치 / 출력 위치 | `/` / 빈칸 / `dist` |

현재 빌드의 전체 용량은 약 119MiB다. Free의 단일 환경 한도는 250MB이며, 이후 파일을 추가하면 다시 확인한다. 회사 구독의 Free 앱 개수·정책 제한은 포털 생성 결과에서 확인한다.

## 2. 생성 전에 준비된 코드

`public/staticwebapp.config.json`의 다음 규칙은 Vite 빌드 시 `dist/staticwebapp.config.json`으로 복사된다.

```json
{"routes":[{"route":"/auth/callback","rewrite":"/index.html"}]}
```

브라우저 주소·로그인 쿼리/해시를 유지한 채 기존 콜백 코드를 실행한다. `vercel.json`은 Azure가 읽지 않으므로 이 별도 파일이 필요하다. 누락·경로 오류·원본과 산출물 불일치는 `npm run verify:config`에서 검출한다. Node.js는 현재 도구 체인에 맞춰 22.12 이상을 사용한다.

## 3. 만들기 이후: 생성된 GitHub Actions 연결

Azure의 만들기를 누르면 리소스와 GitHub Actions 워크플로가 생성된다. `.github/workflows/azure-static-web-apps-*.yml`과 배포 토큰용 Repository secret 이름을 확인한다. 토큰은 화면·대화·소스에 복사하지 않고 자동 생성된 secret 참조를 유지한다.

GitHub 저장소 → Settings → Secrets and variables → Actions → Variables에 아래 **공개 설정값**을 등록한다. 기존 로컬 `.env`와 같은 값을 사용한다.

| Repository variable 이름 | 값 |
| --- | --- |
| `VITE_SUPABASE_URL` | 기존 Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | 기존 publishable/anon key |

두 값은 브라우저에 포함되는 공개 설정이다. service-role 키·Entra client secret을 사용하지 않는다. 저장소 변수를 생성하는 것만으로 빌드에 들어가지는 않으므로, 자동 생성된 워크플로의 **upload 단계**에 아래 `env`를 추가한다.

현재 저장소 워크플로에는 같은 값이 빌드 job의 `env`로 연결되어 upload 단계가 상속한다. 값이 비어 있으면 이름만 표시하고 빌드를 중단하며, 빌드 후 배포 설정 검사도 실행한다. 기존 Git 인증이 있는 운영자는 `python scripts/configure-github-public-env.py`로 로컬의 공개 설정 두 개만 등록하고 읽기 결과를 비교할 수 있다. 이 도구는 토큰과 설정값을 출력하거나 저장하지 않는다.

```yaml
# Existing Azure/static-web-apps-deploy@v1 upload step
env:
  VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ vars.VITE_SUPABASE_ANON_KEY }}
```

워크플로의 `with`에는 Azure가 생성한 실제 `azure_static_web_apps_api_token` secret 참조와 `app_location: '/'`, `api_location: ''`, `output_location: 'dist'`를 유지한다. `app_build_command: 'npm run build && npm run verify:config'`를 지정하면 빌드 산출물 검사 후 배포한다. Azure 리소스의 런타임 환경 변수만 설정하는 것은 Vite 빌드에 반영되지 않는다. 변수 또는 워크플로를 바꾼 뒤에는 새 빌드가 필요하다.

Oryx에서 적절한 Node 버전을 제공하지 않는 경우에는 생성된 **하나의 워크플로**를 수정하여 `actions/setup-node`로 Node 22를 설치하고 `npm ci`, 테스트, `npm run build`, `npm run verify:config`를 먼저 실행한다. 이때 배포 단계는 빌드된 `dist`를 `app_location`으로 사용하고 `skip_app_build: true`, `output_location: ''`, API 위치 빈칸으로 바꾼다. 이 대안과 기본 자동 빌드 설정을 섞거나 중복 배포 워크플로를 추가하지 않는다.

리소스 생성 직후 실행되는 첫 빌드는 이 설정을 추가하기 전일 수 있다. 워크플로 연결·공개 설정값·실제 인증 복귀 주소까지 확인한 후 배포 완료로 판단한다.

## 4. 배포 주소가 나온 뒤 로그인 설정

Azure 리소스 개요에서 **실제 URL**을 확인한다. 아직 생성되지 않은 주소를 추측해서 등록하지 않는다.

Supabase → Authentication → URL Configuration:

- Site URL: 공유할 실제 Azure 원본 주소
- Redirect URLs: `<실제 Azure 원본 주소>/auth/callback`
- 로컬 테스트를 유지하려면 기존 `http://localhost:5173/auth/callback`도 유지

이 사이트의 입력값:

```text
Site URL: https://proud-grass-03a132e00.6.azurestaticapps.net
Redirect URL: https://proud-grass-03a132e00.6.azurestaticapps.net/auth/callback
```

Entra 앱은 기존 **Web** 플랫폼과 Supabase의 `https://<project-ref>.supabase.co/auth/v1/callback`을 유지한다. Azure 원본을 Entra의 직접 SPA 콜백으로 바꾸지 않는다. 현재 구조에서는 Entra → Supabase → Azure의 게임 콜백 순서로 돌아온다. URL allow-list 변경은 저장 후 실제 계정으로 확인한다.

## 5. 실제 배포 확인

1. GitHub Actions의 최신 main 실행 성공 확인.
2. Azure URL에서 타이틀·이미지·음악 로딩과 게스트 NOVA 출격 확인.
3. `/auth/callback` 직접 요청이 404가 아닌 앱 HTML을 반환하는지 확인.
4. 조직 계정 로그인 → 기체 최고 기록 → 한 판 종료·점수 저장 → 랭킹·재접속 확인.
5. 게스트 기록 미저장과 관리자 실행 미등록 확인.
6. 모바일 가로 화면·성능·음소거·일시정지·새로고침 확인.

이후 main에 push하면 연결된 워크플로가 다시 빌드·배포한다. 포털이 워크플로 커밋을 추가한 후 로컬 작업을 시작할 때는 먼저 원격 main 변경을 반영하고, force-push하지 않는다.

## 공식 근거

- [Azure 포털 생성 절차](https://learn.microsoft.com/azure/static-web-apps/get-started-portal)
- [경로 설정과 산출물 위치](https://learn.microsoft.com/azure/static-web-apps/configuration)
- [빌드·Node·환경 변수·빌드 생략](https://learn.microsoft.com/azure/static-web-apps/build-configuration)
- [무료 플랜 제한](https://learn.microsoft.com/azure/static-web-apps/quotas)
