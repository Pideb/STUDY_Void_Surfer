import { drawShip } from '/src/game/renderer.js';
import { createVisualAssetLoader } from '/src/game/visual-assets.js';
import { VISUAL_THEME } from '/src/game/visual-theme.js';
const assets=createVisualAssetLoader();await assets.preload();
const canvas=document.querySelector('canvas'),c=canvas.getContext('2d');
const SUCCESS={width:56,height:36},DAMAGE=16;
function text(s,x,y,size=22,color='#e3f2ff',weight=600){c.fillStyle=color;c.font=`${weight} ${size}px system-ui`;c.fillText(s,x,y);}
function ship(id,x,y){drawShip(c,{x,y,width:36,height:24,velocityY:0},VISUAL_THEME,id,assets);}
function boxes(x,y){
  c.fillStyle='#66d8ff18';c.fillRect(x-SUCCESS.width/2,y-SUCCESS.height/2,SUCCESS.width,SUCCESS.height);
  c.strokeStyle='#76dfff';c.lineWidth=.7;c.strokeRect(x-SUCCESS.width/2,y-SUCCESS.height/2,SUCCESS.width,SUCCESS.height);
  c.fillStyle='#ffd88755';c.fillRect(x-DAMAGE/2,y-DAMAGE/2,DAMAGE,DAMAGE);
  c.strokeStyle='#ffd887';c.lineWidth=.6;c.strokeRect(x-DAMAGE/2,y-DAMAGE/2,DAMAGE,DAMAGE);
}
c.fillStyle='#07101c';c.fillRect(0,0,1440,940);
text('두 영역 분리 · 작게 맞고, 기체 외형으로 특수벽 타이밍 잡기',36,60,31,'#edfbff',800);
text('금색 16×16 = 피격 영역     /     하늘색 56×36 = 특수벽 성공용 영역 제안',36,110,23,'#b5d3e6');
text('성공용 영역은 사망 판정에 쓰지 않습니다. 아래 그림은 시안이며 아직 실제 게임에는 미적용입니다.',36,151,20,'#92adc4',400);
for(const[i,id]of['default','aegis','velocity'].entries()){
  const x=30+i*470;c.fillStyle='#101e2e';c.fillRect(x,200,440,310);
  text(({default:'NOVA',aegis:'AEGIS',velocity:'VELOCITY'})[id],x+24,242,24);
  c.save();c.translate(x+220,360);c.scale(4,4);ship(id,0,0);boxes(0,0);c.restore();
  text('외형 유지 · 두 영역 모두 기체 중심에 배치',x+24,482,18,'#9bb7cf',400);
}
text('특수벽 앞에서 이렇게 작동합니다',36,567,25,'#e3f2ff',800);
c.fillStyle='#101e2e';c.fillRect(30,594,1380,226);
c.save();c.translate(50,608);c.scale(2,2);
const bandLeft=190,wallX=250,playerX=163,playerY=46;
c.fillStyle='#55f6e52a';c.fillRect(bandLeft,0,wallX-bandLeft,92);c.strokeStyle='#55f6e5';c.lineWidth=1;c.strokeRect(bandLeft,0,wallX-bandLeft,92);
c.fillStyle='#bc78f7';c.fillRect(wallX,0,5,92);
ship('default',playerX,playerY);boxes(playerX,playerY);c.restore();
text('큰 하늘색 영역이 청록 성공 구간에 닿음',650,648,23,'#8be5ff',800);
text('→ 이때 SPACE를 누르면 성공 가능',650,691,23,'#79edc4',800);
text('작은 금색 피격 영역은 아직 멀리 있어도 됩니다.',650,735,20,'#b0c8dc',400);
text('실제 벽에 작은 피격 영역이 닿기 전에 눌러야 합니다.',650,777,19,'#b0c8dc',400);
text('복합벽의 구멍 통과·피격은 작은 16×16로 검사하고, 큰 영역은 특수벽의 가로 타이밍만 도와줍니다.',36,867,21,'#b0c8dc',400);
text('일반 플레이에서는 이 사각형들을 숨깁니다. 기체별 성공 난도를 같게 하기 위해 공통 크기를 추천합니다.',36,910,20,'#8ea9c1',400);
document.title='READY · separate damage16 and proposed success56x36';
if(new URLSearchParams(location.search).has('capture')){
  const bytes=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  const response=await fetch('/timing-capture/dual',{method:'POST',body:bytes});if(!response.ok)throw Error('Capture failed');
}
