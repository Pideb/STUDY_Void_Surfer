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

await press('Space',' ');await press('Space',' ');
for(let n=0;n<160;n++){if(await evaluate('Boolean(document.querySelector(".game-over-screen"))'))break;await new Promise(r=>setTimeout(r,100));}
assert.equal(await evaluate('Boolean(document.querySelector(".game-over-screen"))'),true);
const observations=[];for(const [width,height,mobile]of [[1600,900,false],[844,390,true]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await new Promise(r=>setTimeout(r,120));const view=await evaluate('(()=>{const panel=document.querySelector(".game-over-screen").getBoundingClientRect(),hint=document.querySelector(".game-over-restart-hint").getBoundingClientRect();return{panel:{x:panel.x,y:panel.y,width:panel.width,height:panel.height},hint:{x:hint.x,y:hint.y,width:hint.width,height:hint.height},restartButton:[...document.querySelectorAll("button")].some(b=>b.textContent==="재시작")};})()');assert.equal(view.restartButton,false);assert.ok(view.hint.y>=0&&view.hint.y+view.hint.height<=height);observations.push({width,height,view});const img=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.memory/validation/2026-11-02-v02-feedback-release/gameover-'+width+'.png',Buffer.from(img.data,'base64'));}
fs.writeFileSync('.memory/validation/2026-11-02-v02-feedback-release/gameover-browser.json',JSON.stringify({observations,errors},null,2));ws.close();console.log(JSON.stringify({sizes:observations.length,errors:errors.length}));
