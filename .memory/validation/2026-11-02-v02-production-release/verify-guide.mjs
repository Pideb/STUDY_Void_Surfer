import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='.memory/validation/2026-11-02-v02-production-release';
const expected=JSON.parse(fs.readFileSync('docs/player/updates.json','utf8')).entries[0];
const tab=await fetch('http://127.0.0.1:9450/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(tab.webSocketDebuggerUrl),jobs=new Map();let id=0;
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const job=jobs.get(m.id);if(job){jobs.delete(m.id);m.error?job.reject(m.error):job.resolve(m.result);}}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
const results=[];
for(const width of [1200,375]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:width===375});
 await send('Page.navigate',{url:'http://127.0.0.1:5174/guide/index.html'});
 let ready=false;for(let i=0;i<100;i++){if(await evaluate('!!document.querySelector(".update-version")')){ready=true;break;}await new Promise(r=>setTimeout(r,100));}assert.ok(ready);
 const state=await evaluate(`(()=>{const h=document.querySelector('.update-version');h.scrollIntoView({block:'center'});const s=getComputedStyle(h);return{version:h.textContent,fontSize:parseFloat(s.fontSize),fontWeight:Number(s.fontWeight),items:[...h.closest('.update').querySelectorAll('li')].map(e=>e.textContent),overflow:document.documentElement.scrollWidth>innerWidth};})()`);
 assert.equal(state.version,'v0.2');assert.ok(state.fontSize>=32);assert.ok(state.fontWeight>=700);assert.deepEqual(state.items,expected.body);assert.equal(state.overflow,false);
 await new Promise(r=>setTimeout(r,1500));
 assert.ok(await evaluate('document.querySelector(".update-version").getBoundingClientRect().top<innerHeight'));
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(dir+'/guide-'+width+'.png',Buffer.from(shot.data,'base64'));results.push({width,...state});
}
fs.writeFileSync(dir+'/guide-browser.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
await send('Browser.close');ws.close();
