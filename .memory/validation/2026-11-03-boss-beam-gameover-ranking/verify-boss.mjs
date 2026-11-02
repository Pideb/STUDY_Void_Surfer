import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='.memory/validation/2026-11-03-boss-beam-gameover-ranking';
const tab=await fetch('http://127.0.0.1:9451/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(tab.webSocketDebuggerUrl),jobs=new Map();let id=0;
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const job=jobs.get(m.id);if(job){jobs.delete(m.id);m.error?job.reject(m.error):job.resolve(m.result);}}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
await send('Page.navigate',{url:'http://127.0.0.1:5174/guide/index.html'});await new Promise(r=>setTimeout(r,600));
async function verify(){
 const {createBossBeamContact}=await import('/src/game/boss-hit-mask.js');
 const {getBossGeometry}=await import('/src/game/boss-geometry.js');
 const {getBossArtBounds}=await import('/src/game/boss-beam.js');
 const {BOSS_RIGS}=await import('/src/game/boss-rigs.js');
 const {getPreparedBossRig,drawBossRig,getBossRecoil}=await import('/src/game/boss-motion.js');
 const {VISUAL_ASSET_MANIFEST}=await import('/src/game/visual-assets.js');
 const images=new Map();for(const stage of Object.keys(BOSS_RIGS)){const image=new Image();image.src=VISUAL_ASSET_MANIFEST.stages[stage].boss;await image.decode();images.set(`stages.${stage}.boss`,image);}
 let maskReads=0,reduced=false;
 const contact=createBossBeamContact({get:key=>images.get(key)},{reducedMotion:()=>reduced,makeCanvas:(w,h)=>{const c=new OffscreenCanvas(w,h),ctx=c.getContext('2d',{willReadFrequently:true});return {getContext:()=>({clearRect:ctx.clearRect.bind(ctx),drawImage:ctx.drawImage.bind(ctx),getImageData(...a){maskReads++;return ctx.getImageData(...a);}})};}});
 const canvas=new OffscreenCanvas(960,540),ctx=canvas.getContext('2d',{willReadFrequently:true});
 const sheet=document.createElement('canvas');sheet.width=960;sheet.height=810;const sc=sheet.getContext('2d');sc.fillStyle='#08101e';sc.fillRect(0,0,960,810);
 const results=[];
 for(const [index,stageId]of Object.keys(BOSS_RIGS).entries()){
  const image=images.get(`stages.${stageId}.boss`),rig=BOSS_RIGS[stageId];let misses=0,hits=0,oldFalseHits=0,example=null,mismatches=[];
  for(const [time,action]of [[0,{}],[.6,{}],[1.5,{}],[3.4,{}],[.6,{charge:1}],[.6,{roar:1}],[.6,{fire:1}],[.6,{hit:1}],[.6,{roar:1,reduced:true}]]){
   reduced=Boolean(action.reduced);
   const pose={time,charge:0,fire:0,roar:0,hit:0,...action},geometry=getBossGeometry(stageId,1,time,getBossRecoil(pose));
   ctx.clearRect(0,0,960,540);drawBossRig(ctx,{rig,prepared:getPreparedBossRig(stageId,image),pose,box:geometry.box,geometryIncludesRecoil:true,reducedMotion:reduced});
   const data=ctx.getImageData(0,0,960,540).data,bounds=getBossArtBounds(stageId,geometry,pose);
   for(let y=6;y<534;y+=2){
    let ink=false;for(let v=y-6;v<=y+6&&!ink;v++)for(let x=268;x<960;x++)if(data[(v*960+x)*4+3]>=64){ink=true;break;}
    const input={stageId,shot:{fromX:240,fromY:y},fromMotionSeconds:time,toMotionSeconds:time,poseAt:()=>pose};
    const hit=contact(input);
    if(!ink){misses++;if(hit)mismatches.push({time,y,action});if(y+4>=bounds.top&&y-4<=bounds.bottom){oldFalseHits++;example??={time,y};}}
    if(hit)hits++;
   }
  }
  // Warmed shot queries must not re-read pixels.
  reduced=false;const before=maskReads;for(let i=0;i<20;i++)contact({stageId,shot:{fromX:240,fromY:270},fromMotionSeconds:0,toMotionSeconds:.01});
  if(maskReads!==before)throw Error('Per-frame raster read');
  results.push({stageId,misses,hits,oldFalseHits,example,mismatches});
  const time=example?.time??0,pose={time,charge:0,fire:0,roar:0,hit:0},geometry=getBossGeometry(stageId,1,time);
  ctx.clearRect(0,0,960,540);drawBossRig(ctx,{rig,prepared:getPreparedBossRig(stageId,image),pose,box:geometry.box,geometryIncludesRecoil:true});
  if(example){ctx.strokeStyle='#ff6c7b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(240,example.y);ctx.lineTo(960,example.y);ctx.stroke();}
  sc.drawImage(canvas,index%2*480,Math.floor(index/2)*270,480,270);sc.fillStyle='#d7f5ff';sc.font='16px sans-serif';sc.fillText(stageId,index%2*480+16,Math.floor(index/2)*270+24);
 }
 return {results,maskReads,image:sheet.toDataURL('image/png')};
}
const result=await send('Runtime.evaluate',{expression:'('+verify.toString()+')()',awaitPromise:true,returnByValue:true});
if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));const value=result.result.value;
fs.writeFileSync(dir+'/boss-transparent-misses.png',Buffer.from(value.image.split(',')[1],'base64'));delete value.image;
fs.writeFileSync(dir+'/boss-browser.json',JSON.stringify(value,null,2)+'\n');
console.log(JSON.stringify(value));
assert.ok(value.results.every(x=>x.hits>0&&x.misses>0&&x.mismatches.length===0));assert.ok(value.results.some(x=>x.oldFalseHits>0));
await send('Browser.close');ws.close();
