export const VISUAL_THEME = Object.freeze({
  background: '#050816',
  backgroundGlow: '#101d47',
  star: '#87d9ff',
  ship: '#ffffff',
  shipAccent: '#55f6e5',
  obstacle: '#55f6e5',
  obstacleAccent: '#b2fff7',
  specialObstacle: '#b873ff',
  specialAccent: '#ff9d5c',
  dashTrail: '#55f6e5',
  dashBurst: '#55f6e5',
  dash: Object.freeze({
    trail: '#55f6e5',
    lineWidth: 1.5,
    maxTrailLengthMultiplier: 1.2,
    lines: Object.freeze([
      Object.freeze({ verticalOffset: -0.28, lengthMultiplier: 0.58, alpha: 0.42 }),
      Object.freeze({ verticalOffset: -0.1, lengthMultiplier: 0.9, alpha: 0.66 }),
      Object.freeze({ verticalOffset: 0.14, lengthMultiplier: 1, alpha: 0.58 }),
      Object.freeze({ verticalOffset: 0.32, lengthMultiplier: 0.72, alpha: 0.38 }),
    ]),
    outline: '#55f6e5',
    core: '#b2fff7',
  }),
  timingGuide: '#55f6e5',
  warning: '#ff496f',
  bossOverlay: '#000000',
  breakFragment: '#d9a8ff',
  breakOpeningHalfHeight: 28,
  boss: '#ff9d5c',
  text: '#e8fbff',
  mutedText: '#8ba6bf',
  shipGlow: 18,
  obstacleGlow: 16,
});

export const STAR_FIELD = Object.freeze([
  [72, 82, 1.4],
  [164, 418, 1],
  [302, 126, 1.2],
  [438, 468, 1.5],
  [592, 72, 1],
  [710, 382, 1.2],
  [846, 128, 1.4],
  [904, 460, 0.9],
]);

export const AIRCRAFT_VISUALS = Object.freeze({
  default: Object.freeze({ fill: '#e7fdff', outline: '#55f6e5', accent: '#b2fff7', shape: 'balanced' }),
  velocity: Object.freeze({ fill: '#f6eaff', outline: '#55e9ff', accent: '#ff55cf', shape: 'slim' }),
  aegis: Object.freeze({ fill: '#fff0cf', outline: '#ffc45c', accent: '#fff4ac', shape: 'armored' }),
});

export const STAGE_VISUAL_THEMES = Object.freeze({
  'crystal-gates': Object.freeze({
    background: '#08132d', bossBackground: '#05091b', backgroundGlow: '#173763', star: '#a9dbff', primary: '#8bd7ff', accent: '#b78cff',
    obstacle: '#72bbeb', obstacleAccent: '#d4efff', specialObstacle: '#b78cff', specialAccent: '#eddbff',
    boss: '#b5ddff', projectile: '#a9d8ff', laser: '#c0bcff', bossOverlay: '#030614', particleStyle: 'crystal',
    obstacleStyle: 'crystal', specialObstacleStyle: 'crystal-blade', bossStyle: 'crystal-guardian',
    projectileStyle: 'crystal-shard', laserStyle: 'prism-beam',
  }),
  'industrial-void': Object.freeze({
    background: '#111318', bossBackground: '#090909', backgroundGlow: '#36241e', star: '#e1a76a', primary: '#ffad58', accent: '#ff6f43',
    obstacle: '#626a75', obstacleAccent: '#ffba6a', specialObstacle: '#ff8a45', specialAccent: '#ffe0a8',
    boss: '#ff9a4f', projectile: '#ffc06a', laser: '#ff8a42', bossOverlay: '#050505', particleStyle: 'industrial',
    obstacleStyle: 'industrial', specialObstacleStyle: 'industrial-blade', bossStyle: 'orbital-factory',
    projectileStyle: 'industrial-bolt', laserStyle: 'scan-beam',
  }),
  'signal-monoliths': Object.freeze({
    background: '#100b2d', bossBackground: '#080619', backgroundGlow: '#281b5b', star: '#c29dff', primary: '#df70ff', accent: '#5c9dff',
    obstacle: '#564c83', obstacleAccent: '#aa8cff', specialObstacle: '#d35dff', specialAccent: '#75d7ff',
    boss: '#d36bff', projectile: '#75aaff', laser: '#dc67ff', bossOverlay: '#050311', particleStyle: 'signal',
    obstacleStyle: 'monolith', specialObstacleStyle: 'monolith-blade', bossStyle: 'signal-sentinel',
    projectileStyle: 'signal-pulse', laserStyle: 'wave-beam',
  }),
  'gravity-well': Object.freeze({
    background: '#0b071b', bossBackground: '#05030d', backgroundGlow: '#28154c', star: '#c1a6ff', primary: '#b992ff', accent: '#714dff',
    obstacle: '#4e416e', obstacleAccent: '#a98bff', specialObstacle: '#8a63e8', specialAccent: '#d5beff',
    boss: '#b892ff', projectile: '#be9bff', laser: '#a884ff', bossOverlay: '#03020a', particleStyle: 'gravity',
    obstacleStyle: 'gravity', specialObstacleStyle: 'gravity-blade', bossStyle: 'gravity-crescent',
    projectileStyle: 'gravity-orb', laserStyle: 'lensing-beam',
  }),
  'abyssal-beast': Object.freeze({
    background: '#041c25', bossBackground: '#010d12', backgroundGlow: '#073a46', star: '#71d7d8', primary: '#62f1ee', accent: '#1aa7bd',
    obstacle: '#246773', obstacleAccent: '#72e6e6', specialObstacle: '#197e8c', specialAccent: '#9af7ef',
    boss: '#52d8dc', projectile: '#78f5ed', laser: '#63e7e2', bossOverlay: '#010b0e', particleStyle: 'abyssal',
    obstacleStyle: 'abyssal', specialObstacleStyle: 'abyssal-tendril', bossStyle: 'abyssal-leviathan',
    projectileStyle: 'abyssal-organic', laserStyle: 'ripple-beam',
  }),
  'solar-forge': Object.freeze({
    background: '#241006', bossBackground: '#100601', backgroundGlow: '#54200b', star: '#ffb76b', primary: '#ffb24f', accent: '#ff643c',
    obstacle: '#54301f', obstacleAccent: '#ffac4c', specialObstacle: '#aa4c21', specialAccent: '#ffd073',
    boss: '#ff9e3d', projectile: '#ffb342', laser: '#ff8a35', bossOverlay: '#100601', particleStyle: 'solar',
    obstacleStyle: 'solar', specialObstacleStyle: 'solar-blade', bossStyle: 'solar-machine',
    projectileStyle: 'solar-ember', laserStyle: 'heat-beam',
  }),
});

export function getStageVisualTheme(stageId) {
  return STAGE_VISUAL_THEMES[stageId] ?? STAGE_VISUAL_THEMES['crystal-gates'];
}
