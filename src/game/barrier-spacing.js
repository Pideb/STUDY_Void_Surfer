import { getBaseSpeed } from './difficulty.js';

const positive = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;

// Bound every score step that can occur before this barrier reaches the player.
// Include a clear award and the fastest boss target, including across mode changes.
export function getBarrierSpeedBound({ progressionScore = 0, unpassedCount = 0, distanceToPlayer = 792,
  minimumScrollSpeed = 180, minimumSpawnInterval = .7, aircraftSpeedMultiplier = 1, aircraftId = 'default' } = {}) {
  const horizon = Math.max(0, Number.isFinite(distanceToPlayer) ? distanceToPlayer : 792)
    / positive(minimumScrollSpeed, 180) + .3;
  const possiblePoints = Math.max(0, Number.isFinite(unpassedCount) ? unpassedCount : 0)
    + Math.ceil(horizon / positive(minimumSpawnInterval, .7)) + 10;
  return getBaseSpeed(Math.max(0, Number.isFinite(progressionScore) ? progressionScore : 0) + possiblePoints, aircraftId)
    * 1.25 * positive(aircraftSpeedMultiplier, 1);
}
