import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const number=Number(process.argv[2]),slug='2026-10-29-boss-motion-aim-patterns',root='.memory/phases/'+slug+'/P01-runtime';
const files=fs.readdirSync(root).filter(f=>/^T\d+.*\.md$/.test(f)).sort();
if(!Number.isInteger(number)||number<1||number>files.length)throw Error('Invalid task');
const path=root+'/'+files[number-1],task='T'+String(number).padStart(2,'0');
let content=fs.readFileSync(path,'utf8').replaceAll('\r\n','\n');
if(!content.includes('## Status: pending'))throw Error('Task already processed');
content=content.replace('## Status: pending','## Status: done').replaceAll('- [ ]','- [x]');
fs.writeFileSync(path,content);
function git(args){const r=spawnSync('git',args,{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout.trim();}
git(['diff','--check']);
git(['add',path,'.memory/current.md',root+'/phase.md',...process.argv.slice(3)]);
console.log(git(['commit','-m',content.match(/```text\n([\s\S]*?)\n```/)[1]]));
const hash=git(['rev-parse','--short','HEAD']);fs.writeFileSync(path,content.replace('- commit: pending','- commit: '+hash));
let phase=fs.readFileSync(root+'/phase.md','utf8');
phase=phase.replace('| '+task+' | pending |','| '+task+' | done |');
phase=phase.replace(/- done: \d+\/6 \(active: .*?\)/,'- done: '+number+'/6 (active: '+(number<6?'T'+String(number+1).padStart(2,'0'):'none')+')');
fs.writeFileSync(root+'/phase.md',phase);
const finished=number===files.length;
fs.writeFileSync('.memory/current.md','# Current Context\n\n## Active Plan\n'+(finished?'None. '+slug+' complete.':'[Boss Motion, Aiming and Random Patterns](./plans/'+slug+'.md)')+'\n\n## Active Phase\n'+(finished?'None.':'[P01 Runtime](./phases/'+slug+'/P01-runtime/phase.md)')+'\n\n## Active Task\n'+(finished?'None. All six tasks complete.':'[Next task](./phases/'+slug+'/P01-runtime/'+files[number]+')')+'\n\n## Status\n- '+task+' complete and verified; commit '+hash+'.\n- Progress '+number+'/6; sequential completion authorized.\n\n## Next Step (IMPORTANT)\n'+(finished?'Review final report and playtest; deployment/DB remain outside scope.':'Read next blueprint, implement, validate, commit and advance.')+'\n');
if(finished){const plan='.memory/plans/'+slug+'.md';fs.writeFileSync(plan,fs.readFileSync(plan,'utf8').replace('| in_progress |','| done |'));}
console.log('Advanced pointer after '+hash);
