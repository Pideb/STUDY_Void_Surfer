import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const label=process.argv[2]??'baseline',port=Number(process.argv[3]??9422),width=Number(process.argv[4]??1440);
const root=process.cwd(),output=path.join(root,'.memory/validation/2026-10-29-001b-boss-menu');
const tabs=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());
const socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let id=0;const pending=new Map(),trace=[],errors=[];
socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}}else if(m.method==='Tracing.dataCollected')trace.push(...m.params.value);else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
function send(method,params={}){return new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error('Timeout '+method)),45000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;}
await send('Page.enable');await send('Runtime.enable');await send('Performance.enable');
await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__audioContexts=[];window.__bufferStarts=[];var NativeAudio=window.AudioContext;if(NativeAudio){window.AudioContext=class extends NativeAudio{constructor(...args){super(...args);window.__audioContexts.push(this);var create=this.createBufferSource.bind(this);this.createBufferSource=function(...a){var s=create(...a),start=s.start.bind(s);s.start=function(...b){window.__bufferStarts.push({duration:s.buffer?.duration,loop:s.loop,at:performance.now()});return start(...b);};return s;};}};}`});
await send('Page.navigate',{url:'http://127.0.0.1:4186/'});
await evaluate(`new Promise(function(resolve,reject){var start=performance.now();function ready(){if(document.querySelector('.menu-aircraft-image')){Promise.all(Array.from(document.images).map(function(i){return i.decode().catch(function(){});})).then(resolve);}else if(performance.now()-start>30000)reject(Error('menu did not mount'));else setTimeout(ready,100);}ready();})`);
await evaluate(`new Promise(function(r){setTimeout(r,1200);})`);
const before=(await send('Performance.getMetrics')).metrics;
await send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline.frame',transferMode:'ReportEvents'});
const frames=await evaluate(`new Promise(function(resolve){var times=[],ys=[],nodes=[],last=null,first=document.querySelector('.menu-aircraft-image');function frame(t){if(last!==null)times.push(t-last);last=t;var image=document.querySelector('.menu-aircraft-image');ys.push(image.getBoundingClientRect().y);nodes.push(image===first);if(times.length<180)requestAnimationFrame(frame);else resolve({intervals:times,ys:ys,nodeStable:nodes.every(Boolean)});}requestAnimationFrame(frame);})`);
await send('Tracing.end');await new Promise(r=>setTimeout(r,200));
const after=(await send('Performance.getMetrics')).metrics;
const metric=(name,list)=>list.find(m=>m.name===name)?.value??0;
const sort=frames.intervals.toSorted((a,b)=>a-b),p=q=>sort[Math.floor((sort.length-1)*q)];
const baselineAudio=await evaluate(`({contexts:__audioContexts.length,bufferStarts:__bufferStarts.length})`);
await send('Input.dispatchMouseEvent',{type:'mousePressed',x:35,y:200,button:'left',clickCount:1});
await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:35,y:200,button:'left',clickCount:1});
await evaluate(`new Promise(function(r){setTimeout(r,1800);})`);
const gestureAudio=await evaluate(`({contexts:__audioContexts.map(function(c){return c.state;}),starts:__bufferStarts.map(function(s){return {duration:s.duration,loop:s.loop};}),screen:document.querySelector('.menu-screen')?'menu':'other',audioRequests:performance.getEntriesByType('resource').filter(function(r){return r.name.includes('/assets/audio/');}).map(function(r){return new URL(r.name).pathname;})})`);
const repaint=await evaluate(`(function(){var hero=document.querySelector('.menu-aircraft-preview'),motion=hero.querySelector('.menu-aircraft-motion')||hero.querySelector('img'),animation=motion.getAnimations()[0],time=animation?.currentTime??null;document.querySelector('[aria-label="음소거"]').click();var next=document.querySelector('.menu-aircraft-preview'),nextMotion=next.querySelector('.menu-aircraft-motion')||next.querySelector('img');var result={sameHero:hero===next,sameMotion:motion===nextMotion,sameAnimation:animation===nextMotion.getAnimations()[0],beforeTime:time,afterTime:nextMotion.getAnimations()[0]?.currentTime??null};document.querySelector('[aria-label="소리 켜기"]').click();return result;})()`);
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
const reducedMotion=await evaluate(`({motion:getComputedStyle(document.querySelector('.menu-aircraft-motion')||document.querySelector('.menu-aircraft-image')).animationName,exhaust:getComputedStyle(document.querySelector('.menu-aircraft-exhaust')).animationName})`);
await send('Emulation.setEmulatedMedia',{features:[]});
const image=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,`${label}-${width}.png`),Buffer.from(image.data,'base64'));
const report={label,width,method:'Edge headless --disable-gpu; real RAF; strict autoplay; 180 measured intervals after 1.2s warmup. Not physical GPU FPS.',frames:180,medianFrameMs:p(.5),p95FrameMs:p(.95),over33ms:frames.intervals.filter(n=>n>33.4).length,taskDurationMs:(metric('TaskDuration',after)-metric('TaskDuration',before))*1000,paintEvents:trace.filter(e=>e.name==='Paint'&&e.ph==='X').length,paintDurationMs:trace.filter(e=>e.name==='Paint'&&e.ph==='X').reduce((n,e)=>n+(e.dur??0),0)/1000,yRange:[Math.min(...frames.ys),Math.max(...frames.ys)],nodeStable:frames.nodeStable,beforeGesture:baselineAudio,afterGesture:gestureAudio,repaint,reducedMotion,errors};
assert.equal(errors.length,0);if(label==='final'){assert.equal(gestureAudio.screen,'menu');assert.ok(gestureAudio.contexts.includes('running'));assert.ok(gestureAudio.starts.some(s=>s.loop));assert.ok(gestureAudio.audioRequests.every(p=>p==='/assets/audio/menu/orbit-run.wav'));assert.ok(repaint.sameHero&&repaint.sameMotion&&repaint.sameAnimation);assert.ok(repaint.afterTime>=repaint.beforeTime);assert.equal(reducedMotion.motion,'none');assert.equal(reducedMotion.exhaust,'none');}
fs.writeFileSync(path.join(output,`${label}-${width}.json`),JSON.stringify(report,null,2)+'\n');socket.close();console.log(JSON.stringify(report));
