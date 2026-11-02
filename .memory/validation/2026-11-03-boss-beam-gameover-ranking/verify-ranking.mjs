import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='.memory/validation/2026-11-03-boss-beam-gameover-ranking';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(x=>x.includes('=')&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return[x.slice(0,i).trim(),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const tab=await fetch('http://127.0.0.1:9452/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(tab.webSocketDebuggerUrl),jobs=new Map();let id=0;
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const job=jobs.get(m.id);if(job){jobs.delete(m.id);m.error?job.reject(m.error):job.resolve(m.result);}}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
await send('Page.navigate',{url:'http://127.0.0.1:5174/guide/index.html'});await new Promise(r=>setTimeout(r,600));
await send('Runtime.evaluate',{expression:'window.qaPublicConfig='+JSON.stringify({url:env.VITE_SUPABASE_URL,key:env.VITE_SUPABASE_ANON_KEY})});
async function verify(){
 await import('/src/styles.css');
 const {createApp}=await import('/src/app/create-app.js');
 const {createAppController}=await import('/src/ui/app-controller.js');
 const {fetchTopScores,fetchLeaderboardPage}=await import('/src/services/leaderboard-service.js');
 document.body.innerHTML='<div id="app" class="game-shell"></div>';
 const {canvas,uiRoot,liveRegion}=createApp(document.getElementById('app'));
 const calls=[],client={auth:{getSession:async()=>({data:{session:null},error:null})},rpc:async(name,args)=>{
  if(name!=='get_public_leaderboard')throw Error('Guest used a private RPC');
  const r=await fetch(qaPublicConfig.url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:qaPublicConfig.key,'Content-Type':'application/json'},body:JSON.stringify(args)});
  calls.push({name,status:r.status});const data=await r.json();return r.ok?{data,error:null}:{data:null,error:data};
 }};
 let fail=false,saves=0;
 const state={state:'menu',score:0,player:{x:240,y:270,velocityY:0}};
 const controller=createAppController({root:uiRoot,canvas,liveRegion,
  authService:{getSessionUser:async()=>null,subscribeToAuth:()=>()=>{}},
  leaderboardService:{fetchTopScores:()=>fail?Promise.reject(Error('Simulated list failure')):fetchTopScores(client),fetchLeaderboardPage:args=>fetchLeaderboardPage(client,args),fetchPlayerNeighborhood:()=>{throw Error('Guest queried neighborhood');},submitBestScore:()=>{saves++;throw Error('Guest score write');}},
  gameEngine:{getSnapshot:()=>({...state,player:{...state.player}}),start:()=>{state.state='playing';},stop:()=>{state.state='game-over';},setAircraft:()=>{},setGuestMode:()=>{},setInvincibilityEnabled:()=>{},setAccountBestScore:()=>{},update:()=>{}},
  renderer:{render:()=>{},renderMenuBackground:()=>{},destroy:()=>{}},audioManager:{isMuted:()=>true,unlock:async()=>{},setMusicMode:()=>{},setMusicScene:()=>{},play:()=>{},pauseMusic:()=>{},resumeMusic:()=>{},resetRun:()=>{},destroy:()=>{}},
 });
 const wait=async fn=>{for(let i=0;i<150;i++){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw Error('Timed out');};
 controller.mount();await wait(()=>uiRoot.querySelector('.menu-screen'));
 const finish=async()=>{controller.dispatch('START_GAME_FROM_MENU');controller.dispatch('START_PLAYING');await wait(()=>state.state==='playing');controller.dispatch('GAME_OVER');};
 await finish();await wait(()=>uiRoot.querySelector('.leaderboard-section table tbody tr'));
 const rows=uiRoot.querySelectorAll('.leaderboard-section table tbody tr').length;
 const healthy={rows,hasRetry:Boolean(uiRoot.querySelector('.leaderboard-panel button')),sections:uiRoot.querySelectorAll('.leaderboard-section').length};
 controller.dispatch('RETURN_TO_MENU');fail=true;await finish();await wait(()=>uiRoot.querySelector('.leaderboard-section.error-message'));
 const failure={hasRetry:Boolean(uiRoot.querySelector('.leaderboard-panel button')),rankingAction:[...uiRoot.querySelectorAll('button')].some(b=>b.textContent==='파일럿 랭킹')};
 controller.dispatch({type:'OPEN_PILOT_RANKING',returnScreen:'game-over'});await wait(()=>uiRoot.querySelector('.pilot-ranking-table tbody tr'));
 const fullRankingRows=uiRoot.querySelectorAll('.pilot-ranking-table tbody tr').length;
 controller.dispatch('CLOSE_PILOT_RANKING');
 return {healthy,failure,fullRankingRows,calls,scoreWrites:saves};
}
const r=await send('Runtime.evaluate',{expression:'('+verify.toString()+')()',awaitPromise:true,returnByValue:true});
if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));const result=r.result.value;
fs.writeFileSync(dir+'/ranking-browser.json',JSON.stringify(result,null,2)+'\n');
assert.ok(result.healthy.rows>0);assert.equal(result.healthy.sections,1);assert.equal(result.healthy.hasRetry,false);assert.equal(result.failure.hasRetry,false);assert.ok(result.failure.rankingAction);assert.ok(result.fullRankingRows>0);assert.equal(result.scoreWrites,0);assert.ok(result.calls.every(c=>c.status===200));
console.log(JSON.stringify(result));await send('Browser.close');ws.close();
