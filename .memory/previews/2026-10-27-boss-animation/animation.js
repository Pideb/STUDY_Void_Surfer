/* Review-only Canvas animation. Approved source files remain untouched. */
(() => {
  'use strict';
  const rigs = window.BOSS_ANIMATION_RIGS;
  const canvas = document.querySelector('#scene');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const state = { index: 0, mode: 'auto', time: 0, paused: false, actual: false, ready: false };
  const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const cache = new Map();
  let asset, request = 0, audioContext, audioSource, soundRequest = 0;
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
      img.src = src;
    });
  }
  function layer(w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  }
  function polygon(c, points, w, h) {
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h)); c.closePath();
  }
  async function prepare(rig) {
    const root = `../../../public/assets/game/stages/${rig.id}/`;
    const [image, background, projectile] = await Promise.all([
      loadImage(rig.src), loadImage(root + 'boss-background.png'), loadImage(root + 'projectile.png'),
    ]);
    const w = 768, h = Math.round(w * image.height / image.width);
    const original = layer(w, h); original.getContext('2d').drawImage(image, 0, 0, w, h);
    const base = layer(w, h), bc = base.getContext('2d'); bc.drawImage(original, 0, 0);
    const parts = rig.parts.map((part) => {
      const c = layer(w, h), pc = c.getContext('2d');
      pc.save(); polygon(pc, part.poly, w, h); pc.clip(); pc.drawImage(original, 0, 0); pc.restore();
      bc.save(); bc.globalCompositeOperation = 'destination-out'; polygon(bc, part.poly, w, h); bc.fill(); bc.restore();
      return { ...part, canvas: c };
    });
    return { w, h, base, parts, background, projectile };
  }
  function stopSound() { soundRequest++; if (audioSource) { audioSource.stop(); audioSource = null; } }
  async function select(index) {
    const token = ++request; stopSound(); state.ready = false; state.index = index; state.time = 0;
    $('loading').hidden = false; $('loading').textContent = '이미지 준비 중…';
    document.querySelectorAll('#bosses button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
    const rig = rigs[index]; $('name').textContent = `${rig.label} / ${rig.version}`; $('detail').textContent = rig.detail;
    $('sound-detail').textContent = BossRoarSynth.profiles[index].description;
    const player=$('audio-preview');player.pause();player.src=`audio/${rig.id}-roar.wav`;
    $('download-audio').href=player.src;
    try {
      if (!cache.has(index)) cache.set(index, prepare(rig));
      const result = await cache.get(index);
      if (token !== request) return;
      asset = result; state.ready = true; $('loading').hidden = true;
      for (const key of cache.keys()) if (cache.size > 2 && key !== index) cache.delete(key);
    } catch (error) { if (token === request) $('loading').textContent = error.message; cache.delete(index); }
  }
  function actionAt(time, mode) {
    if (mode === 'idle') return { kind: 'idle', t: time % 4, length: 4 };
    if (mode !== 'auto') {
      const length = { attack: 2.6, roar: 2.2, hit: 1.8 }[mode];
      return { kind: mode, t: time % length, length };
    }
    let t = time % 8;
    for (const [kind, length] of [['idle',2.4],['attack',2.6],['roar',1.4],['hit',1.6]]) {
      if (t < length) return { kind, t, length }; t -= length;
    }
    return { kind: 'idle', t: 0, length: 2.4 };
  }
  function poseFor(action, time) {
    const p = { charge: 0, fire: 0, roar: 0, hit: 0 };
    if (action.kind === 'attack') {
      p.charge = smooth(action.t / .9) * (1 - smooth((action.t - 1.35) / .45));
      p.fire = action.t >= 1.1 ? Math.exp(-(action.t - 1.1) * 8) : 0;
    }
    if (action.kind === 'roar') p.roar = Math.sin(Math.PI * clamp(action.t / .8));
    if (action.kind === 'hit') p.hit = action.t > .3 ? Math.exp(-(action.t - .3) * 5) : 0;
    p.time = time; return p;
  }
  function drawWarped(c, source, w, h, time, tail) {
    if (!tail) { c.drawImage(source, 0, 0, w, h); return; }
    // Connected tail deformation; displacement and slope both zero at its root.
    const steps = 64, strip = source.width / steps;
    for (let i = 0; i < steps; i++) {
      const u = (i + .5) / steps, strength = Math.pow(clamp((u - .56) / .44), 2);
      const dy = Math.sin(time * 2.5 - u * 7) * h * .055 * strength;
      c.drawImage(source, i * strip, 0, strip + .3, source.height, i * w / steps, dy, w / steps + .25, h);
    }
  }
  function glow(x, y, r, color, strength = 1) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = clamp(strength);
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1,r));
    g.addColorStop(0, '#ffffff'); g.addColorStop(.18, color); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  function drawBoss(rig, a, p, box) {
    const { x, y, w, h } = box;
    ctx.save(); ctx.translate(x + p.fire * 5 + p.hit * 9, y);
    // The body stays anchored; only articulated parts breathe, unfold and recoil.
    drawWarped(ctx, a.base, w, h, p.time, rig.id === 'abyssal-beast');
    a.parts.forEach((part, i) => {
      const breathing = Math.sin(p.time * (1.7 + i * .13) + i * 1.6);
      const openness = p.charge * .55 + p.roar;
      const angle = breathing * part.amplitude + part.side * part.open * openness;
      const dx = (part.slide || 0) * w * (openness + .24 * breathing) + (part.recoil || 0) * w * p.fire;
      const dy = (part.lift || 0) * h * part.side * (openness + .3 * breathing);
      const [px, py] = part.pivot;
      ctx.save(); ctx.translate(px * w + dx, py * h + dy); ctx.rotate(angle); ctx.translate(-px * w, -py * h);
      ctx.drawImage(part.canvas, 0, 0, w, h); ctx.restore();
    });
    ctx.restore();
    const [cx, cy, cr] = rig.core, coreX = x + cx*w, coreY = y+cy*h;
    glow(coreX, coreY, cr*w*(1.25+p.charge), rig.color, .14 + p.charge*.37 + p.roar*.24);
    if (rig.id === 'gravity-well') {
      ctx.save(); ctx.strokeStyle = rig.color; ctx.globalAlpha = .45; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.ellipse(coreX, coreY, cr*w*(.5+i*.19), cr*h*(.5+i*.19), p.time*(i%2 ? -.4 : .3), p.time+i*2, p.time+i*2+3.3); ctx.stroke();
        const theta = p.time*(i%2 ? -.6 : .5) + i*2.1;
        const px = coreX + Math.cos(theta)*w*.21, py = coreY + Math.sin(theta)*h*.29;
        ctx.drawImage(a.projectile, px-12, py-8, 24, 16);
      } ctx.restore();
    }
    if (rig.id === 'signal-monoliths') {
      for (let i=0;i<6;i++) glow(x+w*(.25+i*.105), y+h*.50, w*.018, rig.color, .15+.6*Math.pow(Math.max(0,Math.sin(p.time*4-i*.9)),6));
    }
    if (rig.id === 'solar-forge') {
      glow(x+w*.91, y+h*.5, w*(.08+.013*Math.sin(p.time*21)), '#ff9845', .3+p.charge*.15);
    }
    if (p.hit > 0) {
      glow(coreX, coreY, w*.35, '#ecfbff', p.hit*.65);
      ctx.save(); ctx.strokeStyle='#f0fcff';ctx.globalAlpha=p.hit;ctx.lineWidth=2;
      for(let i=0;i<10;i++){const theta=i*Math.PI/5;const r=w*(.1+(1-p.hit)*.22);ctx.beginPath();ctx.moveTo(coreX+Math.cos(theta)*r,coreY+Math.sin(theta)*r);ctx.lineTo(coreX+Math.cos(theta)*(r+12),coreY+Math.sin(theta)*(r+12));ctx.stroke();}ctx.restore();
    }
  }
  function projectiles(rig, a, action, box, p) {
    if(action.kind!=='attack') return;
    const {x,y,w,h}=box; const mx=x+rig.muzzle[0]*w, my=y+rig.muzzle[1]*h;
    if(action.t<1.1){glow(mx,my,12+p.charge*28,rig.color,.3+p.charge*.5);return;}
    const age=action.t-1.1;
    const count=[5,3,3,3,3,4][state.index];
    for(let i=0;i<count;i++){
      const lag=['industrial-void','signal-monoliths','solar-forge'].includes(rig.id)?i*.13:0;
      const t=age-lag;if(t<0)continue;
      const spread=(i-(count-1)/2);
      let px=mx-t*460, py=my;
      if(rig.id==='crystal-gates')py+=spread*t*76;
      if(rig.id==='industrial-void')py+=(i%2?1:-1)*h*.12;
      if(rig.id==='signal-monoliths')py+=spread*65;
      if(rig.id==='gravity-well')py+=Math.sin(t*5+i*2)*55*Math.min(1,t*2);
      if(rig.id==='abyssal-beast')py+=spread*52*Math.sin(t*2.5);
      if(rig.id==='solar-forge')py+=spread*22;
      if(px< -60)continue;
      glow(px,py,24,rig.color,.35);ctx.drawImage(a.projectile,px-26,py-13,52,26);
    }
    glow(mx,my,28,rig.color,p.fire);
  }
  function effects(rig, action, box, p) {
    const mx=box.x+rig.muzzle[0]*box.w,my=box.y+rig.muzzle[1]*box.h;
    if(action.kind==='roar' && action.t<.8){
      for(let i=0;i<3;i++){
        const age=action.t-i*.15;if(age<0)continue;
        const r=20+age*540;
        ctx.save();ctx.strokeStyle=rig.color;ctx.lineWidth=2.5;ctx.globalAlpha=Math.max(0,1-age/.8)*.8;
        ctx.shadowColor=rig.color;ctx.shadowBlur=12;ctx.beginPath();ctx.ellipse(mx,my,r,r*.7,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      }
    }
    if(action.kind==='hit' && action.t<.4){
      const t=clamp(action.t/.3), ex=box.x+rig.core[0]*box.w, ey=box.y+rig.core[1]*box.h;
      const bx=130+(ex-130)*t,by=330+(ey-330)*t;
      ctx.save();ctx.lineWidth=5;ctx.strokeStyle='#e1fbff';ctx.shadowColor='#64dfff';ctx.shadowBlur=18;
      ctx.beginPath();ctx.moveTo(bx-45,by);ctx.lineTo(bx,by);ctx.stroke();ctx.restore();glow(bx,by,17,'#a5efff',.7);
    }
  }
  function draw() {
    if(!state.ready)return;
    const rig=rigs[state.index], a=asset;
    const action=actionAt(state.time,state.mode),p=poseFor(action,state.time);
    ctx.clearRect(0,0,960,540);ctx.drawImage(a.background,0,0,960,540);
    ctx.fillStyle='#030814a0';ctx.fillRect(0,0,960,540);
    const w=state.actual?192:460, h=state.actual?128:w*a.h/a.w;
    const box={x:state.actual?715:445,y:270-h/2,w,h};
    drawBoss(rig,a,p,box);projectiles(rig,a,action,box,p);effects(rig,action,box,p);
    // Quiet reference mark at the player side, kept distinct from boss artwork.
    ctx.save();ctx.fillStyle='#d2f7ff';ctx.shadowColor='#87e8ff';ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(128,330);ctx.lineTo(105,321);ctx.lineTo(110,330);ctx.lineTo(105,339);ctx.closePath();ctx.fill();ctx.restore();
    ctx.font='13px system-ui';ctx.fillStyle='#a2b7d2';ctx.fillText('플레이어 방향 ←',28,509);
    $('status').textContent={idle:'대기 · 부위별 움직임',attack:action.t<1.1?'충전':'발사 · 반동',roar:action.t<.8?'울부짖음 · 0.8초':'회복',hit:action.t<.3?'플레이어 반격':'피격 · 회복'}[action.kind];
    $('progress').style.width=`${(state.time%(state.mode==='auto'?8:action.length))/(state.mode==='auto'?8:action.length)*100}%`;
  }
  function setMode(mode) {
    stopSound();$('audio-preview').pause();state.mode=mode;state.time=0;state.paused=false;$('pause').textContent='일시정지';
    document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===mode)));
  }
  async function playRoar(){
    setMode('roar');
    const token=soundRequest,index=state.index;
    try{
      audioContext ||= new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();
      if(token!==soundRequest||index!==state.index||state.paused)return;
      $('audio-preview').pause();state.time=0;
      const sr=audioContext.sampleRate,data=BossRoarSynth.synthesize(rigs[index].id,sr),buffer=audioContext.createBuffer(1,data.length,sr);
      buffer.getChannelData(0).set(data);
      audioSource=audioContext.createBufferSource();audioSource.buffer=buffer;const gain=audioContext.createGain();gain.gain.value=.65;audioSource.connect(gain).connect(audioContext.destination);audioSource.start();
    }catch(error){$('status').textContent='소리를 재생하지 못했습니다: '+error.message;}
  }
  rigs.forEach((rig,i)=>{const b=document.createElement('button');b.textContent=rig.label;b.type='button';b.setAttribute('aria-pressed',String(i===0));b.onclick=()=>select(i);$('bosses').append(b);});
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>setMode(b.dataset.action));
  $('pause').onclick=()=>{state.paused=!state.paused;if(state.paused){stopSound();$('audio-preview').pause();}$('pause').textContent=state.paused?'계속 재생':'일시정지';};
  $('actual').onchange=e=>{state.actual=e.target.checked;};$('sound').onclick=playRoar;
  $('audio-preview').onplay=()=>stopSound();
  document.addEventListener('visibilitychange',()=>{if(document.hidden){state.paused=true;stopSound();$('audio-preview').pause();$('pause').textContent='계속 재생';}});
  let previous;
  function frame(now){if(previous!==undefined&&!state.paused&&state.ready)state.time+=Math.min(.05,(now-previous)/1000);previous=now;draw();requestAnimationFrame(frame);}
  window.BossAnimationPreview={state,select,setMode,actionAt,poseFor,draw,rigs};
  // Optional deterministic review frames for renderer QA, without changing source art.
  const params = new URLSearchParams(location.search);
  const startIndex = clamp(Number(params.get('boss') || 0), 0, rigs.length-1) | 0;
  if(['auto','idle','attack','roar','hit'].includes(params.get('action')))setMode(params.get('action'));
  select(startIndex).then(()=>{
    if(params.has('time'))state.time=clamp(Number(params.get('time')) || 0,0,60);
    if(params.get('still')==='1'){state.paused=true;$('pause').textContent='계속 재생';}
    draw();
  });requestAnimationFrame(frame);
})();
