import { createRenderer, drawShip } from '/src/game/renderer.js';
import { VISUAL_THEME } from '/src/game/visual-theme.js';
import { createVisualAssetLoader } from '/src/game/visual-assets.js';
import { createGameEngine } from '/src/game/game-engine.js';
import { createGameHud } from '/src/ui/game-hud.js';
import { getDashBarrierBounds } from '/src/game/obstacles.js';
import { getPlayerBounds, getSpecialSuccessBounds } from '/src/game/player-geometry.js';
import { isSpecialTimingSuccess } from '/src/game/collision.js';
const query=new URLSearchParams(location.search),mode=query.get('mode')||'desktop',dpr=Number(query.get('dpr'))||1;
Object.defineProperty(globalThis,'devicePixelRatio',{configurable:true,value:dpr});
const canvas=document.querySelector('#scene'),ui=document.querySelector('#ui'),assets=createVisualAssetLoader(),loaded=await assets.preload();
const renderer=createRenderer(canvas,{visualAssets:assets});
let clock=0;const aircraftId=mode.startsWith('aegis')?'aegis':mode==='velocity'?'velocity':'default';
const engine=createGameEngine({now:()=>clock,gravity:0,rng:()=>mode==='geometry'?0:.6,stageRng:()=>.999,
  initialScore:mode==='geometry'?10:200,initialCompletedWarningCount:mode==='geometry'?0:1,aircraftId,guestMode:true,invincibilityEnabled:true});
engine.start();
const hud=createGameHud({getMuted:()=>false},{pause(){},toggleMute(){},space:()=>engine.dash(),fire:()=>engine.fire(),challengeKey:key=>engine.handleChallengeKey(key)});
ui.append(hud.element);
const step=(dt=.05)=>{clock+=dt*1000;engine.update(clock);const s=engine.getSnapshot();hud.update(s);return s;};
const until=fn=>{for(let i=0;i<6000;i++){const s=engine.getSnapshot();if(fn(s))return s;if(s.challenge?.active)for(const key of s.challenge.sequence)engine.handleChallengeKey(key);step();}throw Error('Fixture timeout '+mode);};
let snapshot;
if(mode==='geometry'){
  snapshot=until(s=>s.obstacles[0]&&isSpecialTimingSuccess({playerX:s.player.x,wallX:getDashBarrierBounds(s.obstacles[0]).x,speed:s.difficulty.scrollSpeed,windowSeconds:s.difficulty.timingWindowSeconds}));
}else if(mode==='laser'){
  snapshot=until(s=>s.boss?.attack?.type==='laser'&&s.boss.attack.kind==='single');
}else{
  snapshot=until(s=>s.boss?.weapon.ready&&!s.challenge?.active&&s.obstacles.length);
  if(mode==='aegis-hit'){engine.fire();step(.1);step(.1);snapshot=engine.getSnapshot();}
}
renderer.render(snapshot,{showPlayerHitbox:mode==='geometry'});hud.update(snapshot);
if(mode==='geometry'){
  const bounds=getSpecialSuccessBounds(snapshot.player),c=canvas.getContext('2d');
  c.save();c.setTransform(canvas.width/960,0,0,canvas.height/540,0,0);c.strokeStyle='#76dfff';c.lineWidth=1;c.strokeRect(bounds.left,bounds.top,56,36);c.restore();
}
const bbox=element=>{const b=element?.getBoundingClientRect();return b?{left:b.left,top:b.top,right:b.right,bottom:b.bottom,width:b.width,height:b.height}:null;};
const damage=getPlayerBounds(snapshot.player),success=getSpecialSuccessBounds(snapshot.player),css=canvas.getBoundingClientRect();
const report={mode,viewport:{width:innerWidth,height:innerHeight},dpr,buffer:{width:canvas.width,height:canvas.height},css:bbox(canvas),
  logicalWorld:{width:960,height:540},damage,success,assets:loaded.loaded.length,failedAssets:loaded.failed,
  documentOverflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,
  fireButton:ui.querySelector('.mobile-fire-button')?{display:getComputedStyle(ui.querySelector('.mobile-fire-button')).display,bounds:bbox(ui.querySelector('.mobile-fire-button'))}:null,
  aircraft:snapshot.aircraft,difficulty:snapshot.difficulty,boss:snapshot.boss?{hp:snapshot.boss.hp,maxHp:snapshot.boss.maxHp,laserHits:snapshot.boss.laserHits,damageTaken:snapshot.boss.damageTaken}:null,
  hpUi:ui.querySelector('.boss-health-text')?.textContent,
  timing:mode==='geometry'?{barrierX:getDashBarrierBounds(snapshot.obstacles[0]).x,bandWidth:snapshot.difficulty.scrollSpeed*snapshot.difficulty.timingWindowSeconds,eligible:true,centerInBand:getDashBarrierBounds(snapshot.obstacles[0]).x-snapshot.player.x<=snapshot.difficulty.scrollSpeed*snapshot.difficulty.timingWindowSeconds}:null,
  laser:mode==='laser'?{ys:snapshot.boss.attack.ys,thickness:snapshot.boss.attack.thickness,allowedTop:54,allowedBottom:486}:null,
  fixture:'Actual public engine state and production renderer/HUD/CSS; gravity0/collision bypass for reproducible images. DPR set in this review page only.'};
window.CentralHitboxReview={engine,renderer,snapshot,report};document.title='READY · '+mode+' · '+canvas.width+'x'+canvas.height;
const send=async(path,body)=>{const r=await fetch(path,{method:'POST',body});if(!r.ok)throw Error('Save failed '+path);};
if(query.has('capture')){
  await send('/central/report/'+mode,JSON.stringify(report));
  await send('/central/image/'+mode,await new Promise(resolve=>canvas.toBlob(resolve,'image/png')));
  if(mode==='desktop'){
    // Isolate the same production drawShip call to compare pixel density without
    // stage motion/background details obscuring the aircraft's outline.
    const tiles=[1,2].map(density=>{
      const tile=document.createElement('canvas');tile.width=200*density;tile.height=140*density;
      const c=tile.getContext('2d');c.scale(density,density);c.fillStyle='#081322';c.fillRect(0,0,200,140);
      c.imageSmoothingQuality=density===1?'low':'high';
      drawShip(c,{...snapshot.player,x:100,y:70,velocityY:0},VISUAL_THEME,snapshot.aircraft.id,assets);return tile;
    });
    const compare=document.createElement('canvas');compare.width=1440;compare.height=640;const c=compare.getContext('2d');
    c.fillStyle='#07101c';c.fillRect(0,0,1440,640);c.font='700 26px system-ui';c.fillStyle='#e5f2ff';c.fillText('Same production aircraft / same logical size / higher render density',32,46);
    c.font='20px system-ui';c.fillStyle='#a8c6db';c.fillText('Before: 1x raster enlarged for Full HD',32,96);c.fillText('After: 2x raster drawn for Full HD',750,96);
    c.drawImage(tiles[0],32,130,656,459);c.drawImage(tiles[1],750,130,656,459);
    await send('/central/image/clarity',await new Promise(resolve=>compare.toBlob(resolve,'image/png')));
  }
}
