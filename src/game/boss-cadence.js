export function createBossCadence(target=20,cycleId=1) {
  return {target:target===15?15:20,cycleId:Number.isInteger(cycleId)&&cycleId>0?cycleId:1,phase:'normal',spawnedIds:new Set(),passedIds:new Set()};
}
export const canSpawnNormalWall = c => c.phase==='normal' && c.spawnedIds.size<c.target;
export function recordNormalWallSpawn(c,id) {
  if(!canSpawnNormalWall(c)||c.spawnedIds.has(id))return false;c.spawnedIds.add(id);return true;
}
export function recordNormalWallPass(c,id) {
  if(c.phase!=='normal'||!c.spawnedIds.has(id)||c.passedIds.has(id))return false;
  c.passedIds.add(id);if(c.passedIds.size===c.target){c.phase='draining';return true;}return false;
}
