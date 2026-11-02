import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {ROOT,managementOutput} from './build-management.mjs';import {presentationOutput} from './build-presentation.mjs';import {gameFingerprint,nextVersion} from './release-core.mjs';
import {GUIDE_FILE,hasPlayerGuide,playerGuideOutput} from './build-player-guide.mjs';
import {archivalAliasOutput} from './release-labels.mjs';
const RELEASE_FILE='docs/management/releases.json';
function read(root,file){return fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');}
function json(v){return JSON.stringify(v,null,2)+'\n';}
function sha(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
export function registry(root=ROOT){return JSON.parse(read(root,RELEASE_FILE));}
export function protectSnapshots(root,r){for(var [name,hash]of Object.entries(r.snapshots)){var bytes=fs.readFileSync(path.join(root,'docs/releases',name)),actual=sha(bytes),content=sha(Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n')));if(actual!==hash&&content!==r.snapshotContentSha256?.[name])throw Error('보존 스냅샷 변경 감지: '+name);}}
export function documentOutputs(root=ROOT,r=registry(root)){
  protectSnapshots(root,r);var management=managementOutput(root,r),presentation=presentationOutput(root,management.data,r);
  var outputs={'docs/management/game-data.json':json(management.data),'docs/management/void-surfer-management.html':management.html,'docs/releases/void-surfer-latest.html':presentation};
  var current=r.releases.find(x=>x.version===r.currentVersion),name='void-surfer-'+r.currentVersion+'.html';
  if(!r.snapshots[name])outputs['docs/releases/'+name]=presentation;
  for(var release of r.releases){var label=release.displayVersion;if(['0.01v','0.01-b'].includes(release.version)&&label){var alias='docs/releases/void-surfer-'+label+'.html';if(!outputs[alias])outputs[alias]=archivalAliasOutput(root,release);}}
  var legacy=JSON.parse(read(root,'docs/releases/versions.json'));
  legacy.currentVersion=r.currentVersion;legacy.versionPolicy=r.policy;legacy.versionBase=r.versionBase||'0.1';legacy.nextVersion=r.nextVersion;legacy.managementDocument='../management/void-surfer-management.html';legacy.latestDocument='void-surfer-latest.html';
  legacy.releases=r.releases.map(release=>({...legacy.releases?.find(x=>x.version===release.version),...release,document:path.basename(release.document)}));delete legacy.versions;outputs['docs/releases/versions.json']=json(legacy);
  if(hasPlayerGuide(root))outputs[GUIDE_FILE]=playerGuideOutput(root);
  return outputs;
}
export function writeTransaction(root,outputs,write=(file,content)=>fs.writeFileSync(file,content)){
  var backup=new Map();try{for(var [file,content]of Object.entries(outputs)){var target=path.join(root,file);backup.set(target,fs.existsSync(target)?fs.readFileSync(target):null);write(target,content);}}
  catch(error){for(var [file,bytes]of backup){if(bytes===null){if(fs.existsSync(file))fs.unlinkSync(file);}else fs.writeFileSync(file,bytes);}throw error;}
}
export function build(root=ROOT,services={}){var r=registry(root),outputs=(services.outputs||documentOutputs)(root,r);writeTransaction(root,outputs,services.write);return {version:r.currentVersion,files:Object.keys(outputs)};}
export function check(root=ROOT,services={}){var r=registry(root);if(gameFingerprint(root)!==r.gameFingerprint)throw Error('게임 소스가 바뀌었습니다. npm run release:prepare 로 버전과 두 문서를 갱신하세요.');var outputs=(services.outputs||documentOutputs)(root,r);for(var [file,content]of Object.entries(outputs)){if(!fs.existsSync(path.join(root,file))||read(root,file)!==content.replace(/\r\n/g,'\n'))throw Error('문서가 최신이 아닙니다: '+file+' · npm run docs:build');}return {version:r.currentVersion,files:Object.keys(outputs).length};}
function runNpm(root,args){
  var npmCli=process.env.npm_execpath||path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
  var result=spawnSync(process.execPath,[npmCli,...args],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
  if(result.error||result.status!==0)throw Error('검증 실패: npm '+args.join(' ')+'\n'+(result.stdout||'')+(result.stderr||result.error||''));return result;
}
export function validateGame(root){
  var report='.memory/validation/release-preparation-tests.json';fs.mkdirSync(path.dirname(path.join(root,report)),{recursive:true});
  runNpm(root,['test','--','--run','--reporter=json','--outputFile='+report]);
  var result=JSON.parse(read(root,report));if(!result.success||!result.numPassedTests)throw Error('테스트 결과가 성공이 아닙니다.');
  runNpm(root,['run','build']);runNpm(root,['run','verify:config']);
  return {testFiles:(result.testResults||[]).filter(t=>t.status==='passed').length,tests:result.numPassedTests,build:'passed',configuration:'passed',report};
}
function gitContext(root){var get=args=>{var r=spawnSync('git',args,{cwd:root,encoding:'utf8'});if(r.status!==0)throw Error('Git 메타데이터를 읽을 수 없습니다.');return r.stdout.trim();};return {head:get(['rev-parse','HEAD']),subjects:get(['log','-5','--format=%h %s']),files:get(['status','--short'])};}
export function prepare(root=ROOT,options={},services={}){
  var target=path.join(root,GUIDE_FILE),guide=hasPlayerGuide(root)?playerGuideOutput(root):null,previous=fs.existsSync(target)?fs.readFileSync(target):null;
  var guideStale=guide!==null&&(previous===null||previous.toString('utf8').replace(/\r\n/g,'\n')!==guide);
  if(!options.dryRun&&guideStale){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,guide);}
  try{return prepareWithGuide(root,options,services,guideStale);}
  catch(error){if(!options.dryRun&&guideStale){if(previous===null)fs.unlinkSync(target);else fs.writeFileSync(target,previous);}throw error;}
}
function prepareWithGuide(root,options,services,guideStale){
  var old=registry(root),fingerprint=gameFingerprint(root),changed=guideStale||fingerprint!==old.gameFingerprint;
  var current=old.releases.find(r=>r.version===old.currentVersion),needsRelease=changed||(options.newRelease===true&&current?.status==='deployed-verified');
  if(options.dryRun){var upcoming=nextVersion(old.currentVersion,old.versionBase||'0.1');return {changed,guideStale,currentVersion:old.currentVersion,preparedVersion:needsRelease?upcoming:old.currentVersion,nextVersion:upcoming,fingerprint};}
  if(!needsRelease)return {...build(root,services),changed:false};
  if(!options.title?.trim()||!options.changes?.length||options.changes.some(x=>!x.trim()))throw Error('--title 과 한 개 이상의 --change 가 필요합니다.');
  protectSnapshots(root,old);var validation=(services.validate||validateGame)(root);
  if(validation.build!=='passed'||validation.configuration!=='passed'||!validation.tests)throw Error('테스트/빌드/설정 검증이 완료되지 않았습니다.');
  if(gameFingerprint(root)!==fingerprint)throw Error('검증 중 소스가 변경되었습니다. 다시 준비하세요.');
  var context=(services.git||gitContext)(root),date=options.date||new Date().toISOString().slice(0,10),base=old.versionBase||'0.1',version=nextVersion(old.currentVersion,base);
  var r=structuredClone(old);r.versionBase=base;r.currentVersion=version;r.nextVersion=nextVersion(version,base);r.gameFingerprint=fingerprint;r.documentationDate=date;
  r.releases.push({version,date,title:options.title.trim(),summary:options.changes.join(' · '),status:'validated-pending-deployment',sourceCommit:context.head,sourceContext:context,appFingerprint:fingerprint,document:'../releases/void-surfer-'+version+'.html',validation,changes:{added:[],changed:options.changes,fixed:[]}});
  var outputs=(services.outputs||documentOutputs)(root,r);outputs[RELEASE_FILE]=json(r);writeTransaction(root,outputs,services.write);return {version,changed,releaseCreated:true,status:'validated-pending-deployment',files:Object.keys(outputs)};
}
export function recordDeployment(root=ROOT,proof,services={}){
  var r=registry(root),current=r.releases.find(x=>x.version===r.currentVersion);
  if(!proof||proof.version!==r.currentVersion||proof.gameFingerprint!==r.gameFingerprint||gameFingerprint(root)!==r.gameFingerprint)throw Error('배포 증거 버전/소스 지문 불일치');
  if(proof.conclusion!=='success'||!/^[a-f0-9]{40}$/i.test(proof.headSha)||!/^https:\/\/github\.com\/Pideb\/STUDY_Void_Surfer\/actions\/runs\/\d+$/.test(proof.runUrl)||!Number.isInteger(proof.runId)||!proof.runUrl.endsWith('/'+proof.runId)||!/^[a-f0-9]{64}$/i.test(proof.bundleSha256)||proof.origin!=='https://proud-grass-03a132e00.6.azurestaticapps.net'||!Number.isFinite(Date.parse(proof.completedAtUtc)))throw Error('성공 실행/HEAD/운영 번들 해시/주소/완료 시간이 필요합니다.');
  // Require Git ancestry and exact equality of this worktree, deployed commit and release source tree.
  if(!services.verifyProof){var git=(args)=>spawnSync('git',args,{cwd:root,encoding:'utf8'});var head=git(['rev-parse','HEAD']).stdout.trim();if(head!==proof.headSha)throw Error('배포 HEAD와 현재 Git HEAD가 다릅니다.');var diff=git(['diff',proof.headSha,'--','src','public','index.html','package-lock.json']);if(diff.status!==0||diff.stdout.trim())throw Error('배포 소스와 작업 트리가 다릅니다.');var ancestor=git(['merge-base','--is-ancestor',current.sourceCommit,proof.headSha]);if(ancestor.status!==0)throw Error('릴리스 소스가 배포 HEAD의 이력이 아닙니다.');}
  else services.verifyProof(proof,current);
  current.status='deployed-verified';current.deployment={headSha:proof.headSha,runId:proof.runId,runUrl:proof.runUrl,completedAtUtc:proof.completedAtUtc,bundleSha256:proof.bundleSha256,origin:proof.origin};
  var outputs=(services.outputs||documentOutputs)(root,r),name='void-surfer-'+r.currentVersion+'.html';if(outputs['docs/releases/'+name]){r.snapshots[name]=sha(Buffer.from(outputs['docs/releases/'+name]));r.snapshotContentSha256??={};r.snapshotContentSha256[name]=sha(Buffer.from(outputs['docs/releases/'+name].replace(/\r\n/g,'\n')));}outputs[RELEASE_FILE]=json(r);writeTransaction(root,outputs,services.write);return {version:r.currentVersion,status:current.status};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{var args=process.argv.slice(2),command=args.shift()||'build',options={changes:[]};for(var i=0;i<args.length;i++){if(args[i]==='--dry-run')options.dryRun=true;else if(args[i]==='--new-release')options.newRelease=true;else if(args[i]==='--title')options.title=args[++i];else if(args[i]==='--change')options.changes.push(args[++i]);else if(args[i]==='--proof')options.proof=args[++i];else throw Error('알 수 없는 옵션: '+args[i]);}
    var result=command==='build'?build():command==='check'?check():command==='prepare'?prepare(ROOT,options):command==='record-deployment'?recordDeployment(ROOT,JSON.parse(fs.readFileSync(options.proof,'utf8'))):(()=>{throw Error('지원하지 않는 명령');})();console.log(JSON.stringify(result,null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
