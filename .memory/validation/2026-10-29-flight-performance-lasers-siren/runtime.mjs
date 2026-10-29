import {createRenderer} from '/src/game/renderer.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createGameEngine} from '/src/game/game-engine.js';
import {createGameHud} from '/src/ui/game-hud.js';
import {createAppController} from '/src/ui/app-controller.js';
import {createBossEntryBuffer} from '/src/audio/boss-entry-siren.js';
import {GUEST_RECORD_STORAGE_KEY} from '/src/services/guest-record-service.js';
const q=new URLSearchParams(location.search),id=q.get('id')||'guest-hangar';
const canvas=document.querySelector('#scene'),root=document.querySelector('#ui'),assets=createVisualAssetLoader(),loaded=await assets.preload(),renderer=createRenderer(canvas,{visualAssets:assets});
const send=async(type,name,body)=>{const r=await fetch(`/flightqa/${type}/${name}`,{method:'POST',body});if(!r.ok)throw Error(await r.text());};
const bbox=e=>{const b=e?.getBoundingClientRect();return b?{left:b.left,top:b.top,right:b.right,bottom:b.bottom}:null;};
const settle=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
let clock=0,snapshot,controller;const record={id,failedAssets:loaded.failed,fixture:'Production engine/renderer/controller/HUD/CSS; deterministic gravity0. Auth/ranking data are local test doubles; no remote DB or sign-in mutation.'};
try{
 if(id.includes('guest')||id==='account-hangar'){
  localStorage.setItem(GUEST_RECORD_STORAGE_KEY,JSON.stringify({version:1,bestScore:999,aircraftId:'velocity',achievedAt:new Date().toISOString()}));localStorage.setItem('flight-qa-unrelated','keep');
  const engine=createGameEngine({now:()=>clock,gravity:0,rng:()=>.6});
  let privateReads=0,submissions=0;const user=id==='account-hangar'?{id:'fixture-account',email:'fixture@example.test',user_metadata:{full_name:'Fixture Pilot'}}:null;
  const authService={getSessionUser:async()=>user,subscribeToAuth:()=>()=>{},signInWithMicrosoft:async()=>({user}),signOut:async()=>{}};
  const leaderboardService={fetchPlayerBestScore:async()=>({bestScore:100,error:null}),fetchLeaderboardPage:async()=>({rows:Array.from({length:50},(_,i)=>({rank:i+1,displayName:`Pilot ${i+1}`,bestScore:200-i,aircraftId:'default'})),error:null}),fetchTopScores:async()=>({rows:[],error:null}),fetchPlayerNeighborhood:async()=>{privateReads++;return {rows:[],error:null};},submitBestScore:async()=>{submissions++;return {error:null};}};
  const savedRAF=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=()=>0;
  controller=createAppController({root,canvas,gameEngine:engine,renderer,authService,leaderboardService,audioManager:{isMuted:()=>false,setMusicMode(){},setMusicScene(){},play(){}}});
  controller.mount();await settle();
  if(id.includes('hangar'))controller.dispatch('OPEN_HANGAR');
  else if(id.includes('ranking'))controller.dispatch('OPEN_PILOT_RANKING');
  else if(id.includes('result')){
    controller.dispatch('START_GAME_FROM_MENU');controller.dispatch('START_PLAYING');
    for(let i=0;i<500&&engine.getSnapshot().score<2&&!engine.getSnapshot().deathEffect;i++){clock+=50;engine.update(clock);}
    engine.stop('fixture-end');for(let i=0;i<10;i++){clock+=100;engine.update(clock);}renderer.render(engine.getSnapshot());controller.dispatch('GAME_OVER');
  }
  await settle();globalThis.requestAnimationFrame=savedRAF;snapshot=engine.getSnapshot();
  record.guestRecordPresent=localStorage.getItem(GUEST_RECORD_STORAGE_KEY)!==null;record.unrelated=localStorage.getItem('flight-qa-unrelated');record.privateReads=privateReads;record.submissions=submissions;
  record.hangarBest=root.querySelector('.hangar-best-score')?.textContent??null;record.aircraftOptions=[...root.querySelectorAll('.aircraft-option')].map(b=>({name:b.getAttribute('aria-label'),disabled:b.disabled,image:bbox(b.querySelector('img')),title:bbox(b.querySelector('strong'))}));record.text=root.textContent;
 }else{
  let roll=.6;const engine=createGameEngine({now:()=>clock,gravity:0,rng:()=>roll,initialScore:id.includes('normal')?10:200,initialCompletedWarningCount:id.includes('normal')?4:id.includes('warning')?4:3,invincibilityEnabled:true,accountBestScore:100});engine.start();
  const hud=createGameHud({getMuted:()=>false},{pause(){},toggleMute(){},space(){},fire(){},challengeKey(){}});root.append(hud.element);
  const tick=()=>{clock+=50;engine.update(clock);const s=engine.getSnapshot();hud.update(s);return s;};
  const until=predicate=>{for(let i=0;i<30000;i++){const s=engine.getSnapshot();if(predicate(s))return s;if(s.challenge?.active)for(const key of s.challenge.sequence)engine.handleChallengeKey(key);tick();}throw Error('Fixture timeout '+id);};
  if(id==='boss-entry')snapshot=until(s=>s.bossPreview);
  else if(id==='volley-spread')snapshot=until(s=>s.boss?.attack?.type==='volley'&&s.boss.cyclePhase==='signature'&&s.boss.attack.elapsedSeconds>2);
  else if(id==='boss-stable'){
    const start=until(s=>s.boss&&!s.bossEntry),speeds=[];let before=start;
    for(let i=0;i<120;i++){if(before.challenge?.active)for(const key of before.challenge.sequence)engine.handleChallengeKey(key);const after=tick();speeds.push({wall:after.difficulty.scrollSpeed,background:after.backgroundScrollSpeed,travel:after.backgroundScrollDistancePx-before.backgroundScrollDistancePx});before=after;}
    record.backgroundSamples=speeds;snapshot=before;
  }else{
    if(id.includes('two')){for(let i=0;i<59;i++)tick();roll=.1;}
    snapshot=until(s=>s.ambientAttack);record.lines=snapshot.ambientAttack.ys;
  }
  renderer.render(snapshot);hud.update(snapshot);record.fixture+=' Collision bypass enabled for reproducible combat capture.';
 }
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const Context=globalThis.OfflineAudioContext??globalThis.webkitOfflineAudioContext;
 if(Context){const context=new Context(2,57600,24000),buffer=createBossEntryBuffer(context);let peak=0;for(const value of buffer.getChannelData(0))peak=Math.max(peak,Math.abs(value));record.audio={duration:buffer.duration,channels:buffer.numberOfChannels,frames:buffer.length,peak};}
 record.viewport={width:innerWidth,height:innerHeight,dpr:devicePixelRatio};record.buffer={width:canvas.width,height:canvas.height};record.layers=renderer.getLayerStats();record.overflow=document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight;record.canvas=bbox(canvas);record.snapshot=snapshot;
 await send('png',id,await new Promise(r=>canvas.toBlob(r,'image/png')));await send('json',id,JSON.stringify(record));await send('done',id,'ok');document.title='DONE '+id;
}catch(e){await send('json',id,JSON.stringify({error:e.stack}));await send('done',id,'error');document.title='ERROR '+id;throw e;}
