import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
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
      for(const file of drawnOrnaments.slice(before))assert.equal(file,p.stages[p.state.to][0]+'-ornaments.png','Decorations must identify NEXT stage');
      assert.equal(w.document.querySelector('#safety').textContent,p.phaseAt(time)===3?'새 지역의 장애물 생성':'장애물 생성 중지');
    }
  }
}
p.state.from=1;p.state.to=1;await p.prepare();assert.notEqual(p.state.from,p.state.to);
p.state.reduced=true;p.draw();
const count=drawnOrnaments.length;p.state.ornaments=false;p.state.time=1;p.draw();assert.equal(drawnOrnaments.length,count,'Toggle must remove ornaments');
assert.equal(new Set(drawnOrnaments).size,6);
assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));assert(drawCalls>100);
console.log(`PASS: 6 destination-specific ornament sprites, 3 wall speeds, ${frames} transition frames; approved timing, spawn gate, correct destination, ornament toggle.`);
dom.window.close();
