export const STAGE_IDS = Object.freeze({
  CRYSTAL_GATES: 'crystal-gates',
  INDUSTRIAL_VOID: 'industrial-void',
  SIGNAL_MONOLITHS: 'signal-monoliths',
  GRAVITY_WELL: 'gravity-well',
  ABYSSAL_BEAST: 'abyssal-beast',
  SOLAR_FORGE: 'solar-forge',
});

const definitions = [
  {
    id: STAGE_IDS.CRYSTAL_GATES,
    name: 'CRYSTAL GATES',
    backgroundKey: 'crystal-gates',
    bossBackgroundKey: 'crystal-gates-boss',
    obstacleStyle: 'crystal',
    specialObstacleStyle: 'crystal-blade',
    bossStyle: 'crystal-guardian',
    projectileStyle: 'crystal-shard',
    laserStyle: 'prism-beam',
    palette: { background: '#08132d', primary: '#8bd7ff', accent: '#b78cff', warning: '#ff496f' },
  },
  {
    id: STAGE_IDS.INDUSTRIAL_VOID,
    name: 'INDUSTRIAL VOID',
    backgroundKey: 'industrial-void',
    bossBackgroundKey: 'industrial-void-boss',
    obstacleStyle: 'industrial',
    specialObstacleStyle: 'industrial-blade',
    bossStyle: 'orbital-factory',
    projectileStyle: 'industrial-bolt',
    laserStyle: 'scan-beam',
    palette: { background: '#171313', primary: '#ffad58', accent: '#ff6f43', warning: '#ff496f' },
  },
  {
    id: STAGE_IDS.SIGNAL_MONOLITHS,
    name: 'SIGNAL MONOLITHS',
    backgroundKey: 'signal-monoliths',
    bossBackgroundKey: 'signal-monoliths-boss',
    obstacleStyle: 'monolith',
    specialObstacleStyle: 'monolith-blade',
    bossStyle: 'signal-sentinel',
    projectileStyle: 'signal-pulse',
    laserStyle: 'wave-beam',
    palette: { background: '#100b2d', primary: '#df70ff', accent: '#5c9dff', warning: '#ff496f' },
  },
  {
    id: STAGE_IDS.GRAVITY_WELL,
    name: 'GRAVITY WELL',
    backgroundKey: 'gravity-well',
    bossBackgroundKey: 'gravity-well-boss',
    obstacleStyle: 'gravity',
    specialObstacleStyle: 'gravity-blade',
    bossStyle: 'gravity-crescent',
    projectileStyle: 'gravity-orb',
    laserStyle: 'lensing-beam',
    palette: { background: '#0b071b', primary: '#b992ff', accent: '#714dff', warning: '#ff496f' },
  },
  {
    id: STAGE_IDS.ABYSSAL_BEAST,
    name: 'ABYSSAL BEAST',
    backgroundKey: 'abyssal-beast',
    bossBackgroundKey: 'abyssal-beast-boss',
    obstacleStyle: 'abyssal',
    specialObstacleStyle: 'abyssal-tendril',
    bossStyle: 'abyssal-leviathan',
    projectileStyle: 'abyssal-organic',
    laserStyle: 'ripple-beam',
    palette: { background: '#041c25', primary: '#62f1ee', accent: '#1aa7bd', warning: '#ff496f' },
  },
  {
    id: STAGE_IDS.SOLAR_FORGE,
    name: 'SOLAR FORGE',
    backgroundKey: 'solar-forge',
    bossBackgroundKey: 'solar-forge-boss',
    obstacleStyle: 'solar',
    specialObstacleStyle: 'solar-blade',
    bossStyle: 'solar-machine',
    projectileStyle: 'solar-ember',
    laserStyle: 'heat-beam',
    palette: { background: '#241006', primary: '#ffb24f', accent: '#ff643c', warning: '#ff496f' },
  },
].map((definition) => Object.freeze({
  ...definition,
  palette: Object.freeze(definition.palette),
}));

export const STAGE_CATALOG = Object.freeze(definitions);

function roll(rng) {
  return Math.min(0.999999, Math.max(0, Number(rng?.()) || 0));
}

export function getStageDefinition(id) {
  return STAGE_CATALOG.find((definition) => definition.id === id) ?? STAGE_CATALOG[0];
}

export function createStageShuffleBag(rng = Math.random, previousStageId = null) {
  const bag = [...STAGE_CATALOG].map(({ id }) => id);
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(roll(rng) * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
  }

  if (bag.length > 1 && bag[0] === previousStageId) {
    [bag[0], bag[1]] = [bag[1], bag[0]];
  }

  return bag;
}
