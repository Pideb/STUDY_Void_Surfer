import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='.memory/validation/2026-11-03-aircraft-rankings';
const port=process.env.CDP_PORT??9456,base=process.env.QA_BASE_URL??'http://127.0.0.1:5173';
const tab=await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(tab.webSocketDebuggerUrl),jobs=new Map(),errors=[];let id=0;
await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const job=jobs.get(m.id);if(job){jobs.delete(m.id);m.error?job.reject(m.error):job.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const wait=async expression=>{for(let n=0;n<100;n++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout '+expression);};
const click=async selector=>{const p=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${dir}/${name}.png`,Buffer.from(r.data,'base64'));};
try{
 await send('Runtime.enable');await send('Page.enable');
 const sizes=[];
 for(const [width,height]of[[1600,900],[844,390],[568,320]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});
  await send('Page.navigate',{url:`${base}/${dir}/fixture.html`});
  await wait('window.qa?.ready&&document.querySelectorAll("tbody tr").length>=50');
  await wait('[...document.images].every(i=>i.complete&&i.naturalWidth>0)');
  for(const scope of['overall','default','aegis','velocity']){
   await click('#rank-tab-'+scope);await wait(`document.querySelector('#rank-tab-${scope}')?.getAttribute('aria-selected')==='true'&&!document.querySelector('[aria-busy=true]')&&!!document.querySelector('.personal-score')`);
   assert.equal(await evaluate('document.querySelectorAll("th").length'),scope==='overall'?4:3);
  }
  const metrics=await evaluate(`(()=>{const panel=document.querySelector('.pilot-ranking-screen').getBoundingClientRect(),personal=document.querySelector('.ranking-personal-record'),back=document.querySelector('.pilot-ranking-screen>button').getBoundingClientRect(),scroll=document.querySelector('.pilot-ranking-table-scroll');const before=personal.getBoundingClientRect().top;scroll.scrollTop=150;return{width:innerWidth,height:innerHeight,panel:{x:panel.x,y:panel.y,right:panel.right,bottom:panel.bottom},backBottom:back.bottom,minTarget:Math.min(...[...document.querySelectorAll('.rank-tab,.pilot-ranking-screen>button')].map(e=>e.getBoundingClientRect().height)),tableFont:parseFloat(getComputedStyle(document.querySelector('td')).fontSize),tabsFont:parseFloat(getComputedStyle(document.querySelector('.rank-tab')).fontSize),scroll:scroll.scrollTop,pinnedBefore:before,pinnedAfter:personal.getBoundingClientRect().top,overflow:document.documentElement.scrollWidth>innerWidth};})()`);
  assert.ok(metrics.minTarget>=44);assert.ok(metrics.tableFont>=13);assert.ok(metrics.panel.x>=0&&metrics.panel.y>=0&&metrics.panel.right<=width+1&&metrics.panel.bottom<=height+1);assert.ok(metrics.backBottom<=height);assert.ok(metrics.scroll>0);assert.equal(metrics.pinnedBefore,metrics.pinnedAfter);assert.equal(metrics.overflow,false);sizes.push(metrics);
  await evaluate('document.querySelector(".pilot-ranking-table-scroll").scrollTop=0');
  const visible=await evaluate(`(()=>{const region=document.querySelector('.pilot-ranking-table-scroll').getBoundingClientRect();return [...document.querySelectorAll('tbody tr')].filter(e=>{const r=e.getBoundingClientRect();return r.top>=region.top&&r.bottom<=region.bottom;}).length;})()`);
  assert.ok(visible>=2,`Only ${visible} whole rows visible at ${width}`);metrics.wholeVisibleRows=visible;
  await shot('ranking-'+width);
  if(width===844){
   await evaluate('window.qa.setGuest(true);window.qa.controller.dispatch("OPEN_PILOT_RANKING")');await wait('!!document.querySelector("#rank-tab-aegis")');await click('#rank-tab-aegis');await wait('document.querySelectorAll("tbody tr").length>=50');assert.equal(await evaluate('!!document.querySelector(".personal-score")'),false);await shot('guest-mobile');
  }
 }
 assert.equal(errors.length,0);fs.writeFileSync(dir+'/browser.json',JSON.stringify({actualController:true,mockedServices:true,sizes,errors,remoteWrites:false},null,2));console.log(JSON.stringify({sizes,errors}));
}finally{await send('Browser.close').catch(()=>{});ws.close();}
