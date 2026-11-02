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

await send('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:true});
await send('Page.navigate',{url:'http://127.0.0.1:5173/guide/index.html'});
for(let n=0;n<100;n++){if(await evaluate('Boolean(document.querySelector("#controls"))'))break;await new Promise(r=>setTimeout(r,50));}
await new Promise(r=>setTimeout(r,350));
const result=await evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,mainCount:document.querySelectorAll("main").length,empty:document.querySelector(".empty").textContent})');
assert.ok(result.scrollWidth<=375);assert.equal(result.mainCount,1);
await evaluate('cycleTheme()');await evaluate("applyTheme('dark')");await new Promise(r=>setTimeout(r,400));
const image=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.memory/validation/2026-11-02-v02-feedback-release/player-guide-mobile.png',Buffer.from(image.data,'base64'));
await send('Emulation.clearDeviceMetricsOverride');await send('Page.navigate',{url:'http://127.0.0.1:5173/'});
for(let n=0;n<100;n++){if(await evaluate('Boolean(document.querySelector(".menu-guide-link"))'))break;await new Promise(r=>setTimeout(r,100));}
await evaluate('document.querySelector(".menu-guide-link").focus()');
await send('Input.dispatchKeyEvent',{type:'keyDown',code:'Space',key:' ',windowsVirtualKeyCode:32});await send('Input.dispatchKeyEvent',{type:'keyUp',code:'Space',key:' ',windowsVirtualKeyCode:32});
await new Promise(r=>setTimeout(r,250));
const tabs=await fetch('http://127.0.0.1:9445/json/list').then(r=>r.json());result.newGuideTab=tabs.some(t=>t.id!==tab.id&&t.url==='http://127.0.0.1:5173/guide/index.html');assert.equal(result.newGuideTab,true);assert.equal(errors.length,0);
fs.writeFileSync('.memory/validation/2026-11-02-v02-feedback-release/player-guide-browser.json',JSON.stringify({...result,errors},null,2));ws.close();console.log(JSON.stringify(result));
