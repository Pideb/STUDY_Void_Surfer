import {createRenderer} from '/src/game/renderer.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createGameEngine} from '/src/game/game-engine.js';
import {createBossEncounter} from '/src/game/boss.js';
import {createObstacle} from '/src/game/obstacles.js';

const assets=createVisualAssetLoader(),loaded=await assets.preload();
const engine=createGameEngine({guestMode:true,gravity:0});engine.start();const base=engine.getSnapshot();
const names=['현재 · 먹물 효과 비교 기준','1. 블라인드 먹물 · 넓고 짙은 시야 차단','2. 센서 글리치 · 추천 · 강한 전자 교란','3. 혼합 장애 · 먹물 + 전자 교란'];
const panels=names.map((name,index)=>{
  const card=document.createElement('article'),title=document.createElement('h2'),canvas=document.createElement('canvas');title.textContent=name;card.append(title,canvas);document.querySelector('main').append(card);
  return{index,canvas,renderer:createRenderer(canvas,{visualAssets:assets,reducedMotion:false})};
});
function penalty(ctx,kind,elapsed){
  const remaining=Math.max(0,1-elapsed/4),strength=Math.min(1,remaining*1.7);if(strength<=0)return;
  ctx.save();ctx.beginPath();ctx.rect(0,0,960,540);ctx.ellipse(240,270,66,48,0,0,Math.PI*2);ctx.clip('evenodd');
  if(kind===1||kind===3){
    ctx.fillStyle='#02040b';ctx.globalAlpha=strength*(kind===1?.96:.78);
    for(const[x,y,rx,ry]of[[78,92,210,155],[468,85,220,122],[877,154,225,210],[585,470,220,165],[66,490,200,115]]){
      ctx.beginPath();ctx.ellipse(x,y,rx,ry,Math.sin(x)*.25,0,Math.PI*2);ctx.fill();
      for(let k=0;k<8;k++){const a=k*Math.PI/4;ctx.beginPath();ctx.arc(x+Math.cos(a)*rx*.8,y+Math.sin(a)*ry*.8,30+(k%3)*13,0,Math.PI*2);ctx.fill();}
    }
    ctx.globalAlpha=strength*.75;ctx.fillRect(860,0,100,540);
  }
  if(kind===2||kind===3){
    const step=Math.floor(elapsed*8);
    ctx.globalAlpha=strength*(kind===2?.43:.28);ctx.fillStyle='#06091c';ctx.fillRect(0,0,960,540);
    const bands=kind===2?18:11;
    for(let i=0;i<bands;i++){
      const y=(i*79+step*19)%540,x=(i*157+step*43)%380,h=5+(i%4)*8;
      ctx.globalAlpha=strength*(.26+(i%3)*.17);ctx.fillStyle=i%3===0?'#071021':i%3===1?'#83e8ff':'#b279de';ctx.fillRect(x,y,400+(i%4)*125,h);
      ctx.globalAlpha=strength*.6;ctx.fillStyle='#050719';ctx.fillRect((x+112)%260,y+h+3,700,9+(i%2)*12);
    }
    ctx.globalAlpha=strength*.23;ctx.fillStyle='#c3faff';
    for(let y=0;y<540;y+=6)ctx.fillRect(0,y,960,1);
    ctx.globalAlpha=strength*.34;ctx.fillStyle='#c5faff';
    for(let i=0;i<380;i++){const x=(i*137+step*23)%960,y=(i*83+step*17)%540;ctx.fillRect(x,y,1+(i%3),1);}
  }
  ctx.restore();
}
function render(elapsed){
  for(const{index,canvas,renderer}of panels){
    const snapshot=structuredClone(base);snapshot.elapsedSeconds=elapsed;snapshot.backgroundScrollDistancePx=elapsed*75;
    snapshot.stage={...snapshot.stage,id:'crystal-gates',mode:'boss',elapsedSeconds:elapsed};snapshot.difficulty={...snapshot.difficulty,isBoss:true,scrollSpeed:320};
    snapshot.player={...snapshot.player,y:270};snapshot.flightTrail=Array.from({length:25},(_,i)=>({x:223-i*7,y:270+Math.sin(i*.16)*20,ageSeconds:i*.02}));
    snapshot.boss=createBossEncounter(1,'crystal-gates');snapshot.boss.entranceRemainingSeconds=0;
    snapshot.obstacles=[createObstacle({id:'review-normal',x:495-elapsed*30,gapCenter:280,gapHeight:160,stageId:'crystal-gates',rng:()=>.5}),createObstacle({id:'review-hybrid',x:740-elapsed*30,gapCenter:270,gapHeight:160,kind:'hybrid',stageId:'crystal-gates',rng:()=>.5})];
    if(index===0)snapshot.feedbackEffect={kind:'ink',durationSeconds:4,remainingSeconds:Math.max(0,4-elapsed)};
    renderer.render(snapshot);
    if(index>0){const c=canvas.getContext('2d');c.save();c.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);penalty(c,index,elapsed);c.restore();}
  }
  document.querySelector('#time').value=elapsed;document.querySelector('#label').textContent=elapsed.toFixed(2)+'초';
}
let raf=null;
document.querySelector('#time').oninput=e=>{cancelAnimationFrame(raf);render(Number(e.target.value));};
document.querySelector('#play').onclick=()=>{cancelAnimationFrame(raf);const start=performance.now();const tick=now=>{const t=Math.min(4,(now-start)/1000);render(t);if(t<4)raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);};
render(1);document.querySelector('#status').textContent=`${loaded.loaded.length}개 이미지 로드 · 실패 ${loaded.failed.length}개 · 충돌 위치는 움직이지 않음 · 기체 바로 주변은 식별 가능`;
