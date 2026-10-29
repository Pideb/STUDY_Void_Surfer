import {createRenderer} from '/src/game/renderer.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createGameEngine} from '/src/game/game-engine.js';
import {drawLaser} from '/src/game/laser-renderer.js';
import {createQuarterLaser,updateLaser} from '/src/game/boss-attacks.js';
const query=new URLSearchParams(location.search),assets=createVisualAssetLoader(),loaded=await assets.preload();if(loaded.failed.length)throw Error('Missing assets');
Object.defineProperty(globalThis,'devicePixelRatio',{configurable:true,value:1});
const base=document.createElement('canvas'),renderer=createRenderer(base,{visualAssets:assets});let clock=0;
const engine=createGameEngine({now:()=>clock,gravity:0,rng:()=>.4,stageRng:()=>.999,initialScore:100,initialCompletedWarningCount:3,guestMode:true,invincibilityEnabled:true});engine.start();
for(let i=0;i<80;i++){clock+=50;engine.update(clock);if(engine.getSnapshot().boss?.entranceRemainingSeconds===0)break;}
const source=engine.getSnapshot();if(!source.boss)throw Error('Boss not ready');
const scene=document.querySelector('#scene'),ctx=scene.getContext('2d'),comparison=document.querySelector('#comparison'),cc=comparison.getContext('2d');
const state={style:1,zone:1,time:0,playing:!query.has('capture')},frames=new Map();
function text(c,s,x,y,size=16,color='#e6f7ff',weight=600){c.fillStyle=color;c.font=`${weight} ${size}px system-ui`;c.fillText(s,x,y);}
function dangerPath(c,top,bottom){c.beginPath();if(top>0)c.rect(0,0,960,top);if(bottom<540)c.rect(0,bottom,960,540-bottom);c.clip();}
function underlay(c,style,zone,t,warning){const top=zone*135,bottom=top+135;c.save();dangerPath(c,top,bottom);
c.fillStyle=style===1?'rgba(121,9,32,.17)':'rgba(1,5,14,.38)';c.fillRect(0,0,960,540);
if(style===1){c.strokeStyle='rgba(255,91,110,.27)';c.lineWidth=2;const shift=(t*25)%40;for(let x=-580;x<1000;x+=40){c.beginPath();c.moveTo(x+shift,0);c.lineTo(x+540+shift,540);c.stroke();}}
for(let z=0;z<4;z++){if(z===zone)continue;const y=z*135+67.5;c.fillStyle=warning?'rgba(255,179,185,.85)':'rgba(255,206,210,.65)';c.font='700 13px system-ui';c.fillText(warning?'!  DANGER · 발사 예정':'!  LASER ACTIVE',64,y+5);}
c.restore();}
function safeOverlay(c,style,zone,attack){const top=zone*135,bottom=top+135,warning=attack.telegraphRemainingSeconds>0,mid=top+67.5;
c.save();c.fillStyle=style===1?'rgba(14,171,134,.12)':'rgba(18,228,187,.20)';c.fillRect(0,top,960,135);
c.strokeStyle='#8affd5';c.lineWidth=style===1?4:5;c.shadowColor='#45efbd';c.shadowBlur=9;c.beginPath();c.moveTo(0,top+3);c.lineTo(960,top+3);c.moveTo(0,bottom-3);c.lineTo(960,bottom-3);c.stroke();
// Inward chevrons and text supplement color without obscuring the route.
for(const x of [36,82,878,924]){for(const [y,dir] of [[top+13,1],[bottom-13,-1]]){c.beginPath();c.moveTo(x-6,y);c.lineTo(x,y+dir*5);c.lineTo(x+6,y);c.stroke();}}
c.shadowBlur=0;const labelX=zone===3?650:480;c.fillStyle='rgba(1,22,24,.72)';c.fillRect(labelX-90,mid-28,180,57);c.textAlign='center';text(c,'SAFE · 안전 구역',labelX,mid-4,21,'#c7ffe9',700);
text(c,warning?`${attack.telegraphRemainingSeconds.toFixed(1)}초 후 발사`:'이 구역 안에서 회피',labelX,mid+18,13,'#abefd8',600);c.restore();}
function reactor(c){c.save();c.fillStyle='#03111bbb';c.beginPath();c.arc(480,474,45,0,Math.PI*2);c.fill();c.lineWidth=4;c.strokeStyle='#294a5d';c.beginPath();c.arc(480,474,40,Math.PI*.8,Math.PI*2.2);c.stroke();c.strokeStyle='#8be9ff';c.beginPath();c.arc(480,474,40,Math.PI*.8,Math.PI*.8+Math.PI*1.4*.72);c.stroke();c.textAlign='center';text(c,'72%',480,478,24,'#8be9ff',700);text(c,'LASER',480,495,10,'#9cecff',600);text(c,'SHIFT / CTRL',480,519,10,'#d6efff',500);c.restore();}
function draw(c,style,time,zone=1){const attack={type:'laser',...createQuarterLaser({rng:()=>zone/4+.01,playerY:zone*135+67.5})};updateLaser(attack,time);
const snapshot={...source,obstacles:[],bossPreview:null,challenge:null,feedbackEffect:null,deathEffect:null,
player:{...source.player,y:zone*135+67.5,velocityY:0},flightTrail:[{x:40,y:zone*135+75,ageSeconds:.6},{x:135,y:zone*135+70,ageSeconds:.3},{x:223,y:zone*135+67.5,ageSeconds:0}],
boss:{...source.boss,attack:null,roar:null,animation:{kind:'idle',elapsedSeconds:0},weapon:{...source.boss.weapon,firing:null}},elapsedSeconds:4,backgroundScrollDistancePx:90};
renderer.render(snapshot);c.clearRect(0,0,960,540);c.drawImage(base,0,0,960,540);underlay(c,style,zone,time,attack.telegraphRemainingSeconds>0);drawLaser(c,attack);safeOverlay(c,style,zone,attack);
c.save();c.fillStyle='#061526d9';c.fillRect(13,13,92,34);text(c,'점수 100',24,35,17,'#eef8ff',700);text(c,'BOSS HP',371,32,11,'#ffd59e',700);for(let i=0;i<3;i++){c.fillStyle='#ffb36d';c.fillRect(440+i*44,22,40,9);}text(c,'3 / 3',578,32,11,'#ffd59e',600);c.restore();reactor(c);return attack;
}
function compare(){cc.fillStyle='#060e18';cc.fillRect(0,0,1920,1240);text(cc,'전역 레이저 · 안전 / 위험 지역 표시 비교',22,36,26,'#eaf6ff',700);text(cc,'위: 예고 중  /  아래: 발사 중  /  벽 없는 같은 장면·같은 안전 구역',22,68,18,'#a9c5dc',400);
for(const style of [1,2]){const x=(style-1)*960;text(cc,style===1?'1 · 청록 안전 / 적색 사선 위험 (추천)':'2 · 안전 구역 집중 강조',x+20,105,23,'#edf8ff',700);
for(const [row,time] of [[0,.7],[1,2.55]]){const image=document.createElement('canvas');image.width=960;image.height=540;draw(image.getContext('2d'),style,time);frames.set(style+'-'+row,image);cc.drawImage(image,x,125+row*555);}}
}
compare();draw(ctx,1,.7);document.querySelector('#status').textContent='두 안 모두 안전 구역은 청록색으로 표시하며, 실제 발사 때 기존 레이저 빛을 유지합니다.';
document.querySelector('#style').onchange=e=>state.style=Number(e.target.value);document.querySelector('#zone').onchange=e=>state.zone=Number(e.target.value);
document.querySelector('#play').onclick=e=>{state.playing=!state.playing;e.target.textContent=state.playing?'애니메이션 정지':'애니메이션 재생';};
document.querySelector('#warning').onclick=()=>{state.playing=false;state.time=.7;draw(ctx,state.style,state.time,state.zone);document.querySelector('#play').textContent='애니메이션 재생';};
document.querySelector('#active').onclick=()=>{state.playing=false;state.time=2.55;draw(ctx,state.style,state.time,state.zone);document.querySelector('#play').textContent='애니메이션 재생';};
const send=async(id,canvas)=>{const r=await fetch('/globalreview/'+id,{method:'POST',body:await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))});if(!r.ok)throw Error('Export failed');};
if(query.has('capture')){for(const [id,image] of frames)await send('option-'+id,image);await send('comparison',comparison);}
let previous=performance.now();function frame(now){const dt=Math.min(.1,(now-previous)/1000);previous=now;if(state.playing)state.time=(state.time+dt)%3.15;draw(ctx,state.style,state.time,state.zone);requestAnimationFrame(frame);}requestAnimationFrame(frame);
window.GlobalLaserReview={state,draw,frames};
