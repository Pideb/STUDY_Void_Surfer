// Normalized core/muzzle locations from the approved articulated boss review.
const LOCATIONS = Object.freeze({
  'crystal-gates': { core: [.385, .485], muzzle: [.06, .48] },
  'industrial-void': { core: [.61, .51], muzzle: [.035, .51] },
  'signal-monoliths': { core: [.12, .5], muzzle: [.04, .5] },
  'gravity-well': { core: [.43, .5], muzzle: [.24, .5] },
  'abyssal-beast': { core: [.115, .43], muzzle: [.065, .43] },
  'solar-forge': { core: [.64, .5], muzzle: [.08, .5] },
});

export function getBossGeometry(stageId, entranceProgress = 1) {
  const p = Math.max(0, Math.min(1, Number(entranceProgress) || 0));
  const eased = p * p * (3 - 2 * p);
  const centerX = 1160 + (842 - 1160) * eased;
  const box = { x: centerX - 96, y: 206, w: 192, h: 128 };
  const positions = LOCATIONS[stageId] ?? LOCATIONS['crystal-gates'];
  const point = ([x, y]) => ({ x: box.x + x * box.w, y: box.y + y * box.h });
  return { box, center: { x: centerX, y: 270 }, core: point(positions.core), muzzle: point(positions.muzzle) };
}
