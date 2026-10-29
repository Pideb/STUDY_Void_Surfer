import fs from 'node:fs';import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url),read=id=>JSON.parse(fs.readFileSync(new URL(id+'.json',root),'utf8'));
const pairs=[['baseline-desktop','final-v3-desktop'],['baseline-mobile','final-mobile']],comparisons=[];
for(const [beforeId,afterId] of pairs){const before=read(beforeId),after=read(afterId);assert(!before.error&&!after.error);assert.deepEqual(before.viewport,after.viewport);assert.deepEqual(before.buffer,after.buffer);assert.deepEqual(before.assets.failed,[]);assert.deepEqual(after.assets.failed,[]);
 for(let i=0;i<before.scenes.length;i++){const a=before.scenes[i],b=after.scenes[i];assert.equal(a.name,b.name);assert.deepEqual(a.snapshot,b.snapshot,'Mismatched gameplay fixture');assert(a.flushedMs.median>0&&b.flushedMs.median>0);
  for(const layer of Object.values(b.layers)){assert(layer.available);assert.equal(layer.width,Math.max(1,Math.floor(after.buffer.width*layer.density)));assert.equal(layer.height,Math.max(1,Math.floor(after.buffer.height*layer.density)));}
  comparisons.push({device:beforeId.replace('baseline-',''),scene:a.name,beforeMs:a.flushedMs.median,afterMs:b.flushedMs.median,changePercent:(b.flushedMs.median/a.flushedMs.median-1)*100,beforeP95:a.flushedMs.p95,afterP95:b.flushedMs.p95,beforeDrawMs:a.drawMs.median,afterDrawMs:b.drawMs.median,beforeFrameInterval:a.frameIntervalMs.median,afterFrameInterval:b.frameIntervalMs.median});
 }
}
const reference=read('reference-desktop');assert.equal(reference.sampleCount,180);assert.equal(reference.warmup,60);assert(!reference.error);
for(const scene of reference.scenes){assert.deepEqual(scene.snapshot,read('baseline-desktop').scenes.find(s=>s.name===scene.name).snapshot);for(const layer of Object.values(scene.layers))assert.equal(layer.density,1);}
fs.writeFileSync(new URL('performance-comparison.json',root),JSON.stringify({method:'Headless software rasterization; identical public-engine snapshots,60 warmup/180 measured RAF renders per scene. Includes1px synchronous readback. Not a hardware FPS guarantee.',comparisons},null,2));
console.log(JSON.stringify(comparisons,null,2));
