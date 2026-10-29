export function createBossWeapon() {
  return { chargeSeconds: 0, rechargeSeconds: 10, ready: false, firing: null };
}

export function startBossWeapon(weapon, shot) {
  if (!weapon?.ready || weapon.firing || !shot
    || !['fromX', 'fromY', 'toX', 'toY'].every(key => Number.isFinite(shot[key]))) return false;
  weapon.ready = false;
  weapon.chargeSeconds = 0;
  weapon.firing = { ...shot, elapsedSeconds: 0, chargeSeconds: .5, durationSeconds: .7, impacted: false };
  return true;
}

// Contact is tested throughout the active beam, never during charge or recovery
// after expiry. A miss remains eligible later in this same beam, without homing.
export function advanceBossWeapon(weapon, deltaSeconds, hitTest = () => false) {
  if (!weapon || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return false;
  weapon.chargeSeconds = Math.min(weapon.rechargeSeconds, weapon.chargeSeconds + deltaSeconds);
  weapon.ready = weapon.chargeSeconds + 1e-9 >= weapon.rechargeSeconds;
  let impact = false;
  if (weapon.firing) {
    const shot = weapon.firing;
    const previousElapsed = shot.elapsedSeconds;
    shot.elapsedSeconds = Math.min(shot.durationSeconds, shot.elapsedSeconds + deltaSeconds);
    const fromOffset = Math.max(0, shot.chargeSeconds - previousElapsed);
    const toOffset = Math.min(deltaSeconds, shot.durationSeconds - previousElapsed);
    if (!shot.impacted && previousElapsed < shot.durationSeconds && shot.elapsedSeconds + 1e-9 >= shot.chargeSeconds
      && fromOffset <= toOffset + 1e-9 && hitTest({shot,fromOffset,toOffset:Math.max(fromOffset,toOffset)})) {
      shot.impacted = true;
      impact = true;
    }
    if (shot.elapsedSeconds + 1e-9 >= shot.durationSeconds) weapon.firing = null;
  }
  return impact;
}
