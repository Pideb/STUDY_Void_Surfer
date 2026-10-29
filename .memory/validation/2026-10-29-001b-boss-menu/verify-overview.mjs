import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const root=process.cwd(), output=path.join(root,'.memory/validation/2026-10-29-001b-boss-menu');
const tabs=await fetch('http://127.0.0.1:9423/json/list').then(r=>r.json());
const tab=tabs.find(t=>t.type==='page');
const socket=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let id=0;const pending=new Map(),errors=[],network=[];
socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const waiter=pending.get(message.id);if(waiter){clearTimeout(waiter.timer);pending.delete(message.id);message.error?waiter.reject(message.error):waiter.resolve(message.result);}}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);else if(message.method==='Network.loadingFailed')network.push(message.params);};
function send(method,params={}){return new Promise((resolve,reject)=>{const current=++id;const timer=setTimeout(()=>{pending.delete(current);reject(Error('CDP timed out: '+method));},25000);pending.set(current,{resolve,reject,timer});socket.send(JSON.stringify({id:current,method,params}));});}
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value;}
async function screenshot(name){await new Promise(r=>setTimeout(r,350));const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(result.data,'base64'));}
await send('Page.enable');await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await send('Runtime.enable');await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1020,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:pathToFileURL(path.join(root,'docs/releases/void-surfer-0.01-b.html')).href});
await evaluate(`new Promise(function(resolve){if(document.readyState==='complete')resolve();else window.addEventListener('load',resolve,{once:true});})`);
await evaluate(`Promise.all(Array.from(document.images).map(function(img){img.loading='eager';return img.decode().catch(function(){return null;});}))`);
await evaluate(`Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,6000);})])`);
await evaluate(`document.documentElement.className='theme-dark';currentTheme='dark';onThemeChange();animateCounters();window.scrollTo({top:0,behavior:'instant'})`);
await new Promise(r=>setTimeout(r,1400));
const results={source:'docs/releases/void-surfer-0.01-b.html',version:'0.01-b',viewports:[],interactions:{}};
for(const width of [1440,768,375]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===375?900:1020,deviceScaleFactor:1,mobile:false});
  await evaluate(`window.scrollTo({top:0,behavior:'instant'});document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('visible');})`);
  await new Promise(r=>setTimeout(r,350));
  const layout=await evaluate(`({width:innerWidth,documentWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,missingImages:Array.from(document.images).filter(function(i){return !i.complete||!i.naturalWidth;}).map(function(i){return i.alt;}),mainCount:document.querySelectorAll('main').length,h1:parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),h2:parseFloat(getComputedStyle(document.querySelector('h2')).fontSize),h3:parseFloat(getComputedStyle(document.querySelector('h3')).fontSize),theme:document.documentElement.className,chartLoaded:typeof Chart!=='undefined',canvasChart:typeof ChartManager!=='undefined'&&ChartManager.charts.size,overflowElements:Array.from(document.querySelectorAll('body *')).filter(function(el){if(!el.getClientRects().length||el.closest('.table-wrap,.toc'))return false;var r=el.getBoundingClientRect();return r.right>innerWidth+1||r.left< -1;}).slice(0,12).map(function(el){return el.tagName+'.'+el.className;})})`);
  assert.ok(layout.documentWidth<=width,'Document overflow at '+width);assert.equal(layout.mainCount,1);assert.deepEqual(layout.missingImages,[]);assert.ok(layout.h1>=48&&layout.h2>=32&&layout.h3>=24);
  results.viewports.push(layout);await screenshot('overview-'+width);
  if(width===1440){await evaluate(`document.getElementById('workflow').scrollIntoView({behavior:'instant',block:'start'})`);await screenshot('workflow-desktop');await evaluate(`document.getElementById('stages').scrollIntoView({behavior:'instant',block:'start'})`);await screenshot('stages-desktop');}
  if(width===375){await evaluate(`document.getElementById('hangar').scrollIntoView({behavior:'instant',block:'start'})`);await screenshot('hangar-mobile');}
}
results.interactions.beforeTheme=await evaluate('currentTheme');await evaluate('cycleTheme()');results.interactions.afterTheme=await evaluate('currentTheme');assert.notEqual(results.interactions.beforeTheme,results.interactions.afterTheme);
results.chart=await evaluate(`({count:ChartManager.charts.size,fallbackDisplay:getComputedStyle(document.getElementById('speedFallback')).display})`);assert.equal(results.chart.count,1);assert.equal(results.chart.fallbackDisplay,'none');
results.audio=await evaluate(`({duration:document.querySelector('audio').duration,ready:document.querySelector('audio').readyState})`);assert.ok(Math.abs(results.audio.duration-2.4)<.001);
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1020,deviceScaleFactor:1,mobile:false});
await evaluate(`document.getElementById('workflow').scrollIntoView({behavior:'instant',block:'start'})`);await screenshot('workflow-light');
await evaluate(`toggleMenu()`);assert.equal(await evaluate(`document.getElementById('vizMenuDropdown').classList.contains('open')`),true);await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);assert.equal(await evaluate(`document.getElementById('vizMenuDropdown').classList.contains('open')`),false);results.interactions.menuEscape=true;
await evaluate(`document.querySelector('[data-stage="5"]').click()`);results.interactions.stage=await evaluate(`Array.from(document.querySelectorAll('[data-stage-panel]')).filter(function(p){return !p.hidden;}).map(function(p){return p.dataset.stagePanel;})`);assert.deepEqual(results.interactions.stage,['5']);
await evaluate(`document.querySelector('[data-filter="전투·연출"]').click()`);results.interactions.combatFilter=await evaluate(`document.querySelectorAll('.feedback-item:not([hidden])').length`);assert.ok(results.interactions.combatFilter>0&&results.interactions.combatFilter<25);
await evaluate(`document.querySelector('[data-filter="전체"]').click();document.getElementById('feedbackSearch').value='히트박스';document.getElementById('feedbackSearch').dispatchEvent(new Event('input',{bubbles:true}));`);results.interactions.search=await evaluate(`document.querySelectorAll('.feedback-item:not([hidden])').length`);assert.ok(results.interactions.search>0&&results.interactions.search<25,JSON.stringify(await evaluate(`({active:activeFilter,query:document.getElementById('feedbackSearch').value,count:document.getElementById('feedbackCount').textContent,matches:Array.from(document.querySelectorAll('.feedback-item')).filter(function(i){return i.textContent.includes('히트박스');}).map(function(i){return {hidden:i.hidden,text:i.textContent};})})`)));
await evaluate(`document.getElementById('feedbackSearch').value='';document.getElementById('feedbackSearch').dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('feedback').scrollIntoView({behavior:'instant',block:'start'})`);await screenshot('feedback-light');
await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async function(text){window.__copiedVersion=text;}}});document.getElementById('copyVersion').click()`);await new Promise(r=>setTimeout(r,200));results.interactions.copyStatus=await evaluate(`document.getElementById('copyStatus').textContent`);assert.ok(results.interactions.copyStatus.length>0);
results.interactions.copiedVersion=await evaluate('window.__copiedVersion');
assert.ok(results.interactions.copiedVersion.includes('3928989'));assert.ok(results.interactions.copiedVersion.includes('미배포'));
assert.ok(!results.interactions.copiedVersion.includes('f69a166'));
await evaluate(`document.getElementById('release').scrollIntoView({behavior:'instant',block:'start'})`);await screenshot('release-desktop');
await send('Emulation.setEmulatedMedia',{media:'print'});await evaluate(`window.dispatchEvent(new Event('beforeprint'))`);results.print=await evaluate(`({visibleStages:Array.from(document.querySelectorAll('[data-stage-panel]')).filter(function(p){return getComputedStyle(p).display!=='none';}).length,openDetails:document.querySelectorAll('details[open]').length,allDetails:document.querySelectorAll('details').length,menuDisplay:getComputedStyle(document.querySelector('.viz-menu')).display})`);assert.equal(results.print.visibleStages,6);assert.equal(results.print.openDetails,results.print.allDetails);assert.equal(results.print.menuDisplay,'none');
await send('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
await evaluate(`window.dispatchEvent(new Event('afterprint'))`);await send('Emulation.setEmulatedMedia',{media:''});
await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await send('Page.reload',{ignoreCache:true});
await new Promise(r=>setTimeout(r,1200));await evaluate(`Promise.all(Array.from(document.images).map(function(i){i.loading='eager';return i.decode().catch(function(){return null;});}))`);
results.offline=await evaluate(`({mainCount:document.querySelectorAll('main').length,chartPresent:typeof Chart!=='undefined',fallbackVisible:getComputedStyle(document.getElementById('speedFallback')).display!=='none',imagesMissing:Array.from(document.images).filter(function(i){return !i.naturalWidth;}).length,feedbackItems:document.querySelectorAll('.feedback-item').length,embeddedAudio:document.querySelector('audio source').src.startsWith('data:')})`);assert.equal(results.offline.imagesMissing,0);assert.equal(results.offline.feedbackItems,25);assert.equal(results.offline.fallbackVisible,true);assert.equal(results.offline.embeddedAudio,true);
await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});

results.metadata=await evaluate(`JSON.parse(document.getElementById('releaseMetadata').textContent)`);
assert.equal(results.metadata.version,'0.01-b');assert.equal(results.metadata.status,'validated-local-not-deployed');
assert.equal(results.metadata.verification.tests,716);
results.historicalLabels=await evaluate(`({archive:document.getElementById('warning-archive').textContent,history:document.querySelector('#feedback .lede').textContent})`);
assert.ok(results.historicalLabels.archive.includes('0.01v'));
results.errors=errors;results.networkFailures=network.map(n=>({error:n.errorText,canceled:n.canceled}));assert.equal(errors.length,0,'Uncaught browser errors');
fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(results,null,2)+'\n');
socket.close();console.log(JSON.stringify(results,null,2));
