import * as C from '../src/game/constants.js';
import {AIRCRAFT_CATALOG} from '../src/game/aircraft.js';
import {STAGE_CATALOG} from '../src/game/stages.js';
import {getBaseSpeed,getBossWallRules} from '../src/game/difficulty.js';
import {sampleProjectileSpeed} from '../src/game/projectile-speed.js';
import {FEEDBACK_AIRCRAFT_POLICY} from '../src/game/feedback-policy.js';
import {getBossHealth} from '../src/game/boss.js';
import {createBossWeapon} from '../src/game/boss-weapon.js';
import {createChallenge} from '../src/game/wasd-challenge.js';
import {VISUAL_ASSET_MANIFEST} from '../src/game/visual-assets.js';
import {MAX_RENDER_WIDTH,MAX_RENDER_HEIGHT} from '../src/game/render-resolution.js';

export function collectGameCatalog(){
  var crafts=AIRCRAFT_CATALOG.map(c=>({...c,gravity:C.GRAVITY*c.gravityMultiplier,lift:C.LIFT_VELOCITY*c.liftMultiplier,
    startingSpeed:getBaseSpeed(0,c.id)*c.scrollSpeedMultiplier,ceiling:getBaseSpeed(c.speedCapScore,c.id)*c.scrollSpeedMultiplier,
    normalSpawn:C.NORMAL_SPAWN_INTERVAL_SECONDS*c.spawnIntervalMultiplier,bossSpawn:C.WARNING_SPAWN_INTERVAL_SECONDS*c.spawnIntervalMultiplier,
    speedRows:Array.from({length:23},(_,i)=>({score:i*10,normal:getBaseSpeed(i*10,c.id)*c.scrollSpeedMultiplier,
      slow:getBaseSpeed(i*10,c.id)*c.scrollSpeedMultiplier*C.BOSS_SLOW_MULTIPLIER,
      fast:getBaseSpeed(i*10,c.id)*c.scrollSpeedMultiplier*C.BOSS_FAST_MULTIPLIER*(c.id==='velocity'?C.VELOCITY_FAST_BOSS_SPEED_MULTIPLIER:1)}))}));
  return {schemaVersion:1,constants:C,crafts,stages:STAGE_CATALOG,assets:VISUAL_ASSET_MANIFEST,
    world:{width:C.WORLD_WIDTH,height:C.WORLD_HEIGHT},render:{maxWidth:MAX_RENDER_WIDTH,maxHeight:MAX_RENDER_HEIGHT,nativeRaf:true},
    weapon:{...createBossWeapon(),rechargeByAircraft:Object.fromEntries(AIRCRAFT_CATALOG.map(c=>[c.id,createBossWeapon(c.id).rechargeSeconds])),chargeBeforeFire:.5,lockedSeconds:.7,activeSeconds:.2,hp:getBossHealth()},
    lineLaser:{telegraphSeconds:C.BOSS_LASER_TELEGRAPH_SECONDS,activeSeconds:C.LINE_LASER_ACTIVE_SECONDS,
      sweepSeconds:C.LINE_LASER_SWEEP_SECONDS,fadeSeconds:C.LINE_LASER_FADE_SECONDS,clearGapFraction:C.LINE_LASER_CLEAR_GAP_FRACTION,
      warningDuringWalls:true,fireOnlyBetweenWalls:true,pauseSpawns:false},
    bossRound:{uniqueUnlockBoss:2,minimumUniqueBlocks:1,extraUniqueChance:.5,maximumUniqueBlocks:2,consecutiveUnique:false},
    challenges:Array.from({length:8},(_,i)=>{var lo=createChallenge({bossNumber:i+1,rng:()=>0}),hi=createChallenge({bossNumber:i+1,rng:()=>.999});
      return {boss:i+1,min:lo.sequence.length,max:hi.sequence.length,seconds:lo.timeLimitSeconds};}),
    feedbackAccess:{...FEEDBACK_AIRCRAFT_POLICY},
    menuLayout:{referenceWidth:1600,referenceHeight:900,mobilePrimaryFont:20,mobilePrimaryHeight:60,rotationResume:'manual'},
    bossCadence:{firstWalls:C.FIRST_BOSS_WALL_COUNT,repeatWalls:C.REPEAT_BOSS_WALL_COUNT,resetAt:'stage-arrival',excludeBossWalls:true,excludeTransitionWalls:true},
    ranking:{order:['score-desc','private-duration-desc','achieved-asc','user-id-asc'],durationVisible:false},
    bossWallRules:[1,2,3,4,7].map(boss=>({boss,...getBossWallRules(boss),inlineProjectile:boss>=3,inlineLaser:boss>=4})),
    projectileSpeed:{reference:240,minBase:sampleProjectileSpeed(240,()=>0),maxBase:sampleProjectileSpeed(240,()=>1),gain:(sampleProjectileSpeed(340,()=>0)-sampleProjectileSpeed(240,()=>0))/100,min:sampleProjectileSpeed(-10000,()=>0),max:sampleProjectileSpeed(10000,()=>1)},
    uniqueAttacks:STAGE_CATALOG.map(s=>({stageId:s.id,unlockBoss:2,count:({'crystal-gates':'1→3','industrial-void':'3','signal-monoliths':'6×2','gravity-well':'5','abyssal-beast':'6','solar-forge':'6'})[s.id],intervalSeconds:({'industrial-void':.3,'signal-monoliths':1.15,'gravity-well':.3,'abyssal-beast':.18})[s.id]??null})),
    challengeFeedback:{kinds:['ink','glitch','crack','fog'],seconds:C.CHALLENGE_FAILURE_EFFECT_SECONDS,glitchBlackoutSeconds:.18,recoverySeconds:C.CHALLENGE_RECOVERY_SECONDS,wrongKeySeconds:C.CHALLENGE_WRONG_KEY_FLASH_SECONDS},
    movingWalls:{freezeDistance:160,brakingDistance:40,artByStage:Object.fromEntries(STAGE_CATALOG.map(s=>[s.id,s.id==='abyssal-beast'?'B':'A']))},
    unlocks:[
      {id:'guest',trigger:'처음부터',group:'시작',title:'GUEST · 모든 기체 임시 해금',body:'다음 버전까지 임시 해금. v0.3 전까지 계정·게스트 모두3기체 선택 가능. 게스트 기록은 저장하지 않습니다.'},
      {id:'special',trigger:`${C.SPECIAL_UNLOCK_SCORE}점`,group:'점수',title:'특수벽 후보',body:`일반·첫 보스20% / 보스2·3·4+는30·40·50%. 보스7벽당 최소0·1·2·3개. 성공 기준은 끝까지0.30초로 유지합니다.`},
      {id:'boss1',trigger:`일반벽 ${C.FIRST_BOSS_WALL_COUNT}개`,group:'보스',title:'첫 BOSS · 저속',body:'20개를 통과하고 남은 벽이 화면 밖까지 나간 뒤 진입합니다. 이후 새 지역 도착부터 일반벽15개마다 다음 보스. 보스 벽·전환 추가벽은 제외합니다.'},
      {id:'aegis',trigger:`임시 해금 / 원래 최고 ${C.AIRCRAFT_AEGIS_UNLOCK_SCORE}점`,group:'계정',title:'AEGIS',body:'중력1.3배·상승력70%. 보스 레이저1발로 HP3칸 제거. 첫 충전·재충전30초, 최대1발 저장. 원래 해금 기준은 임시 기간 뒤 복구합니다.'},
      {id:'velocity',trigger:`임시 해금 / 원래 최고 ${C.AIRCRAFT_VELOCITY_UNLOCK_SCORE}점`,group:'계정',title:'VELOCITY',body:'최종 점수×1.5 반올림. 시작 속도×2, 점수에 따른 증가폭은 다른 기체와 같습니다.'},
      {id:'first-clear',trigger:'보스 1회 클리어',group:'보스',title:'이동 구멍 · 복합벽',body:'일반벽의50%가 이동 구멍 후보. 특수벽 선택 중50%가 복합벽 후보입니다. 특수벽 판정 안내는 여기까지 표시됩니다.'},
      {id:'boss2',trigger:'두 번째 보스',group:'보스',title:'전역 레이저 패턴',body:'벽 없는 상태에서 한 구역만 안전한 공격을1~3회. 매번 새 예고/이동 시간을 제공합니다.'},
      {id:'unique',trigger:'두 번째 보스부터',group:'보스',title:'지역별 고유 탄막',body:'라운드당1회 보장+50%로1회 추가, 연속 등장 금지. 블록마다1~3세트. 보스2·3은 앞 세트가 화면 밖으로 나간 뒤,4부터는 다음 예고가 겹칠 수 있습니다.'},
      {id:'inline-projectile',trigger:'세 번째 보스부터',group:'보스',title:'벽 사이 단일 투사체',body:'벽 회피 중에는 한 발씩만 발사합니다. 일반·특수벽과 함께 나올 수 있습니다.'},
      {id:'inline-laser',trigger:'네 번째 보스부터',group:'보스',title:'벽 사이 줄 레이저',body:'상·하15% 제외 무작위 높이. 예고0.7초는 벽과 겹쳐도 되지만 발사0.2초는 벽 사이에서만. 벽 생성 간격 유지,2줄은 빛 사이25% 이상 확보.'},
      {id:'ambient',trigger:`보스 ${C.AMBIENT_LASER_UNLOCK_BOSSES}회 클리어`,group:'보스',title:'일반 구간 줄 레이저',body:`비행${C.AMBIENT_LASER_INTERVAL_SECONDS}초마다${C.AMBIENT_LASER_CHANCE*100}% 시도.1줄70%/2줄30%. 예고0.7초 후 벽 사이0.2초 발사, 간격이 부족하면 다음 틈까지 예고 유지.`},
      {id:'continuity',trigger:`진행 ${C.GAP_CONTINUITY_SCORE}점 / VELOCITY 처음부터`,group:'점수',title:'구멍 높이 연속성 제한',body:'이전 구멍 중심을 기준으로 최대 구멍 높이의70% 범위에서 선택합니다. 실제 속도와 필수 대시 간격도 보정합니다.'},
      {id:'cap',trigger:`진행 ${C.SPEED_CAP_SCORE}점`,group:'점수',title:'일반 속도 증가 종료',body:'보스 배율은 별도입니다. 점수 감점으로 이미 오른 속도는 내려가지 않습니다.'},
    ],
    sources:['src/game/constants.js','src/game/aircraft.js','src/game/difficulty.js','src/game/game-engine.js','src/game/player.js',
      'src/game/player-geometry.js','src/game/collision.js','src/game/boss.js','src/game/boss-weapon.js','src/game/boss-signatures.js',
      'src/game/boss-patterns.js','src/game/wasd-challenge.js','src/game/stages.js','src/game/visual-assets.js'],
    notes:{speed:'표는 목표속도입니다. 실제 비행은2초 보간·필수 대시 간격 제한의 영향을 받습니다.',
      archive:'독립 WARNING, 투사체 반사로 보스 클리어, 후반 HP5 증가는 현재 규칙이 아닙니다.',
      preview:'슬라이더는 문서 안의 가상 실험입니다. 게임 파일·배포 값·계정 기록을 변경하지 않습니다.'}};
}
