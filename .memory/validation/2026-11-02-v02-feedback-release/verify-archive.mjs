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

await send('Page.navigate',{url:'http://127.0.0.1:5173/docs/management/archive-check.html'});
for(let n=0;n<120;n++){if(await evaluate('Boolean(document.querySelector("#tab-archive"))'))break;await new Promise(r=>setTimeout(r,100));}
await evaluate('document.querySelector("#tab-archive").click()');
const initial=await evaluate('document.querySelectorAll("#previewArchive a").length');assert.equal(initial,12);
await evaluate('document.querySelector("#archiveStatus").value="superseded";document.querySelector("#archiveStatus").dispatchEvent(new Event("change"))');assert.equal(await evaluate('document.querySelectorAll("#previewArchive a").length'),1);
await evaluate('document.querySelector("#tab-archive").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',code:'ArrowLeft',key:'ArrowLeft',windowsVirtualKeyCode:37});assert.equal(await evaluate('document.activeElement.id'),'tab-history');assert.equal(errors.length,0);
fs.writeFileSync('.memory/validation/2026-11-02-v02-feedback-release/archive-browser.json',JSON.stringify({entries:initial,statusFilter:true,keyboardTabNavigation:true,errors},null,2));ws.close();console.log('Archive verified: 12 links, filter and keyboard tabs');
