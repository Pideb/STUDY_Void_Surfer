import {createRenderer} from '/src/game/renderer.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createGameEngine} from '/src/game/game-engine.js';
import {createGameHud} from '/src/ui/game-hud.js';
import {createStageShuffleBag,STAGE_CATALOG} from '/src/game/stages.js';
const params=new URLSearchParams(location.search),mode=params.get('mode')||'desktop';
const assets=createVisualAssetLoader(),loaded=await assets.preload();if(loaded.failed.length)throw Error('Missing assets');
const canvas=document.querySelector('#scene'),renderer=createRenderer(canvas,{visualAssets:assets});
const hud=createGameHud({getMuted:()=>false},{pause(){},toggleMute(){},space(){},fire(){},challengeKey(){}});document.querySelector('#ui').append(hud.element);
const send=async(type,id,body)=>{const r=await fetch(`/aimqa/${type}/${id}`,{method:'POST',body});if(!r.ok)throw Error(await r.text());};
const save=async(id,c=canvas)=>send('png',id,await new Promise(resolve=>c.toBlob(resolve,'image/png')));
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const stageSeeds=new Map();for(let i=0;i<100;i++){const seed=Math.imul(i,2654435761);stageSeeds.set(createStageShuffleBag(seeded(seed))[0],seed);}
function runtime(extra={}){
  let time=0;const engine=createGameEngine({now:()=>time,gravity:0,rng:()=>.6,stageRng:()=>.999,initialScore:200,initialCompletedWarningCount:3,guestMode:true,invincibilityEnabled:true,...extra});engine.start();hud.update(engine.getSnapshot());
  const tick=(dt=.05)=>{time+=dt*1000;engine.update(time);const s=engine.getSnapshot();hud.update(s);return s;};
  const until=predicate=>{for(let i=0;i<20000;i++){const s=engine.getSnapshot();if(predicate(s))return s;if(s.challenge?.active)for(const code of s.challenge.sequence)engine.handleChallengeKey(code);tick();}throw Error('Fixture timeout '+mode);};
  return {engine,tick,until};
}
function draw(s){renderer.render(s);hud.update(s);}
const bbox=element=>{const b=element.getBoundingClientRect();return {left:b.left,top:b.top,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
const aim=s=>s.boss?.weapon.ready&&!s.challenge?.active&&Math.abs(270+162*Math.sin((s.boss.motionSeconds+.5)*Math.PI/3)-s.player.y)<25;
const record={mode,fixture:'Actual public engine/renderer/HUD/CSS; gravity0 and collision bypass only for reproducible capture. No snapshot geometry or hazard injection.',assets:loaded.loaded.length,failedAssets:loaded.failed};
try{
  let s;
  if(mode==='motion'){
    const board=document.createElement('canvas');board.width=1440;board.height=1536;const c=board.getContext('2d');c.fillStyle='#07101c';c.fillRect(0,0,1440,1536);record.bosses=[];
    for(let row=0;row<STAGE_CATALOG.length;row++){
      const stage=STAGE_CATALOG[row],id=stage.id,{engine,tick,until}=runtime({stageRng:seeded(stageSeeds.get(id))});
      const frames=[until(s=>s.boss?.motionSeconds>=1.5),until(s=>s.boss?.motionSeconds>=4.5),until(s=>s.boss?.pose.charge>.55),until(s=>s.boss?.pose.roar>.55)];
      record.bosses.push({stageId:id,frames:frames.map(s=>({motionSeconds:s.boss.motionSeconds,center:s.boss.geometry.center,pose:s.boss.pose}))});
      for(let col=0;col<4;col++){
        const state=frames[col];draw(state);const g=state.boss.geometry,top=Math.max(0,Math.min(320,g.center.y-110));
        c.drawImage(canvas,700/960*canvas.width,top/540*canvas.height,260/960*canvas.width,220/540*canvas.height,col*360,row*256+28,350,220);
        c.fillStyle='#dbf2ff';c.font='13px system-ui';c.fillText(id+' / '+['lower extreme','upper extreme','charge','roar'][col],col*360+8,row*256+18);
      }
      s=frames.at(-1);
    }
    if(params.has('capture'))await save('boss-actions-actual',board);
  }else{
    const {engine,tick,until}=runtime({aircraftId:mode==='aegis-hit'?'aegis':'default',
      initialCompletedWarningCount:['intro','entrance','drain'].includes(mode)?1:mode==='passed'?0:3,
      initialScore:mode==='drain'?29:mode==='passed'?19:200,
      rng:()=>mode==='warning-bottom'?.99:mode==='passed'?0:.6});
    if(mode==='intro')s=until(s=>s.bossEntry?.phase==='alert');
    else if(mode==='entrance')s=until(s=>s.bossEntry?.phase==='entering'&&s.boss.entranceRemainingSeconds<.55&&s.boss.entranceRemainingSeconds>.4);
    else if(mode==='drain')s=until(s=>s.bossEntry?.phase==='draining'&&s.obstacles.length>0);
    else if(mode==='passed'){
      s=until(s=>s.obstacles.some(w=>w.passed&&w.showTimingGuide&&Number.isFinite(w.timingGuideWidthPx)));
      const wall=s.obstacles.find(w=>w.passed&&w.showTimingGuide);record.passedGuide={storedWidth:wall.timingGuideWidthPx,liveWidth:s.difficulty.scrollSpeed*s.difficulty.timingWindowSeconds};
    }
    else if(mode==='warning-bottom')s=until(s=>s.boss?.attack?.kind==='quarter'&&s.boss.attack.safeZone===3&&s.boss.attack.telegraphRemainingSeconds>1.5);
    else if(mode==='warning')s=until(s=>s.boss?.attack?.kind==='quarter'&&s.boss.attack.telegraphRemainingSeconds>1.5);
    else if(mode==='active')s=until(s=>s.boss?.attack?.kind==='quarter'&&s.boss.attack.telegraphRemainingSeconds===0&&s.boss.attack.activeRemainingSeconds<.7&&s.boss.attack.activeRemainingSeconds>.4);
    else if(mode==='challenge')s=until(s=>s.challenge?.active);
    else if(['hit','miss','aegis-hit'].includes(mode)){
      const before=until(mode==='miss'?s=>s.boss?.weapon.ready&&!s.challenge?.active&&Math.abs(Math.sin((s.boss.motionSeconds+.6)*Math.PI/3))>.96:aim);
      record.beforeHp=before.boss.hp;if(!engine.fire())throw Error('Fire rejected');for(let i=0;i<5;i++)s=tick(.1);record.afterHp=s.boss.hp;record.laserHits=s.boss.laserHits;
    }else s=until(s=>s.boss?.weapon.ready&&s.obstacles.length>0&&!s.challenge?.active);
  }
  draw(s);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));draw(s);
  record.viewport={width:innerWidth,height:innerHeight,dpr:devicePixelRatio};record.buffer={width:canvas.width,height:canvas.height};record.canvas=bbox(canvas);record.reactor=bbox(document.querySelector('.weapon-hud'));
  record.fireButton={display:getComputedStyle(document.querySelector('.mobile-fire-button')).display,bounds:bbox(document.querySelector('.mobile-fire-button'))};
  record.overflow=document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight;
  record.boss=s.boss?{number:s.boss.number,phase:s.boss.cyclePhase,hp:s.boss.hp,geometry:s.boss.geometry,motionSeconds:s.boss.motionSeconds}:null;
  record.bossEntry=s.bossEntry;record.wallCount=s.obstacles.length;
  record.challenge=s.challenge?.active?{sequence:s.challenge.sequence,remainingSeconds:s.challenge.remainingSeconds}:null;
  record.text={headings:document.querySelectorAll('.wasd-challenge-overlay h2').length,sequences:document.querySelectorAll('.challenge-sequence').length,combatSentences:document.querySelectorAll('.hud-combat-status').length};
  window.ActualBossReview={renderer,hud,snapshot:s,record};document.title='READY '+mode;
  if(params.has('capture')){await save(mode);await send('json',mode,JSON.stringify(record));await send('done',mode,'ok');}
}catch(error){document.title='ERROR '+mode;document.body.dataset.error=error.stack;await send('json',mode,JSON.stringify({error:error.stack}));await send('done',mode,'error');throw error;}
