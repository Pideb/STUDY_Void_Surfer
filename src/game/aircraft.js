import {
  AEGIS_GRAVITY_MULTIPLIER,
  AEGIS_LIFT_MULTIPLIER,
  AIRCRAFT_AEGIS_UNLOCK_SCORE,
  AIRCRAFT_DEFAULT_UNLOCK_SCORE,
  AIRCRAFT_VELOCITY_UNLOCK_SCORE,
  VELOCITY_MOVEMENT_MULTIPLIER,
  VELOCITY_SCORE_MULTIPLIER,
  VELOCITY_SPAWN_INTERVAL_MULTIPLIER,
  SPEED_CAP_SCORE,
  VELOCITY_SPEED_CAP_SCORE,
} from './constants.js';

export const AIRCRAFT_IDS = Object.freeze({
  DEFAULT: 'default',
  VELOCITY: 'velocity',
  AEGIS: 'aegis',
});

const definitions = [
  {
    id: AIRCRAFT_IDS.DEFAULT,
    name: 'NOVA',
    unlockBestScore: AIRCRAFT_DEFAULT_UNLOCK_SCORE,
    scoreMultiplier: 1,
    scrollSpeedMultiplier: 1,
    spawnIntervalMultiplier: 1,
    gravityMultiplier: 1,
    liftMultiplier: 1,
    visualKey: 'default',
  },
  {
    id: AIRCRAFT_IDS.AEGIS,
    name: 'AEGIS',
    unlockBestScore: AIRCRAFT_AEGIS_UNLOCK_SCORE,
    scoreMultiplier: 1,
    scrollSpeedMultiplier: 1,
    spawnIntervalMultiplier: 1,
    gravityMultiplier: AEGIS_GRAVITY_MULTIPLIER,
    liftMultiplier: AEGIS_LIFT_MULTIPLIER,
    visualKey: 'aegis',
  },
  {
    id: AIRCRAFT_IDS.VELOCITY,
    name: 'VELOCITY',
    unlockBestScore: AIRCRAFT_VELOCITY_UNLOCK_SCORE,
    scoreMultiplier: VELOCITY_SCORE_MULTIPLIER,
    scrollSpeedMultiplier: VELOCITY_MOVEMENT_MULTIPLIER,
    spawnIntervalMultiplier: VELOCITY_SPAWN_INTERVAL_MULTIPLIER,
    gravityMultiplier: 1,
    liftMultiplier: 1,
    visualKey: 'velocity',
  },
].map((definition) => Object.freeze({
  ...definition,
  speedCapScore: definition.id === AIRCRAFT_IDS.VELOCITY ? VELOCITY_SPEED_CAP_SCORE : SPEED_CAP_SCORE,
  bossLaserDamage: definition.id === AIRCRAFT_IDS.AEGIS ? 3 : 1,
}));

export const AIRCRAFT_CATALOG = Object.freeze(definitions);

function normalizeScore(bestScore) {
  const numeric = Number(bestScore);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
}

export function getAircraftDefinition(id) {
  return AIRCRAFT_CATALOG.find((definition) => definition.id === id) ?? AIRCRAFT_CATALOG[0];
}

export function getUnlockedAircraftIds(bestScore = 0) {
  const normalizedScore = normalizeScore(bestScore);
  return AIRCRAFT_CATALOG
    .filter((definition) => definition.unlockBestScore <= normalizedScore)
    .map((definition) => definition.id);
}

export function isAircraftUnlocked(id, bestScore = 0) {
  return getUnlockedAircraftIds(bestScore).includes(getAircraftDefinition(id).id)
    && getAircraftDefinition(id).id === id;
}
