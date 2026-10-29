import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url),modes=['nova','aegis','velocity','mobile','charge','beam','sixshot','laser'];
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);
function png(name){const bytes=fs.readFileSync(new URL(name,root));assert.equal(bytes.readUInt32BE(0),0x89504e47);return{width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};}
for(const mode of modes){
  const r=JSON.parse(fs.readFileSync(new URL(mode+'.json',root),'utf8'));
  assert.equal(r.error,undefined,mode+': '+r.error);assert.equal(r.mode,mode);assert.equal(r.loadedAssets,53);assert.deepEqual(r.missingAssets,[]);assert.equal(r.overflow,false);
  assert.deepEqual(png(mode+'.png'),r.buffer);assert.equal(r.buffer.width,r.viewport.width*r.dpr);assert.equal(r.buffer.height,r.viewport.height*r.dpr);
  assert.deepEqual(png(mode+'-layout.png'),mode==='mobile'?{width:640,height:360}:{width:1280,height:720});
  assert.equal(r.damage.right-r.damage.left,16);assert.equal(r.damage.bottom-r.damage.top,16);
  for(const row of r.speedTable){const start=row.id==='velocity'?480:240;for(const {score,speed} of row.speeds)assert.equal(speed,start+10*Math.floor(Math.min(score,100)/10));}
  assert.deepEqual(r.cooldownMarker,{x:204,y:246,radius:8});
  if(['nova','aegis','velocity','mobile'].includes(mode))close(r.cooldownRemaining,.05);
  if(r.weaponChecks){const w=r.weaponChecks;close(w.chargeSeconds,.5);close(w.durationSeconds,.7);close(w.captureElapsed,mode==='charge'?.49:.5);assert.equal(w.hpAtCapture,mode==='charge'?3:2);assert.ok(w.playerHeld&&w.worldAdvanced&&w.wallAdvanced);}
  if(mode==='sixshot')assert.deepEqual(r.volley,{count:6,phase:'signature',walls:0});
  if(mode==='laser')for(const y of r.lineLaser.ys){assert.ok(y-r.lineLaser.thickness/2>=81);assert.ok(y+r.lineLaser.thickness/2<=459);}
}
for(const id of ['nova','aegis','velocity'])assert.deepEqual(png(id+'-detail.png'),{width:640,height:360});
console.log('Passed: eight actual engine/renderer fixtures, dimensions, speed targets, ring, firing, six shots and laser margins.');
