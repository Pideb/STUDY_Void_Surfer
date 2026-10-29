const baseline=new URLSearchParams(location.search).get('revision')==='baseline';
const {createRenderer}=await import(baseline?'./renderer-baseline.mjs':'/src/game/renderer.js');
import { createVisualAssetLoader } from '/src/game/visual-assets.js';
import { createGameEngine } from '/src/game/game-engine.js';
import { createGameHud } from '/src/ui/game-hud.js';
const assets=createVisualAssetLoader(),loaded=await assets.preload();
const canvas=document.querySelector('#scene'),renderer=createRenderer(canvas,{visualAssets:assets});
const hud=createGameHud({getMuted:()=>false},{pause(){},toggleMute(){},space(){},fire(){},challengeKey(){}});
document.querySelector('#ui').append(hud.element);
const boss=new URLSearchParams(location.search).get('boss')==='1';let time=0;
const engine=createGameEngine({now:()=>time,gravity:0,rng:()=>.6,stageRng:()=>.5,initialScore:boss?20:10,
  initialNextBossScore:boss?20:99999,invincibilityEnabled:true});
engine.start();
for(let i=0;i<1000;i++){time+=50;engine.update(time);const s=engine.getSnapshot();
  if(boss?s.boss&&!s.bossEntry&&s.obstacles.length>=3:s.obstacles.length>=3)break;}
window.runMeasurement=async()=>{
  const intervals=[],durations=[];let last=null,count=0;
  await new Promise(resolve=>{function frame(timestamp){
    const elapsed=last===null?16.667:timestamp-last;last=timestamp;
    // Fixed benchmark simulation step makes both runs render the same timeline,
    // independent of how slow the actual RAF delivery is. Production is unchanged.
    time+=1000/60;engine.update(time);
    const snapshot=engine.getSnapshot(),start=performance.now();renderer.render(snapshot);hud.update(snapshot);
    if(count++>=20){intervals.push(elapsed);durations.push(performance.now()-start);}
    if(intervals.length<90)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
  const sorted=values=>values.toSorted((a,b)=>a-b),percentile=(values,q)=>sorted(values)[Math.floor((values.length-1)*q)];
  const s=engine.getSnapshot();
  return {scenario:boss?'boss':'normal',viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},buffer:{width:canvas.width,height:canvas.height},
    layers:renderer.getLayerStats(),frames:intervals.length,medianFrameMs:percentile(intervals,.5),p95FrameMs:percentile(intervals,.95),
    over33ms:intervals.filter(n=>n>33.4).length,medianDrawAndHudMs:percentile(durations,.5),p95DrawAndHudMs:percentile(durations,.95),
    failedAssets:loaded.failed,player:{x:s.player.x,y:s.player.y},nativeRaf:true,
    simulationStepMs:1000/60,method:'Actual engine/art/renderer/HUD; deterministic gravity0/invincible, fixed benchmark simulation step, private Edge headless --disable-gpu. Baseline pins prior resolution policy; not physical-GPU FPS.'};
};
window.fixtureReady=true;
