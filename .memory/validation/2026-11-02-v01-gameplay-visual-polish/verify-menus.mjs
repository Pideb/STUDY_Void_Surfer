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
const before=await evaluate('document.querySelector(".is-keyboard-current")?.textContent');assert.ok(before);await press('ArrowDown');const next=await evaluate('document.querySelector(".is-keyboard-current")?.textContent');assert.notEqual(next,before);await press('Space',' ');
for(let n=0;n<20;n++){if(await evaluate('Boolean(document.querySelector(".hangar-screen"))'))break;await new Promise(r=>setTimeout(r,50));}
assert.equal(await evaluate('Boolean(document.querySelector(".hangar-screen"))'),true);await press('ArrowRight');const focus=await evaluate('document.activeElement.dataset.menuItemId');assert.ok(focus.startsWith('aircraft:'));
const image=await send('Page.captureScreenshot',{format:'png'});fs.mkdirSync('.memory/validation/2026-11-02-v02-feedback-release',{recursive:true});fs.writeFileSync('.memory/validation/2026-11-02-v02-feedback-release/keyboard-hangar.png',Buffer.from(image.data,'base64'));fs.writeFileSync('.memory/validation/2026-11-02-v02-feedback-release/menu-keyboard.json',JSON.stringify({before,next,focus,errors},null,2));ws.close();console.log(JSON.stringify({before,next,focus,errors:errors.length}));
