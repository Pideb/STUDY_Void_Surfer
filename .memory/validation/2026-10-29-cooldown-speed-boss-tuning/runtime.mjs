import {createRenderer,drawShip,drawDashCooldown} from '/src/game/renderer.js';
import {VISUAL_THEME} from '/src/game/visual-theme.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createGameEngine} from '/src/game/game-engine.js';
import {createGameHud} from '/src/ui/game-hud.js';
import {getPlayerBounds} from '/src/game/player-geometry.js';
const query=new URLSearchParams(location.search),mode=query.get('mode')||'nova',dpr=mode==='mobile'?2:1;
Object.defineProperty(globalThis,'devicePixelRatio',{configurable:true,value:dpr});
const canvas=document.querySelector('#scene'),ui=document.querySelector('#ui'),assets=createVisualAssetLoader(),loaded=await assets.preload();
if(loaded.failed.length)throw Error('Missing assets');
const renderer=createRenderer(canvas,{visualAssets:assets});
const aircraftId=mode==='aegis'?'aegis':mode==='velocity'?'velocity':'default',normal=['nova','aegis','velocity','mobile'].includes(mode);
let time=0;
const engine=createGameEngine({now:()=>time,gravity:0,rng:()=>mode==='sixshot'?.99:mode==='laser'?.6:.4,stageRng:()=>.999,
initialScore:normal?0:100,initialCompletedWarningCount:normal?0:1,aircraftId,guestMode:true,invincibilityEnabled:true});
engine.start();
const hud=createGameHud({getMuted:()=>false},{pause(){},toggleMute(){},space:()=>engine.dash(),fire:()=>engine.fire(),challengeKey:key=>engine.handleChallengeKey(key)});ui.append(hud.element);
const step=(dt=.05)=>{time+=dt*1000;engine.update(time);const s=engine.getSnapshot();hud.update(s);return s;};
const until=predicate=>{for(let i=0;i<8000;i++){const s=engine.getSnapshot();if(predicate(s))return s;if(s.challenge?.active)for(const key of s.challenge.sequence)engine.handleChallengeKey(key);step();}throw Error('Timeout '+mode);};
let snapshot,markerPlayer=null,weaponChecks=null;
if(normal){
  for(let i=0;i<30;i++)step();engine.dash();for(let i=0;i<7;i++)step();markerPlayer=engine.getSnapshot().player;
  for(let i=0;i<6;i++)step();snapshot=engine.getSnapshot();
}else if(mode==='charge'||mode==='beam'){
  until(s=>s.boss?.weapon.ready&&!s.challenge?.active);engine.fire();
  for(let i=0;i<4;i++)step(.1);step(.09);const before=engine.getSnapshot();
  if(mode==='beam')step(.01);snapshot=engine.getSnapshot();
  const wallBefore=before.obstacles[0];const playerY=snapshot.player.y;
  const hpAtCapture=snapshot.boss.hp;
  for(let i=0;i<4;i++)step(.05);const at69=engine.getSnapshot();
  // These checks are taken from the real public engine clock, independently of
  // the earlier visual snapshot that remains rendered below.
  weaponChecks={captureElapsed:snapshot.boss.weapon.firing.elapsedSeconds,chargeSeconds:snapshot.boss.weapon.firing.chargeSeconds,
    durationSeconds:snapshot.boss.weapon.firing.durationSeconds,hpAtCapture,playerHeld:at69.player.y===playerY,
    worldAdvanced:at69.elapsedSeconds>snapshot.elapsedSeconds,
    wallAdvanced:wallBefore?at69.obstacles.find(w=>w.id===wallBefore.id)?.x<wallBefore.x:null};
}else if(mode==='sixshot'){
  snapshot=until(s=>s.boss?.cyclePhase==='signature'&&s.boss.attack?.type==='volley'&&s.boss.attack.projectiles.length===6&&s.boss.attack.elapsedSeconds>=.4);
}else if(mode==='laser'){
  snapshot=until(s=>s.boss?.attack?.type==='laser'&&s.boss.attack.kind==='single'&&s.boss.attack.activeElapsedSeconds>=.38);
}
renderer.render(snapshot);hud.update(snapshot);
const speedTable=['default','aegis','velocity'].map(id=>({id,speeds:[0,10,50,99,100,200].map(score=>{
  const e=createGameEngine({initialScore:score,aircraftId:id,guestMode:true});e.start();return{score,speed:e.getSnapshot().difficulty.scrollSpeed};
})}));
const fireButton=ui.querySelector('.mobile-fire-button'),box=fireButton?.getBoundingClientRect();
const report={mode,viewport:{width:innerWidth,height:innerHeight},dpr,buffer:{width:canvas.width,height:canvas.height},
  loadedAssets:loaded.loaded.length,missingAssets:loaded.failed,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,
  aircraftId,damage:getPlayerBounds(snapshot.player),cooldownRemaining:snapshot.player.dashCooldownRemainingSeconds,
  cooldownMarker:{x:snapshot.player.x-36,y:snapshot.player.y-24,radius:8},speedTable,weaponChecks,
  volley:snapshot.boss?.attack?.type==='volley'?{count:snapshot.boss.attack.projectiles.length,phase:snapshot.boss.cyclePhase,walls:snapshot.obstacles.length}:null,
  lineLaser:mode==='laser'?{ys:snapshot.boss.attack.ys,thickness:snapshot.boss.attack.thickness,allowedTop:81,allowedBottom:459}:null,
  mobileFire:fireButton?{display:getComputedStyle(fireButton).display,left:box.left,right:box.right,bottom:box.bottom}:null,
  fixture:'Production engine/renderer/HUD/assets; reproducible clock, gravity0, guest/admin collision bypass for captures only.'};
window.TuningReview={engine,renderer,snapshot,report};
const send=async(path,body)=>{const r=await fetch(path,{method:'POST',body});if(!r.ok)throw Error('Export failed '+path);};
if(query.has('capture')){
  await send('/tuning/report/'+mode,JSON.stringify(report));
  await send('/tuning/image/'+mode,await new Promise(resolve=>canvas.toBlob(resolve,'image/png')));
  if(markerPlayer&&mode!=='mobile'){
    const tile=document.createElement('canvas');tile.width=640;tile.height=360;const c=tile.getContext('2d');c.fillStyle='#081322';c.fillRect(0,0,640,360);c.translate(320,210);c.scale(4,4);
    const p={...markerPlayer,x:0,y:0};drawShip(c,p,VISUAL_THEME,aircraftId,assets);drawDashCooldown(c,p);
    await send('/tuning/image/'+mode+'-detail',await new Promise(resolve=>tile.toBlob(resolve,'image/png')));
  }
}
document.title='READY - '+mode;
