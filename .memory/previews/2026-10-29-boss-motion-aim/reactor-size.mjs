import {createRenderer} from '/src/game/renderer.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createGameEngine} from '/src/game/game-engine.js';
import {createObstacle} from '/src/game/obstacles.js';
Object.defineProperty(globalThis,'devicePixelRatio',{configurable:true,value:1});
const assets=createVisualAssetLoader(),loaded=await assets.preload();if(loaded.failed.length)throw Error('Missing assets');
const scene=document.createElement('canvas'),renderer=createRenderer(scene,{visualAssets:assets}),out=document.querySelector('#comparison'),c=out.getContext('2d');
let clock=0;const engine=createGameEngine({now:()=>clock,gravity:0,rng:()=>.4,stageRng:()=>.999,initialScore:100,initialCompletedWarningCount:1,guestMode:true,invincibilityEnabled:true});engine.start();
for(let i=0;i<80;i++){clock+=50;engine.update(clock);if(engine.getSnapshot().boss?.entranceRemainingSeconds===0)break;}
const snapshot=engine.getSnapshot();if(!snapshot.boss)throw Error('Boss fixture missing');
snapshot.player={...snapshot.player,y:330,velocityY:0};snapshot.flightTrail=[{x:55,y:352,ageSeconds:.7},{x:120,y:348,ageSeconds:.4},{x:175,y:337,ageSeconds:.2},{x:223,y:330,ageSeconds:0}];
snapshot.obstacles=[
createObstacle({id:'passed-normal',x:78,gapCenter:262,gapHeight:180,stageId:'crystal-gates'}),
createObstacle({id:'front-normal',x:430,gapCenter:365,gapHeight:180,stageId:'crystal-gates'}),
createObstacle({id:'front-special',x:660,gapCenter:270,gapHeight:180,kind:'special',stageId:'crystal-gates',showTimingGuide:true}),
];snapshot.boss.attack=null;snapshot.boss.roar=null;snapshot.boss.animation={kind:'idle',elapsedSeconds:0};snapshot.boss.weapon.firing=null;snapshot.challenge=null;snapshot.feedbackEffect=null;
renderer.render(snapshot);
const base=document.createElement('canvas');base.width=960;base.height=540;base.getContext('2d').drawImage(scene,0,0,960,540);
const sizes=[{id:'small',d:64,label:'1 · 작은 크기'},{id:'medium',d:80,label:'2 · 중간 크기 (추천)'},{id:'large',d:104,label:'3 · 큰 크기'}],frames=new Map();
function text(ctx,s,x,y,size=18,color='#abc5dc',weight=400){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui`;ctx.fillText(s,x,y);}
function reactor(ctx,diameter,ready=false){const r=diameter/2,x=480,y=500-r*.65,p=ready?1:.72,color=ready?'#fff3c8':'#8be9ff';ctx.save();
const backing=ctx.createRadialGradient(x,y,0,x,y,r+13);backing.addColorStop(0,'rgba(2,9,19,.65)');backing.addColorStop(.8,'rgba(2,9,19,.28)');backing.addColorStop(1,'rgba(2,9,19,0)');ctx.fillStyle=backing;ctx.beginPath();ctx.arc(x,y,r+13,0,Math.PI*2);ctx.fill();
ctx.lineWidth=r*.1;ctx.strokeStyle='#294a5d';ctx.beginPath();ctx.arc(x,y,r,Math.PI*.8,Math.PI*2.2);ctx.stroke();ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=ready?7:3;ctx.beginPath();ctx.arc(x,y,r,Math.PI*.8,Math.PI*.8+Math.PI*1.4*p);ctx.stroke();
for(let k=0;k<=10;k++){const a=Math.PI*.8+Math.PI*1.4*k/10;ctx.strokeStyle='#93b7cb';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*(r+6),y+Math.sin(a)*(r+6));ctx.lineTo(x+Math.cos(a)*(r+9),y+Math.sin(a)*(r+9));ctx.stroke();}
ctx.textAlign='center';ctx.shadowBlur=3;text(ctx,ready?'READY':'72%',x,y+2,ready?r*.42:r*.6,color,700);text(ctx,'LASER',x,y+17,Math.max(9,r*.24),color,600);
ctx.shadowBlur=0;ctx.strokeStyle='#7ba6bd';ctx.lineWidth=.8;ctx.fillStyle='rgba(2,9,19,.65)';ctx.fillRect(x-43,499,86,18);ctx.strokeRect(x-43,499,86,18);text(ctx,'SHIFT / CTRL',x,512,10,'#d5eeff',600);ctx.restore();}
function render(ready=false){c.fillStyle='#060e18';c.fillRect(0,0,out.width,out.height);text(c,'원자로 아크 · 실제 벽과 기체에 대한 크기 비교',22,35,26,'#edf8ff',700);text(c,'왼쪽: 같은 플레이 장면  /  오른쪽: 같은 하단 영역 확대  /  원의 지름만 변경',22,66,18);
sizes.forEach((option,i)=>{const frame=document.createElement('canvas');frame.width=960;frame.height=540;const f=frame.getContext('2d');f.drawImage(base,0,0);reactor(f,option.d,ready);frames.set(option.id,frame);
const y=91+i*369;c.strokeStyle=i===1?'#82d4e7':'#2b455b';c.lineWidth=i===1?2:1;c.strokeRect(14,y,1412,352);
text(c,option.label,33,y+31,23,'#eef8ff',700);text(c,`원 지름 ${option.d}px · 화면 높이의 ${(option.d/540*100).toFixed(1)}%`,33,y+60,17);
c.drawImage(frame,0,0,960,540,30,y+76,480,270);
// Fixed source area and zoom for all sizes; foreground walls remain visible.
c.drawImage(frame,350,390,260,150,548,y+77,468,270);
text(c,'하단 확대',1037,y+109,17,'#d3e9f8',600);text(c,`지름 ${option.d}px`,1037,y+145,24,'#e9f8ff',700);
text(c,['가장 적게 가림','크기와 가독성 균형','충전 상태가 가장 또렷함'][i],1037,y+185,18);
text(c,'일반벽 아래쪽과',1037,y+232,17);text(c,'겹치는 정도를 비교하세요.',1037,y+259,17);
});text(c,ready?'현재: 발사 준비 상태':'현재: 충전 중 72%',22,1210,17);}
render();document.querySelector('#status').textContent='64px /80px /104px · 크기 비교용 고정 장면';
document.querySelector('#charging').onclick=()=>render(false);document.querySelector('#ready').onclick=()=>render(true);
if(new URLSearchParams(location.search).has('capture')){for(const option of sizes)await send('reactor-'+option.id,frames.get(option.id));await send('reactor-sizes',out);}
async function send(id,canvas){const r=await fetch('/reactorsize/'+id,{method:'POST',body:await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))});if(!r.ok)throw Error('Export failed '+id);}
window.ReactorSizeReview={snapshot,renderer,sizes,render};
