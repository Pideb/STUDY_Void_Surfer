import { drawShip } from '/src/game/renderer.js';
import { createVisualAssetLoader } from '/src/game/visual-assets.js';
import { VISUAL_THEME } from '/src/game/visual-theme.js';
import { isSpecialTimingSuccess } from '/src/game/collision.js';

const q=new URLSearchParams(location.search),projectile=q.get('kind')==='projectile';
const assets=createVisualAssetLoader();await assets.preload();
const canvas=document.querySelector('#sheet'),c=canvas.getContext('2d');
c.fillStyle='#07101c';c.fillRect(0,0,1440,920);
function text(t,x,y,size=22,color='#e1f0ff',weight=600){c.fillStyle=color;c.font=`${weight} ${size}px system-ui`;c.fillText(t,x,y);}
function line(x1,y1,x2,y2,color='#39526d',width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function ship(x,y){drawShip(c,{x,y,width:36,height:24,velocityY:0},VISUAL_THEME,'default',assets);c.fillStyle='#ffe19144';c.fillRect(x-8,y-8,16,16);c.strokeStyle='#ffe191';c.lineWidth=1;c.strokeRect(x-8,y-8,16,16);c.fillStyle='#fff';c.beginPath();c.arc(x,y,1.6,0,Math.PI*2);c.fill();}
function frame(i,title,sub){const x=30+i*470;c.fillStyle='#101e2e';c.fillRect(x,220,440,420);text(title,x+22,260,23);text(sub,x+22,297,17,'#9db8d2',500);return x;}
if(!projectile){
  text('특수벽 · 누르는 순간 기체의 중심 위치로 성공 결정',36,60,32,'#edfbff',800);
  text('예시: 벽 속도 400 px/s · WARNING/BOSS 성공 시간 0.15초 → 벽 앞 60px 구간',36,105,22,'#b3cce1');
  text('청록 띠 = 성공 구간 / 금색 정사각형 = 선택한 16×16 피격 영역 / 흰 점 = 기체 중심',36,144,20,'#96aec6',400);
  const data=[{center:124,title:'① 정사각형 일부만 들어옴',sub:'중심은 구간 밖 · 도착까지 0.165초',ok:false},
    {center:150,title:'② 중심이 구간 안에 들어옴',sub:'도착까지 0.100초 · 이때 SPACE',ok:true},
    {center:94,title:'③ 너무 일찍 SPACE를 누름',sub:'도착까지 0.240초 · 아직 구간 밖',ok:false}];
  for(const[i,d]of data.entries()){
    const x=frame(i,d.title,d.sub);c.save();c.translate(x+10,335);c.scale(2,2);
    c.fillStyle='#55f6e52a';c.fillRect(130,0,60,86);line(130,0,130,86,'#59e9d7',1);
    c.fillStyle='#c877ff';c.fillRect(190,0,5,86);c.fillStyle='#ffffff';c.fillRect(191,0,1,86);
    ship(d.center,43);line(d.center,6,d.center,80,'#ffe191',.6);c.restore();
    const result=isSpecialTimingSuccess({playerX:d.center,wallX:190,speed:400,windowSeconds:.15});
    if(result!==d.ok)throw Error('Diagram disagrees with live timing function');
    text(d.ok?'SPACE → 성공':'SPACE → 특수벽 성공 아님',x+22,558,23,d.ok?'#7af0cb':'#ffb3ad',800);
    text(d.ok?'해당 벽을 통과하도록 지정됩니다.':'대시가 나가도 이 벽은 통과 불가합니다.',x+22,600,17,'#a4bed3',400);
  }
  text('현재 조건: 0 ≤ (벽 X − 기체 중심 X) ÷ 현재 속도 ≤ 성공 시간',36,702,25,'#d6efff');
  text('히트박스가 일부 들어왔는지, 완전히 들어왔는지는 성공 조건이 아닙니다.',36,750,24,'#ffe191',700);
  text('평상시 0.30초 / WARNING·BOSS 0.15초. 속도가 빠를수록 띠는 넓어져도 허용 시간은 같습니다.',36,797,21,'#a4bed3',400);
  text('복합벽은 구멍 안에 있어야 한다는 조건도 추가됩니다. 성공하지 못한 벽과 피격 영역이 겹치면 사망합니다.',36,838,20,'#a4bed3',400);
}else{
  text('보스 투사체 · 별도 성공 영역이 아닌 0.6초 접촉 무시',36,60,32,'#edfbff',800);
  text('SPACE를 누르는 위치에서 타이밍 성공을 확정하지 않습니다. 이후 실제 접촉 시 무적이 남아 있는지 봅니다.',36,105,21,'#b3cce1');
  text('현재 보스 탄환은 반사/파괴 성공 판정이 없습니다. 무적으로 통과한 탄환도 계속 화면 밖으로 날아갑니다.',36,144,20,'#96aec6',400);
  const labels=[['① 누른 뒤 0.20초에 접촉','0.6초 무적이 남아 있음','접촉해도 생존','#7af0cb'],
    ['② 누른 뒤 0.65초에 접촉','효과 종료 · 쿨타임은 아직 남음','접촉하면 사망','#ffb3ad'],
    ['③ 위아래로 피해 접촉 없음','SPACE를 누르지 않아도 됨','스쳐 지나가면 생존','#7af0cb']];
  for(const[i,d]of labels.entries()){
    const x=frame(i,d[0],d[1]);c.save();c.translate(x+10,342);c.scale(2,2);ship(90,40);
    if(i===0){c.strokeStyle='#bcf9ff';c.globalAlpha=.6;c.lineWidth=1;c.beginPath();c.arc(90,40,22,0,Math.PI*2);c.stroke();c.globalAlpha=1;}
    const px=i===2?90:100,py=i===2?10:40;
    line(px+28,py,px+60,py,'#9bd3ff',1);
    const image=assets.get('stages.crystal-gates.projectile');if(image)c.drawImage(image,px-17,py-10,34,20);
    c.strokeStyle='#ffb59d';c.lineWidth=.7;c.strokeRect(px-8,py-5.5,16,11);c.restore();
    text(d[2],x+22,558,25,d[3],800);text(i===2?'피격 영역이 겹치지 않으면 안전합니다.':'투사체 몸체와 기체 피격 영역의 접촉 기준',x+22,600,16,'#a4bed3',400);
  }
  text('시간축 · SPACE를 누른 순간부터',36,700,23,'#d6efff');
  const left=80,top=755,scale=1600;
  c.fillStyle='#2aa996';c.fillRect(left,top,.6*scale,35);c.fillStyle='#7e6d48';c.fillRect(left+.6*scale,top,.1*scale,35);
  text('투사체 무적 0.6초',left+22,top+26,20,'#e5fffa',700);
  text('0초 · SPACE',left,top+72,19,'#c4dfed');text('0.6초 · 무적 종료',left+.6*scale-135,top+72,19,'#c4dfed');
  text('0.7초 · 재사용 가능',left+.7*scale-10,top+72,19,'#ffe191');
}
text('정사각형은 선택한 16×16 시안입니다. 현재 게임은 아직 기존 33×24 피격 영역이며, 이 그림은 성공 로직 설명용입니다.',36,895,18,'#819bb2',400);
document.title='READY · '+(projectile?'projectile immunity':'special timing');
if(q.has('capture')){
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  const response=await fetch('/timing-capture/'+(projectile?'projectile':'wall'),{method:'POST',body:blob});
  if(!response.ok)throw Error('Capture failed');
}
