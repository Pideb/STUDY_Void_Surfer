import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='.memory/validation/2026-11-02-v01-gameplay-visual-polish';
const tab=await fetch('http://127.0.0.1:9445/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(tab.webSocketDebuggerUrl),pending=new Map(),errors=[];let id=0;
await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const job=pending.get(m.id);if(job){clearTimeout(job.timer);pending.delete(m.id);m.error?job.reject(m.error):job.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method)),15000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
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
  renderer.render({score:20,player:{x:240,y:270,velocityY:0,width:36,height:24},aircraft:{id:'default'},obstacles:kind==='quarter'?[]:[wall],difficulty:{scrollSpeed:300,timingWindowSeconds:.3},stage:{id:stageId,mode:attack?'boss':'normal',elapsedSeconds:2},boss:attack?{attack,hp:3}:null});
  return canvas.toDataURL();
 };
})()`);
assert.equal((await evaluate('loaded.failed.length')),0);
const shots=[];
for(const stage of await evaluate('stageIds'))for(const kind of ['moving','special','hybrid','projectile','single','quarter']){
 const variants=['special','hybrid'].includes(kind)?[false,true]:[false];
 for(const broken of variants){const data=await evaluate(`drawScene(${JSON.stringify(stage)},${JSON.stringify(kind)},${broken})`);const file=`${stage}-${kind}${broken?'-broken':''}.png`;fs.writeFileSync(dir+'/'+file,Buffer.from(data.split(',')[1],'base64'));shots.push(file);}
}
assert.equal(errors.length,0);fs.writeFileSync(dir+'/runtime-visual-check.json',JSON.stringify({loaded:await evaluate('loaded.loaded.length'),shots,errors},null,2));
ws.close();console.log(JSON.stringify({shots:shots.length,errors:errors.length}));
