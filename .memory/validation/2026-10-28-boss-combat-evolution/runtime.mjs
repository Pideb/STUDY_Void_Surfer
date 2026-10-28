import {createRenderer} from '/src/game/renderer.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createGameEngine} from '/src/game/game-engine.js';
import {STAGE_CATALOG} from '/src/game/stages.js';
import {createBossEncounter} from '/src/game/boss.js';
import {createSignatureAttack,updateSignatureAttack} from '/src/game/boss-signatures.js';
import {getBossGeometry} from '/src/game/boss-geometry.js';
import {createPortalTransition,advancePortalTransition} from '/src/game/portal-transition.js';

const query=new URLSearchParams(location.search);
const mode=query.get('mode')??'boss', single=query.has('stage');
const time=Number(query.get('t')??2.3), reduced=query.has('reduced');
if(query.has('dpr'))Object.defineProperty(window,'devicePixelRatio',{value:Number(query.get('dpr'))});
if(single)document.body.classList.add('single');
window.qaErrors=[];addEventListener('error',e=>window.qaErrors.push(e.message));
const assets=createVisualAssetLoader();const loaded=await assets.preload();
const engine=createGameEngine({guestMode:true,gravity:0});engine.start();
const base=engine.getSnapshot();
const stages=single?[STAGE_CATALOG[Number(query.get('stage'))]]:STAGE_CATALOG;
const panels=stages.map((stage,index)=>{
  const article=document.createElement('article'),title=document.createElement('h2'),canvas=document.createElement('canvas');
  title.textContent=`${stage.name} · ${mode==='portal'?'DESTINATION PORTAL':'BOSS / SIGNATURE'}`;
  article.append(title,canvas);document.querySelector('main').append(article);
  return{stage,index,renderer:createRenderer(canvas,{visualAssets:assets,reducedMotion:reduced})};
});
function render(t){
  for(const{stage,index,renderer}of panels){
    const snapshot=structuredClone(base);
    snapshot.elapsedSeconds=t;snapshot.backgroundScrollDistancePx=t*80;
    snapshot.stage={...snapshot.stage,id:stage.id,mode:mode==='portal'?'normal':'boss',elapsedSeconds:t,transition:null};
    snapshot.difficulty={...snapshot.difficulty,isBoss:mode!=='portal',bossPattern:'slow',scrollSpeed:320};
    snapshot.aircraft={...snapshot.aircraft,id:['default','aegis','velocity'][index%3]};
    snapshot.flightTrail=Array.from({length:24},(_,i)=>({x:223-i*7,y:270+Math.sin(i*.16)*20,ageSeconds:i*.018}));
    snapshot.obstacles=[];
    if(mode==='portal'){
      const source=STAGE_CATALOG[(STAGE_CATALOG.indexOf(stage)+5)%6];
      const transition=createPortalTransition({fromKey:source.bossBackgroundKey,toKey:stage.backgroundKey,fromStageId:source.id,destinationStageId:stage.id});
      advancePortalTransition(transition,Number(query.get('phaseTime')??1.95),320);
      snapshot.stage.transition=transition;snapshot.stage.id=transition.swapped?stage.id:source.id;
      snapshot.boss=null;
    }else{
      const boss=createBossEncounter(index+1,stage.id);boss.entranceRemainingSeconds=0;
      boss.animation={kind:query.get('action')??'charge',elapsedSeconds:t%1.1,durationSeconds:1.1,actionId:'qa-action'};
      const origin=getBossGeometry(stage.id).muzzle;
      boss.attack=createSignatureAttack({id:'qa-volley',stageId:stage.id,bossNumber:index+1,bossX:origin.x,bossY:origin.y,playerY:270,rng:()=>.5});
      updateSignatureAttack(boss.attack,query.has('firing')?1.9:.6,{...snapshot.player,y:520});
      snapshot.boss=boss;
      // Signature volleys run after the wall wave has left, as in the real scheduler.
      if(query.has('roar')){snapshot.obstacles=[];boss.attack=null;boss.roar={id:'qa-roar',elapsedSeconds:.4,durationSeconds:.8};boss.animation={kind:'roar',elapsedSeconds:.4,durationSeconds:.8};}
    }
    renderer.render(snapshot);
  }
}
render(time);
document.querySelector('#status').textContent=`READY · ${loaded.loaded.length} loaded · ${loaded.failed.length} failed · DPR ${devicePixelRatio} · ${reduced?'reduced motion':'full motion'}`;
window.qaReady={loaded:loaded.loaded.length,failed:loaded.failed,errors:window.qaErrors};
if(query.has('animate')){const started=performance.now();const tick=now=>{render(time+(now-started)/1000);requestAnimationFrame(tick)};requestAnimationFrame(tick)}
