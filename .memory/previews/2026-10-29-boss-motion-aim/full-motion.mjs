import {createRenderer} from '/src/game/renderer.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createGameEngine} from '/src/game/game-engine.js';
import {createObstacle} from '/src/game/obstacles.js';
import {getBossGeometry} from '/src/game/boss-geometry.js';
import {BOSS_RIGS} from '/src/game/boss-rigs.js';
import {prepareBossRig,drawBossRig,drawBossActionEffects} from '/src/game/boss-motion.js';
const query=new URLSearchParams(location.search),canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d'),tau=Math.PI*2;
const wide=query.get('range')==='wide',amplitude=wide?162:120,minY=270-amplitude,maxY=270+amplitude;
const topPercent=wide?20:28,bottomPercent=wide?80:72;
Object.defineProperty(globalThis,'devicePixelRatio',{configurable:true,value:1});
const assets=createVisualAssetLoader(),loaded=await assets.preload();if(loaded.failed.length)throw Error('Assets unavailable');
const base=document.createElement('canvas'),renderer=createRenderer(base,{visualAssets:assets});
const engine=createGameEngine({now:()=>0,gravity:0,initialScore:100,initialCompletedWarningCount:1,rng:()=>.4,stageRng:()=>.999,guestMode:true});engine.start();
const source=engine.getSnapshot(),rigs=new Map();
for(const id of Object.keys(BOSS_RIGS)){const original=BOSS_RIGS[id],rig={...original,parts:original.parts.map(p=>({...p,amplitude:p.amplitude*3,open:p.open*1.7,slide:(p.slide||0)*2,lift:(p.lift||0)*2,recoil:(p.recoil||0)*2}))};rigs.set(id,{rig,prepared:prepareBossRig({rig,image:assets.get('stages.'+id+'.boss')})});}
const state={stage:'crystal-gates',time:0,paused:false,guides:false};
function label(text,x,y,size=14,color='#bcd7eb',weight=400){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui`;ctx.fillText(text,x,y);}
function reactor(t){const x=480,y=474,r=40,p=.72,color='#8be9ff';ctx.save();const g=ctx.createRadialGradient(x,y,0,x,y,53);g.addColorStop(0,'#020913aa');g.addColorStop(1,'#02091300');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,53,0,tau);ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#294a5d';ctx.beginPath();ctx.arc(x,y,r,Math.PI*.8,Math.PI*2.2);ctx.stroke();ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=3;ctx.beginPath();ctx.arc(x,y,r,Math.PI*.8,Math.PI*.8+Math.PI*1.4*p);ctx.stroke();
for(let k=0;k<=10;k++){const a=Math.PI*.8+Math.PI*1.4*k/10;ctx.strokeStyle='#93b7cb';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*46,y+Math.sin(a)*46);ctx.lineTo(x+Math.cos(a)*49,y+Math.sin(a)*49);ctx.stroke();}
ctx.textAlign='center';label('72%',x,y+2,24,color,700);label('LASER',x,y+17,10,color,600);ctx.shadowBlur=0;ctx.fillStyle='#020913aa';ctx.fillRect(x-43,499,86,18);ctx.strokeStyle='#7ba6bd';ctx.strokeRect(x-43,499,86,18);label('SHIFT / CTRL',x,512,10,'#d5eeff',600);ctx.restore();}
function geometry(t){const original=getBossGeometry(state.stage),dy=amplitude*Math.sin(tau*t/6),point=p=>({x:p.x,y:p.y+dy});return{box:{...original.box,y:original.box.y+dy},center:point(original.center),core:point(original.core),muzzle:point(original.muzzle)};}
function draw(t){
const playerY=270+28*Math.sin(t*1.15),travel=(t*200)%2400;
const obstacles=[{x:420,kind:'normal'},{x:850,kind:'special'},{x:1280,kind:'normal'},{x:1710,kind:'normal'},{x:2140,kind:'special'}].map((o,index)=>{
let x=o.x-travel;if(x< -100)x+=2400;const wall=createObstacle({id:'review-'+index,x,gapCenter:270,gapHeight:180,kind:o.kind,stageId:state.stage,showTimingGuide:o.kind==='special'});
if(wall.kind==='special'&&x<268){wall.barrierBroken=true;wall.barrierBreakY=playerY;}return wall;
}).filter(o=>o.x<1040);
const snapshot={...source,boss:null,bossPreview:null,challenge:null,feedbackEffect:null,deathEffect:null,
stage:{id:state.stage,mode:'boss',elapsedSeconds:t,transition:null},elapsedSeconds:t,backgroundScrollDistancePx:t*50,
difficulty:{...source.difficulty,isBoss:false,isWarning:false,scrollSpeed:200,timingWindowSeconds:.15},
player:{...source.player,y:playerY,velocityY:0},obstacles,
flightTrail:Array.from({length:9},(_,i)=>({x:35+i*23.5,y:270+28*Math.sin((t-(8-i)*.12)*1.15),ageSeconds:(8-i)*.12}))};
renderer.render(snapshot);ctx.clearRect(0,0,960,540);ctx.drawImage(base,0,0,960,540);
const g=geometry(t),{rig,prepared}=rigs.get(state.stage);
drawBossRig(ctx,{rig,prepared,pose:{time:t*1.3,charge:0,fire:0,roar:0,hit:0},box:g.box,projectileImage:assets.get('stages.'+state.stage+'.projectile')});
drawBossActionEffects(ctx,{rig,pose:{time:t},box:g.box});
ctx.save();ctx.fillStyle='#071525cc';ctx.strokeStyle='#3d657b';ctx.lineWidth=1;ctx.fillRect(13,13,92,34);ctx.strokeRect(13,13,92,34);label('점수 100',24,35,17,'#eaf7ff',700);
label('BOSS HP',371,32,11,'#ffd59e',700);for(let i=0;i<3;i++){ctx.fillStyle='#ffb36d';ctx.fillRect(440+i*44,22,40,9);}label('3 / 3',578,32,11,'#ffd59e',600);ctx.restore();
reactor(t);
if(state.guides){ctx.save();ctx.setLineDash([7,7]);ctx.strokeStyle='#f4edba9c';ctx.lineWidth=1;for(const y of [minY,maxY]){ctx.beginPath();ctx.moveTo(600,y);ctx.lineTo(950,y);ctx.stroke();label(y===minY?`중심 최상단 ${topPercent}%`:`중심 최하단 ${bottomPercent}%`,615,y-7,12,'#f4edba');}ctx.setLineDash([]);ctx.strokeStyle='#f4edba';ctx.beginPath();ctx.arc(g.center.x,g.center.y,3,0,tau);ctx.stroke();ctx.restore();}
return g;
}
let last=performance.now();function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(!state.paused)state.time+=dt;draw(state.time);requestAnimationFrame(frame);}
document.querySelector('#stage').onchange=e=>{state.stage=e.target.value;state.time=0;};document.querySelector('#pause').onclick=e=>{state.paused=!state.paused;e.target.textContent=state.paused?'재생':'정지';};document.querySelector('#restart').onclick=()=>state.time=0;document.querySelector('#guides').onchange=e=>state.guides=e.target.checked;
document.querySelector('#full').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.();};document.querySelector('#clean').onclick=()=>document.body.classList.toggle('clean');
draw(0);document.querySelector('#loading').hidden=true;
document.querySelector('.status').textContent=`시안 · 중심 높이 ${topPercent}~${bottomPercent}% · 6초 왕복 · 기체/보스 크기 유지 · 충전 UI 80px`;
const send=async(id,body)=>{const r=await fetch('/fullmotion/'+id+(wide?'-wide':''),{method:'POST',body});if(!r.ok)throw Error('Save failed '+id);};
const png=()=>new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
if(query.has('capture')){
state.paused=true;draw(0);await send('poster',await png());
const strip=document.createElement('canvas');strip.width=1440;strip.height=320;const c=strip.getContext('2d');c.fillStyle='#060e18';c.fillRect(0,0,1440,320);
for(const [index,time] of [4.5,0,1.5].entries()){draw(time);c.drawImage(canvas,index*480,40,480,270);c.fillStyle='#e5f2ff';c.font='600 18px system-ui';c.fillText([`최상단 · 중심 ${topPercent}%`,'중앙 · 중심 50%',`최하단 · 중심 ${bottomPercent}%`][index],index*480+14,27);}
await send('range',await new Promise(resolve=>strip.toBlob(resolve,'image/png')));draw(0);
await send('report',JSON.stringify({stage:state.stage,world:{width:960,height:540},minimumCenterY:minY,maximumCenterY:maxY,periodSeconds:6,nominalArtHeight:128,nominalArtMinY:minY-64,nominalArtMaxY:maxY+64,reactorDiameter:80,loadedAssets:loaded.loaded.length,failedAssets:loaded.failed,fixture:'Preview using production scene and art; candidate movement only, no collision simulation.'}));
}
if(query.has('record')){
state.paused=true;if(document.readyState!=='complete')await new Promise(resolve=>addEventListener('load',resolve,{once:true}));
await new Promise(requestAnimationFrame);draw(0);
const stream=canvas.captureStream(24),mime=['video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw Error('Recorder unavailable');
const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1900000}),chunks=[];
const stopped=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=e=>reject(e.error);recorder.onstop=()=>resolve(new Blob(chunks,{type:'video/webm'}));});
recorder.start(500);const start=performance.now();
await new Promise(resolve=>{function record(now){const t=(now-start)/1000;draw(Math.min(t,6));if(t>=6){resolve();return;}requestAnimationFrame(record);}requestAnimationFrame(record);});
recorder.stop();const movie=await stopped;stream.getTracks().forEach(track=>track.stop());if(movie.size<10000)throw Error('Empty movie');await send('movie',movie);await send('recorded',JSON.stringify({bytes:movie.size,mime,seconds:6}));draw(0);document.title='RECORDED';
}else if(!query.has('capture'))requestAnimationFrame(frame);
window.FullBossMotionReview={state,draw,geometry};
