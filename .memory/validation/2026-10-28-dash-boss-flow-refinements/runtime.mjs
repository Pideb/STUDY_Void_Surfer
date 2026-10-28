import {createRenderer} from '/src/game/renderer.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createGameEngine} from '/src/game/game-engine.js';
import {STAGE_CATALOG} from '/src/game/stages.js';
import {createBossEncounter} from '/src/game/boss.js';
import {createSignatureAttack,updateSignatureAttack} from '/src/game/boss-signatures.js';
import {createSingleLaser,updateLaser} from '/src/game/boss-attacks.js';
import {createObstacle} from '/src/game/obstacles.js';
import {createPortalTransition,advancePortalTransition} from '/src/game/portal-transition.js';
import {getBossGeometry} from '/src/game/boss-geometry.js';

const query=new URLSearchParams(location.search),portals=query.has('portals');
if(portals)document.body.classList.add('portals');
if(query.has('single'))document.body.classList.add('single');
if(query.has('dpr'))Object.defineProperty(window,'devicePixelRatio',{value:Number(query.get('dpr'))});
const assets=createVisualAssetLoader(),loaded=await assets.preload();
const engine=createGameEngine({guestMode:true,gravity:0});engine.start();const base=engine.getSnapshot();
const names=['RECHARGE 25%','RECHARGE 92%','READY · RING HIDDEN','TWO LINES · WARNING','TWO LINES · FIRING','SPECIAL WALL + SIGNATURE','FIXED PORTAL · HIGH FLIGHT','FIXED PORTAL · LOW FLIGHT','ADMIN · ACTUAL HITBOX'];
const cards=portals?STAGE_CATALOG.map(s=>s.name+' · FIXED FULL-HEIGHT PORTAL'):names;
const selected=query.has('single')?[Number(query.get('single'))]:cards.map((_,i)=>i);
for(const index of selected){
  const article=document.createElement('article'),heading=document.createElement('h2'),canvas=document.createElement('canvas');heading.textContent=cards[index];article.append(heading,canvas);document.querySelector('main').append(article);
  const renderer=createRenderer(canvas,{visualAssets:assets,reducedMotion:query.has('reduced')});
  const snapshot=structuredClone(base),stage=STAGE_CATALOG[portals?index:0];
  snapshot.elapsedSeconds=2.3;snapshot.stage={...snapshot.stage,id:stage.id,mode:'normal',elapsedSeconds:2.3,transition:null};
  snapshot.difficulty={...snapshot.difficulty,scrollSpeed:320};snapshot.obstacles=[];
  snapshot.player.y=270;snapshot.player.dashCooldownRemainingSeconds=index===0?.75:index===1?.08:0;
  snapshot.flightTrail=Array.from({length:30},(_,i)=>({x:223-i*7,y:270+Math.sin(i*.15)*20,ageSeconds:i*.02}));
  if(!portals&&index>=3&&index<=5){
    snapshot.difficulty.isBoss=true;snapshot.stage.mode='boss';snapshot.boss=createBossEncounter(1,stage.id);snapshot.boss.entranceRemainingSeconds=0;
    if(index===5){
      const muzzle=getBossGeometry(stage.id).muzzle;
      snapshot.boss.attack=createSignatureAttack({stageId:stage.id,bossX:muzzle.x,bossY:muzzle.y,rng:()=>.5});
      updateSignatureAttack(snapshot.boss.attack,.6);
      snapshot.obstacles=[createObstacle({id:'qa-special',x:500,gapCenter:270,gapHeight:160,kind:'hybrid',stageId:stage.id})];
    }else{
      snapshot.boss.attack={id:'qa-laser',type:'laser',...createSingleLaser({lineCount:2,gapCenter:270,gapHeight:180,rng:()=>.2})};
      if(index===4)updateLaser(snapshot.boss.attack,1.1);
      snapshot.obstacles=[createObstacle({id:'qa-normal',x:470,gapCenter:270,gapHeight:180,stageId:stage.id})];
    }
  }
  if(portals||index===6||index===7){
    const destination=portals?stage:STAGE_CATALOG[1],source=STAGE_CATALOG[(STAGE_CATALOG.indexOf(destination)+5)%6];
    snapshot.stage.id=source.id;snapshot.stage.mode='boss';snapshot.difficulty.isBoss=false;
    snapshot.player.y=index%2?480:60;snapshot.flightTrail=[];
    const transition=createPortalTransition({fromKey:source.bossBackgroundKey,toKey:destination.backgroundKey,fromStageId:source.id,destinationStageId:destination.id,crossingY:snapshot.player.y});
    advancePortalTransition(transition,3.4,320);snapshot.stage.transition=transition;
  }
  renderer.render(snapshot,{showPlayerHitbox:!portals&&index===8});
}
document.querySelector('#status').textContent=`READY · ${loaded.loaded.length} assets loaded · ${loaded.failed.length} failures · DPR ${devicePixelRatio}`;
