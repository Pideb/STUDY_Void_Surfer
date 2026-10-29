import fs from 'node:fs';import assert from 'node:assert/strict';
const dir='.memory/validation/2026-10-29-fullscreen-fhd-music-start',origin='https://proud-grass-03a132e00.6.azurestaticapps.net';
const tabs=await fetch('http://127.0.0.1:9430/json/list').then(r=>r.json());
const socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});let id=0;const pending=new Map(),errors=[];
socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
function send(method,params={}){return new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error('Timeout '+method)),35000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function wait(expression,timeout=25000){return evaluate(`new Promise((resolve,reject)=>{const start=performance.now();function check(){if(${expression})return resolve();if(performance.now()-start>${timeout})return reject(Error('Condition timeout'));setTimeout(check,20);}check();})`);}
async function click(label){const p=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)});if(!b)throw Error('Missing button');const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});}
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
await send('Emulation.setDeviceMetricsOverride',{width:3840,height:2160,deviceScaleFactor:1,mobile:false});
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__loops=[];window.__notes=[];const byteNames=new WeakMap(),bufferNames=new WeakMap();const originalFetch=window.fetch;window.fetch=async function(input,...args){const response=await originalFetch(input,...args);const url=typeof input==='string'?input:input?.url;if(url?.includes('/assets/audio/')){const read=response.arrayBuffer.bind(response);response.arrayBuffer=async()=>{const bytes=await read();byteNames.set(bytes,url);return bytes;};}return response;};const Native=window.AudioContext;if(Native)window.AudioContext=class extends Native{async decodeAudioData(bytes){const url=byteNames.get(bytes),buffer=await super.decodeAudioData(bytes);bufferNames.set(buffer,url);return buffer;}createBufferSource(){const s=super.createBufferSource(),start=s.start.bind(s);s.start=(...args)=>{window.__loops.push({url:bufferNames.get(s.buffer),loop:s.loop,at:performance.now()});return start(...args);};return s;}createOscillator(){const s=super.createOscillator(),start=s.start.bind(s);s.start=(...args)=>{window.__notes.push(performance.now());return start(...args);};return s;}};`});
await send('Page.navigate',{url:origin+'/?verification=fhd-music'});
await wait(`document.querySelector('.menu-screen')`);
await evaluate('new Promise(r=>setTimeout(r,500))');
const before=await evaluate(`({width:document.querySelector('canvas').width,height:document.querySelector('canvas').height,guest:document.body.textContent.includes('GUEST')})`);
assert.deepEqual(before,{width:1920,height:1080,guest:true});
await click('게임 시작');await wait(`document.querySelector('.tutorial-screen')`);await wait(`__loops.some(s=>s.url?.includes('/menu/'))`);
await evaluate('window.__departure=performance.now()');await click('출격하기');
await wait(`document.querySelector('.game-hud')`);
const result=await evaluate(`({origin:location.origin,viewport:[innerWidth,innerHeight],buffer:[document.querySelector('canvas').width,document.querySelector('canvas').height],departure:__departure,observedPlayingAt:performance.now(),loops:__loops,notes:__notes,score:document.querySelector('.score-value')?.textContent??null})`);
assert.deepEqual(result.buffer,[1920,1080]);
assert.ok(result.loops.some(s=>s.url?.includes('/gameplay/')&&s.at>=result.departure));
assert.ok(!result.loops.some(s=>s.url?.includes('/menu/')&&s.at>result.departure));
assert.ok(!result.notes.some(t=>t>result.departure));
const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${dir}/public-playing.png`,Buffer.from(screenshot.data,'base64'));
assert.deepEqual(errors,[]);fs.writeFileSync(`${dir}/public-start.json`,JSON.stringify({...result,errors,readOnlyGuestRun:true},null,2)+'\n');
socket.close();console.log(JSON.stringify(result));
