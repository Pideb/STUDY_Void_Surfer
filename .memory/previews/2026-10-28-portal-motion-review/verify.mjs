import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {finalizeDuration} from './webm-duration.mjs';
import {JSDOM} from 'jsdom';
const dir=path.dirname(fileURLToPath(import.meta.url)),errors=[];let drawCalls=0;const drawnOrnaments=[];
const dom=new JSDOM(await readFile(path.join(dir,'preview.html'),'utf8'),{runScripts:'outside-only',url:'http://localhost/preview.html'});
const {window:w}=dom;w.requestAnimationFrame=()=>0;
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({}, {
  get:(_target,key)=>{
    if(key==='createRadialGradient')return (...args)=>{assert(args.every(Number.isFinite));assert(args[5]>0);return {addColorStop(){}};};
    return (...args)=>{if(key==='drawImage'){drawCalls++;if(args[0]?.file?.endsWith('-ornaments.png'))drawnOrnaments.push(args[0].file);}for(const n of args.filter(a=>typeof a==='number'))assert(Number.isFinite(n),key);};
  },set:(_target,key,value)=>{if(key==='globalAlpha')assert(value>=0&&value<=1);return true;},
});
w.Image=class{set src(src){this.file=src;readFile(path.resolve(dir,src)).then(b=>{assert.equal(b.toString('ascii',1,4),'PNG');this.width=b.readUInt32BE(16);this.height=b.readUInt32BE(20);this.onload?.();}).catch(e=>{errors.push(e);this.onerror?.(e);});}};
w.eval(await readFile(path.join(dir,'portal.js'),'utf8'));const p=w.PortalPreview;
let frames=0;
for(let from=0;from<6;from++){
  p.state.from=from;p.state.to=(from+1)%6;await p.prepare();assert(p.state.ready);
  assert.match(w.document.querySelector('#destination-detail').textContent,new RegExp(p.stages[p.state.to][1]));
  for(const speed of [240,480,960]){
    p.state.speed=speed;const t=p.timing();assert.equal((t.approach-.45)*speed,960);
    assert.equal(p.phaseAt(t.approach-.01),1);assert.equal(p.phaseAt(t.approach+.01),2);
    assert.equal(p.phaseAt(t.clear-.001),2);assert.equal(p.phaseAt(t.clear+.001),3);
    for(const time of [0,.6,t.approach-.05,t.approach+.1,t.approach+.25,t.approach+.6,t.clear-.001,t.clear,t.clear+.5]){
      p.state.time=time;const before=drawnOrnaments.length;p.draw();frames++;
      for(const file of drawnOrnaments.slice(before))assert(file.endsWith('/'+p.stages[p.state.to][0]+'-ornaments.png'),'Decorations must identify NEXT stage');
      assert.equal(w.document.querySelector('#safety').textContent,p.phaseAt(time)===3?'새 지역의 장애물 생성':'장애물 생성 중지');
    }
  }
}
p.state.from=1;p.state.to=1;await p.prepare();assert.notEqual(p.state.from,p.state.to);
p.state.reduced=true;p.draw();
const count=drawnOrnaments.length;p.state.ornaments=false;p.state.time=1;p.draw();assert.equal(drawnOrnaments.length,count,'Toggle must remove ornaments');
assert.equal(new Set(drawnOrnaments).size,6);
for(let stage=0;stage<6;stage++){
  let moving=false;
  for(let sector=0;sector<8;sector++){
    const a=p.ornamentPose(stage,sector,.3),b=p.ornamentPose(stage,sector,1.2);
    for(const n of Object.values(a))assert(Number.isFinite(n));
    if(a.dx!==b.dx||a.dy!==b.dy||a.angle!==b.angle)moving=true;
    for(const n of Object.values(p.ornamentPose(stage,sector,1,true)))assert.equal(n,0);
  }
  assert(moving,'All destinations need actual time-varying motion');
}
p.state.ornaments=true;p.state.detail=true;p.state.time=9;p.draw();assert.match(w.document.querySelector('#phase').textContent,/조형물 동작/);
assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));assert(drawCalls>100);
const report=JSON.parse(await readFile(path.join(dir,'qa/playback-report.json'),'utf8'));
assert.equal(report.length,6);
for(const row of report){
  assert.equal(row.error,null,row.id);assert.equal(row.width,960);assert.equal(row.height,540);
  assert(row.frames>30&&row.lastTime>5&&row.lastTime<6&&row.sampled&&row.variance>50,row.id+' must decode a visible moving clip through its end');
  const video=await readFile(path.join(dir,'media',row.id+'-portal.webm'));assert.equal(video.readUInt32BE(0),0x1a45dfa3);
  const info=finalizeDuration(video);assert(info.frames>100&&info.seconds>5&&info.seconds<6);
  const poster=await readFile(path.join(dir,'media',row.id+'-portal.png'));assert.equal(poster.toString('ascii',1,4),'PNG');
  const original=await readFile(path.join(dir,'../2026-10-28-portal-destination-ornaments',row.id+'-ornaments.png'));
  assert.equal(original.toString('ascii',1,4),'PNG');
}
console.log(`PASS: 6 original-art motions, 3 wall speeds, ${frames} transition frames; 6 real WebM clips decoded at 960x540 through their end, 6 posters, approved timing/spawn gate.`);
dom.window.close();
