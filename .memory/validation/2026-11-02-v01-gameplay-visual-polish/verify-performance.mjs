import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='.memory/validation/2026-11-02-v01-gameplay-visual-polish';
const tab=await fetch('http://127.0.0.1:9445/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(tab.webSocketDebuggerUrl),pending=new Map(),errors=[];let id=0;
await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const job=pending.get(m.id);if(job){clearTimeout(job.timer);pending.delete(m.id);m.error?job.reject(m.error):job.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method)),45000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
await send('Runtime.enable');await send('Page.enable');
await send('Page.navigate',{url:'http://127.0.0.1:5173/'+dir+'/render-check.html'});
for(let n=0;n<30;n++){if(await evaluate('Boolean(document.getElementById("scene"))'))break;await new Promise(r=>setTimeout(r,100));}
await evaluate(`(async()=>{
 const [{createVisualAssetLoader},{createRenderer},{STAGE_CATALOG},{createObstacle}]=await Promise.all([import('/src/game/visual-assets.js'),import('/src/game/renderer.js'),import('/src/game/stages.js'),import('/src/game/obstacles.js')]);
 const assets=createVisualAssetLoader();window.loaded=await assets.preload();window.canvas=document.getElementById('scene');window.renderer=createRenderer(canvas,{visualAssets:assets,reducedMotion:true});window.stageIds=STAGE_CATALOG.map(s=>s.id);
 window.drawScene=(stageId,kind,broken=false)=>{
  const wall=createObstacle({id:'wall',x:490,gapCenter:270,gapHeight:180,stageId,kind:kind==='hybrid'?'hybrid':kind==='special'?'special':'normal',movingGap:kind==='moving',gapMotionCycleSeconds:4.8,showTimingGuide:true,rng:()=>.3});
  if(broken){wall.barrierBroken=true;wall.barrierBreakY=270;wall.breakEffect={centerY:270,remainingSeconds:.3,durationSeconds:.65,seed:1};}
  const attack=kind==='projectile'?{type:'volley',stageId,projectiles:[{type:'projectile',stageId,state:'flying',x:580,y:270},{type:'projectile',stageId,state:'flying',x:700,y:180}]}:kind==='single'||kind==='quarter'?{type:'laser',stageId,kind,y:180,thickness:18,safeZone:2,zoneHeight:135,telegraphRemainingSeconds:0,activeRemainingSeconds:.4,activeElapsedSeconds:.12,elapsedSeconds:2}:null;
  renderer.render({feedbackEffect:window.penalty??null,score:20,player:{x:240,y:270,velocityY:0,width:36,height:24},aircraft:{id:'default'},obstacles:kind==='quarter'?[]:[wall],difficulty:{scrollSpeed:300,timingWindowSeconds:.3},stage:{id:stageId,mode:attack?'boss':'normal',elapsedSeconds:2},boss:attack?{attack,hp:3}:null});
  return window.skipCapture?null:canvas.toDataURL();
 };
})()`);
assert.equal((await evaluate('loaded.failed.length')),0);

await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
const result=await evaluate(`(async()=>{
 const {createGameHud:beforeHud}=await import('./hud-before.mjs'),{createGameHud:afterHud}=await import('/src/ui/game-hud.js');
 const summary=values=>{values.sort((a,b)=>a-b);return{p50:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],p99:values[Math.floor(values.length*.99)]};};
 const hudResults={};const model={muted:false,getMuted:()=>false},handlers={toggleMute(){},pause(){},space(){},fire(){}};
 const snap={score:20,challenge:{active:true,sequence:['KeyW','KeyA','KeyS','KeyD'],cursor:1,remainingSeconds:3,timeLimitSeconds:4},boss:{hp:3,weapon:{chargeSeconds:5,rechargeSeconds:10,ready:false}}};
 for(const [name,create]of[['before',beforeHud],['after',afterHud]]){const hud=create(model,handlers);document.body.append(hud.element);hud.update(snap);const observer=new MutationObserver(()=>{});observer.observe(hud.element,{subtree:true,attributes:true,childList:true,characterData:true});const times=[];for(let i=0;i<1000;i++){const t=performance.now();hud.update(snap);times.push(performance.now()-t);}hudResults[name]={...summary(times),domWrites:observer.takeRecords().length};observer.disconnect();hud.element.remove();}
 const {createRenderer:oldRenderer}=await import('./renderer-before.mjs'),{createVisualAssetLoader}=await import('/src/game/visual-assets.js');const assets=createVisualAssetLoader();await assets.preload();const after=renderer,before=oldRenderer(canvas,{visualAssets:assets,reducedMotion:true});
 window.skipCapture=true;const renderResults={};for(const [name,r]of[['before',before],['after',after]]){window.renderer=r;for(let i=0;i<10;i++)drawScene('crystal-gates','quarter');const times=[];for(let i=0;i<40;i++){const t=performance.now();drawScene('crystal-gates','quarter');times.push(performance.now()-t);}renderResults[name]={...summary(times),canvasWidth:canvas.width,canvasHeight:canvas.height};}
 window.skipCapture=false;window.renderer=before;const beforePixels=drawScene('crystal-gates','quarter');window.renderer=after;const pixelsEqual=beforePixels===drawScene('crystal-gates','quarter');window.skipCapture=true;const failure={};window.penalty={kind:'glitch',durationSeconds:8,remainingSeconds:7};for(const [name,r]of[['before',before],['after',after]]){window.renderer=r;const times=[];for(let i=0;i<10;i++){const t=performance.now();drawScene('crystal-gates','quarter');times.push(performance.now()-t);}failure[name]=summary(times);}window.penalty=null;window.renderer=after;before.destroy();return{pixelsEqual,hud:hudResults,render:renderResults,failure,heapEstimate:performance.memory?.usedJSHeapSize??null,userAgent:navigator.userAgent};
})()`);
assert.equal(result.pixelsEqual,true);assert.equal(result.hud.after.domWrites,0);assert.ok(result.hud.before.domWrites>0);assert.equal(errors.length,0);fs.writeFileSync(dir+'/performance-comparison.json',JSON.stringify({conditions:'Same headless Edge software GPU,1920x1080,native render budget; render timing excludes screenshot encoding; software raster timing is not user FPS.',result,errors},null,2));ws.close();console.log(JSON.stringify(result.hud));
