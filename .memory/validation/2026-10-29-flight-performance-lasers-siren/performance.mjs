import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createGameEngine} from '/src/game/game-engine.js';
const q=new URLSearchParams(location.search),id=q.get('id')||'baseline-desktop';
const {createRenderer}=await import(q.has('baseline')?'./baseline-renderer.mjs':'/src/game/renderer.js');
const send=async(type,name,body)=>{const r=await fetch(`/flightqa/${type}/${name}`,{method:'POST',body});if(!r.ok)throw Error(await r.text());};
const png=async name=>send('png',name,await new Promise(r=>canvas.toBlob(r,'image/png')));
const canvas=document.querySelector('#scene'),assets=createVisualAssetLoader(),loaded=await assets.preload();
if(q.has('dpr'))Object.defineProperty(globalThis,'devicePixelRatio',{configurable:true,value:Number(q.get('dpr'))});
const renderer=createRenderer(canvas,{visualAssets:assets,...(q.has('reference')?{renderDensities:{background:1,walls:1,projectiles:1,lasers:1}}:{})});
function fixture(extra){let clock=0;const engine=createGameEngine({now:()=>clock,gravity:0,rng:()=>.99,stageRng:()=>.999,initialScore:200,initialCompletedWarningCount:3,invincibilityEnabled:true,...extra});engine.start();
return {engine,until:predicate=>{for(let i=0;i<30000;i++){const s=engine.getSnapshot();if(predicate(s))return s;if(s.challenge?.active)for(const key of s.challenge.sequence)engine.handleChallengeKey(key);clock+=50;engine.update(clock);}throw Error('Fixture timeout');}};}
const warmup=q.has('quick')?1:60,sampleCount=q.has('quick')?1:180;
const raf=()=>new Promise(r=>requestAnimationFrame(r));
const stats=a=>{const sorted=[...a].sort((a,b)=>a-b);return {median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)]};};
try{
 const normal=fixture({initialScore:10,initialCompletedWarningCount:0}),boss=fixture();
 const scenes=[['walls',normal.until(s=>s.obstacles.length>=3)],['volley',boss.until(s=>s.boss?.cyclePhase==='signature'&&s.boss.attack?.projectiles?.some(p=>p.state==='flying'))],['global',boss.until(s=>s.boss?.attack?.kind==='quarter'&&s.boss.attack.activeElapsedSeconds>.4)]];
 const challenge=boss.until(s=>s.challenge?.active),wrong=['KeyW','KeyA','KeyS','KeyD'].find(k=>k!==challenge.challenge.sequence[0]);boss.engine.handleChallengeKey(wrong);scenes.push(['failure',boss.engine.getSnapshot()]);
 const record={id,warmup,sampleCount,sourceCommit:q.get('commit'),browser:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},buffer:{width:canvas.width,height:canvas.height},assets:loaded,method:'Static matched public-engine snapshots;60 warmup +180 RAF samples per scene. Draw-submit and synchronous1px readback flush durations separate; headless --disable-gpu, not physical display FPS.',scenes:[]};
 for(const [name,snapshot]of scenes){
  for(let i=0;i<warmup;i++){renderer.render(snapshot);canvas.getContext('2d').getImageData(0,0,1,1);}
  const draw=[],flush=[],frames=[];let previous=performance.now();
  for(let i=0;i<sampleCount;i++){await raf();const now=performance.now();frames.push(now-previous);previous=now;const start=performance.now();renderer.render(snapshot);const submitted=performance.now();canvas.getContext('2d').getImageData(0,0,1,1);draw.push(submitted-start);flush.push(performance.now()-start);}
  record.scenes.push({name,drawMs:stats(draw),flushedMs:stats(flush),frameIntervalMs:stats(frames),snapshot,layers:renderer.getLayerStats?.()??null});await png(id+'-'+name);
 }
 record.buffer={width:canvas.width,height:canvas.height};await send('json',id,JSON.stringify(record));await send('done',id,'ok');document.title='DONE '+id;
}catch(e){await send('json',id,JSON.stringify({error:e.stack}));await send('done',id,'error');document.title='ERROR';throw e;}
