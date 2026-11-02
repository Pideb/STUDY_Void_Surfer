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

await evaluate(`(async()=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/src/styles.css';document.head.append(link);await new Promise(r=>link.onload=r);const {createGameHud}=await import('/src/ui/game-hud.js');window.counts={dash:0,fire:0};window.hud=createGameHud({muted:false,getMuted:()=>false},{space:()=>counts.dash++,fire:()=>counts.fire++,pause:()=>{},toggleMute:()=>{}});hud.element.style.cssText='position:fixed;inset:0;width:100vw;height:100dvh';document.body.append(hud.element);window.paintHud=active=>hud.update({score:20,player:{x:240,y:270},boss:{hp:3,weapon:{chargeSeconds:10,rechargeSeconds:10,ready:true}},challenge:active?{active:true,sequence:['KeyW','KeyA','KeyS','KeyD'],cursor:0,remainingSeconds:4,timeLimitSeconds:4}:null});window.bounds=selector=>[...document.querySelectorAll(selector)].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}});})()`);
await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});const sizes=[];
for(const [width,height] of [[812,375],[844,390],[960,540]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await evaluate('paintHud(false)');
 const controls=await evaluate('bounds(".mobile-fire-button,.mobile-space-button")');for(const b of controls){assert.equal(b.width,64);assert.equal(b.height,64);assert.ok(b.x>=0&&b.x+b.width<=width&&b.y+b.height<=height);}assert.ok(Math.abs(controls[0].x-controls[1].x)>=76);
 await evaluate('paintHud(true)');const keys=await evaluate('bounds(".challenge-key-button")');for(let i=0;i<4;i++){assert.equal(keys[i].width,56);assert.equal(keys[i].height,56);assert.ok(keys[i].y>=0&&keys[i].y+56<=height);if(i)assert.equal(keys[i].x-keys[i-1].x,68);}
 sizes.push({width,height,controls,keys});
}
assert.equal(errors.length,0);fs.writeFileSync(dir+'/mobile-input-bounds.json',JSON.stringify({sizes,errors},null,2));const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(dir+'/mobile-hud.png',Buffer.from(shot.data,'base64'));ws.close();console.log(JSON.stringify({sizes:sizes.length,errors:errors.length}));
