import fs from 'node:fs';
import assert from 'node:assert/strict';
const output = '.memory/validation/2026-10-29-001b-boss-menu';
const tabs = await fetch('http://127.0.0.1:9423/json/list').then(r=>r.json());
const socket = new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
let id=0; const pending=new Map(), errors=[];
socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);};
function send(method,params={}){return new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error('Timeout '+method)),30000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
await send('Page.enable'); await send('Runtime.enable');
await send('Network.enable');await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
await send('Emulation.setEmulatedMedia',{media:'',features:[]});
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
for(const scene of ['boss-entry','boss-active']){
  await send('Page.navigate',{url:`http://127.0.0.1:4186/${output}/runtime.html?id=${scene}`});
  const data=await evaluate(`new Promise((resolve,reject)=>{let start=performance.now();function check(){if(window.fixture)return resolve(window.fixture);if(performance.now()-start>20000)return reject(Error('Fixture load timeout'));setTimeout(check,100);}check();})`);
  assert.deepEqual(data.failedAssets,[]);assert.equal(data.score,20);assert.equal(data.isWarning,false);
  if(scene==='boss-entry')assert.equal(data.preview.warningIndex,1);
  else {assert.equal(data.bossNumber,1);assert.equal(data.isBoss,true);assert.ok(data.obstacles.length>=3);assert.ok(data.obstacles.every(w=>w.bossNumber===1));}
  await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const screenshot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(`${output}/${scene}.png`,Buffer.from(screenshot.data,'base64'));
  fs.writeFileSync(`${output}/${scene}.json`,JSON.stringify(data,null,2)+'\n');
  console.log(JSON.stringify(data));
}
assert.deepEqual(errors,[]);socket.close();
