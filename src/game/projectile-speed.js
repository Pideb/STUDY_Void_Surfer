export function sampleProjectileSpeed(actualScrollSpeed = 240, rng = Math.random) {
  const speed = Number.isFinite(actualScrollSpeed) ? actualScrollSpeed : 240;
  const sample = typeof rng === 'function' ? Number(rng()) : .5;
  const base = 220 + Math.max(0, Math.min(1, Number.isFinite(sample) ? sample : .5)) * 140;
  return Math.max(80, Math.min(800, base + (speed - 240) * .35));
}
