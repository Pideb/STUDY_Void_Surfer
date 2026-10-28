import {drawShip} from '/src/game/renderer.js';
import {VISUAL_THEME} from '/src/game/visual-theme.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
const assets=createVisualAssetLoader();const loaded=await assets.preload();
if(loaded.failed.length)throw Error('Asset failures: '+loaded.failed.join(','));
const canvas=document.querySelector('canvas'),c=canvas.getContext('2d'),tau=Math.PI*2;
const bg=assets.get('stages.crystal-gates.background');
const choices=[{diameter:16,title:'1 · 균형형 (추천)',sub:'작지만 진행 상태를 읽기 쉬운 크기'},
{diameter:12,title:'2 · 최소형',sub:'기체를 가장 덜 가리는 작은 점 크기'},
{diameter:20,title:'3 · 선명형',sub:'빠른 플레이 중에도 좀 더 또렷하게'}];
function text(str,x,y,size=18,color='#aac1d7',weight=400){c.fillStyle=color;c.font=`${weight} ${size}px system-ui`;c.fillText(str,x,y);}
function scene(x,y,w,h){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle='#0a1826';c.fillRect(x,y,w,h);if(bg)c.drawImage(bg,x,y,w,h);c.fillStyle='rgba(1,6,15,.66)';c.fillRect(x,y,w,h);c.restore();}
function ship(x,y,id,scale,diameter,progress){c.save();c.translate(x,y);c.scale(scale,scale);
// One short trail supplies visual context; candidate ring never surrounds the ship.
c.save();c.strokeStyle=id==='aegis'?'#ffe7a1':id==='velocity'?'#ffc0e4':'#a0faff';c.lineWidth=3;c.globalAlpha=.6;c.beginPath();c.moveTo(-80,4);c.quadraticCurveTo(-45,7,-22,0);c.stroke();c.restore();
drawShip(c,{x:0,y:0,width:36,height:24,velocityY:0},VISUAL_THEME,id,assets);
if(progress<1){const rx=-36,ry=-24,r=diameter/2;c.save();c.lineWidth=1.8;c.fillStyle='rgba(2,8,20,.85)';c.beginPath();c.arc(rx,ry,r+1.5,0,tau);c.fill();c.strokeStyle='rgba(255,255,255,.25)';c.beginPath();c.arc(rx,ry,r,0,tau);c.stroke();c.strokeStyle='#fff';c.lineCap='round';c.shadowColor='#fff';c.shadowBlur=2;c.beginPath();c.arc(rx,ry,r,-Math.PI/2,-Math.PI/2+tau*progress);c.stroke();c.restore();}c.restore();}
function draw(progress=.62){c.fillStyle='#07101b';c.fillRect(0,0,1440,850);text('SPACE 쿨타임 · 기체 왼쪽 위 배치',28,43,28,'#ecf7ff',700);text('모든 시안: 동일한 위치 / 시계 방향으로 채워짐 / 준비 완료 시 사라짐',28,76,18);
choices.forEach((v,i)=>{const x=20+i*474;c.strokeStyle=i===0?'#6edbe9':'#253a4c';c.lineWidth=i===0?2:1;c.strokeRect(x,105,454,715);
text(v.title,x+20,145,24,'#eef7ff',700);text(v.sub,x+20,177,17);text(`원 지름 ${v.diameter}px · 현재 충전 ${Math.round(progress*100)}%`,x+20,207,17);
scene(x+12,226,430,235);ship(x+244,365,'default',3,v.diameter,progress);text('기체 + 표시 3배 확대',x+20,488,16);
scene(x+12,513,430,205);['default','aegis','velocity'].forEach((id,j)=>{ship(x+100+j*126,608,id,1,v.diameter,progress);text(['NOVA','AEGIS','VELOCITY'][j],x+66+j*126,665,15,'#d8e9fa',600);});text('게임 좌표 크기 · 각 기체에서의 위치',x+20,748,16);text('위치: 기체 중심 기준 왼쪽 36 / 위 24px',x+20,782,15);});}
draw();document.title='READY - cooldown candidates';
await fetch('/cooldown/image',{method:'POST',body:await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))}).then(r=>{if(!r.ok)throw Error('Export failed');});
let running=false,start=0;document.querySelector('#toggle').onclick=()=>{running=!running;if(running){start=performance.now();requestAnimationFrame(animate);}else draw();};
function animate(t){if(!running)return;const phase=((t-start)%1600)/1000;draw(phase<.7?phase/.7:1);requestAnimationFrame(animate);}
