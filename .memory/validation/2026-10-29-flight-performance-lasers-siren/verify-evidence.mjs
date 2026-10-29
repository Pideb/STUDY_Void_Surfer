import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root=new URL('./',import.meta.url),read=id=>JSON.parse(fs.readFileSync(new URL(id+'.json',root),'utf8'));
const modes=['guest-menu','guest-hangar','guest-ranking','guest-result','account-hangar','mobile-guest-hangar','ambient-normal','ambient-warning-two','boss-entry','boss-stable','volley-spread'];
for(const id of modes){const r=read(id);assert(!r.error,r.error);assert.equal(r.overflow,false);assert.deepEqual(r.failedAssets,[]);assert.equal(r.audio.duration,2.4);assert.equal(r.audio.frames,57600);assert.equal(r.audio.channels,2);
 if(id.includes('guest')){assert.equal(r.guestRecordPresent,false);assert.equal(r.privateReads,0);assert.equal(r.submissions,0);assert.equal(r.unrelated,'keep');assert.equal(r.hangarBest,null);assert(!r.text.includes('게스트 최고 기록'));}
 if(id.includes('guest-hangar')){assert.deepEqual(r.aircraftOptions.map(a=>a.disabled),[false,true,true]);if(id.startsWith('mobile'))for(const craft of r.aircraftOptions)assert(craft.image.right<=craft.title.left,'Mobile image overlaps title');}
 const png=fs.readFileSync(new URL(id+'.png',root));assert.equal(png.readUInt32BE(16),r.buffer.width);assert.equal(png.readUInt32BE(20),r.buffer.height);
}
assert.equal(read('account-hangar').hangarBest,'계정 최고 기록 100점');assert.deepEqual(read('account-hangar').aircraftOptions.map(a=>a.disabled),[false,false,false]);
assert.equal(read('guest-result').snapshot.score,2);assert(!read('guest-result').text.includes('내 주변 순위'));assert(!read('guest-result').text.includes('등록되었습니다'));
assert(read('guest-ranking').text.includes('로그인하면'));assert.equal(read('ambient-normal').snapshot.difficulty.isWarning,false);assert.equal(read('ambient-warning-two').snapshot.difficulty.isWarning,true);assert.equal(read('ambient-warning-two').lines.length,2);
assert.equal(read('boss-entry').snapshot.bossPreview.remainingSeconds,2.4);
const stable=read('boss-stable').backgroundSamples;assert(new Set(stable.map(s=>s.wall.toFixed(1))).size>1);assert(new Set(stable.map(s=>s.background)).size===1);for(const s of stable)assert(Math.abs(s.travel-s.background*.0125)<1e-7);
assert.equal(read('volley-spread').snapshot.boss.attack.type,'volley');
const provenance=read('density-provenance');for(const [path,hash]of Object.entries(provenance))assert.equal(createHash('sha256').update(fs.readFileSync(path)).digest('hex'),hash);
assert.equal(createHash('sha256').update(fs.readFileSync('public/assets/audio/boss-entry.wav')).digest('hex'),'925ffc1b9ef079dd9dca52260398af72b9224ff633479a7b3111b6d50efb18b2');
const artifacts=fs.readdirSync(root).filter(f=>f.endsWith('.png')).map(name=>{const b=fs.readFileSync(new URL(name,root));assert.equal(b.readUInt32BE(0),0x89504e47);return {name,width:b.readUInt32BE(16),height:b.readUInt32BE(20),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};});
fs.writeFileSync(new URL('evidence-manifest.json',root),JSON.stringify({runtimeCases:modes.length,artifacts},null,2));
console.log(`Evidence passed:11 actual-runtime cases, ${artifacts.length} PNGs, approved audio and density-source hashes; guest policy/account behavior/geometry verified.`);
