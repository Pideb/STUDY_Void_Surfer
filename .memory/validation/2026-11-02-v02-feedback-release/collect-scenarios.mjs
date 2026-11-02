import fs from 'node:fs';
import {findFiniteAttackPath} from '../../../tests/helpers/finite-attack-path.js';
import {STAGE_CATALOG} from '../../../src/game/stages.js';
import {AIRCRAFT_CATALOG} from '../../../src/game/aircraft.js';
import {getBaseSpeed} from '../../../src/game/difficulty.js';
const dir='.memory/validation/2026-11-02-v02-feedback-release';
let worst=null;const cases=[];
for(const stage of STAGE_CATALOG)for(const craft of AIRCRAFT_CATALOG)for(const bossNumber of[2,3,4,7])for(const dt of[1/60,1/30,.1])for(const score of[0,220]){
 const scrollSpeed=getBaseSpeed(score,craft.id)*craft.scrollSpeedMultiplier*(score===220?(craft.id==='velocity'?1.1:1.25):1);
 const scene={stageId:stage.id,craft,bossNumber,dt,scrollSpeed,roll:.6},path=findFiniteAttackPath(scene),{frames,...summary}=path;
 cases.push({stageId:stage.id,aircraftId:craft.id,bossNumber,dt,score,scrollSpeed,...summary});
 if(path.passed&&(!worst||path.minBoundaryMargin<worst.path.minBoundaryMargin))worst={scene,path};
}
fs.writeFileSync(dir+'/finite-path-scenarios.json',JSON.stringify({scope:'Finite wall-free regional attacks; real gravity/lift/16px damage box; dash0.6s,cooldown0.7s; fixed muzzle270; no blanket invincibility, no full wall-overlap or human reaction proof',cases},null,2));
fs.writeFileSync(dir+'/narrow-path-replay.json',JSON.stringify(worst));
console.log(JSON.stringify({cases:cases.length,passed:cases.filter(c=>c.passed).length}));
if(cases.some(c=>!c.passed))process.exitCode=1;
