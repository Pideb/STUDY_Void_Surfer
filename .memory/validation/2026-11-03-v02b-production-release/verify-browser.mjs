import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='.memory/validation/2026-11-03-v02b-production-release',expected=JSON.parse(fs.readFileSync('docs/player/updates.json','utf8')).entries;
const tab=await fetch('http://127.0.0.1:9454/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(tab.webSocketDebuggerUrl),jobs=new Map();let id=0;
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const job=jobs.get(m.id);if(job){jobs.delete(m.id);m.error?job.reject(m.error):job.resolve(m.result);}}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const wait=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+expression);};
const guides=[];
for(const width of[1200,375]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:width===375});
 await send('Page.navigate',{url:'http://127.0.0.1:4175/guide/index.html'});await wait('!!document.querySelector(".update-version")');
 const guide=await evaluate(`(()=>{document.querySelector('#updates').scrollIntoView({behavior:'instant',block:'start'});return{entries:[...document.querySelectorAll('.update')].map(e=>({version:e.querySelector('.update-version').textContent,body:[...e.querySelectorAll('li')].map(l=>l.textContent)})),fontSize:parseFloat(getComputedStyle(document.querySelector('.update-version')).fontSize),fontWeight:getComputedStyle(document.querySelector('.update-version')).fontWeight,overflow:document.documentElement.scrollWidth>innerWidth};})()`);
 assert.deepEqual(guide.entries,expected.map(({version,body})=>({version,body})));assert.ok(guide.fontSize>=32);assert.equal(guide.fontWeight,'800');assert.equal(guide.overflow,false);
 await new Promise(r=>setTimeout(r,1300));const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(dir+'/guide-'+width+'.png',Buffer.from(shot.data,'base64'));guides.push({width,...guide});
}
await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://127.0.0.1:4175/'});await wait('!!document.querySelector(".menu-version")');
const menuVersion=await evaluate('document.querySelector(".menu-version").textContent');assert.equal(menuVersion.trim(),'v0.2b');
const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(dir+'/menu-version.png',Buffer.from(shot.data,'base64'));
const result={guides,menuVersion,productionBuild:true};fs.writeFileSync(dir+'/browser.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));await send('Browser.close');ws.close();
