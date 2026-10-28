import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const dir=path.dirname(fileURLToPath(import.meta.url));
const scope=vm.createContext({});
vm.runInContext(await readFile(path.join(dir,'roar-synthesis.js'),'utf8'),scope);
const {profiles,synthesize,wavBytes}=scope.BossRoarSynth;
await mkdir(path.join(dir,'audio'),{recursive:true});
const report=[];
for(const p of profiles){
  const samples=synthesize(p.id),again=synthesize(p.id);
  assert.equal(samples.length,35280);assert.equal(Math.abs(samples[0]),0);assert.equal(Math.abs(samples.at(-1)),0);
  let peak=0,power=0,delta=0;
  for(let i=0;i<samples.length;i++){
    const n=samples[i];assert(Number.isFinite(n));assert.equal(n,again[i]);peak=Math.max(peak,Math.abs(n));power+=n*n;
    if(i)delta+=(n-samples[i-1])**2;
  }
  const rms=Math.sqrt(power/samples.length);assert(peak<=.721&&peak>.5);assert(rms>.06&&rms<.5);
  const bytes=wavBytes(samples);assert.equal(bytes.length,70604);
  await writeFile(path.join(dir,'audio',p.id+'-roar.wav'),bytes);
  report.push({...p,duration:.8,sampleRate:44100,peak,rms,roughness:Math.sqrt(delta/samples.length)});
}
assert(new Set(report.map(r=>r.roughness.toFixed(4))).size===6,'All six sound signatures must differ');
await writeFile(path.join(dir,'audio','manifest.json'),JSON.stringify(report,null,2)+'\n');
console.log('PASS: six distinct original .8s PCM roar previews; deterministic, finite, unclipped, tapered endpoints.');
