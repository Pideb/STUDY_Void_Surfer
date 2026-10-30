import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {collectGameCatalog} from './game-catalog.mjs';import {gameFingerprint} from './release-core.mjs';
var root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(fs.existsSync(path.join(root,'docs/management/releases.json')))throw Error('이미 초기화되어 있습니다. 기존 버전을 덮어쓰지 말고 docs:build 또는 release:prepare를 사용하세요.');
var existing=JSON.parse(fs.readFileSync(path.join(root,'docs/releases/versions.json'),'utf8'));
var current=existing.releases.find(r=>r.version==='0.01-b');
var fingerprint=gameFingerprint(root);
var catalog={schemaVersion:1,currentVersion:'0.01-b',versionBase:'0.1',policy:'다음 배포0.1, 이후0.11→0.12→0.13. 기준 버전은 사용자 요청으로만 변경. 문서만 재생성할 때는 버전을 올리지 않습니다.',
  gameFingerprint:fingerprint,nextVersion:'0.1',
  snapshots:Object.fromEntries(['void-surfer-0.01v.html','void-surfer-0.01-b.html'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'docs/releases',name))).digest('hex')])),
  releases:[
    {version:'0.01v',date:'2026-10-29',title:'첫 게임·발표 자료 기준',status:'archived',sourceCommit:'f69a166',document:'../releases/void-surfer-0.01v.html',
      summary:'세 기체·여섯 지역·보스전·계정/게스트/랭킹과 실플레이 피드백을 처음 문서화한 기준입니다. 배포 성공을 별도로 주장하지 않는 보존 문서입니다.',
      changes:{added:['3기체와 계정 최고 기록 해금','6지역 실제 배경·벽·보스·탄막·레이저 자산','게스트·Microsoft 로그인·공개 파일럿 랭킹','직접 조준하는 보스 레이저와 WASD 시야 페널티'],changed:['점수 기반 고정 속도 증가,220점 상한','입력/물리와 분리된 렌더링 레이어'],fixed:['특수벽/이동 구멍/보스 무한 진행 등 반복 실플레이 피드백']},validation:{testFiles:55,tests:699}},
    {version:'0.01-b',date:'2026-10-29',title:'보스 흐름·전체화면·음악 시작 안정화',status:'deployed-verified',sourceCommit:current.sourceCommit,
      appFingerprint:fingerprint,document:'../releases/void-surfer-0.01-b.html',deployment:current.deployment,validation:current.verification,
      summary:'현재 배포된 규칙과 수치를 관리용 문서의 기본값으로 사용합니다.',
      changes:{added:['이전 WARNING 설계와 원본을 재기획용으로 보관','음악 준비 중 별도 출격 대기 상태와 최대10초 무음 자동 시작'],
        changed:['일반→보스 반복으로 독립 WARNING 교체','다음 보스: 포털 전환 완료 점수+15~20','전체 캔버스 FHD 제한·모니터 주사율 유지'],
        fixed:['첫 메뉴 동작으로 소리 활성화','계정/음소거 갱신 시 메뉴 기체 모션 초기화 방지','플레이 진입 시 메뉴곡/임시 합성 음악 재생 방지','로딩 취소·재시작·계정 변경의 늦은 완료와 중복 출격 방지']},
      timeline:[{date:'2026-10-29',source:'1ae7524',text:'독립 WARNING 대신 실제 보스 반복'},
        {date:'2026-10-29',source:'3928989',text:'메뉴 첫 입력 오디오와 기체 모션 유지'},
        {date:'2026-10-29',source:'e0eaacf',text:'포털 도착 후15~20점으로 다음 보스 예약'},
        {date:'2026-10-29',source:'dda1732',text:'최대 FHD 렌더링·RAF 유지'},
        {date:'2026-10-29',source:'e90bb76',text:'게임곡 준비 후 시작·10초 제한·늦은 음원/취소 처리'}]},
  ]};
fs.writeFileSync(path.join(root,'docs/management/releases.json'),JSON.stringify(catalog,null,2)+'\n');
fs.writeFileSync(path.join(root,'docs/management/game-data.json'),JSON.stringify(collectGameCatalog(),null,2)+'\n');
console.log(JSON.stringify({version:catalog.currentVersion,crafts:3,stages:6,gameFingerprint:fingerprint}));
