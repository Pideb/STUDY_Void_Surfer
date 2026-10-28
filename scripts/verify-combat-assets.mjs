import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {VISUAL_ASSET_MANIFEST} from '../src/game/visual-assets.js';

const base=process.argv[2]??'http://127.0.0.1:4187';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=JSON.parse(await readFile('public/assets/game/combat-assets.json','utf8'));
for(const {source,file,sha256} of manifest.assets){
  const local=await readFile(file),original=await readFile(source);
  assert.equal(digest(local),sha256,file);assert.equal(digest(original),sha256,source);
  const response=await fetch(new URL(file.replace(/^public/,''),base));
  assert.equal(response.status,200,file);
  const delivered=Buffer.from(await response.arrayBuffer());assert.equal(digest(delivered),sha256,file);
  if(file.endsWith('.wav'))assert.equal(delivered.toString('ascii',0,4),'RIFF',file);
  else assert.equal(delivered.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file);
}
for(const id of ['industrial-void','gravity-well']){
  const file=`public/assets/game/stages/${id}/boss.png`;
  const baseline=execFileSync('git',['show',`f7cfecf:${file}`],{maxBuffer:16*1024*1024});
  assert.equal(digest(await readFile(file)),digest(baseline),`${id} original design changed`);
}
const urls=new Set();const collect=value=>{if(typeof value==='string')urls.add(value);else Object.values(value).forEach(collect)};
collect(VISUAL_ASSET_MANIFEST);
for(const url of urls){
  const response=await fetch(new URL(url,base));assert.equal(response.status,200,url);
  const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',url);
}
for(const filename of await readdir('dist/assets'))if(filename.endsWith('.js')){
  const source=await readFile(`dist/assets/${filename}`,'utf8');
  assert.ok(!/\.memory\//.test(source),'Deployed bundle references review files');
}
console.log(`Verified ${manifest.assets.length} approved assets byte-for-byte over production HTTP, ${urls.size} visual assets, two original bosses, and standalone bundle.`);
