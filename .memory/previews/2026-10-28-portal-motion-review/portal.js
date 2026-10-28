/* Review only: existing scenery/player art + code-native portal light. */
(() => {
  'use strict';
  const stages=[['crystal-gates','수정','#8bd7ff'],['industrial-void','산업','#ffad58'],['signal-monoliths','신호','#d49bff'],['gravity-well','중력','#be9bff'],['abyssal-beast','심해','#62f1ee'],['solar-forge','태양','#ffb24f']];
  const $=id=>document.getElementById(id),c=$('scene').getContext('2d');
  const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const motifs=['수정 파편','기계 장갑 · 부유 브래킷','신호 석판 · 노드','궤도 암석 · 초승달 조각','생체 늑골 · 촉수','용광로 장갑 · 불씨'];
  const state={from:1,to:0,speed:480,time:0,paused:false,ready:false,reduced:false,loop:true,ornaments:true,detail:false};
  const promises=new Map();let assets,request=0;
  function image(src){if(!promises.has(src))promises.set(src,new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('이미지 로드 실패: '+src));i.src=src;}));return promises.get(src);}
  function root(i){return '../../../public/assets/game/stages/'+stages[i][0]+'/';}
  async function prepare(){
    const token=++request;state.ready=false;state.time=0;$('loading').hidden=false;$('loading').textContent='배경 준비 중…';
    if(state.from===state.to){state.to=(state.from+1)%6;$('to').value=String(state.to);}
    try{
      const [from,to,player,wall,ornament]=await Promise.all([image(root(state.from)+'background.png'),image(root(state.to)+'background.png'),image('../../../public/assets/game/aircraft/default.png'),image(root(state.to)+'normal-wall.png'),image('../2026-10-28-portal-destination-ornaments/'+stages[state.to][0]+'-ornaments.png')]);
      if(token!==request)return;assets={from,to,player,wall,ornament};state.ready=true;$('loading').hidden=true;
      $('destination-detail').textContent=stages[state.to][1]+' 목적지 · '+motifs[state.to]+' · 장식 충돌 없음';
    }catch(e){if(token===request)$('loading').textContent=e.message;}
  }
  function timing(speed=state.speed){const approach=.45+960/Math.max(1,speed);return {approach,clear:approach+.9,total:approach+2.9};}
  function phaseAt(time,speed=state.speed){const t=timing(speed);return time<.45?0:time<t.approach?1:time<t.clear?2:3;}
  function background(img,travel){
    const shift=travel%960;c.drawImage(img,-shift,0,960,540);c.drawImage(img,960-shift,0,960,540);
    c.fillStyle='#020814aa';c.fillRect(0,0,960,540);
  }
  function glow(x,y,rx,ry,color,alpha=1){
    c.save();c.translate(x,y);c.scale(1,ry/rx);c.globalCompositeOperation='screen';c.globalAlpha=clamp(alpha);
    const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,'#f6fdff');g.addColorStop(.24,color);g.addColorStop(1,color+'00');
    c.fillStyle=g;c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.fill();c.restore();
  }
  function ornamentPose(stage,sector,time,reduced=false){
    const theta=(sector+.5)*Math.PI/4,beat=time*1.6+sector*.83;
    if(reduced)return {dx:0,dy:0,angle:0};
    const n=Math.sin(beat);
    if(stage===0)return {dx:Math.cos(theta)*n*4,dy:Math.sin(beat*.73)*5,angle:Math.sin(beat*.7)*.012};
    if(stage===1){const lock=Math.sin(time*2+sector*.35)*.8;return {dx:Math.cos(theta)*lock,dy:Math.sin(theta)*lock,angle:0};}
    if(stage===2)return {dx:Math.sin(beat*.6)*1.8,dy:Math.sin(time*2+sector*1.3)*4,angle:0};
    if(stage===3)return {dx:-Math.sin(theta)*Math.sin(beat*.7)*4,dy:Math.cos(theta)*Math.sin(beat*.7)*5,angle:Math.sin(beat*.5)*.011};
    if(stage===4)return {dx:Math.cos(theta)*Math.sin(time*1.8+sector*.25)*2.5,dy:Math.sin(theta)*Math.sin(time*1.8+sector*.25)*3,angle:Math.sin(beat)*.009};
    return {dx:Math.cos(theta)*Math.sin(time*2.5+sector*.3)*1.3,dy:Math.sin(theta)*Math.sin(time*2.5+sector*.3)*1.3,angle:0};
  }
  function shell(x,rx,ry,alpha){
    const h=Math.min(500,ry*2.7),w=h*assets.ornament.width/assets.ornament.height,t=state.time;
    c.save();c.globalAlpha=alpha;
    c.beginPath();c.rect(-1000,-1000,3000,3000);c.ellipse(x,270,rx+4,ry+3,0,0,Math.PI*2);c.clip('evenodd');
    // Each angular region articulates the existing illustration; no replacement art.
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,b=(i+1)*Math.PI/4,p=ornamentPose(state.to,i,t,state.reduced);
      c.save();c.translate(x+p.dx,270+p.dy);c.rotate(p.angle);
      // Overlapping masks avoid opening artificial straight seams between regions.
      c.beginPath();c.moveTo(0,0);c.arc(0,0,1000,a-.085,b+.085);c.closePath();c.clip();
      c.drawImage(assets.ornament,-w/2,-h/2,w,h);c.restore();
    }
    c.restore();
    // Sparse material-specific accents, all outside the open aperture.
    const color=stages[state.to][2];
    if(state.to===0){
      for(let i=0;i<5;i++){const a=i*1.3+t*.12;glow(x+Math.cos(a)*(rx+33),270+Math.sin(a)*ry*.83,3.5,3.5,color,alpha*(.2+.25*Math.sin(t*2+i)**2));}
    }else if(state.to===1){
      for(let i=0;i<4;i++){const side=i%2?1:-1,yy=270+(i<2?-1:1)*ry*.62;glow(x+side*(rx+20),yy,6,3,color,alpha*(.2+.35*Math.max(0,Math.sin(t*2-i))));}
    }else if(state.to===2){
      for(let i=0;i<6;i++){const a=(i+.5)*Math.PI/3;glow(x+Math.cos(a)*(rx+23),270+Math.sin(a)*ry*.88,4,4,color,alpha*(.12+.5*Math.max(0,Math.sin(t*3-i*.7))**4));}
    }else if(state.to===3){
      c.save();c.strokeStyle=color;c.lineWidth=1;c.globalAlpha=alpha*.22;
      for(let i=0;i<2;i++){c.beginPath();c.ellipse(x,270,rx+25+i*8,ry+6+i*6,Math.sin(t*.3)*.04,t*.4+i*Math.PI,t*.4+i*Math.PI+1.8);c.stroke();}c.restore();
    }else if(state.to===4){
      for(let i=0;i<4;i++){const a=(i+.5)*Math.PI/2;glow(x+Math.cos(a)*(rx+25),270+Math.sin(a)*ry*.8,6,11,color,alpha*(.10+.16*Math.sin(t*1.8-i)**2));}
    }else{
      for(let i=0;i<10;i++){
        const life=(t*.43+i*.173)%1,a=i*2.4;
        const px=x+Math.cos(a)*(rx+22+life*15),py=270+Math.sin(a)*ry*.83-life*25;
        glow(px,py,2.2,2.2,'#ffc277',alpha*(1-life)*.65);
      }
    }
  }
  function portal(x,alpha=1){
    const color=stages[state.to][2],near=clamp((1080-x)/850),rx=29+near*32,ry=118+near*88;
    if(state.ornaments)shell(x,rx,ry,alpha);
    c.save();c.globalAlpha=alpha;
    c.save();c.beginPath();c.ellipse(x,270,rx,ry,0,0,Math.PI*2);c.clip();c.drawImage(assets.to,0,0,960,540);c.fillStyle='#ddf8ff66';c.fillRect(0,0,960,540);c.restore();
    c.globalCompositeOperation='screen';c.shadowColor=color;c.shadowBlur=24;
    for(let i=0;i<4;i++){
      c.strokeStyle=i===3?'#f3fdff':color;c.globalAlpha=alpha*(.18+i*.17);c.lineWidth=i===3?2:7-i;
      c.beginPath();c.ellipse(x,270,rx+i*3,ry+i*5,0,0,Math.PI*2);c.stroke();
    }
    for(let i=0;i<18;i++){
      const angle=i*Math.PI/9+state.time*.35,swell=1+.035*Math.sin(state.time*7+i);
      const px=x+Math.cos(angle)*rx*swell,py=270+Math.sin(angle)*ry*swell;
      c.fillStyle='#e6fcff';c.globalAlpha=alpha*.7;c.beginPath();c.arc(px,py,1.2+(i%3)*.5,0,Math.PI*2);c.fill();
    }
    c.restore();glow(x,270,rx*1.8,ry*1.35,color,alpha*.16);
  }
  function ship(alpha=1){
    c.save();c.globalAlpha=alpha;const x=240,y=270;
    c.strokeStyle='#9defff';c.lineWidth=4;c.lineCap='round';c.shadowColor='#5fdbff';c.shadowBlur=12;
    c.beginPath();c.moveTo(x-28,y);c.lineTo(x-110,y+Math.sin(state.time*3)*2);c.stroke();
    c.drawImage(assets.player,x-30,y-22,60,44);c.restore();
  }
  function draw(){
    if(!state.ready)return;
    const t=state.time,clock=timing(),p=state.detail?1:phaseAt(t),cross=t-clock.approach;
    c.clearRect(0,0,960,540);
    // Switch scenery only under the fully opaque white hold, never in view.
    const swapped=!state.detail&&cross>=.20;
    background(swapped?assets.to:assets.from,t*state.speed*.045);
    if(p===1)portal(state.detail?625:240+960-(t-.45)*state.speed);
    if(p===2){
      if(cross<.2)portal(240-cross*state.speed,1-smooth(cross/.20));
      const burst=smooth(cross/.20);
      for(let i=0;i<26;i++){
        const angle=i*Math.PI/13,r=60+burst*700,near=1-clamp(cross/.75);
        c.save();c.globalAlpha=near*.45;c.strokeStyle='#cef6ff';c.lineWidth=1.5;
        c.beginPath();c.moveTo(240+Math.cos(angle)*r*.65,270+Math.sin(angle)*r*.65);c.lineTo(240+Math.cos(angle)*r,270+Math.sin(angle)*r);c.stroke();c.restore();
      }
    }
    ship();
    if(p===2){
      const white=cross<.20?smooth(cross/.20):1-smooth((cross-.30)/.60);
      c.fillStyle=state.reduced?'#c6dfed':'#ffffff';c.globalAlpha=clamp(white);c.fillRect(0,0,960,540);c.globalAlpha=1;
    }
    if(p===3){
      const since=t-clock.clear,x=1000-since*state.speed;
      c.drawImage(assets.wall,x,0,46,184);c.drawImage(assets.wall,x,330,46,210);
    }
    $('phase').textContent=state.detail?'조형물 동작 반복 · 포탈 위치 고정':['보스 클리어','포탈 접근 · 장애물과 같은 이동 속도','포탈 통과 · 다음 지역으로 전환','새 지역 도착 · 장애물 재개'][p];
    $('safety').textContent=p===3?'새 지역의 장애물 생성':'장애물 생성 중지';
    document.querySelectorAll('[data-step]').forEach(e=>e.classList.toggle('active',Number(e.dataset.step)===p));
    $('scrub').value=String(Math.round(t/clock.total*1000));
  }
  for(const id of ['from','to']){
    stages.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=s[1];$(id).append(o);});
    $(id).value=String(state[id]);$(id).onchange=e=>{state[id]=Number(e.target.value);prepare();};
  }
  $('speed').onchange=e=>{state.speed=Number(e.target.value);state.time=0;};
  $('ornaments').onchange=e=>{state.ornaments=e.target.checked;};
  $('detail').onchange=e=>{state.detail=e.target.checked;state.time=0;};
  $('reduced').onchange=e=>{state.reduced=e.target.checked;};$('loop').onchange=e=>{state.loop=e.target.checked;};
  $('replay').onclick=()=>{state.time=0;state.paused=false;$('pause').textContent='일시정지';};
  $('pause').onclick=()=>{state.paused=!state.paused;$('pause').textContent=state.paused?'계속 재생':'일시정지';};
  $('scrub').oninput=e=>{state.time=Number(e.target.value)/1000*timing().total;state.paused=true;$('pause').textContent='계속 재생';draw();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){state.paused=true;$('pause').textContent='계속 재생';}});
  let previous;
  function frame(now){
    if(previous!==undefined&&!state.paused&&state.ready){state.time+=Math.min(.05,(now-previous)/1000);if(state.time>timing().total){if(state.loop)state.time=0;else{state.time=timing().total;state.paused=true;$('pause').textContent='계속 재생';}}}
    previous=now;draw();requestAnimationFrame(frame);
  }
  window.PortalPreview={state,prepare,timing,phaseAt,draw,stages,ornamentPose};
  const params=new URLSearchParams(location.search);
  if(params.has('to'))state.to=Math.max(0,Math.min(5,Number(params.get('to'))||0))|0;
  if(params.has('from'))state.from=Math.max(0,Math.min(5,Number(params.get('from'))||0))|0;
  $('from').value=String(state.from);$('to').value=String(state.to);
  const ready=prepare().then(()=>{if(params.has('time'))state.time=Math.max(0,Math.min(timing().total,Number(params.get('time'))||0));if(params.get('still')==='1'){state.paused=true;$('pause').textContent='계속 재생';}draw();});
  window.PortalPreview.ready=ready;
  requestAnimationFrame(frame);
})();
