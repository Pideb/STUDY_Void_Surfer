import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {BOSS_RIGS} from '/src/game/boss-rigs.js';
import {prepareBossRig,drawBossRig,drawBossActionEffects} from '/src/game/boss-motion.js';
import {drawShip} from '/src/game/renderer.js';
import {VISUAL_THEME} from '/src/game/visual-theme.js';
const assets=createVisualAssetLoader(),loaded=await assets.preload();if(loaded.failed.length)throw Error('Missing assets');
const stageIds=Object.keys(BOSS_RIGS),prepared=new Map(),tau=Math.PI*2;
for(const id of stageIds){const source=BOSS_RIGS[id],rig={...source,parts:source.parts.map(p=>({...p,amplitude:p.amplitude*3,open:p.open*1.7,slide:(p.slide||0)*2,lift:(p.lift||0)*2,recoil:(p.recoil||0)*2}))};prepared.set(id,{rig,prepared:prepareBossRig({rig,image:assets.get('stages.'+id+'.boss')})});}
const hud=document.querySelector('#hud'),hc=hud.getContext('2d'),bosses=document.querySelector('#bosses'),bc=bosses.getContext('2d');
const text=(c,s,x,y,size=16,color='#b4cbdd',weight=400)=>{c.fillStyle=color;c.font=`${weight} ${size}px system-ui`;c.fillText(s,x,y);};
function background(c,id,x,y,w,h,kind='bossBackground'){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.drawImage(assets.get('stages.'+id+'.'+kind),x,y,w,h);c.fillStyle='rgba(1,6,16,.63)';c.fillRect(x,y,w,h);c.restore();}
function line(c,x1,y1,x2,y2,color='#9bedff',width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function label(c,s,x,y){c.save();c.strokeStyle='#9dc8dc';c.lineWidth=1;c.strokeRect(x,y-14,s.length*8+12,20);text(c,s,x+6,y,11,'#dff7ff',600);c.restore();}
function drawHud(progress=.72,state='charging'){
hc.fillStyle='#060e18';hc.fillRect(0,0,1440,470);text(hc,'레이저 충전 UI · 패널 없는 전투 계기',22,34,24,'#e9f7ff',700);
const titles=['1 · 세그먼트 레일 (추천)','2 · 원자로 아크','3 · 세로 커패시터'];
for(let i=0;i<3;i++){const x=14+i*477,y=58,w=463,h=395,c=hc;const color=state==='ready'?'#fff6cc':'#8cecff';
c.strokeStyle=i===0?'#7acfe4':'#274254';c.lineWidth=i===0?2:1;c.strokeRect(x,y,w,h);text(c,titles[i],x+18,y+32,21,'#eef8ff',700);
background(c,'crystal-gates',x+10,y+50,w-20,h-100);drawShip(c,{x:x+130,y:y+157,width:36,height:24,velocityY:0},VISUAL_THEME,'default',assets);
c.save();c.globalAlpha=.8;c.drawImage(assets.get('stages.crystal-gates.boss'),x+325,y+105,110,74);c.restore();
if(state==='firing'){line(c,x+160,y+157,x+w-10,y+157,'#8ee8ff77',15);line(c,x+160,y+157,x+w-10,y+157,'#fff',3);}
c.save();c.shadowColor=color;c.shadowBlur=state==='ready'?10:3;
if(i===0){const left=x+71,top=y+262;
line(c,left-18,top+9,left-6,top+9,'#7495ae');line(c,left-6,top+9,left,top+3,'#7495ae');line(c,left+297,top+9,left+308,top+9,'#7495ae');
for(let k=0;k<18;k++){c.fillStyle=k<Math.floor(progress*18)?color:'#25465a';c.fillRect(left+k*16.5,top,12,8);}
line(c,left,top+17,left+293,top+17,'#6ba1b6',.7);text(c,state==='ready'?'LASER READY':state==='firing'?'DISCHARGING':'LASER CHARGE',left,top-12,12,color,700);
text(c,state==='ready'?'발사 준비':state==='firing'?'발사 중':`${Math.round(progress*100)}%`,left+227,top-12,12,color,600);label(c,'SHIFT',left+90,top+43);label(c,'CTRL',left+154,top+43);
}else if(i===1){const cx=x+w/2,cy=y+272;
c.lineWidth=5;c.strokeStyle='#284451';c.beginPath();c.arc(cx,cy,48,Math.PI*.8,Math.PI*2.2);c.stroke();c.strokeStyle=color;c.beginPath();c.arc(cx,cy,48,Math.PI*.8,Math.PI*.8+Math.PI*1.4*progress);c.stroke();
for(let k=0;k<=10;k++){const a=Math.PI*.8+Math.PI*1.4*k/10;line(c,cx+Math.cos(a)*57,cy+Math.sin(a)*57,cx+Math.cos(a)*61,cy+Math.sin(a)*61,'#749db5',1);}
text(c,Math.round(progress*100)+'%',cx-30,cy+4,24,color,700);text(c,state==='ready'?'READY':state==='firing'?'FIRE':'REACTOR',cx-26,cy+24,11,color,600);label(c,'SHIFT / CTRL',cx-54,cy+67);
}else{const left=x+w-68,top=y+214;
for(let k=0;k<12;k++){c.fillStyle=k<Math.floor(progress*12)?color:'#294857';c.fillRect(left,top+116-k*9,15,6);}
line(c,left-8,top+4,left-8,top+128,'#7094aa',.8);text(c,state==='ready'?'READY':state==='firing'?'FIRE':Math.round(progress*100)+'%',left-69,top+40,19,color,700);text(c,'LASER',left-69,top+60,11,'#8caec5',600);label(c,'SHIFT',left-71,top+91);label(c,'CTRL',left-71,top+116);
}c.restore();text(c,['시야를 덜 가리는 가로 계기','아래 중앙 원호로 충전 표현','오른쪽 아래의 슬림한 계기'][i],x+18,y+h-17,14);
}}
const actionNames={idle:'대기·수직 이동',charge:'공격 충전',fire:'투사체 발사',roar:'포효',hit:'피격',entrance:'화면 밖에서 등장'};
function drawBosses(time=0,action='auto'){
const sequence=['idle','charge','fire','roar','hit','entrance'];let actionTime=time%(action==='entrance'?3:1.5);
if(action==='auto'){const phase=time%10.5;action=phase<7.5?sequence[Math.floor(phase/1.5)]:'entrance';actionTime=phase<7.5?phase%1.5:phase-7.5;}
bc.fillStyle='#060e18';bc.fillRect(0,0,1440,850);text(bc,'보스 행동 강화안 · '+actionNames[action],22,32,24,'#e9f7ff',700);
stageIds.forEach((id,index)=>{const x=14+(index%3)*477,y=56+Math.floor(index/3)*393,w=463,h=377,c=bc;
c.strokeStyle='#2d4b60';c.lineWidth=1;c.strokeRect(x,y,w,h);text(c,BOSS_RIGS[id].label+' · '+id,x+16,y+29,18,'#eef6ff',700);background(c,id,x+8,y+42,w-16,h-79,action==='entrance'&&actionTime<1?'background':'bossBackground');
c.save();c.beginPath();c.rect(x+8,y+42,w-16,h-79);c.clip();
const {rig,prepared:layers}=prepared.get(id),phase=index*.67,travel=Math.sin(time*1.1+phase)*66;
if(action==='entrance'){
  const darkness=actionTime<.4?Math.min(1,actionTime/.4):actionTime<1?1:Math.max(0,1-(actionTime-1)/1.5);
  c.fillStyle=`rgba(0,0,0,${darkness*.97})`;c.fillRect(x+8,y+42,w-16,h-79);
  if(actionTime>=.4&&actionTime<1.5)text(c,'BOSS',x+175,y+138,32,'#ff6386',800);
}
const entry=action==='entrance'?Math.max(0,Math.min(1,(actionTime-1)/1.1)):1,ease=entry*entry*(3-2*entry);
const bx=x+247+(1-ease)*250,by=y+181+travel-64;
const firePulse=action==='fire'?Math.exp(-(actionTime%.5)*10):0,hitPulse=action==='hit'?Math.exp(-(actionTime%.65)*5):0;
const recoil=firePulse*12+Math.sin(time*65)*hitPulse*8;
const box={x:bx+recoil,y:by,w:192,h:128};
const pose={time:time*1.3,charge:action==='charge'?Math.min(1,(actionTime%.9)/.6):0,fire:firePulse,roar:action==='roar'?Math.sin(Math.PI*(actionTime%.8)/.8):0,hit:hitPulse};
drawBossRig(c,{rig,prepared:layers,pose,box,projectileImage:assets.get('stages.'+id+'.projectile')});
drawBossActionEffects(c,{rig,pose,box,action:action==='roar'?{kind:'roar',elapsedSeconds:actionTime%.8,durationSeconds:.8}:null});
if(action==='fire'){const shotAge=actionTime%.5;const mx=box.x+rig.muzzle[0]*box.w,my=box.y+rig.muzzle[1]*box.h;c.drawImage(assets.get('stages.'+id+'.projectile'),mx-shotAge*600-18,my-12,36,24);}
drawShip(c,{x:x+105,y:y+193,width:36,height:24,velocityY:0},VISUAL_THEME,'default',assets);
c.restore();text(c,['수정 조각 개폐','장갑·포신 반동','분리 링 전개','궤도·외피 회전','턱·꼬리의 움직임','방열 날개 개폐'][index],x+16,y+h-13,14);
});}
drawHud();drawBosses(.7,'roar');document.querySelector('#load').className='hidden';
let selected='auto',start=performance.now(),hudPlaying=false;
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{selected=b.dataset.action;start=performance.now();document.querySelectorAll('[data-action]').forEach(n=>n.classList.toggle('active',n===b));});
document.querySelector('#hud-toggle').onclick=()=>{hudPlaying=!hudPlaying;document.querySelector('#hud-toggle').textContent=hudPlaying?'충전 UI 정지':'충전 UI 애니메이션 재생';};
const send=async(name,canvas)=>{const response=await fetch('/bossreview/'+name,{method:'POST',body:await new Promise(r=>canvas.toBlob(r,'image/png'))});if(!response.ok)throw Error('Export failed');};
if(new URLSearchParams(location.search).has('capture')){await send('hud-options',hud);await send('boss-actions',bosses);}
function frame(now){const t=(now-start)/1000;drawBosses(t,selected);if(hudPlaying){const p=t%13;drawHud(p<10?p/10:1,p<10?'charging':p<12.3?'ready':'firing');}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
