import fs from 'node:fs';import assert from 'node:assert/strict';
const label=process.argv[2]??'baseline',dir='.memory/validation/2026-10-29-fullscreen-fhd-music-start';
const tabs=await fetch('http://127.0.0.1:9430/json/list').then(r=>r.json());
const socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});let id=0;const pending=new Map(),errors=[];
socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
function send(method,params={}){return new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error('Timeout '+method)),55000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
await send('Page.enable');await send('Runtime.enable');
const reports=[];
for(const width of [1920,3840])for(const boss of [0,1]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width*9/16,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:`http://127.0.0.1:4186/${dir}/runtime.html?boss=${boss}&revision=${label}`});
  await evaluate(`new Promise((resolve,reject)=>{let n=0;function check(){if(window.fixtureReady)return resolve();if(n++>300)return reject(Error('fixture timeout'));setTimeout(check,100);}check();})`);
  const report=await evaluate('runMeasurement()');assert.deepEqual(report.failedAssets,[]);
  if(label==='final'){assert.ok(report.buffer.width<=1920);assert.ok(report.buffer.height<=1080);}
  reports.push(report);const png=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(`${dir}/${label}-${width}-${report.scenario}.png`,Buffer.from(png.data,'base64'));
  console.log(JSON.stringify({label,...report}));
}
assert.deepEqual(errors,[]);fs.writeFileSync(`${dir}/${label}-render.json`,JSON.stringify({label,reports,errors},null,2)+'\n');socket.close();
