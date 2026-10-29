import fs from 'node:fs';import assert from 'node:assert/strict';
const dir='.memory/validation/2026-10-29-fullscreen-fhd-music-start';
const tabs=await fetch('http://127.0.0.1:9430/json/list').then(r=>r.json());
const socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});let id=0;const pending=new Map(),errors=[];
socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
function send(method,params={}){return new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error('Timeout '+method)),35000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function wait(expression,timeout=20000){return evaluate(`new Promise((resolve,reject)=>{const start=performance.now();function check(){if(${expression})return resolve();if(performance.now()-start>${timeout})return reject(Error('Condition timeout'));setTimeout(check,25);}check();})`);}
async function click(label){const p=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)});if(!b)throw Error('Missing button');const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${dir}/${name}.png`,Buffer.from(r.data,'base64'));}
await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:2,mobile:false});
const reports=[];
for(const mode of ['ready','timeout','cancel','late-menu','failure']){
  await send('Page.navigate',{url:`http://127.0.0.1:4187/${dir}/startup.html?mode=${mode}`});
  await wait(`window.startup&&document.querySelector('.menu-screen')`);
  await click('게임 시작');await wait(`document.querySelector('.tutorial-screen')`);
  if(mode!=='late-menu')await wait(`startup.loops.some(s=>s.url?.includes('/menu/'))`);
  await evaluate('window.departedAt=performance.now()');await click('출격하기');await wait(`document.querySelector('.preparing-screen')`);
  const before=await evaluate(`({score:startup.snapshot().score,elapsed:startup.snapshot().elapsedSeconds,player:startup.snapshot().player,stage:startup.snapshot().stage.id})`);
  await evaluate('new Promise(r=>setTimeout(r,100))');
  const waiting=await evaluate(`({score:startup.snapshot().score,elapsed:startup.snapshot().elapsedSeconds,player:startup.snapshot().player,stage:startup.snapshot().stage.id})`);
  assert.deepEqual(waiting,before);
  if(mode!=='cancel')await screenshot('preparing-'+mode);
  if(mode==='cancel'){
    await click('메인으로');await evaluate('new Promise(r=>setTimeout(r,1400))');
    assert.equal(await evaluate('startup.snapshot().state'),'menu');
    assert.equal(await evaluate(`startup.loops.filter(s=>s.url?.includes('/gameplay/')).length`),0);
  }else{
    await wait(`startup.snapshot().state==='playing'`);
    const entered=await evaluate(`({afterMs:performance.now()-departedAt,gameLoops:startup.loops.filter(s=>s.url?.includes('/gameplay/')).length})`);
    if(['timeout','failure'].includes(mode)){assert.ok(entered.afterMs>=9900);assert.equal(entered.gameLoops,0);}
    else assert.equal(entered.gameLoops,1);
    if(mode!=='failure')await wait(`startup.loops.some(s=>s.url?.includes('/gameplay/'))`);
    if(mode==='late-menu')await evaluate('new Promise(r=>setTimeout(r,2200))');
    const after=await evaluate(`({loops:startup.loops,notes:startup.notes,stops:startup.stops,departedAt,stage:startup.snapshot().stage.id,buffer:startup.buffer(),entered:${JSON.stringify(entered)},state:startup.snapshot().state})`);
    assert.equal(after.buffer.width,1920);assert.equal(after.buffer.height,1080);
    assert.ok(after.loops.filter(s=>s.url?.includes('/gameplay/')).every(s=>s.state==='playing'&&s.url.endsWith('/'+after.stage+'.wav')));
    assert.ok(!after.loops.some(s=>s.url?.includes('/menu/')&&s.at>after.departedAt));
    assert.ok(!after.notes.some(t=>t>after.departedAt));
    if(mode==='ready'){
      const menuStop=after.stops.find(s=>s.url?.includes('/menu/')&&s.at>after.departedAt);assert.ok(menuStop);assert.ok(menuStop.scheduled<=menuStop.now+.002);
      await screenshot('playing-ready');
      const requests=await evaluate('startup.requests.length');
      await evaluate(`startup.controller.dispatch('GAME_OVER');startup.controller.dispatch('RESTART_IMMEDIATE')`);
      await wait(`startup.snapshot().state==='playing'`);assert.equal(await evaluate('startup.requests.length'),requests);
      after.cachedRestartSameRequestCount=true;
    }
    reports.push({mode,...after});
  }
}
assert.deepEqual(errors,[]);fs.writeFileSync(`${dir}/startup-verification.json`,JSON.stringify({reports,errors,cancellationVerified:true},null,2)+'\n');socket.close();console.log(JSON.stringify({scenarios:reports.map(r=>({mode:r.mode,afterMs:r.entered.afterMs})),cancellationVerified:true,errors}));
