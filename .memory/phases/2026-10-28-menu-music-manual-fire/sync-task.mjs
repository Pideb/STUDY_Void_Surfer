import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const n=Number(process.argv[2]),slug='2026-10-28-menu-music-manual-fire',root='.memory/phases/'+slug+'/P01-runtime',files=fs.readdirSync(root).filter(f=>/^T\d+/.test(f)).sort(),file=files[n-1],path=root+'/'+file;
let content=fs.readFileSync(path,'utf8');content=content.replace('## Status: pending','## Status: done').replaceAll('- [ ]','- [x]');fs.writeFileSync(path,content);
const message=content.match(/```text\n([\s\S]*?)\n```/)[1];
function git(args){const r=spawnSync('git',args,{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);return r.stdout.trim();}
git(['diff','--check']);git(['add',path,'.memory/current.md',root+'/phase.md',...process.argv.slice(3)]);console.log(git(['commit','-m',message]));const hash=git(['rev-parse','--short','HEAD']);fs.writeFileSync(path,content.replace('- commit: pending','- commit: '+hash));
let phase=fs.readFileSync(root+'/phase.md','utf8');phase=phase.replace('| T'+String(n).padStart(2,'0')+' | pending |','| T'+String(n).padStart(2,'0')+' | done |');phase=phase.replace(/- done: \d+\/6 \(active: .*?\)/,'- done: '+n+'/6 (active: '+(n<6?'T'+String(n+1).padStart(2,'0'):'none')+')');fs.writeFileSync(root+'/phase.md',phase);
const next=n<6?'[Next task](./phases/'+slug+'/P01-runtime/'+files[n]+')':'None. All six Tasks complete.';
fs.writeFileSync('.memory/current.md','# Current Context\n\n## Active Plan\n'+(n<6?'[Menu Music and Manual Boss Laser](./plans/'+slug+'.md)':'None. '+slug+' complete.')+'\n\n## Active Phase\n'+(n<6?'P01-runtime':'None.')+'\n\n## Active Task\n'+next+'\n\n## Status\n- T'+String(n).padStart(2,'0')+' completed and verified; commit '+hash+'.\n- Progress '+n+'/6. User authorized sequential completion.\n\n## Next Step (IMPORTANT)\n'+(n<6?'Read next task blueprint and continue implementation, validation and commit.':'Review final validation report; no deployment/DB change.')+'\n');
if(n===6){const plan='.memory/plans/'+slug+'.md';fs.writeFileSync(plan,fs.readFileSync(plan,'utf8').replace('| in_progress |','| done |'));}
console.log('Advanced memory pointer after '+hash);
