import * as C from '../src/game/constants.js';
import {AIRCRAFT_CATALOG} from '../src/game/aircraft.js';
import {STAGE_CATALOG} from '../src/game/stages.js';
import {getBaseSpeed} from '../src/game/difficulty.js';
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
    weapon:{...createBossWeapon(),chargeBeforeFire:.5,lockedSeconds:.7,activeSeconds:.2,hp:getBossHealth()},
    challenges:Array.from({length:8},(_,i)=>{var lo=createChallenge({bossNumber:i+1,rng:()=>0}),hi=createChallenge({bossNumber:i+1,rng:()=>.999});
      return {boss:i+1,min:lo.sequence.length,max:hi.sequence.length,seconds:lo.timeLimitSeconds};}),
    unlocks:[
      {id:'guest',trigger:'처음부터',group:'시작',title:'GUEST · NOVA',body:'로그인 없이 시작. 게스트 최고 기록은 저장하지 않고 공개 랭킹만 조회합니다.'},
      {id:'special',trigger:`${C.SPECIAL_UNLOCK_SCORE}점`,group:'점수',title:'특수벽 후보',body:`일반20% / 보스50%. 생성 간격·최소 할당·대시 대응 간격에 따라 보정됩니다.`},
      {id:'boss1',trigger:`${C.WARNING_START_SCORE}점`,group:'점수',title:'첫 BOSS',body:'기존 벽을 모두 보낸 뒤 암전·사이렌·보스 입장. 독립 WARNING은 현재 비활성입니다.'},
      {id:'aegis',trigger:`계정 최고 ${C.AIRCRAFT_AEGIS_UNLOCK_SCORE}점`,group:'계정',title:'AEGIS 해금',body:'게스트는 최고 기록과 무관하게 NOVA만 선택합니다.'},
      {id:'velocity',trigger:`계정 최고 ${C.AIRCRAFT_VELOCITY_UNLOCK_SCORE}점`,group:'계정',title:'VELOCITY 해금',body:'최종 점수×1.5 반올림. 시작 속도×2, 점수에 따른 증가폭은 다른 기체와 같습니다.'},
      {id:'first-clear',trigger:'보스 1회 클리어',group:'보스',title:'이동 구멍 · 복합벽',body:'일반벽의50%가 이동 구멍 후보. 특수벽 선택 중50%가 복합벽 후보입니다. 특수벽 판정 안내는 여기까지 표시됩니다.'},
      {id:'boss2',trigger:'두 번째 보스',group:'보스',title:'전역 레이저 패턴',body:'벽 없는 상태에서 한 구역만 안전한 공격을1~3회. 매번 새 예고/이동 시간을 제공합니다.'},
      {id:'ambient',trigger:`보스 ${C.AMBIENT_LASER_UNLOCK_BOSSES}회 클리어`,group:'보스',title:'일반 구간 줄 레이저',body:`비행${C.AMBIENT_LASER_INTERVAL_SECONDS}초마다${C.AMBIENT_LASER_CHANCE*100}% 시도.1줄70%/2줄30%, 안전 배치가 없으면 줄이거나 생략합니다.`},
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
