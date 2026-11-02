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
await send('Page.navigate',{url:'http://127.0.0.1:5173/'});

for(let n=0;n<100;n++){if(await evaluate('Boolean(document.querySelector(".menu-screen .is-keyboard-current"))'))break;await new Promise(r=>setTimeout(r,100));}
const press=async(code,key=code)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',code,key,windowsVirtualKeyCode:code==='Space'?32:40});await send('Input.dispatchKeyEvent',{type:'keyUp',code,key,windowsVirtualKeyCode:code==='Space'?32:40});};

const desktop=[];for(const [width,height]of [[1600,900],[1920,1080],[2560,1440],[3840,2160],[3440,1440],[1366,768]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await new Promise(r=>setTimeout(r,80));const value=await evaluate('(()=>{const d=document.querySelector(".menu-design-space"),b=document.querySelector(".menu-actions button").getBoundingClientRect(),scale=Number(d.dataset.scale);return{scale,width:b.width/scale,height:b.height/scale,mobile:d.classList.contains("is-mobile-landscape")};})()');assert.equal(value.mobile,false);desktop.push({width,height,...value});}
for(const d of desktop){assert.ok(Math.abs(d.width-desktop[0].width)<.1);assert.ok(Math.abs(d.height-desktop[0].height)<.1);}
await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});const mobile=[];
for(const [width,height]of [[568,320],[667,375],[740,360],[812,375],[844,390]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,80));const targets=await evaluate('[...document.querySelectorAll(".menu-screen button")].map(e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,font:getComputedStyle(e).fontSize};})');for(const t of targets){assert.ok(t.w>=52&&t.h>=52);assert.ok(t.x>=-.1&&t.y>=-.1&&t.x+t.w<=width+.1&&t.y+t.h<=height+.1);}mobile.push({width,height,targets});if(width===568){const img=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.memory/validation/2026-11-02-v02-feedback-release/mobile-menu-568.png',Buffer.from(img.data,'base64'));}}
await press('Space',' ');await press('Space',' ');for(let n=0;n<150;n++){if(await evaluate('Boolean(document.querySelector(".game-hud"))'))break;await new Promise(r=>setTimeout(r,50));}
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,120));assert.equal(await evaluate('Boolean(document.querySelector(".orientation-host:not([hidden]) .orientation-gate"))'),true);const portrait=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.memory/validation/2026-11-02-v02-feedback-release/portrait-gate.png',Buffer.from(portrait.data,'base64'));
await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,100));assert.equal(await evaluate('Boolean(document.querySelector(".orientation-host:not([hidden]) .rotation-resume-panel"))'),true);await press('Space',' ');assert.equal(await evaluate('document.querySelector(".orientation-host").hidden'),true);
fs.writeFileSync('.memory/validation/2026-11-02-v02-feedback-release/layout-orientation.json',JSON.stringify({desktop,mobile,manualResumeVerified:true,errors},null,2));ws.close();console.log(JSON.stringify({desktop:desktop.length,mobile:mobile.length,errors:errors.length}));
