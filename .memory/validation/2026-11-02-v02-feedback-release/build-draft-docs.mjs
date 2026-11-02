import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {registry,documentOutputs,protectSnapshots} from '../../../scripts/release-docs.mjs';
import {gameFingerprint} from '../../../scripts/release-core.mjs';
const root=process.cwd(),dir='.memory/validation/2026-11-02-v02-feedback-release/draft-docs';
const sourceRegistry=fs.readFileSync('docs/management/releases.json'),manual=fs.readFileSync('docs/player/updates.json'),r=registry();
const tests=JSON.parse(fs.readFileSync('.memory/validation/2026-11-02-v02-feedback-release/all-tests.json','utf8'));
const sourceHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
Object.assign(r,{currentVersion:'0.2',versionBase:'0.2',nextVersion:'0.21',documentationDate:'2026-11-02',gameFingerprint:gameFingerprint(root)});
r.releases.forEach(release=>{if(release.displayVersion)release.displayDocument='../releases/void-surfer-'+release.displayVersion+'.html';});
r.releases.push({version:'0.2',date:'2026-11-02',title:'피드백 반영 · 로컬 플레이 검토',summary:'승인된 게임·메뉴·모바일·기록·문서 개선의 개발 검토본입니다. 실제 배포되지 않았습니다.',status:'draft-not-deployed',sourceCommit:sourceHead,document:'../releases/void-surfer-0.2.html',appFingerprint:r.gameFingerprint,validation:{testFiles:tests.testResults.length,tests:tests.numPassedTests,build:'passed',configuration:'passed',scope:'T18 full runtime suite; T19 document tests separately recorded'},changes:{added:['6지역 고유 탄막과 차수별 해금','방향키 메뉴·모바일 확대·회전 안내·플레이 가이드','비공개 플레이 통계 및 동점 플레이시간 정렬'],changed:['일반벽20개 후 첫 보스, 다음 지역 일반벽15개마다 보스','첫3보스 저속→고속→변속, 이후 무작위','모든 기체 임시 해금·WASD 오입력 재시도·4종 페널티'],fixed:['이동벽 통과 직전 수직 움직임 정지','빠른 재시작의 이전 저장 응답 격리','동일 HUD 갱신과 레이어 재사용 최적화']}});
const outputs=documentOutputs(root,r),files=[];
for(const [relative,original]of Object.entries(outputs)){
 const target=path.join(dir,relative);fs.mkdirSync(path.dirname(target),{recursive:true});
 let content=original;if(relative==='docs/management/void-surfer-management.html')content=content.replace('</head>','<meta name="workspace-relative-root" content="../../../../../../">\n</head>');
 fs.writeFileSync(target,content);files.push({file:target.replaceAll(path.sep,'/'),bytes:Buffer.byteLength(content),sha256:crypto.createHash('sha256').update(content).digest('hex')});
}
protectSnapshots(root,registry());if(!sourceRegistry.equals(fs.readFileSync('docs/management/releases.json'))||!manual.equals(fs.readFileSync('docs/player/updates.json')))throw Error('Read-only source changed');
const generatorSourceHashes={};for(const file of ['scripts/build-management.mjs','scripts/build-presentation.mjs','scripts/game-catalog.mjs','scripts/release-labels.mjs','scripts/release-docs.mjs','docs/management/content.html','docs/management/browser.js','docs/management/lab-model.mjs','docs/management/preview-catalog.json'])generatorSourceHashes[file]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({status:'draft-not-deployed',sourceHead,gameFingerprint:r.gameFingerprint,productionVersion:registry().currentVersion,manualPlayerUpdatesUnchanged:true,generatorSourceHashes,files},null,2)+'\n');
console.log(JSON.stringify({status:'draft-not-deployed',files:files.length,productionVersion:registry().currentVersion}));
