import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('./',import.meta.url),modes=['desktop','mobile','drain','intro','entrance','warning','warning-bottom','active','challenge','hit','miss','aegis-hit','passed','motion'];
const records={},artifacts=[];
for(const mode of modes){
  const record=JSON.parse(await readFile(new URL(mode+'.json',root),'utf8'));records[mode]=record;
  assert(!record.error,record.error);assert.equal(record.overflow,false);assert.deepEqual(record.failedAssets,[]);
  assert.equal(record.text.headings,0);assert.equal(record.text.sequences,1);assert.equal(record.text.combatSentences,0);
  for(const suffix of ['.png','-layout.png']){
    const name=mode+suffix,bytes=await readFile(new URL(name,root));assert.equal(bytes.readUInt32BE(0),0x89504e47);
    const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
    if(suffix==='.png'){assert.equal(width,record.buffer.width);assert.equal(height,record.buffer.height);}
    artifacts.push({name,width,height,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  }
}
assert.equal(records.desktop.fireButton.display,'none');assert.equal(records.mobile.fireButton.display,'flex');
for(const mode of ['desktop','mobile']){const r=records[mode];assert(r.reactor.left>=0&&r.reactor.right<=r.viewport.width);assert(r.reactor.top>=0&&r.reactor.bottom<=r.viewport.height);}
assert.equal(records.hit.afterHp,2);assert.equal(records.hit.laserHits,1);
assert.equal(records.miss.afterHp,3);assert.equal(records.miss.laserHits,0);
assert.equal(records['aegis-hit'].afterHp,0);assert.equal(records['aegis-hit'].laserHits,1);
assert(records.drain.wallCount>0);assert.equal(records.drain.boss,null);assert.equal(records.drain.bossEntry.phase,'draining');
assert.equal(records.intro.boss,null);assert.equal(records.entrance.wallCount,0);assert(records.entrance.bossEntry.darkness>0&&records.entrance.bossEntry.darkness<1);
assert.equal(records.passed.passedGuide.storedWidth,75);assert.equal(records.passed.passedGuide.liveWidth,37.5);
assert(records.challenge.challenge.sequence.length>=4);
assert.equal(records.motion.bosses.length,6);
for(const boss of records.motion.bosses){assert(Math.abs(boss.frames[0].center.y-432)<1);assert(Math.abs(boss.frames[1].center.y-108)<1);assert(boss.frames[2].pose.charge>.55);assert(boss.frames[3].pose.roar>.55);}
const board=await readFile(new URL('boss-actions-actual.png',root));artifacts.push({name:'boss-actions-actual.png',width:board.readUInt32BE(16),height:board.readUInt32BE(20),bytes:board.length,sha256:createHash('sha256').update(board).digest('hex')});
await writeFile(new URL('evidence-manifest.json',root),JSON.stringify({checkedModes:modes.length,artifacts},null,2)+'\n');
console.log('Actual runtime evidence passed:14 public-engine cases,29 PNGs,6 boss identities; no fixture errors/overflow/missing assets.');
