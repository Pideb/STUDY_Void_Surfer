import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='.memory/validation/2026-11-03-pilot-ranking-reload';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(x=>x.includes('=')&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return[x.slice(0,i).trim(),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const tab=await fetch('http://127.0.0.1:9453/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(tab.webSocketDebuggerUrl),jobs=new Map();let id=0;
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const job=jobs.get(m.id);if(job){jobs.delete(m.id);m.error?job.reject(m.error):job.resolve(m.result);}}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://127.0.0.1:5174/guide/index.html'});await new Promise(r=>setTimeout(r,600));
await evaluate('window.qaPublicConfig='+JSON.stringify({url:env.VITE_SUPABASE_URL,key:env.VITE_SUPABASE_ANON_KEY}));
async function init(){
 await import('/src/styles.css');const {createApp}=await import('/src/app/create-app.js'),{createAppController}=await import('/src/ui/app-controller.js'),{fetchLeaderboardPage}=await import('/src/services/leaderboard-service.js');
 document.body.innerHTML='<div id="app" class="game-shell"></div>';const {canvas,uiRoot,liveRegion}=createApp(document.getElementById('app'));
 const qa={calls:[],writes:0};window.qa=qa;
 const client={rpc:async(name,args)=>{if(name!=='get_public_leaderboard')throw Error('Unexpected private RPC');const r=await fetch(qaPublicConfig.url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:qaPublicConfig.key,'Content-Type':'application/json'},body:JSON.stringify(args)});qa.calls.push({name,status:r.status,offset:args.p_offset});const data=await r.json();return r.ok?{data,error:null}:{data:null,error:data};}};
 qa.controller=createAppController({root:uiRoot,canvas,liveRegion,
  authService:{getSessionUser:async()=>null,subscribeToAuth:()=>()=>{}},
  leaderboardService:{fetchLeaderboardPage:args=>{if(qa.calls.length===0){qa.calls.push({simulatedError:true,offset:args.offset});return Promise.resolve({rows:[],error:Error('Simulated offline')});}return fetchLeaderboardPage(client,args);},submitBestScore:()=>{qa.writes++;throw Error('Unexpected score write');}},
  gameEngine:{getSnapshot:()=>({state:'menu',score:0,player:{x:240,y:270,velocityY:0}}),setAircraft:()=>{},setGuestMode:()=>{},setInvincibilityEnabled:()=>{},setAccountBestScore:()=>{}},
  renderer:{render:()=>{},renderMenuBackground:()=>{},destroy:()=>{}},audioManager:{isMuted:()=>true,unlock:async()=>{},setMusicMode:()=>{},setMusicScene:()=>{},play:()=>{},destroy:()=>{}},
 });
 qa.controller.mount();for(let i=0;i<20;i++)await Promise.resolve();for(let i=0;i<100&&!uiRoot.querySelector('.menu-screen');i++)await new Promise(r=>setTimeout(r,25));qa.controller.dispatch('OPEN_PILOT_RANKING');
}
await evaluate('('+init.toString()+')()');
await new Promise(r=>setTimeout(r,1200));
const before=await evaluate(`(()=>{const b=document.querySelector('.ranking-reload');if(!b)return{error:'Reload disappeared',calls:qa.calls,screen:document.querySelector('#ui-root')?.dataset.screen,buttons:[...document.querySelectorAll('button')].map(b=>({label:b.textContent,className:b.className}))};window.qaButton=b;const r=b.getBoundingClientRect();return {calls:qa.calls.length,label:b.textContent,disabled:b.disabled,x:r.x+r.width/2,y:r.y+r.height/2,targetAtPoint:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b,autoSentinel:!!document.querySelector('.ranking-load-more'),observerAvailable:typeof IntersectionObserver==='function'};})()`);
console.log(JSON.stringify({before}));
assert.equal(before.calls,1);assert.equal(before.label,'랭킹 다시 불러오기');assert.equal(before.disabled,false);assert.equal(before.targetAtPoint,true);assert.equal(before.autoSentinel,false);assert.equal(before.observerAvailable,true);
await send('Input.dispatchMouseEvent',{type:'mousePressed',x:before.x,y:before.y,button:'left',clickCount:1});await new Promise(r=>setTimeout(r,200));
assert.equal(await evaluate('qaButton.isConnected'),true);
await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:before.x,y:before.y,button:'left',clickCount:1});
let rows=0;for(let i=0;i<150;i++){rows=await evaluate('document.querySelectorAll(".pilot-ranking-table tbody tr").length');if(rows>0)break;await new Promise(r=>setTimeout(r,50));}
const after=await evaluate('({calls:qa.calls,writes:qa.writes,rows:document.querySelectorAll(".pilot-ranking-table tbody tr").length,hasReload:!!document.querySelector(".ranking-reload")})');
assert.ok(after.rows>0);assert.equal(after.calls.length,2);assert.equal(after.calls[1].status,200);assert.equal(after.writes,0);assert.equal(after.hasReload,false);
const report={before,after,realPointerClick:true,productionWrite:false};fs.writeFileSync(dir+'/browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await send('Browser.close');ws.close();
