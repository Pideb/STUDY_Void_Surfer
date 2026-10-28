import { drawShip } from '/src/game/renderer.js';
import { createVisualAssetLoader } from '/src/game/visual-assets.js';
import { VISUAL_THEME } from '/src/game/visual-theme.js';
import { getPlayerBounds } from '/src/game/collision.js';

const query=new URLSearchParams(location.search);
if(query.has('poster'))document.body.classList.add('poster');
const assets=createVisualAssetLoader(),loaded=await assets.preload();
const canvas=document.querySelector('#sheet'),ctx=canvas.getContext('2d');
const options=[{size:16,color:'#6ff4e8',title:'1 · 16×16',sub:'작은 중앙 코어 · 가장 관대한 판정'},
  {size:20,color:'#ffd783',title:'2 · 20×20  추천',sub:'중앙 동체 크기 · 여유와 긴장감의 균형'},
  {size:24,color:'#c4acff',title:'3 · 24×24',sub:'현재 높이 유지 · 좌우 피격 폭만 축소'}];
ctx.fillStyle='#07101c';ctx.fillRect(0,0,1440,1200);
function text(value,x,y,size=20,color='#e5f3ff',weight=600){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui`;ctx.fillText(value,x,y);}
for(let col=0;col<3;col++){
  const o=options[col],x=col*480;
  ctx.fillStyle=col===1?'#172333':'#0e1928';ctx.fillRect(x+12,12,456,1176);
  ctx.strokeStyle=col===1?'#c4a15c':'#23394e';ctx.lineWidth=col===1?2:1;ctx.strokeRect(x+12.5,12.5,455,1175);
  text(o.title,x+36,62,30,o.color,800);text(o.sub,x+36,100,17,'#a8bfd4',500);
  const fraction=Math.round(o.size*o.size/(33*24)*100);
  text(`현재 대비 면적 ${fraction}% · ${o.size}×${o.size} 월드 px`,x+36,130,16,'#8fa9c1',400);
  for(const[row,craft]of['default','aegis','velocity'].entries()){
    const top=160+row*270,centerX=x+240,centerY=top+145;
    text(({default:'NOVA',aegis:'AEGIS',velocity:'VELOCITY'})[craft],x+36,top+28,18,'#d4e9f8',800);
    ctx.save();ctx.translate(centerX,centerY);ctx.scale(4,4);
    ctx.strokeStyle='#203345';ctx.lineWidth=.25;ctx.beginPath();ctx.moveTo(-48,0);ctx.lineTo(48,0);ctx.moveTo(0,-25);ctx.lineTo(0,25);ctx.stroke();
    const player={x:0,y:0,width:36,height:24,velocityY:0};
    drawShip(ctx,player,VISUAL_THEME,craft,assets);
    const old=getPlayerBounds(player);ctx.setLineDash([1.2,1]);ctx.strokeStyle='#d5e1f3a6';ctx.lineWidth=.4;
    ctx.strokeRect(old.left,old.top,old.right-old.left,old.bottom-old.top);ctx.setLineDash([]);
    ctx.fillStyle=o.color+'38';ctx.fillRect(-o.size/2,-o.size/2,o.size,o.size);
    ctx.strokeStyle=o.color;ctx.lineWidth=.65;ctx.strokeRect(-o.size/2,-o.size/2,o.size,o.size);
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,.7,0,Math.PI*2);ctx.fill();ctx.restore();
    text('4× 확대',x+36,top+246,14,'#7f9ab3',400);
  }
  const stripY=1006;
  ctx.fillStyle='#0a1220';ctx.fillRect(x+30,stripY,420,150);
  text('플레이 크기 · 1×',x+44,stripY+28,16,'#b4cde1',600);
  for(const[index,craft]of['default','aegis','velocity'].entries()){
    const px=x+100+index*140,py=stripY+80;
    drawShip(ctx,{x:px,y:py,width:36,height:24,velocityY:0},VISUAL_THEME,craft,assets);
    ctx.fillStyle=o.color+'50';ctx.fillRect(px-o.size/2,py-o.size/2,o.size,o.size);ctx.strokeStyle=o.color;ctx.lineWidth=1;ctx.strokeRect(px-o.size/2,py-o.size/2,o.size,o.size);
    text(({default:'NOVA',aegis:'AEGIS',velocity:'VELOCITY'})[craft],px-34,stripY+127,12,'#91abc2',500);
  }
}
window.HitboxReview={canvas,options,assets:loaded.loaded.length,failed:loaded.failed};
document.title=`READY · ${loaded.loaded.length} assets / ${loaded.failed.length} failed · central hitbox comparison`;
