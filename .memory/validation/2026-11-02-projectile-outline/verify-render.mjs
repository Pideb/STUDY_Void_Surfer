import fs from 'node:fs';import assert from 'node:assert/strict';
const dir='.memory/validation/2026-11-02-projectile-outline',origin='http://127.0.0.1:5174';
const tab=await fetch('http://127.0.0.1:9449/json/new?about:blank',{method:'PUT'}).then(r=>r.json()),ws=new WebSocket(tab.webSocketDebuggerUrl),jobs=new Map(),exceptions=[];let id=0;
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const job=jobs.get(m.id);if(job){clearTimeout(job.timer);jobs.delete(m.id);m.error?job.reject(m.error):job.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method)),20000);jobs.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:origin+'/.memory/validation/2026-11-02-v01-gameplay-visual-polish/render-check.html'});
await evaluate(`(async()=>{
 const [{createVisualAssetLoader},oldMaterial,newMaterial,oldRenderer,newRenderer,{STAGE_CATALOG},{getStageVisualTheme}]=await Promise.all([import('/src/game/visual-assets.js'),import('/${dir}/visual-materials-before.mjs'),import('/src/game/visual-materials.js'),import('/${dir}/renderer-before.mjs'),import('/src/game/renderer.js'),import('/src/game/stages.js'),import('/src/game/visual-theme.js')]);
 window.assets=createVisualAssetLoader();window.loaded=await assets.preload();window.stages=STAGE_CATALOG;window.oldMaterial=oldMaterial;window.newMaterial=newMaterial;window.getTheme=getStageVisualTheme;
 window.canvas=document.querySelector('canvas');window.renderers=[oldRenderer.createRenderer(canvas,{visualAssets:assets,reducedMotion:true}),newRenderer.createRenderer(canvas,{visualAssets:assets,reducedMotion:true})];
 window.draw=(stageId,version)=>{const shots=[{type:'projectile',state:'flying',x:460,y:215},{type:'projectile',state:'flying',role:'parent',x:635,y:285},{type:'projectile',state:'returning',x:790,y:235}].map(s=>({...s,stageId,bossX:850,bossY:200}));renderers[version].render({score:35,player:{x:240,y:270,width:36,height:24,velocityY:0},aircraft:{id:'default'},difficulty:{scrollSpeed:350,timingWindowSeconds:.3,isBoss:true},stage:{id:stageId,mode:'boss',elapsedSeconds:2},obstacles:[{kind:'normal',x:550,width:72,gapCenter:270,gapHeight:135,stageId}],boss:{hp:3,attack:{type:'volley',stageId,projectiles:shots}}});return canvas.toDataURL();};
})()`);
assert.equal(await evaluate('loaded.failed.length'),0);
const files=[];
for(const [size,width,height]of[['desktop',1920,1080],['mobile',844,390]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:size==='mobile'});
 for(const stage of await evaluate('stages.map(s=>s.id)'))for(const version of[0,1]){
  const data=await evaluate(`draw(${JSON.stringify(stage)},${version})`),file=`${stage}-${size}-${version?'after':'before'}.png`;
  fs.writeFileSync(dir+'/'+file,Buffer.from(data.split(',')[1],'base64'));files.push(file);
 }
}
const pixels=await evaluate(`(()=>{
 const cases=[];for(const stage of stages)for(const role of['normal','parent']){
  const sprite=assets.get('stages.'+stage.id+'.projectile'),canvas=document.createElement('canvas');canvas.width=180;canvas.height=100;const ctx=canvas.getContext('2d'),shot=Object.freeze({x:90,y:50,state:'flying',role});
  oldMaterial.drawRestoredProjectile(ctx,sprite,shot,stage.id);const old=ctx.getImageData(0,0,180,100).data;ctx.clearRect(0,0,180,100);newMaterial.drawRestoredProjectile(ctx,sprite,shot,stage.id);const next=ctx.getImageData(0,0,180,100).data;
  // Explicit channel parsing avoids treating the leading # as a hex pair.
  const rgb=[1,3,5].map(i=>parseInt(getTheme(stage.id).projectile.slice(i,i+2),16));let addedColoredPixels=0;for(let i=0;i<old.length;i+=4)if(old[i+3]<16&&next[i+3]>200&&Math.abs(next[i]-rgb[0])+Math.abs(next[i+1]-rgb[1])+Math.abs(next[i+2]-rgb[2])<40)addedColoredPixels++;
  cases.push({stageId:stage.id,role,color:getTheme(stage.id).projectile,addedColoredPixels});
 }
 let reads=0;const prototypes=[CanvasRenderingContext2D.prototype,globalThis.OffscreenCanvasRenderingContext2D?.prototype].filter(Boolean),originals=prototypes.map(p=>[p,p.getImageData]);for(const[p,fn]of originals)p.getImageData=function(...args){reads++;return fn.apply(this,args);};
 const scratch=document.createElement('canvas').getContext('2d');for(let i=0;i<1000;i++)for(const stage of stages)newMaterial.drawRestoredProjectile(scratch,assets.get('stages.'+stage.id+'.projectile'),{x:90,y:50,state:'flying'},stage.id);for(const[p,fn]of originals)p.getImageData=fn;
 return{cases,pixelReadsIn6000WarmDraws:reads};
})()`);
for(const c of pixels.cases)assert.ok(c.addedColoredPixels>10,JSON.stringify(c));assert.equal(pixels.pixelReadsIn6000WarmDraws,0);assert.equal(exceptions.length,0);
fs.writeFileSync(dir+'/render-check.json',JSON.stringify({files,pixels,exceptions},null,2));ws.close();console.log(JSON.stringify({captures:files.length,cases:pixels.cases.length,warmPixelReads:pixels.pixelReadsIn6000WarmDraws,exceptions:exceptions.length}));
