export function createBossWeapon() {
  return { chargeSeconds: 0, rechargeSeconds: 10, ready: false, firing: null };
}

export function startBossWeapon(weapon, shot) {
  if (!weapon?.ready || weapon.firing || !shot
    || !['fromX', 'fromY', 'toX', 'toY'].every(key => Number.isFinite(shot[key]))) return false;
  weapon.ready = false;
  weapon.chargeSeconds = 0;
  weapon.firing = { ...shot, elapsedSeconds: 0, chargeSeconds: .2, durationSeconds: .3, impacted: false };
  return true;
}

// Return a one-time impact event; the caller owns boss damage and effects.
export function advanceBossWeapon(weapon, deltaSeconds) {
  if (!weapon || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return false;
  weapon.chargeSeconds = Math.min(weapon.rechargeSeconds, weapon.chargeSeconds + deltaSeconds);
  weapon.ready = weapon.chargeSeconds + 1e-9 >= weapon.rechargeSeconds;
  let impact = false;
  if (weapon.firing) {
    const shot = weapon.firing;
    shot.elapsedSeconds = Math.min(shot.durationSeconds, shot.elapsedSeconds + deltaSeconds);
    if (!shot.impacted && shot.elapsedSeconds + 1e-9 >= shot.chargeSeconds) {
      shot.impacted = true;
      impact = true;
    }
    if (shot.elapsedSeconds + 1e-9 >= shot.durationSeconds) weapon.firing = null;
  }
  return impact;
}
