// Legacy high-score scenarios explicitly seed completed wall cadence here.
// Production code never uses score to select a boss encounter.
import {createGameEngine as createEngine} from '../../src/game/game-engine.js';
export {constrainGapCenter} from '../../src/game/game-engine.js';
export function readyBossCadence(target=20,cycleId=1){const ids=Array.from({length:target},(_,i)=>`fixture-${cycleId}-${i}`);return{target,cycleId,spawnedIds:ids,passedIds:[...ids]};}
export function createGameEngine(options={}) {
  const seed=!Object.hasOwn(options,'initialBossCadence')&&(options.initialScore??0)>=(options.initialNextBossScore??(20+(options.initialClearedBossCount??Math.floor((options.initialCompletedWarningCount??0)/2))*20));
  return createEngine({...options,...(seed?{initialBossCadence:readyBossCadence()}:{} )});
}
