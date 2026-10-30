import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
var root=process.cwd(),out=path.join(root,'.memory/validation/2026-10-30-management-console');
var tab=await fetch('http://127.0.0.1:9431/json/new?about:blank',{method:'PUT'}).then(r=>r.json()),socket=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
var id=0,pending=new Map(),errors=[];
socket.onmessage=e=>{var m=JSON.parse(e.data);if(m.id){var p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);};
function send(method,params={}){return new Promise((resolve,reject)=>{var current=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),25000);pending.set(current,{resolve,reject,timer});socket.send(JSON.stringify({id:current,method,params}));});}
async function evaluate(expression){var r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function shot(name){await new Promise(r=>setTimeout(r,250));var s=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(s.data,'base64'));}
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
await send('Page.navigate',{url:pathToFileURL(path.join(root,'docs/management/void-surfer-management.html')).href});
await new Promise(r=>setTimeout(r,1600));
await evaluate(`new Promise(function(resolve){if(window.managementReady)resolve();else window.addEventListener('load',resolve,{once:true});})`);
await evaluate(`Promise.all(Array.from(document.images).map(function(i){return i.decode().catch(function(){return null;});}))`);
var results={viewports:[],interactions:{}};
for(var width of [1440,768,375]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
 for(var panel of ['elements','lab','history']){
  await evaluate(`showTab('${panel}');window.scrollTo(0,0)`);await new Promise(r=>setTimeout(r,150));
  var layout=await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,main:document.querySelectorAll('main').length,missing:Array.from(document.images).filter(function(i){return !i.naturalWidth;}).length,overflow:Array.from(document.querySelectorAll('body *')).filter(function(el){if(!el.getClientRects().length||el.closest('.table-wrap,.mini-table,.viz-menu'))return false;var r=el.getBoundingClientRect();return r.right>innerWidth+2||r.left< -2;}).slice(0,8).map(function(el){return el.tagName+'.'+el.className;})})`);
  results.viewports.push({panel,...layout});assert.equal(layout.main,1);assert.equal(layout.missing,0);assert.ok(layout.scroll<=width,JSON.stringify({panel,...layout}));
  if(width===1440||width===375)await shot(panel+'-'+width);
 }
}
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await evaluate(`showTab('lab');byId('hitCraft').value='default';resetHit();byId('wallX').value=330;byId('wallX').dispatchEvent(new Event('input'));`);
assert.equal(await evaluate('eligible()'),true);assert.equal(await evaluate('hit.gapHeight'),180);
await evaluate(`byId('wallX').value=341;byId('wallX').dispatchEvent(new Event('input'));`);assert.equal(await evaluate('eligible()'),false);
await evaluate(`byId('successWidth').value=80;byId('successWidth').dispatchEvent(new Event('input'));`);assert.equal(await evaluate('eligible()'),true);
await evaluate(`byId('hitKind').value='hybrid';byId('playerY').value=100;byId('playerY').dispatchEvent(new Event('input'));`);assert.equal(await evaluate('eligible()'),false);
await evaluate(`byId('hitKind').value='special';byId('resetHit').click();byId('physicsCraft').value='aegis';byId('physicsCraft').dispatchEvent(new Event('change'));`);assert.deepEqual(await evaluate('({g:physics.gravity,l:Math.round(physics.lift)})'),{g:1170,l:252});
await evaluate(`byId('gravity').value=900;byId('gravity').dispatchEvent(new Event('input'));`);assert.equal(await evaluate('physics.gravity'),900);
await evaluate(`byId('exportProposal').click()`);assert.equal(await evaluate('window.lastProposal.previewOnly'),true);results.interactions.proposal=await evaluate('window.lastProposal');
await evaluate(`showTab('elements');byId('progressScore').value=220;byId('progressScore').dispatchEvent(new Event('input'));byId('speedCraft').value='velocity';byId('speedCraft').dispatchEvent(new Event('change'));`);assert.equal(await evaluate(`byId('targetSpeed').textContent`),'700');
await evaluate(`document.querySelector('[data-stage-pick="solar-forge"]').click();byId('scenePattern').value='quarter';byId('scenePattern').dispatchEvent(new Event('change'));byId('objectCanvas').scrollIntoView({block:'center'});`);await shot('objects-desktop');
await evaluate(`state.scenePlay=false;state.sceneTime=0;byId('sceneStep').click();`);assert.equal(await evaluate('state.sceneTime'),.1);
await evaluate(`showTab('history');byId('historySearch').value='보스';byId('historySearch').dispatchEvent(new Event('input'));`);assert.ok(await evaluate(`document.querySelectorAll('.release-entry:not([hidden])').length`)>0);
await evaluate(`byId('historySearch').value='absentXYZ';byId('historySearch').dispatchEvent(new Event('input'));`);assert.equal(await evaluate(`document.querySelectorAll('.release-entry:not([hidden])').length`),0);
await evaluate(`byId('historySearch').value='';renderHistory();cycleTheme();toggleMenu();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));`);assert.equal(await evaluate(`byId('vizMenuDropdown').classList.contains('open')`),false);
await send('Emulation.setEmulatedMedia',{media:'print'});results.print=await evaluate(`({panels:Array.from(document.querySelectorAll('.tab-panel')).filter(function(p){return getComputedStyle(p).display!=='none';}).length,stages:Array.from(document.querySelectorAll('.stage-detail')).filter(function(p){return getComputedStyle(p).display!=='none';}).length,menu:getComputedStyle(document.querySelector('.viz-menu')).display})`);assert.equal(results.print.panels,3);assert.equal(results.print.stages,6);assert.equal(results.print.menu,'none');await send('Emulation.setEmulatedMedia',{media:''});
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal(await evaluate('activeAnimation()'),false);
await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,1200));
results.offline=await evaluate(`({ready:window.managementReady,chart:typeof Chart!=='undefined',fallback:getComputedStyle(byId('speedFallback')).display!=='none',missing:Array.from(document.images).filter(function(i){return !i.naturalWidth;}).length})`);assert.equal(results.offline.ready,true);assert.equal(results.offline.fallback,true);assert.equal(results.offline.missing,0);
await evaluate(`showTab('lab');resetHit();`);assert.equal(await evaluate('hit.speed'),240);
results.errors=errors;assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(results,null,2)+'\n');
await send('Page.navigate',{url:pathToFileURL(path.join(root,'docs/releases/void-surfer-latest.html')).href});await new Promise(r=>setTimeout(r,1200));await evaluate(`Promise.all(Array.from(document.images).map(function(i){i.loading='eager';return i.decode().catch(function(){return null;});}))`);
var presentation={};presentation.metadata=await evaluate(`JSON.parse(document.getElementById('releaseMetadata').textContent)`);assert.equal(presentation.metadata.version,'0.01-b');assert.equal(presentation.metadata.gameFingerprint,results.interactions.proposal.gameFingerprint);
for(var width of [1440,768,375]){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});var p=await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,missing:Array.from(document.images).filter(function(i){return !i.naturalWidth;}).length,main:document.querySelectorAll('main').length})`);assert.ok(p.scroll<=width,JSON.stringify(p));assert.equal(p.main,1);assert.equal(p.missing,0);presentation[width]=p;}
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaluate(`document.getElementById('rules').scrollIntoView({block:'start'})`);await shot('presentation-current-rules');
assert.ok((await evaluate(`document.getElementById('hangar').textContent`)).includes('252'));
assert.ok((await evaluate(`document.getElementById('rules').textContent`)).includes('15~20'));
presentation.errors=errors;assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'presentation-verification.json'),JSON.stringify(presentation,null,2)+'\n');
await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await send('Emulation.setEmulatedMedia',{features:[]});await send('Page.navigate',{url:pathToFileURL(path.join(root,'docs/management/void-surfer-management.html')).href});await new Promise(r=>setTimeout(r,1100));await evaluate(`applyTheme('light');showTab('lab');window.scrollTo(0,250)`);await shot('lab-light');
assert.deepEqual(errors,[]);socket.close();console.log(JSON.stringify(results,null,2));console.log('Latest presentation verified.');
