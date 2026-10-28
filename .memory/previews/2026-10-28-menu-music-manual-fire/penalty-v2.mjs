import {createRenderer} from '/src/game/renderer.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createGameEngine} from '/src/game/game-engine.js';
import {createBossEncounter} from '/src/game/boss.js';
import {createObstacle} from '/src/game/obstacles.js';

const query=new URLSearchParams(location.search),kind=query.get('kind')==='glitch'?'glitch':'ink';
if(query.has('poster'))document.body.classList.add('poster');
const canvas=document.querySelector('#scene'),assets=createVisualAssetLoader(),loaded=await assets.preload();
const renderer=createRenderer(canvas,{visualAssets:assets,reducedMotion:false});
const engine=createGameEngine({guestMode:true,gravity:0});engine.start();const base=engine.getSnapshot();
const noiseCanvas=document.createElement('canvas');noiseCanvas.width=240;noiseCanvas.height=135;
const noiseContext=noiseCanvas.getContext('2d'),noiseImage=noiseContext.createImageData(240,135);
let lastNoise=-1;
function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function staticTexture(t){
  const frame=Math.floor(t*22);if(frame===lastNoise)return;lastNoise=frame;const roll=rng(9001+frame*101);
  for(let i=0;i<noiseImage.data.length;i+=4){const n=roll(),v=n<.55?8:n<.88?22+roll()*36:n<.987?62+roll()*70:170+roll()*65;
    noiseImage.data[i]=v*.68;noiseImage.data[i+1]=v*.9;noiseImage.data[i+2]=v;noiseImage.data[i+3]=255;}
  noiseContext.putImageData(noiseImage,0,0);
}
const clamp=x=>Math.max(0,Math.min(1,x));
function inkBlob(c,x,y,rx,ry,seed,t){
  const g=c.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));g.addColorStop(0,'#010208');g.addColorStop(.8,'#010208');g.addColorStop(1,'#03040a');c.fillStyle=g;
  c.beginPath();for(let k=0;k<=48;k++){const a=k/48*Math.PI*2,w=1+.075*Math.sin(a*5+seed)+.04*Math.sin(a*11+seed*.7+t*.45);const px=x+Math.cos(a)*rx*w,py=y+Math.sin(a)*ry*w;if(k===0)c.moveTo(px,py);else c.lineTo(px,py);}c.closePath();c.fill();
}
function overlay(c,elapsed,player){
  const age=elapsed-.5;if(age<0||age>=4)return;
  const strength=clamp(age/.11)*clamp((4-age)/1.2);c.save();
  // Only a small real ship silhouette stays clear; wall geometry is never shifted.
  c.beginPath();c.rect(0,0,960,540);c.ellipse(player.x,player.y,48,33,0,0,Math.PI*2);c.clip('evenodd');
  if(kind==='ink'){
    c.globalAlpha=strength*.995;
    const spread=.93+.07*clamp(age/.3);
    for(const[x,y,rx,ry,s]of[[525,100,360,205,1],[715,330,350,255,4],[180,40,270,155,8],[155,500,260,180,11],[450,470,280,165,15],[957,50,160,180,18]])inkBlob(c,x,y,rx*spread,ry*spread,s,age);
    c.fillStyle='#010208';c.globalAlpha=strength*.99;
    for(let i=0;i<12;i++){const x=165+i*62,y=90+(i%3)*40,len=40+clamp(age/1.1)*(85+(i%4)*18);c.beginPath();c.ellipse(x,y+len/2,5+(i%3)*3,len/2,0,0,Math.PI*2);c.fill();}
    // Dense stains soften at the perimeter rather than moving the gameplay scene.
    c.globalAlpha=strength*.32;c.fillStyle='#05050c';c.fillRect(0,0,960,540);
  }else{
    staticTexture(age);const step=Math.floor(age*19),roll=rng(step*491+321);
    c.globalAlpha=strength*.9;c.fillStyle='#020711';c.fillRect(0,0,960,540);
    c.imageSmoothingEnabled=false;c.globalAlpha=strength*.89;c.drawImage(noiseCanvas,0,0,960,540);
    // Dense moving RF snow, broad signal-drop bands, and broken scan-line bursts.
    for(let i=0;i<17;i++){
      const y=roll()*540,h=7+roll()*39,x=-30+roll()*190;
      c.globalAlpha=strength*(.58+roll()*.35);c.fillStyle=i%4===0?'#96bccb':i%3===0?'#29435b':'#01040b';
      c.fillRect(x,y,760+roll()*200,h);
      c.globalAlpha=strength*.62;c.fillStyle='#8ca5ae';c.fillRect(x+roll()*180,y+h+2,250+roll()*540,1+roll()*3);
    }
    const tear=(age*180)%650-90;c.globalAlpha=strength*.92;c.fillStyle='#03060c';c.fillRect(0,tear,960,48);
    c.globalAlpha=strength*.55;c.fillStyle='#7393a2';
    for(let y=0;y<540;y+=4)c.fillRect(0,y+(step%3),960,1);
    for(let i=0;i<75;i++){const x=roll()*960,y=roll()*540;c.globalAlpha=strength*(.2+roll()*.5);c.fillStyle=roll()<.3?'#9ba4bd':'#091422';c.fillRect(x,y,12+roll()*60,3+roll()*13);}
  }
  c.restore();
}
function render(t){
  const s=structuredClone(base);s.elapsedSeconds=t;s.backgroundScrollDistancePx=t*65;
  s.stage={...s.stage,id:'crystal-gates',mode:'boss',elapsedSeconds:t};s.difficulty={...s.difficulty,isBoss:true,scrollSpeed:320};
  s.player={...s.player,y:270+Math.sin(t*1.7)*24};s.flightTrail=Array.from({length:25},(_,i)=>({x:223-i*7,y:s.player.y+Math.sin(i*.16)*15,ageSeconds:i*.02}));
  s.boss=createBossEncounter(1,'crystal-gates');s.boss.entranceRemainingSeconds=0;
  s.obstacles=[createObstacle({id:'normal',x:540-t*44,gapCenter:280,gapHeight:160,stageId:'crystal-gates',rng:()=>.5}),createObstacle({id:'special',x:805-t*44,gapCenter:270,gapHeight:160,kind:'hybrid',stageId:'crystal-gates',rng:()=>.5})];
  renderer.render(s);const c=canvas.getContext('2d');c.save();c.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);overlay(c,t,s.player);c.restore();
  document.querySelector('#time').value=t;document.querySelector('#clock').textContent=t.toFixed(2)+'초';
}
let raf=null;
const play=()=>{cancelAnimationFrame(raf);const start=performance.now();const tick=now=>{const t=Math.min(6,(now-start)/1000);render(t);if(t<6)raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);};
document.querySelector('#play').onclick=play;
document.querySelector('#time').oninput=e=>{cancelAnimationFrame(raf);render(Number(e.target.value));};
document.querySelector('#title').textContent=kind==='ink'?'먹물 페널티 · 더 넓고 짙은 시야 차단':'글리치 페널티 · 움직이는 치직임과 신호 끊김';
document.querySelector('#description').textContent=kind==='ink'?'검은 얼룩이 넓게 퍼지고 흘러내립니다. 기체 둘레만 식별 가능하며, 장애물의 상당 부분이 가려집니다.':'짙은 RF 잡음이 빠르게 바뀌고 굵은 화면 끊김 띠가 흘러갑니다. 단순한 고정 선 효과가 아닙니다. 밝은 전체 화면 점멸은 사용하지 않습니다.';
document.querySelector('#other').href='penalty-v2.html?kind='+(kind==='ink'?'glitch':'ink');document.querySelector('#other').textContent=kind==='ink'?'글리치 시안 보기':'먹물 시안 보기';
document.querySelector('#status').textContent=`실제 게임 이미지 ${loaded.loaded.length}개 · 실패 ${loaded.failed.length}개 · 효과4초 / 전후 비교 총6초 · 시안 단계`;
render(1.5);
window.PenaltyPreview={canvas,render,kind,loaded};
if(query.has('record')){
  // Start after page load so Firefox's compositor can publish changing frames.
  window.addEventListener('load', async()=>{
  try{
    const send=async(path,body)=>{const r=await fetch(path,{method:'POST',body});if(!r.ok)throw new Error('Capture save '+r.status);};
    render(1.5);await send('/review-poster/'+kind,await new Promise(resolve=>canvas.toBlob(resolve,'image/png')));
    const stream=canvas.captureStream(24),type=['video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
    const recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:1900000}),chunks=[];
    const done=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>resolve(new Blob(chunks,{type:'video/webm'}));recorder.onerror=e=>reject(e.error);});
    render(0);recorder.start(400);const began=performance.now();
    await new Promise(resolve=>{const tick=now=>{const t=Math.min(6,(now-began)/1000);render(t);if(t<6)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
    recorder.stop();const blob=await done;stream.getTracks().forEach(track=>track.stop());await send('/review-video/'+kind,blob);
    await send('/review-status/'+kind,JSON.stringify({status:'recorded',bytes:blob.size,images:loaded.loaded.length,failed:loaded.failed}));document.title=kind+' capture complete';
  }catch(error){document.querySelector('#status').textContent=error.message;await fetch('/review-status/'+kind,{method:'POST',body:JSON.stringify({status:'error',error:error.message})});}
  },{once:true});
}
