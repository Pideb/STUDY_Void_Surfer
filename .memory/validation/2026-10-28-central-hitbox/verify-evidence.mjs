import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base=new URL('./',import.meta.url);
const ids=['desktop','mobile','fourk','geometry','aegis-start','aegis-hit','velocity','laser'];
const reports={};
for(const id of ids){
  const r=JSON.parse(await readFile(new URL(id+'.json',base),'utf8'));reports[id]=r;
  assert.equal(r.assets,53,id);assert.deepEqual(r.failedAssets,[]);assert.equal(r.documentOverflow,false);
  assert.equal(r.damage.right-r.damage.left,16);assert.equal(r.damage.bottom-r.damage.top,16);
  assert.equal(r.success.right-r.success.left,56);assert.equal(r.success.bottom-r.success.top,36);
  assert.ok(r.buffer.width*r.buffer.height<=3840*2160);
  const png=await readFile(new URL(id+'.png',base));assert.equal(png.readUInt32BE(16),r.buffer.width);assert.equal(png.readUInt32BE(20),r.buffer.height);
}
assert.deepEqual(reports.desktop.buffer,{width:1920,height:1080});
assert.deepEqual(reports.mobile.buffer,{width:1280,height:720});assert.deepEqual(reports.mobile.viewport,{width:640,height:360});
assert.deepEqual(reports.fourk.buffer,{width:3840,height:2160});assert.equal(reports.fourk.dpr,2);
assert.equal(reports.desktop.fireButton.display,'none');assert.notEqual(reports.mobile.fireButton.display,'none');
assert.ok(reports.mobile.fireButton.bounds.right<=640&&reports.mobile.fireButton.bounds.bottom<=360);
assert.equal(reports.geometry.timing.centerInBand,false);assert.equal(reports.geometry.timing.eligible,true);
assert.equal(reports['aegis-start'].hpUi,'3 / 3');assert.equal(reports['aegis-hit'].hpUi,'0 / 3');
assert.equal(reports['aegis-hit'].boss.laserHits,1);assert.equal(reports['aegis-hit'].boss.damageTaken,3);
assert.equal(reports.velocity.aircraft.speedCapScore,70);assert.equal(reports.desktop.aircraft.speedCapScore,100);
for(const y of reports.laser.laser.ys){assert.ok(y-9>=54);assert.ok(y+9<=486);}
for(const id of ['clarity','desktop-layout','mobile-layout','fourk-layout','geometry-layout','aegis-start-layout','aegis-hit-layout','velocity-layout','laser-layout']){
  const png=await readFile(new URL(id+'.png',base));assert.equal(png.readUInt32BE(0),0x89504e47);
}
console.log('8 real-renderer fixtures verified: assets, body/success sizes, true viewport/buffer resolution, cap, UI, AEGIS damage and interior laser.');
