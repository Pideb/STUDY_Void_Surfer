// src/game/constants.js
var WORLD_WIDTH = 960;
var WORLD_HEIGHT = 540;
var PLAYER_START_Y = WORLD_HEIGHT / 2;
var PLAYER_HITBOX_SIZE = 16;
var PLAYER_SUCCESS_WIDTH = 56;
var PLAYER_SUCCESS_HEIGHT = 36;
var OBSTACLE_WIDTH = 72;
var SPECIAL_OBSTACLE_WIDTH = 24;
var OBSTACLE_SPAWN_X = WORLD_WIDTH + OBSTACLE_WIDTH;
var DASH_DURATION_SECONDS = 0.6;
var DASH_COOLDOWN_SECONDS = 0.7;
var BOSS_PATTERNS = Object.freeze({
  SLOW: "slow",
  FAST: "fast",
  SHIFT: "shift"
});
var BOSS_LASER_SWEEP_SECONDS = 0.4;
var BOSS_LASER_FADE_SECONDS = 0.15;

// src/game/visual-theme.js
var VISUAL_THEME = Object.freeze({
  background: "#050816",
  backgroundGlow: "#101d47",
  star: "#87d9ff",
  ship: "#ffffff",
  shipAccent: "#55f6e5",
  obstacle: "#55f6e5",
  obstacleAccent: "#b2fff7",
  specialObstacle: "#b873ff",
  specialAccent: "#ff9d5c",
  dashTrail: "#55f6e5",
  dashBurst: "#55f6e5",
  dash: Object.freeze({
    trail: "#55f6e5",
    lineWidth: 1.5,
    maxTrailLengthMultiplier: 1.2,
    lines: Object.freeze([
      Object.freeze({ verticalOffset: -0.28, lengthMultiplier: 0.58, alpha: 0.42 }),
      Object.freeze({ verticalOffset: -0.1, lengthMultiplier: 0.9, alpha: 0.66 }),
      Object.freeze({ verticalOffset: 0.14, lengthMultiplier: 1, alpha: 0.58 }),
      Object.freeze({ verticalOffset: 0.32, lengthMultiplier: 0.72, alpha: 0.38 })
    ]),
    outline: "#55f6e5",
    core: "#b2fff7"
  }),
  timingGuide: "#55f6e5",
  warning: "#ff496f",
  bossOverlay: "#000000",
  breakFragment: "#efffff",
  breakRing: "#7cfff2",
  breakOpeningHalfHeight: 28,
  boss: "#ff9d5c",
  text: "#e8fbff",
  mutedText: "#8ba6bf",
  shipGlow: 18,
  obstacleGlow: 16
});
var STAR_FIELD = Object.freeze([
  [72, 82, 1.4],
  [164, 418, 1],
  [302, 126, 1.2],
  [438, 468, 1.5],
  [592, 72, 1],
  [710, 382, 1.2],
  [846, 128, 1.4],
  [904, 460, 0.9]
]);
var AIRCRAFT_VISUALS = Object.freeze({
  default: Object.freeze({ fill: "#e7fdff", outline: "#55f6e5", accent: "#b2fff7", shape: "balanced" }),
  velocity: Object.freeze({ fill: "#f6eaff", outline: "#55e9ff", accent: "#ff55cf", shape: "slim" }),
  aegis: Object.freeze({ fill: "#fff0cf", outline: "#ffc45c", accent: "#fff4ac", shape: "armored" })
});
var STAGE_VISUAL_THEMES = Object.freeze({
  "crystal-gates": Object.freeze({
    background: "#08132d",
    bossBackground: "#05091b",
    backgroundGlow: "#173763",
    star: "#a9dbff",
    primary: "#8bd7ff",
    accent: "#b78cff",
    obstacle: "#72bbeb",
    obstacleAccent: "#d4efff",
    specialObstacle: "#b78cff",
    specialAccent: "#eddbff",
    boss: "#b5ddff",
    projectile: "#a9d8ff",
    laser: "#c0bcff",
    bossOverlay: "#030614",
    particleStyle: "crystal",
    obstacleStyle: "crystal",
    specialObstacleStyle: "crystal-blade",
    bossStyle: "crystal-guardian",
    projectileStyle: "crystal-shard",
    laserStyle: "prism-beam"
  }),
  "industrial-void": Object.freeze({
    background: "#111318",
    bossBackground: "#090909",
    backgroundGlow: "#36241e",
    star: "#e1a76a",
    primary: "#ffad58",
    accent: "#ff6f43",
    obstacle: "#626a75",
    obstacleAccent: "#ffba6a",
    specialObstacle: "#ff8a45",
    specialAccent: "#ffe0a8",
    boss: "#ff9a4f",
    projectile: "#ffc06a",
    laser: "#ff8a42",
    bossOverlay: "#050505",
    particleStyle: "industrial",
    obstacleStyle: "industrial",
    specialObstacleStyle: "industrial-blade",
    bossStyle: "orbital-factory",
    projectileStyle: "industrial-bolt",
    laserStyle: "scan-beam"
  }),
  "signal-monoliths": Object.freeze({
    background: "#100b2d",
    bossBackground: "#080619",
    backgroundGlow: "#281b5b",
    star: "#c29dff",
    primary: "#df70ff",
    accent: "#5c9dff",
    obstacle: "#564c83",
    obstacleAccent: "#aa8cff",
    specialObstacle: "#d35dff",
    specialAccent: "#75d7ff",
    boss: "#d36bff",
    projectile: "#75aaff",
    laser: "#dc67ff",
    bossOverlay: "#050311",
    particleStyle: "signal",
    obstacleStyle: "monolith",
    specialObstacleStyle: "monolith-blade",
    bossStyle: "signal-sentinel",
    projectileStyle: "signal-pulse",
    laserStyle: "wave-beam"
  }),
  "gravity-well": Object.freeze({
    background: "#0b071b",
    bossBackground: "#05030d",
    backgroundGlow: "#28154c",
    star: "#c1a6ff",
    primary: "#b992ff",
    accent: "#714dff",
    obstacle: "#4e416e",
    obstacleAccent: "#a98bff",
    specialObstacle: "#8a63e8",
    specialAccent: "#d5beff",
    boss: "#b892ff",
    projectile: "#be9bff",
    laser: "#a884ff",
    bossOverlay: "#03020a",
    particleStyle: "gravity",
    obstacleStyle: "gravity",
    specialObstacleStyle: "gravity-blade",
    bossStyle: "gravity-crescent",
    projectileStyle: "gravity-orb",
    laserStyle: "lensing-beam"
  }),
  "abyssal-beast": Object.freeze({
    background: "#041c25",
    bossBackground: "#010d12",
    backgroundGlow: "#073a46",
    star: "#71d7d8",
    primary: "#62f1ee",
    accent: "#1aa7bd",
    obstacle: "#246773",
    obstacleAccent: "#72e6e6",
    specialObstacle: "#197e8c",
    specialAccent: "#9af7ef",
    boss: "#52d8dc",
    projectile: "#78f5ed",
    laser: "#63e7e2",
    bossOverlay: "#010b0e",
    particleStyle: "abyssal",
    obstacleStyle: "abyssal",
    specialObstacleStyle: "abyssal-tendril",
    bossStyle: "abyssal-leviathan",
    projectileStyle: "abyssal-organic",
    laserStyle: "ripple-beam"
  }),
  "solar-forge": Object.freeze({
    background: "#241006",
    bossBackground: "#100601",
    backgroundGlow: "#54200b",
    star: "#ffb76b",
    primary: "#ffb24f",
    accent: "#ff643c",
    obstacle: "#54301f",
    obstacleAccent: "#ffac4c",
    specialObstacle: "#aa4c21",
    specialAccent: "#ffd073",
    boss: "#ff9e3d",
    projectile: "#ffb342",
    laser: "#ff8a35",
    bossOverlay: "#100601",
    particleStyle: "solar",
    obstacleStyle: "solar",
    specialObstacleStyle: "solar-blade",
    bossStyle: "solar-machine",
    projectileStyle: "solar-ember",
    laserStyle: "heat-beam"
  })
});
function getStageVisualTheme(stageId) {
  return STAGE_VISUAL_THEMES[stageId] ?? STAGE_VISUAL_THEMES["crystal-gates"];
}

// src/game/obstacles.js
function getDashBarrierBounds(obstacle) {
  const width = obstacle.kind === "hybrid" ? SPECIAL_OBSTACLE_WIDTH : obstacle.width;
  return { x: obstacle.x + (obstacle.width - width) / 2, width };
}

// src/game/player-geometry.js
function centeredBounds(player, width, height) {
  if (!Number.isFinite(player?.x) || !Number.isFinite(player?.y)) return null;
  return {
    left: player.x - width / 2,
    right: player.x + width / 2,
    top: player.y - height / 2,
    bottom: player.y + height / 2
  };
}
function getPlayerBounds(player) {
  return centeredBounds(player, PLAYER_HITBOX_SIZE, PLAYER_HITBOX_SIZE);
}
function getSpecialSuccessBounds(player) {
  return centeredBounds(player, PLAYER_SUCCESS_WIDTH, PLAYER_SUCCESS_HEIGHT);
}

// src/game/boss-attacks.js
function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
function getLaserFrontX(laser, worldWidth = WORLD_WIDTH) {
  if (laser.telegraphRemainingSeconds > 0) return worldWidth;
  if (!Number.isFinite(laser.activeElapsedSeconds)) return 0;
  return worldWidth * (1 - clamp(laser.activeElapsedSeconds / BOSS_LASER_SWEEP_SECONDS, 0, 1));
}

// src/game/laser-renderer.js
var cyan = "#59e8ff";
var white = "#f7ffff";
function charge(ctx, y, radius, strength) {
  ctx.save();
  const glow3 = ctx.createRadialGradient(WORLD_WIDTH - 8, y, 0, WORLD_WIDTH - 8, y, radius);
  glow3.addColorStop(0, `rgba(245,255,255,${strength})`);
  glow3.addColorStop(0.28, `rgba(89,232,255,${strength * 0.7})`);
  glow3.addColorStop(1, "rgba(40,154,255,0)");
  ctx.fillStyle = glow3;
  ctx.fillRect(WORLD_WIDTH - radius - 8, y - radius, radius * 2, radius * 2);
  ctx.restore();
}
function beam(ctx, y, height, front, time, opacity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  const broad = height > 30;
  const tip = front > 0 ? front : -height * 2;
  const shimmer = 0.96 + Math.sin(time * 9 + y * 0.03) * 0.04;
  function ray(centerY, width, color, alpha, blur = 0, offset = 0) {
    ctx.save();
    ctx.globalAlpha = opacity * alpha * shimmer;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.filter = blur > 0 ? `blur(${blur}px)` : "none";
    ctx.beginPath();
    ctx.moveTo(WORLD_WIDTH + height * 2, centerY);
    ctx.lineTo(tip + width / 2 + offset, centerY);
    ctx.stroke();
    ctx.restore();
  }
  ray(y, height * 1.45, "#227eff", 0.08, broad ? 20 : 12);
  ray(y, height, "#36caff", 0.17, broad ? 13 : 7);
  ray(y, height * 0.6, cyan, 0.28, broad ? 9 : 4);
  ray(y, height * 0.29, "#a5faff", 0.58, broad ? 6 : 2);
  ray(y, Math.max(2, height * 0.1), white, 0.92, broad ? 3 : 0);
  const filaments = broad ? 11 : 5;
  for (let index = 0; index < filaments; index += 1) {
    const fraction = (index / (filaments - 1) - 0.5) * 2;
    const lineY = y + fraction * height * 0.36 + Math.sin(time * 5 + index * 1.9) * height * 0.018;
    const alpha = 0.12 + (1 - Math.abs(fraction)) * 0.35;
    ray(
      lineY,
      broad ? 1.5 + index % 3 : 0.9,
      "#d2ffff",
      alpha,
      2,
      Math.abs(fraction) * height * 0.23
    );
  }
  ctx.shadowColor = cyan;
  ctx.shadowBlur = 8;
  ctx.filter = "none";
  for (let index = 0; index < (broad ? 22 : 10); index += 1) {
    const x = ((index * 103 - time * 980) % (WORLD_WIDTH + 180) + WORLD_WIDTH + 180) % (WORLD_WIDTH + 180) - 90;
    if (x < front + 20 || x > WORLD_WIDTH) continue;
    const offsetY = Math.sin(index * 2.4) * height * 0.39;
    const length = 16 + index % 5 * 9;
    const highlight = ctx.createLinearGradient(x, 0, x + length, 0);
    highlight.addColorStop(0, "rgba(221,255,255,0)");
    highlight.addColorStop(0.65, "rgba(221,255,255,0.55)");
    highlight.addColorStop(1, "rgba(221,255,255,0)");
    ctx.strokeStyle = highlight;
    ctx.globalAlpha = opacity * 0.6;
    ctx.lineWidth = 1 + index % 2;
    ctx.beginPath();
    ctx.moveTo(x, y + offsetY);
    ctx.lineTo(x + length, y + offsetY);
    ctx.stroke();
  }
  if (front > 0) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowBlur = 0;
    ctx.translate(front + height * 0.18, y);
    ctx.scale(broad ? 0.55 : 1, 1);
    const radius = Math.max(18, height * 0.58);
    const flare = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    flare.addColorStop(0, "rgba(247,255,255,0.95)");
    flare.addColorStop(0.2, "rgba(162,249,255,0.65)");
    flare.addColorStop(0.55, "rgba(52,202,255,0.2)");
    flare.addColorStop(1, "rgba(52,202,255,0)");
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
function safeLane(ctx, zone, time, warning) {
  const top = zone * WORLD_HEIGHT / 4, height = WORLD_HEIGHT / 4;
  ctx.save();
  ctx.fillStyle = warning ? "rgba(69,242,211,0.14)" : "rgba(5,30,36,0.22)";
  ctx.fillRect(0, top, WORLD_WIDTH, height);
  ctx.strokeStyle = "#7effd7";
  ctx.lineWidth = warning ? 3 : 2;
  ctx.shadowColor = "#7effd7";
  ctx.shadowBlur = warning ? 9 : 3;
  ctx.beginPath();
  ctx.moveTo(0, top + 3);
  ctx.lineTo(WORLD_WIDTH, top + 3);
  ctx.moveTo(0, top + height - 3);
  ctx.lineTo(WORLD_WIDTH, top + height - 3);
  ctx.stroke();
  ctx.fillStyle = "#7effd7";
  for (const x of [28, WORLD_WIDTH - 28]) {
    const direction = x < WORLD_WIDTH / 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x + direction * 10, top + height / 2);
    ctx.lineTo(x - direction * 5, top + height / 2 - 10);
    ctx.lineTo(x - direction * 5, top + height / 2 + 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
function dangerLanes(ctx, safeZone, zoneHeight, warning, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;
  for (let zone = 0; zone < 4; zone++) {
    if (zone === safeZone) continue;
    const top = zone * zoneHeight;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, WORLD_WIDTH, zoneHeight);
    ctx.clip();
    ctx.fillStyle = warning ? "rgba(255,54,83,.11)" : "rgba(255,54,83,.06)";
    ctx.fillRect(0, top, WORLD_WIDTH, zoneHeight);
    ctx.strokeStyle = warning ? "rgba(255,102,118,.32)" : "rgba(255,102,118,.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -zoneHeight; x < WORLD_WIDTH + zoneHeight; x += 38) {
      ctx.moveTo(x, top + zoneHeight);
      ctx.lineTo(x + zoneHeight, top);
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
function drawLaser(ctx, attack) {
  if (!attack || attack.type !== "laser") return;
  if (attack.kind === "single" && attack.ys?.length > 1) {
    for (const y of attack.ys) drawLaser(ctx, { ...attack, y, ys: void 0 });
    return;
  }
  const warning = attack.telegraphRemainingSeconds > 0;
  const fading = attack.activeRemainingSeconds <= 0;
  const opacity = fading ? Math.max(0, (attack.fadeRemainingSeconds ?? 0) / BOSS_LASER_FADE_SECONDS) : 1;
  if (!warning && opacity <= 0) return;
  const time = attack.elapsedSeconds ?? 0;
  const front = getLaserFrontX(attack);
  const warningProgress = 1 - attack.telegraphRemainingSeconds / (attack.telegraphDurationSeconds || 1);
  ctx.save();
  if (attack.kind === "single") {
    if (warning) {
      ctx.strokeStyle = "#8defff";
      ctx.globalAlpha = 0.65;
      ctx.setLineDash([12, 12]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, attack.y);
      ctx.lineTo(WORLD_WIDTH, attack.y);
      ctx.stroke();
      ctx.setLineDash([]);
      charge(ctx, attack.y, 24 + 17 * warningProgress, 0.5 + 0.4 * warningProgress);
    } else {
      beam(ctx, attack.y, attack.thickness ?? 18, front, time, opacity);
      charge(ctx, attack.y, 48, opacity);
    }
  } else if (attack.kind === "quarter") {
    const zoneHeight = attack.zoneHeight ?? WORLD_HEIGHT / 4;
    dangerLanes(ctx, attack.safeZone, zoneHeight, warning, warning ? 1 : opacity);
    if (warning) {
      for (let zone = 0; zone < 4; zone += 1) {
        if (zone === attack.safeZone) continue;
        ctx.save();
        ctx.strokeStyle = "rgba(99,226,255,0.25)";
        ctx.setLineDash([14, 16]);
        ctx.lineWidth = 1;
        for (const fraction of [0.2, 0.5, 0.8]) {
          const y = (zone + fraction) * zoneHeight;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(WORLD_WIDTH, y);
          ctx.stroke();
        }
        ctx.restore();
        charge(ctx, (zone + 0.5) * zoneHeight, 28, 0.3 + warningProgress * 0.44);
      }
    } else {
      ctx.save();
      ctx.beginPath();
      if (attack.safeZone > 0) ctx.rect(0, 0, WORLD_WIDTH, attack.safeZone * zoneHeight);
      if (attack.safeZone < 3) {
        const safeBottom = (attack.safeZone + 1) * zoneHeight;
        ctx.rect(0, safeBottom, WORLD_WIDTH, WORLD_HEIGHT - safeBottom);
      }
      ctx.clip();
      for (let zone = 0; zone < 4; zone += 1) {
        if (zone === attack.safeZone) continue;
        beam(ctx, (zone + 0.5) * zoneHeight, zoneHeight - 8, front, time, opacity);
        charge(ctx, (zone + 0.5) * zoneHeight, 60, opacity);
      }
      ctx.restore();
    }
    safeLane(ctx, attack.safeZone, time, warning);
  }
  ctx.restore();
}

// src/game/visual-assets.js
var VISUAL_ASSET_MANIFEST = Object.freeze({
  menuBackground: "/assets/game/menu/space-background.png",
  menuTitle: "/assets/game/menu/void-surfer-wordmark.png",
  aircraft: Object.freeze({
    default: "/assets/game/aircraft/default.png",
    velocity: "/assets/game/aircraft/velocity.png",
    aegis: "/assets/game/aircraft/aegis.png"
  }),
  stages: Object.freeze({
    "crystal-gates": Object.freeze({
      background: "/assets/game/stages/crystal-gates/background.png",
      bossBackground: "/assets/game/stages/crystal-gates/boss-background.png",
      normalWall: "/assets/game/stages/crystal-gates/normal-wall.png",
      specialWall: "/assets/game/stages/crystal-gates/special-wall.png",
      boss: "/assets/game/stages/crystal-gates/boss-evolved.png",
      projectile: "/assets/game/stages/crystal-gates/projectile.png",
      laser: "/assets/game/stages/crystal-gates/laser.png",
      portalOrnaments: "/assets/game/stages/crystal-gates/portal-ornaments.png"
    }),
    "industrial-void": Object.freeze({
      background: "/assets/game/stages/industrial-void/background.png",
      bossBackground: "/assets/game/stages/industrial-void/boss-background.png",
      normalWall: "/assets/game/stages/industrial-void/normal-wall.png",
      specialWall: "/assets/game/stages/industrial-void/special-wall.png",
      boss: "/assets/game/stages/industrial-void/boss.png",
      projectile: "/assets/game/stages/industrial-void/projectile.png",
      laser: "/assets/game/stages/industrial-void/laser.png",
      portalOrnaments: "/assets/game/stages/industrial-void/portal-ornaments.png"
    }),
    "signal-monoliths": Object.freeze({
      background: "/assets/game/stages/signal-monoliths/background.png",
      bossBackground: "/assets/game/stages/signal-monoliths/boss-background.png",
      normalWall: "/assets/game/stages/signal-monoliths/normal-wall.png",
      specialWall: "/assets/game/stages/signal-monoliths/special-wall.png",
      boss: "/assets/game/stages/signal-monoliths/boss-evolved.png",
      projectile: "/assets/game/stages/signal-monoliths/projectile.png",
      laser: "/assets/game/stages/signal-monoliths/laser.png",
      portalOrnaments: "/assets/game/stages/signal-monoliths/portal-ornaments.png"
    }),
    "gravity-well": Object.freeze({
      background: "/assets/game/stages/gravity-well/background.png",
      bossBackground: "/assets/game/stages/gravity-well/boss-background.png",
      normalWall: "/assets/game/stages/gravity-well/normal-wall.png",
      specialWall: "/assets/game/stages/gravity-well/special-wall.png",
      boss: "/assets/game/stages/gravity-well/boss.png",
      projectile: "/assets/game/stages/gravity-well/projectile.png",
      laser: "/assets/game/stages/gravity-well/laser.png",
      portalOrnaments: "/assets/game/stages/gravity-well/portal-ornaments.png"
    }),
    "abyssal-beast": Object.freeze({
      background: "/assets/game/stages/abyssal-beast/background.png",
      bossBackground: "/assets/game/stages/abyssal-beast/boss-background.png",
      normalWall: "/assets/game/stages/abyssal-beast/normal-wall.png",
      specialWall: "/assets/game/stages/abyssal-beast/special-wall.png",
      boss: "/assets/game/stages/abyssal-beast/boss-evolved.png",
      projectile: "/assets/game/stages/abyssal-beast/projectile.png",
      laser: "/assets/game/stages/abyssal-beast/laser.png",
      portalOrnaments: "/assets/game/stages/abyssal-beast/portal-ornaments.png"
    }),
    "solar-forge": Object.freeze({
      background: "/assets/game/stages/solar-forge/background.png",
      bossBackground: "/assets/game/stages/solar-forge/boss-background.png",
      normalWall: "/assets/game/stages/solar-forge/normal-wall.png",
      specialWall: "/assets/game/stages/solar-forge/special-wall.png",
      boss: "/assets/game/stages/solar-forge/boss-evolved.png",
      projectile: "/assets/game/stages/solar-forge/projectile.png",
      laser: "/assets/game/stages/solar-forge/laser.png",
      portalOrnaments: "/assets/game/stages/solar-forge/portal-ornaments.png"
    })
  })
});

// src/game/boss-rigs.js
var BOSS_RIGS = Object.freeze({
  "crystal-gates": {
    "id": "crystal-gates",
    "label": "\uC218\uC815",
    "color": "#8bd7ff",
    "core": [
      0.385,
      0.485,
      0.045
    ],
    "muzzle": [
      0.06,
      0.48
    ],
    "parts": [
      {
        "pivot": [
          0.55,
          0.4
        ],
        "poly": [
          [
            0.31,
            0.29
          ],
          [
            0.49,
            0.1
          ],
          [
            0.65,
            0.35
          ],
          [
            0.55,
            0.46
          ]
        ],
        "side": -1,
        "amplitude": 0.025,
        "open": 0.1
      },
      {
        "pivot": [
          0.55,
          0.58
        ],
        "poly": [
          [
            0.31,
            0.7
          ],
          [
            0.48,
            0.98
          ],
          [
            0.65,
            0.68
          ],
          [
            0.55,
            0.53
          ]
        ],
        "side": 1,
        "amplitude": 0.025,
        "open": 0.1
      },
      {
        "pivot": [
          0.79,
          0.17
        ],
        "poly": [
          [
            0.61,
            0
          ],
          [
            0.91,
            0.05
          ],
          [
            0.91,
            0.27
          ],
          [
            0.73,
            0.29
          ]
        ],
        "side": -1,
        "amplitude": 0.02,
        "open": 0.09
      },
      {
        "pivot": [
          0.79,
          0.82
        ],
        "poly": [
          [
            0.65,
            0.72
          ],
          [
            0.91,
            0.67
          ],
          [
            0.91,
            0.99
          ],
          [
            0.65,
            0.99
          ]
        ],
        "side": 1,
        "amplitude": 0.02,
        "open": 0.09
      }
    ]
  },
  "industrial-void": {
    "id": "industrial-void",
    "label": "\uC0B0\uC5C5",
    "color": "#ffad58",
    "core": [
      0.61,
      0.51,
      0.038
    ],
    "muzzle": [
      0.035,
      0.51
    ],
    "parts": [
      {
        "pivot": [
          0.43,
          0.39
        ],
        "poly": [
          [
            0.01,
            0.33
          ],
          [
            0.4,
            0.25
          ],
          [
            0.49,
            0.33
          ],
          [
            0.45,
            0.44
          ],
          [
            0.01,
            0.43
          ]
        ],
        "side": -1,
        "amplitude": 0.012,
        "open": 0.045,
        "recoil": 0.026
      },
      {
        "pivot": [
          0.42,
          0.52
        ],
        "poly": [
          [
            5e-3,
            0.45
          ],
          [
            0.42,
            0.44
          ],
          [
            0.49,
            0.5
          ],
          [
            0.45,
            0.61
          ],
          [
            5e-3,
            0.58
          ]
        ],
        "side": 1,
        "amplitude": 0.012,
        "open": 0.035,
        "recoil": 0.023
      }
    ]
  },
  "signal-monoliths": {
    "id": "signal-monoliths",
    "label": "\uC2E0\uD638",
    "color": "#d49bff",
    "core": [
      0.12,
      0.5,
      0.035
    ],
    "muzzle": [
      0.04,
      0.5
    ],
    "parts": [
      {
        "pivot": [
          0.48,
          0.48
        ],
        "poly": [
          [
            0.3,
            0.26
          ],
          [
            0.56,
            0.35
          ],
          [
            0.53,
            0.66
          ],
          [
            0.3,
            0.77
          ]
        ],
        "side": -1,
        "amplitude": 0.012,
        "open": 0.032,
        "slide": 0.018
      },
      {
        "pivot": [
          0.69,
          0.5
        ],
        "poly": [
          [
            0.53,
            0.29
          ],
          [
            0.79,
            0.38
          ],
          [
            0.78,
            0.63
          ],
          [
            0.54,
            0.72
          ]
        ],
        "side": 1,
        "amplitude": 0.012,
        "open": 0.03,
        "slide": 0.025
      },
      {
        "pivot": [
          0.66,
          0.24
        ],
        "poly": [
          [
            0.51,
            0.14
          ],
          [
            0.67,
            0.07
          ],
          [
            0.82,
            0.23
          ],
          [
            0.67,
            0.36
          ],
          [
            0.52,
            0.28
          ]
        ],
        "side": -1,
        "amplitude": 0.026,
        "open": 0.05,
        "lift": 0.018
      },
      {
        "pivot": [
          0.66,
          0.76
        ],
        "poly": [
          [
            0.51,
            0.73
          ],
          [
            0.67,
            0.63
          ],
          [
            0.82,
            0.75
          ],
          [
            0.67,
            0.92
          ],
          [
            0.52,
            0.84
          ]
        ],
        "side": 1,
        "amplitude": 0.026,
        "open": 0.05,
        "lift": 0.018
      }
    ]
  },
  "gravity-well": {
    "id": "gravity-well",
    "label": "\uC911\uB825",
    "color": "#be9bff",
    "core": [
      0.43,
      0.5,
      0.115
    ],
    "muzzle": [
      0.24,
      0.5
    ],
    "parts": [
      {
        "pivot": [
          0.71,
          0.35
        ],
        "poly": [
          [
            0.18,
            0.07
          ],
          [
            0.49,
            0.01
          ],
          [
            0.73,
            0.15
          ],
          [
            0.84,
            0.36
          ],
          [
            0.68,
            0.39
          ],
          [
            0.48,
            0.23
          ],
          [
            0.27,
            0.21
          ]
        ],
        "side": -1,
        "amplitude": 8e-3,
        "open": 0.038
      },
      {
        "pivot": [
          0.71,
          0.7
        ],
        "poly": [
          [
            0.18,
            0.89
          ],
          [
            0.4,
            0.98
          ],
          [
            0.68,
            0.91
          ],
          [
            0.84,
            0.74
          ],
          [
            0.7,
            0.61
          ],
          [
            0.49,
            0.78
          ],
          [
            0.26,
            0.77
          ]
        ],
        "side": 1,
        "amplitude": 8e-3,
        "open": 0.038
      }
    ]
  },
  "abyssal-beast": {
    "id": "abyssal-beast",
    "label": "\uC2EC\uD574",
    "color": "#62f1ee",
    "core": [
      0.115,
      0.43,
      0.055
    ],
    "muzzle": [
      0.065,
      0.43
    ],
    "parts": [
      {
        "pivot": [
          0.285,
          0.48
        ],
        "poly": [
          [
            0.015,
            0.43
          ],
          [
            0.16,
            0.44
          ],
          [
            0.31,
            0.48
          ],
          [
            0.25,
            0.65
          ],
          [
            0.09,
            0.69
          ],
          [
            0.015,
            0.59
          ]
        ],
        "side": -1,
        "amplitude": 0.016,
        "open": 0.19,
        "jaw": true
      },
      {
        "pivot": [
          0.43,
          0.43
        ],
        "poly": [
          [
            0.34,
            0.38
          ],
          [
            0.53,
            0.42
          ],
          [
            0.75,
            0.94
          ],
          [
            0.55,
            0.86
          ],
          [
            0.43,
            0.67
          ]
        ],
        "side": 1,
        "amplitude": 0.027,
        "open": 0.07
      },
      {
        "pivot": [
          0.34,
          0.2
        ],
        "poly": [
          [
            0.24,
            0.23
          ],
          [
            0.35,
            0.03
          ],
          [
            0.5,
            0.015
          ],
          [
            0.46,
            0.24
          ]
        ],
        "side": -1,
        "amplitude": 0.02,
        "open": 0.04
      }
    ]
  },
  "solar-forge": {
    "id": "solar-forge",
    "label": "\uD0DC\uC591",
    "color": "#ffb24f",
    "core": [
      0.64,
      0.5,
      0.075
    ],
    "muzzle": [
      0.08,
      0.5
    ],
    "parts": [
      {
        "pivot": [
          0.4,
          0.29
        ],
        "poly": [
          [
            0.26,
            0.24
          ],
          [
            0.38,
            0.04
          ],
          [
            0.59,
            0
          ],
          [
            0.52,
            0.18
          ],
          [
            0.45,
            0.3
          ]
        ],
        "side": -1,
        "amplitude": 0.012,
        "open": 0.12
      },
      {
        "pivot": [
          0.4,
          0.73
        ],
        "poly": [
          [
            0.26,
            0.73
          ],
          [
            0.39,
            0.99
          ],
          [
            0.57,
            0.99
          ],
          [
            0.52,
            0.84
          ],
          [
            0.45,
            0.7
          ]
        ],
        "side": 1,
        "amplitude": 0.012,
        "open": 0.12
      },
      {
        "pivot": [
          0.78,
          0.29
        ],
        "poly": [
          [
            0.68,
            0.19
          ],
          [
            0.91,
            0.08
          ],
          [
            0.85,
            0.3
          ],
          [
            0.74,
            0.34
          ]
        ],
        "side": -1,
        "amplitude": 0.015,
        "open": 0.1
      },
      {
        "pivot": [
          0.78,
          0.73
        ],
        "poly": [
          [
            0.68,
            0.77
          ],
          [
            0.89,
            0.98
          ],
          [
            0.85,
            0.74
          ],
          [
            0.74,
            0.68
          ]
        ],
        "side": 1,
        "amplitude": 0.015,
        "open": 0.1
      },
      {
        "pivot": [
          0.32,
          0.44
        ],
        "poly": [
          [
            5e-3,
            0.47
          ],
          [
            0.13,
            0.33
          ],
          [
            0.28,
            0.3
          ],
          [
            0.37,
            0.4
          ],
          [
            0.31,
            0.48
          ]
        ],
        "side": 1,
        "amplitude": 6e-3,
        "open": 0.035,
        "recoil": 0.012
      },
      {
        "pivot": [
          0.32,
          0.58
        ],
        "poly": [
          [
            5e-3,
            0.54
          ],
          [
            0.14,
            0.68
          ],
          [
            0.28,
            0.69
          ],
          [
            0.37,
            0.61
          ],
          [
            0.31,
            0.53
          ]
        ],
        "side": -1,
        "amplitude": 6e-3,
        "open": 0.035,
        "recoil": 0.012
      }
    ]
  }
});

// src/game/boss-geometry.js
var LOCATIONS = Object.freeze({
  "crystal-gates": { core: [0.385, 0.485], muzzle: [0.06, 0.48] },
  "industrial-void": { core: [0.61, 0.51], muzzle: [0.035, 0.51] },
  "signal-monoliths": { core: [0.12, 0.5], muzzle: [0.04, 0.5] },
  "gravity-well": { core: [0.43, 0.5], muzzle: [0.24, 0.5] },
  "abyssal-beast": { core: [0.115, 0.43], muzzle: [0.065, 0.43] },
  "solar-forge": { core: [0.64, 0.5], muzzle: [0.08, 0.5] }
});
function getBossGeometry(stageId, entranceProgress = 1, motionSeconds = 0, recoilX = 0) {
  const p = Math.max(0, Math.min(1, Number(entranceProgress) || 0));
  const eased = p * p * (3 - 2 * p);
  const centerX = 1160 + (842 - 1160) * eased + (Number.isFinite(recoilX) ? recoilX : 0);
  const centerY = 270 + 162 * Math.sin((Number.isFinite(motionSeconds) ? Math.max(0, motionSeconds) : 0) * Math.PI / 3);
  const box = { x: centerX - 96, y: centerY - 64, w: 192, h: 128 };
  const positions = LOCATIONS[stageId] ?? LOCATIONS["crystal-gates"];
  const point = ([x, y]) => ({ x: box.x + x * box.w, y: box.y + y * box.h });
  return { box, center: { x: centerX, y: centerY }, core: point(positions.core), muzzle: point(positions.muzzle) };
}

// src/game/boss-motion.js
var TAU = Math.PI * 2;
var preparedRigs = /* @__PURE__ */ new Map();
var finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
var clamp2 = (value, min = 0, max = 1) => Math.max(min, Math.min(max, finite(value, min)));
var seconds = (value) => clamp2(value, 0, 1e9);
var smooth = (value) => {
  const t = clamp2(value);
  return t * t * (3 - 2 * t);
};
var pointValid = (point) => Array.isArray(point) && point.length >= 2 && point.slice(0, 2).every((n) => Number.isFinite(n) && n >= 0 && n <= 1);
var boxValid = (box) => box && [box.x, box.y, box.w, box.h].every(Number.isFinite) && box.w > 0 && box.h > 0;
function rigValid(rig) {
  return rig && pointValid(rig.core) && Number.isFinite(rig.core[2]) && rig.core[2] > 0 && pointValid(rig.muzzle) && Array.isArray(rig.parts) && rig.parts.every((part) => part && pointValid(part.pivot) && Array.isArray(part.poly) && part.poly.length >= 3 && part.poly.every(pointValid) && ["side", "amplitude", "open"].every((key) => Number.isFinite(part[key])) && ["slide", "lift", "recoil"].every((key) => part[key] === void 0 || Number.isFinite(part[key])));
}
function imageSize(image) {
  return [image?.naturalWidth ?? image?.width, image?.naturalHeight ?? image?.height];
}
function defaultCanvasFactory(width, height) {
  if (typeof OffscreenCanvas === "function") return new OffscreenCanvas(width, height);
  if (typeof CanvasRenderingContext2D === "undefined" || typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
function layer(factory, width, height) {
  let canvas, ctx;
  try {
    canvas = factory(width, height);
    if (!canvas) return null;
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext?.("2d");
  } catch {
    return null;
  }
  const methods = [
    "drawImage",
    "save",
    "restore",
    "beginPath",
    "moveTo",
    "lineTo",
    "closePath",
    "clip",
    "fill",
    "stroke",
    "clearRect"
  ];
  return ctx && methods.every((method) => typeof ctx[method] === "function") ? { canvas, ctx } : null;
}
function polygon(ctx, points, width, height) {
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i) ctx.lineTo(x * width, y * height);
    else ctx.moveTo(x * width, y * height);
  });
  ctx.closePath();
}
function prepareBossRig({ rig, image, canvasFactory = defaultCanvasFactory } = {}) {
  if (!rigValid(rig)) return null;
  const [iw, ih] = imageSize(image);
  if (!(Number.isFinite(iw) && Number.isFinite(ih) && iw > 0 && ih > 0)) return null;
  const width = 768, height = Math.round(width * ih / iw);
  if (!(height > 0 && height <= 8192)) return null;
  const original = layer(canvasFactory, width, height);
  if (!original) return null;
  const base = layer(canvasFactory, width, height);
  const erase = layer(canvasFactory, width, height);
  if (!base || !erase) return null;
  const cutouts = rig.parts.map(() => layer(canvasFactory, width, height));
  if (cutouts.some((cutout) => !cutout)) return null;
  original.ctx.drawImage(image, 0, 0, width, height);
  base.ctx.drawImage(original.canvas, 0, 0);
  const parts = rig.parts.map((part, i) => {
    const cutout = cutouts[i];
    cutout.ctx.save();
    polygon(cutout.ctx, part.poly, width, height);
    cutout.ctx.clip();
    cutout.ctx.drawImage(original.canvas, 0, 0);
    cutout.ctx.restore();
    erase.ctx.clearRect(0, 0, width, height);
    erase.ctx.save();
    polygon(erase.ctx, part.poly, width, height);
    erase.ctx.fillStyle = "#fff";
    erase.ctx.fill();
    erase.ctx.globalCompositeOperation = "destination-out";
    erase.ctx.strokeStyle = "#fff";
    erase.ctx.lineWidth = 2;
    erase.ctx.lineJoin = "round";
    erase.ctx.stroke();
    erase.ctx.restore();
    base.ctx.save();
    base.ctx.globalCompositeOperation = "destination-out";
    base.ctx.drawImage(erase.canvas, 0, 0);
    base.ctx.restore();
    return {
      ...part,
      pivot: [...part.pivot],
      poly: part.poly.map((point) => [...point]),
      canvas: cutout.canvas
    };
  });
  return { width, height, base: base.canvas, parts };
}
function getPreparedBossRig(stageId, image) {
  const rig = BOSS_RIGS[stageId];
  if (!rig) return null;
  const [width, height] = imageSize(image);
  const src = image?.currentSrc || image?.src;
  const cached = preparedRigs.get(stageId);
  if (cached && cached.image === image && cached.rig === rig && Object.is(cached.width, width) && Object.is(cached.height, height) && cached.src === src) {
    preparedRigs.delete(stageId);
    preparedRigs.set(stageId, cached);
    return cached.prepared;
  }
  const prepared = prepareBossRig({ rig, image });
  preparedRigs.delete(stageId);
  preparedRigs.set(stageId, { image, rig, width, height, src, prepared });
  if (preparedRigs.size > 2) preparedRigs.delete(preparedRigs.keys().next().value);
  return prepared;
}
function getBossPose({ animation, idleElapsedSeconds = 0, reducedMotion = false } = {}) {
  const pose = { time: reducedMotion ? 0 : seconds(idleElapsedSeconds), charge: 0, fire: 0, roar: 0, hit: 0 };
  const t = seconds(animation?.elapsedSeconds);
  const defaults = { attack: 2.6, roar: 0.8, hit: 0.38 };
  const duration = finite(animation?.durationSeconds) > 0 ? animation.durationSeconds : defaults[animation?.kind];
  if (t >= duration) return pose;
  if (animation?.kind === "attack") {
    pose.charge = smooth(t / 0.9) * (1 - smooth((t - 1.35) / 0.45));
    pose.fire = t >= 1.1 ? Math.exp(-(t - 1.1) * 8) : 0;
  }
  if (animation?.kind === "roar") pose.roar = Math.sin(Math.PI * clamp2(t / duration));
  if (animation?.kind === "hit") pose.hit = Math.exp(-t * 5);
  return pose;
}
function normalizedPose(pose, reducedMotion) {
  return {
    time: reducedMotion ? 0 : seconds(pose?.time),
    charge: clamp2(pose?.charge),
    fire: clamp2(pose?.fire),
    roar: clamp2(pose?.roar),
    hit: clamp2(pose?.hit)
  };
}
function getBossRecoil(pose, reducedMotion = false) {
  const p = normalizedPose(pose, reducedMotion);
  return reducedMotion ? 0 : p.fire * 10 + p.hit * 12;
}
function getBossPartTransform(part, index, pose, reducedMotion = false) {
  const p = normalizedPose(pose, reducedMotion);
  const breathing = reducedMotion ? 0 : Math.sin(p.time * (1.7 + index * 0.13) + index * 1.6);
  const openness = p.charge * 0.55 + p.roar;
  return {
    angle: breathing * part.amplitude * 3 + part.side * part.open * 1.7 * openness,
    dx: (part.slide || 0) * 2 * (openness + 0.24 * breathing) + (part.recoil || 0) * 2 * p.fire,
    dy: (part.lift || 0) * 2 * part.side * (openness + 0.3 * breathing)
  };
}
function drawWarped(ctx, source, width, height, time, tail) {
  if (!tail) {
    ctx.drawImage(source, 0, 0, width, height);
    return;
  }
  const steps = 64, strip = source.width / steps;
  for (let i = 0; i < steps; i++) {
    const u = (i + 0.5) / steps, strength = Math.pow(clamp2((u - 0.56) / 0.44), 2);
    const dy = Math.sin(time * 2.5 - u * 7) * height * 0.075 * strength;
    ctx.drawImage(
      source,
      i * strip,
      0,
      strip + 0.3,
      source.height,
      i * width / steps,
      dy,
      width / steps + 0.25,
      height
    );
  }
}
function glow(ctx, x, y, radius, color, strength = 1) {
  if (!(radius > 0 && strength > 0)) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = clamp2(strength);
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, radius));
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.18, color);
  gradient.addColorStop(1, `${color}00`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}
function drawBossRig(ctx, { rig, prepared, pose, box, projectileImage, reducedMotion = false, geometryIncludesRecoil = false } = {}) {
  if (!ctx || !rigValid(rig) || !prepared?.base || !Array.isArray(prepared.parts) || !boxValid(box)) return;
  const p = normalizedPose(pose, reducedMotion);
  const { x, y, w, h } = box;
  ctx.save();
  ctx.translate(x + (geometryIncludesRecoil ? 0 : getBossRecoil(p, reducedMotion)), y);
  drawWarped(ctx, prepared.base, w, h, p.time, rig.id === "abyssal-beast" && !reducedMotion);
  prepared.parts.forEach((part, i) => {
    const transform = getBossPartTransform(part, i, p, reducedMotion);
    const [px, py] = part.pivot;
    ctx.save();
    ctx.translate(px * w + transform.dx * w, py * h + transform.dy * h);
    ctx.rotate(transform.angle);
    ctx.translate(-px * w, -py * h);
    ctx.drawImage(part.canvas, 0, 0, w, h);
    ctx.restore();
  });
  ctx.restore();
  const [cx, cy, cr] = rig.core, coreX = x + cx * w, coreY = y + cy * h;
  glow(ctx, coreX, coreY, cr * w * (1.25 + p.charge), rig.color, 0.14 + p.charge * 0.37 + p.roar * 0.24);
  if (rig.id === "gravity-well") {
    ctx.save();
    ctx.strokeStyle = rig.color;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(
        coreX,
        coreY,
        cr * w * (0.5 + i * 0.19),
        cr * h * (0.5 + i * 0.19),
        p.time * (i % 2 ? -0.4 : 0.3),
        p.time + i * 2,
        p.time + i * 2 + 3.3
      );
      ctx.stroke();
      const theta = p.time * (i % 2 ? -0.6 : 0.5) + i * 2.1;
      const px = coreX + Math.cos(theta) * w * 0.21, py = coreY + Math.sin(theta) * h * 0.29;
      if (projectileImage) ctx.drawImage(projectileImage, px - 12, py - 8, 24, 16);
    }
    ctx.restore();
  }
  if (rig.id === "signal-monoliths") {
    for (let i = 0; i < 6; i++) {
      glow(
        ctx,
        x + w * (0.25 + i * 0.105),
        y + h * 0.5,
        w * 0.018,
        rig.color,
        0.15 + 0.6 * Math.pow(Math.max(0, Math.sin(p.time * 4 - i * 0.9)), 6)
      );
    }
  }
  if (rig.id === "solar-forge") {
    glow(ctx, x + w * 0.91, y + h * 0.5, w * (0.08 + 0.013 * Math.sin(p.time * 21)), "#ff9845", 0.3 + p.charge * 0.15);
  }
}
function drawBossActionEffects(ctx, { rig, pose, box, action, reducedMotion = false } = {}) {
  if (!ctx || !rigValid(rig) || !boxValid(box)) return;
  const p = normalizedPose(pose, reducedMotion);
  const { x, y, w, h } = box;
  const mx = x + rig.muzzle[0] * w, my = y + rig.muzzle[1] * h;
  if (p.charge > 0 && p.fire === 0) glow(ctx, mx, my, 12 + p.charge * 28, rig.color, 0.3 + p.charge * 0.5);
  if (p.fire > 0) glow(ctx, mx, my, 28, rig.color, p.fire);
  const isRoar = action && (action.kind === "roar" || action.kind === void 0);
  const duration = finite(action?.durationSeconds) > 0 ? action.durationSeconds : 0.8;
  const elapsed = seconds(action?.elapsedSeconds);
  if (isRoar && elapsed < duration) {
    for (let i = 0; i < (reducedMotion ? 1 : 3); i++) {
      const age = elapsed - i * 0.15;
      if (age < 0) continue;
      const radius = reducedMotion ? 24 : 20 + age * 540;
      ctx.save();
      ctx.strokeStyle = rig.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = Math.max(0, 1 - age / duration) * 0.8;
      ctx.shadowColor = rig.color;
      ctx.shadowBlur = reducedMotion ? 0 : 12;
      ctx.beginPath();
      ctx.ellipse(mx, my, radius, radius * 0.7, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
  if (p.hit > 0) {
    const coreX = x + rig.core[0] * w, coreY = y + rig.core[1] * h;
    glow(ctx, coreX, coreY, w * 0.35, "#ecfbff", p.hit * 0.65);
    ctx.save();
    ctx.strokeStyle = "#f0fcff";
    ctx.globalAlpha = p.hit;
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const theta = i * Math.PI / 5;
      const radius = w * (reducedMotion ? 0.1 : 0.1 + (1 - p.hit) * 0.22);
      ctx.beginPath();
      ctx.moveTo(coreX + Math.cos(theta) * radius, coreY + Math.sin(theta) * radius);
      ctx.lineTo(coreX + Math.cos(theta) * (radius + 12), coreY + Math.sin(theta) * (radius + 12));
      ctx.stroke();
    }
    ctx.restore();
  }
}

// src/game/portal-renderer.js
var destinations = [
  ["crystal-gates", "#8bd7ff"],
  ["industrial-void", "#ffad58"],
  ["signal-monoliths", "#d49bff"],
  ["gravity-well", "#be9bff"],
  ["abyssal-beast", "#62f1ee"],
  ["solar-forge", "#ffb24f"]
];
var clamp3 = (x) => Math.max(0, Math.min(1, x));
var finite2 = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
var seconds2 = (value) => Math.max(0, finite2(value));
var smooth2 = (x) => {
  x = clamp3(x);
  return x * x * (3 - 2 * x);
};
function getPortalWhiteAlpha(transition) {
  if (transition?.kind !== "portal") return 0;
  const time = seconds2(transition.phaseElapsedSeconds);
  if (transition.phase === "white-out") return smooth2(time / 0.2);
  if (transition.phase === "hold") return 1;
  if (transition.phase === "reveal") return 1 - smooth2(time / 0.6);
  return 0;
}
function imageSize2(image) {
  if (!image || image.complete === false) return null;
  const width = image.naturalWidth ?? image.width;
  const height = image.naturalHeight ?? image.height;
  return Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0 ? { width, height } : null;
}
function ellipse(c, x, y, rx, ry, rotation, start, end) {
  if (typeof c.ellipse === "function") {
    c.ellipse(x, y, rx, ry, rotation, start, end);
  } else {
    c.save();
    c.translate(x, y);
    c.rotate(rotation);
    c.scale(rx, ry);
    c.arc(0, 0, 1, start, end);
    c.restore();
  }
}
function glow2(c, x, y, rx, ry, color, alpha = 1) {
  c.save();
  c.translate(x, y);
  c.scale(1, ry / rx);
  c.globalCompositeOperation = "screen";
  c.globalAlpha = clamp3(alpha);
  const g = c.createRadialGradient?.(0, 0, 0, 0, 0, rx);
  if (g) {
    g.addColorStop(0, "#f6fdff");
    g.addColorStop(0.24, color);
    g.addColorStop(1, color + "00");
  }
  c.fillStyle = g ?? color;
  c.beginPath();
  c.arc(0, 0, rx, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
function ornamentPose(stage, sector, time, reduced = false) {
  const theta = (sector + 0.5) * Math.PI / 4, beat = time * 1.6 + sector * 0.83;
  if (reduced) return { dx: 0, dy: 0, angle: 0 };
  const n = Math.sin(beat);
  if (stage === 0) return { dx: Math.cos(theta) * n * 4, dy: Math.sin(beat * 0.73) * 5, angle: Math.sin(beat * 0.7) * 0.012 };
  if (stage === 1) {
    const lock = Math.sin(time * 2 + sector * 0.35) * 0.8;
    return { dx: Math.cos(theta) * lock, dy: Math.sin(theta) * lock, angle: 0 };
  }
  if (stage === 2) return { dx: Math.sin(beat * 0.6) * 1.8, dy: Math.sin(time * 2 + sector * 1.3) * 4, angle: 0 };
  if (stage === 3) return { dx: -Math.sin(theta) * Math.sin(beat * 0.7) * 4, dy: Math.cos(theta) * Math.sin(beat * 0.7) * 5, angle: Math.sin(beat * 0.5) * 0.011 };
  if (stage === 4) return { dx: Math.cos(theta) * Math.sin(time * 1.8 + sector * 0.25) * 2.5, dy: Math.sin(theta) * Math.sin(time * 1.8 + sector * 0.25) * 3, angle: Math.sin(beat) * 9e-3 };
  return { dx: Math.cos(theta) * Math.sin(time * 2.5 + sector * 0.3) * 1.3, dy: Math.sin(theta) * Math.sin(time * 2.5 + sector * 0.3) * 1.3, angle: 0 };
}
function shell(c, { x, y, rx, ry, alpha, stage, time: t, reducedMotion, ornamentImage, size }) {
  const h = ry * 2.7, w = h * size.width / size.height;
  c.save();
  c.globalAlpha = alpha;
  c.beginPath();
  c.rect(-1e3, -1e3, 3e3, 3e3);
  ellipse(c, x, y, rx + 4, ry + 3, 0, 0, Math.PI * 2);
  c.clip("evenodd");
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, b = (i + 1) * Math.PI / 4;
    const p = ornamentPose(stage, i, t, reducedMotion);
    c.save();
    c.translate(x + p.dx, y + p.dy);
    c.rotate(p.angle);
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, 1e3, a - 0.085, b + 0.085);
    c.closePath();
    c.clip();
    c.drawImage(ornamentImage, -w / 2, -h / 2, w, h);
    c.restore();
  }
  c.restore();
  const color = destinations[stage][1];
  if (stage === 0) {
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3 + t * 0.12;
      glow2(c, x + Math.cos(a) * (rx + 33), y + Math.sin(a) * ry * 0.83, 3.5, 3.5, color, alpha * (0.2 + 0.25 * Math.sin(t * 2 + i) ** 2));
    }
  } else if (stage === 1) {
    for (let i = 0; i < 4; i++) {
      const side = i % 2 ? 1 : -1, yy = y + (i < 2 ? -1 : 1) * ry * 0.62;
      glow2(c, x + side * (rx + 20), yy, 6, 3, color, alpha * (0.2 + 0.35 * Math.max(0, Math.sin(t * 2 - i))));
    }
  } else if (stage === 2) {
    for (let i = 0; i < 6; i++) {
      const a = (i + 0.5) * Math.PI / 3;
      glow2(c, x + Math.cos(a) * (rx + 23), y + Math.sin(a) * ry * 0.88, 4, 4, color, alpha * (0.12 + 0.5 * Math.max(0, Math.sin(t * 3 - i * 0.7)) ** 4));
    }
  } else if (stage === 3) {
    c.save();
    c.strokeStyle = color;
    c.lineWidth = 1;
    c.globalAlpha = alpha * 0.22;
    for (let i = 0; i < 2; i++) {
      c.beginPath();
      ellipse(c, x, y, rx + 25 + i * 8, ry + 6 + i * 6, Math.sin(t * 0.3) * 0.04, t * 0.4 + i * Math.PI, t * 0.4 + i * Math.PI + 1.8);
      c.stroke();
    }
    c.restore();
  } else if (stage === 4) {
    for (let i = 0; i < 4; i++) {
      const a = (i + 0.5) * Math.PI / 2;
      glow2(c, x + Math.cos(a) * (rx + 25), y + Math.sin(a) * ry * 0.8, 6, 11, color, alpha * (0.1 + 0.16 * Math.sin(t * 1.8 - i) ** 2));
    }
  } else {
    for (let i = 0; i < 10; i++) {
      const life = (t * 0.43 + i * 0.173) % 1, a = i * 2.4;
      const px = x + Math.cos(a) * (rx + 22 + life * 15), py = y + Math.sin(a) * ry * 0.83 - life * 25;
      glow2(c, px, py, 2.2, 2.2, "#ffc277", alpha * (1 - life) * 0.65);
    }
  }
}
function drawPortal(c, { transition, destinationBackground, ornamentImage, reducedMotion = false } = {}) {
  if (!c || transition?.kind !== "portal") return;
  if (transition.phase !== "approach" && transition.phase !== "white-out") return;
  const alpha = transition.phase === "white-out" ? 1 - getPortalWhiteAlpha(transition) : 1;
  if (alpha <= 0) return;
  const found = destinations.findIndex(([id]) => id === transition.destinationStageId);
  const stage = found < 0 ? 0 : found, color = destinations[stage][1];
  const x = finite2(
    transition.portalX,
    finite2(transition.crossingX, WORLD_WIDTH / 4) + 960 - Math.max(0, finite2(transition.travelledPixels))
  );
  const y = WORLD_HEIGHT / 2, time = seconds2(transition.elapsedSeconds);
  const near = clamp3((1080 - x) / 850), rx = 70 + near * 34, ry = WORLD_HEIGHT / 2 + 100;
  const size = imageSize2(ornamentImage);
  if (size) shell(c, { x, y, rx, ry, alpha, stage, time, reducedMotion, ornamentImage, size });
  c.save();
  c.globalAlpha = alpha;
  c.save();
  c.beginPath();
  ellipse(c, x, y, rx, ry, 0, 0, Math.PI * 2);
  c.clip();
  if (imageSize2(destinationBackground)) c.drawImage(destinationBackground, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  c.fillStyle = "#ddf8ff66";
  c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  c.restore();
  c.globalCompositeOperation = "screen";
  c.shadowColor = color;
  c.shadowBlur = 24;
  for (let i = 0; i < 4; i++) {
    c.strokeStyle = i === 3 ? "#f3fdff" : color;
    c.globalAlpha = alpha * (0.18 + i * 0.17);
    c.lineWidth = i === 3 ? 2 : 7 - i;
    c.beginPath();
    ellipse(c, x, y, rx + i * 3, ry + i * 5, 0, 0, Math.PI * 2);
    c.stroke();
  }
  for (let i = 0; i < 18; i++) {
    const angle = i * Math.PI / 9 + time * 0.35, swell = 1 + 0.035 * Math.sin(time * 7 + i);
    const px = x + Math.cos(angle) * rx * swell, py = y + Math.sin(angle) * ry * swell;
    c.fillStyle = "#e6fcff";
    c.globalAlpha = alpha * 0.7;
    c.beginPath();
    c.arc(px, py, 1.2 + i % 3 * 0.5, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  glow2(c, x, y, rx * 1.8, ry * 1.35, color, alpha * 0.16);
}
function drawTransitionOverlay(c, { transition, reducedMotion = false } = {}) {
  const alpha = getPortalWhiteAlpha(transition);
  if (!c || alpha <= 0) return;
  c.save();
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = alpha;
  c.fillStyle = reducedMotion ? "#c6dfed" : "#ffffff";
  c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  c.restore();
}

// src/game/challenge-effects.js
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 4294967296;
  };
}
var clamp4 = (x) => Math.max(0, Math.min(1, x));
function inkBlob(c, x, y, rx, ry, seed, t) {
  const g = c.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
  g.addColorStop(0, "#010208");
  g.addColorStop(0.8, "#010208");
  g.addColorStop(1, "#03040a");
  c.fillStyle = g;
  c.beginPath();
  for (let k = 0; k <= 48; k++) {
    const a = k / 48 * Math.PI * 2, w = 1 + 0.075 * Math.sin(a * 5 + seed) + 0.04 * Math.sin(a * 11 + seed * 0.7 + t * 0.45);
    const px = x + Math.cos(a) * rx * w, py = y + Math.sin(a) * ry * w;
    if (k === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
}
var textures = /* @__PURE__ */ new WeakMap();
function staticTexture(c, t) {
  let cache = textures.get(c);
  if (!cache) {
    const canvas = c.canvas?.ownerDocument?.createElement("canvas") ?? (typeof OffscreenCanvas === "function" ? new OffscreenCanvas(240, 135) : null);
    if (!canvas) return null;
    canvas.width = 240;
    canvas.height = 135;
    const context = canvas.getContext("2d");
    if (!context?.createImageData) return null;
    cache = { canvas, context, image: context.createImageData(240, 135), frame: -1 };
    textures.set(c, cache);
  }
  const frame = Math.floor(t * 22);
  if (cache.frame === frame) return cache.canvas;
  cache.frame = frame;
  const roll = rng(9001 + frame * 101), data = cache.image.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = roll(), v = n < 0.55 ? 8 : n < 0.88 ? 22 + roll() * 36 : n < 0.987 ? 62 + roll() * 70 : 170 + roll() * 65;
    data[i] = v * 0.68;
    data[i + 1] = v * 0.9;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  cache.context.putImageData(cache.image, 0, 0);
  return cache.canvas;
}
function drawChallengeFailure(c, effect, player, { reducedMotion = false } = {}) {
  if (!effect || !player || !(effect.remainingSeconds > 0)) return;
  const duration = effect.durationSeconds || 5, elapsed = Math.max(0, duration - effect.remainingSeconds);
  const age = reducedMotion ? 1 : elapsed, kind = effect.kind;
  const strength = clamp4(elapsed / 0.11) * clamp4(effect.remainingSeconds / 1.2);
  c.save();
  c.beginPath();
  c.rect(0, 0, 960, 540);
  c.ellipse(player.x, player.y, 74, 52, 0, 0, Math.PI * 2);
  c.clip("evenodd");
  if (kind === "ink") {
    c.globalAlpha = strength * 0.88;
    const spread = 0.93 + 0.07 * clamp4(age / 0.3);
    for (const [x, y, rx, ry, s] of [[650, 72, 260, 120, 1], [145, 480, 205, 108, 8], [880, 380, 155, 170, 11], [455, 35, 155, 72, 15]]) inkBlob(c, x, y, rx * spread, ry * spread, s, age);
    c.fillStyle = "#010208";
    c.globalAlpha = strength * 0.84;
    for (let i = 0; i < 5; i++) {
      const x = 520 + i * 58, y = 88 + i % 3 * 12, len = 20 + clamp4(age / 1.1) * (30 + i % 3 * 10);
      c.beginPath();
      c.ellipse(x, y + len / 2, 4 + i % 2 * 2, len / 2, 0, 0, Math.PI * 2);
      c.fill();
    }
  } else {
    const noiseCanvas = staticTexture(c, age);
    const step = Math.floor(age * 19), roll = rng(step * 491 + 321);
    c.globalAlpha = strength * 0.14;
    c.fillStyle = "#020711";
    c.fillRect(0, 0, 960, 540);
    c.imageSmoothingEnabled = false;
    c.globalAlpha = strength * 0.3;
    if (noiseCanvas) c.drawImage(noiseCanvas, 0, 0, 960, 540);
    for (let i = 0; i < 8; i++) {
      const y = roll() * 540, h = 3 + roll() * 11, x = roll() * 520;
      c.globalAlpha = strength * (0.28 + roll() * 0.28);
      c.fillStyle = i % 4 === 0 ? "#96bccb" : i % 3 === 0 ? "#29435b" : "#01040b";
      c.fillRect(x, y, 150 + roll() * 360, h);
      c.globalAlpha = strength * 0.34;
      c.fillStyle = "#8ca5ae";
      c.fillRect(x + roll() * 60, y + h + 2, 100 + roll() * 280, 1 + roll() * 2);
    }
    const tear = age * 180 % 650 - 90;
    c.globalAlpha = strength * 0.48;
    c.fillStyle = "#03060c";
    c.fillRect(0, tear, 960, 14);
    c.globalAlpha = strength * 0.2;
    c.fillStyle = "#7393a2";
    for (let y = 0; y < 540; y += 8) c.fillRect(0, y + step % 3, 960, 1);
    for (let i = 0; i < 24; i++) {
      const x = roll() * 960, y = roll() * 540;
      c.globalAlpha = strength * (0.18 + roll() * 0.25);
      c.fillStyle = roll() < 0.3 ? "#9ba4bd" : "#091422";
      c.fillRect(x, y, 6 + roll() * 28, 2 + roll() * 5);
    }
  }
  c.restore();
}

// src/game/render-resolution.js
var WORLD_WIDTH2 = 960;
var WORLD_HEIGHT2 = 540;
var MAX_RENDER_PIXELS = 3840 * 2160;
function getRenderResolution({ width, height, dpr } = {}) {
  const cssWidth = Number.isFinite(width) && width > 0 ? width : WORLD_WIDTH2;
  const cssHeight = Number.isFinite(height) && height > 0 ? height : WORLD_HEIGHT2;
  const pixelRatio = Number.isFinite(dpr) ? Math.max(1, Math.min(2, dpr)) : 1;
  const limit = Math.min(pixelRatio, Math.sqrt(MAX_RENDER_PIXELS / cssWidth / cssHeight));
  const physicalWidth = Math.max(1, Math.floor(cssWidth * limit));
  const physicalHeight = Math.max(1, Math.floor(cssHeight * limit));
  return {
    width: physicalWidth,
    height: physicalHeight,
    scaleX: physicalWidth / WORLD_WIDTH2,
    scaleY: physicalHeight / WORLD_HEIGHT2,
    pixelRatio
  };
}

// src/game/renderer.js
function getDevicePixelRatio() {
  return Math.max(1, Number(globalThis.devicePixelRatio) || 1);
}
function resolveReducedMotion(preference) {
  return typeof preference === "function" ? Boolean(preference()) : preference ?? Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}
function setGlow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function resetGlow(ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}
function drawShip(ctx, player, theme = VISUAL_THEME, aircraftId = "default", visualAssets = null) {
  const tilt = Number.isFinite(player.facingAngle) ? player.facingAngle : Math.max(-0.35, Math.min(0.35, player.velocityY / 1e3));
  const dashIntensity = getDashIntensity(player);
  const craft = AIRCRAFT_VISUALS[aircraftId] ?? AIRCRAFT_VISUALS.default;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(tilt);
  const image = visualAssets?.get(`aircraft.${aircraftId}`) ?? visualAssets?.get(VISUAL_ASSET_MANIFEST.aircraft[aircraftId] ?? VISUAL_ASSET_MANIFEST.aircraft.default);
  if (image) {
    const scale = Math.min(player.width / image.width, player.height / image.height);
    const width = image.width * scale * 1.8;
    const height = image.height * scale * 1.8;
    ctx.globalAlpha = 1;
    setGlow(ctx, craft.outline, 8);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    resetGlow(ctx);
    if (dashIntensity > 0) {
      ctx.globalAlpha = 0.55 + dashIntensity * 0.4;
      setGlow(ctx, theme.dash.outline, 12 + dashIntensity * 8);
      ctx.beginPath();
      ctx.arc(-player.width / 4, 0, 2 + dashIntensity * 2, 0, Math.PI * 2);
      ctx.fillStyle = AIRCRAFT_VISUALS[aircraftId]?.accent ?? AIRCRAFT_VISUALS.default.accent;
      ctx.fill();
    }
    resetGlow(ctx);
    ctx.restore();
    return;
  }
  ctx.scale(1.8, 1.8);
  setGlow(ctx, craft.outline, theme.shipGlow);
  ctx.fillStyle = craft.fill;
  ctx.beginPath();
  if (craft.shape === "slim") {
    ctx.moveTo(player.width / 2, 0);
    ctx.lineTo(-player.width / 2, -player.height * 0.34);
    ctx.lineTo(-player.width / 2 + 5, 0);
    ctx.lineTo(-player.width / 2, player.height * 0.34);
  } else if (craft.shape === "armored") {
    ctx.moveTo(player.width / 2, 0);
    ctx.lineTo(player.width * 0.08, -player.height / 2);
    ctx.lineTo(-player.width / 2, -player.height * 0.4);
    ctx.lineTo(-player.width * 0.28, 0);
    ctx.lineTo(-player.width / 2, player.height * 0.4);
    ctx.lineTo(player.width * 0.08, player.height / 2);
  } else {
    ctx.moveTo(player.width / 2, 0);
    ctx.lineTo(-player.width / 2, -player.height / 2);
    ctx.lineTo(-player.width / 2 + 8, 0);
    ctx.lineTo(-player.width / 2, player.height / 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = craft.outline;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = craft.accent;
  ctx.lineWidth = craft.shape === "armored" ? 2 : 1.5;
  ctx.beginPath();
  if (craft.shape === "armored") {
    ctx.moveTo(player.width * 0.1, -player.height * 0.3);
    ctx.lineTo(-player.width * 0.2, 0);
    ctx.lineTo(player.width * 0.1, player.height * 0.3);
    ctx.moveTo(-player.width * 0.34, -player.height * 0.23);
    ctx.lineTo(-player.width * 0.34, player.height * 0.23);
  } else {
    ctx.moveTo(-player.width * 0.22, 0);
    ctx.lineTo(player.width * 0.24, 0);
  }
  ctx.stroke();
  if (dashIntensity > 0) {
    const pulse = 0.55 + Math.sin((1 - dashIntensity) * Math.PI * 3) * 0.15;
    ctx.globalAlpha = pulse;
    setGlow(ctx, theme.dash.outline, 12 + dashIntensity * 8);
    ctx.strokeStyle = theme.dash.outline;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    resetGlow(ctx);
    ctx.globalAlpha = 0.72 + dashIntensity * 0.22;
    ctx.fillStyle = craft.accent;
    ctx.beginPath();
    ctx.arc(-player.width / 5, 0, 3 + dashIntensity * 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    resetGlow(ctx);
    ctx.fillStyle = craft.accent;
    ctx.beginPath();
    ctx.arc(-player.width / 5, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  resetGlow(ctx);
  ctx.restore();
}
function drawShipDeathEffect(ctx, effect, aircraftId = "default", reducedMotion = false) {
  if (!effect || !Number.isFinite(effect.durationSeconds) || effect.durationSeconds <= 0) return;
  const progress = Math.max(0, Math.min(1, effect.elapsedSeconds / effect.durationSeconds));
  const craft = AIRCRAFT_VISUALS[aircraftId] ?? AIRCRAFT_VISUALS.default;
  const alpha = (1 - progress) * (reducedMotion ? 0.5 : 1);
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffffff";
  setGlow(ctx, craft.accent, reducedMotion ? 12 : 24 * (1 - progress));
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, reducedMotion ? 9 : 5 + (1 - progress) * 15, 0, Math.PI * 2);
  ctx.fill();
  resetGlow(ctx);
  if (!reducedMotion) {
    const fragmentCount = 10;
    for (let index = 0; index < fragmentCount; index += 1) {
      const angle = index * Math.PI * 2 / fragmentCount + Math.PI / 10;
      const distance = 8 + progress * 46;
      const size = 2 + index % 3 * 1.2;
      const x = effect.x + Math.cos(angle) * distance;
      const y = effect.y + Math.sin(angle) * distance;
      ctx.fillStyle = index % 2 === 0 ? craft.outline : craft.accent;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * size * 2, y + Math.sin(angle) * size * 2);
      ctx.lineTo(x + Math.cos(angle + 2.4) * size, y + Math.sin(angle + 2.4) * size);
      ctx.lineTo(x + Math.cos(angle - 2.4) * size, y + Math.sin(angle - 2.4) * size);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}
function drawShipExhaust(ctx, player, aircraftId = "default", _elapsedSeconds = 0, flightTrail = []) {
  const craft = AIRCRAFT_VISUALS[aircraftId] ?? AIRCRAFT_VISUALS.default;
  if (!Array.isArray(flightTrail) || flightTrail.length < 2) return;
  ctx.save();
  ctx.strokeStyle = craft.accent;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  setGlow(ctx, craft.accent, 9);
  const segmentCount = flightTrail.length - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    const start = flightTrail[index];
    const end = flightTrail[index + 1];
    const agePosition = index / Math.max(1, segmentCount - 1);
    ctx.globalAlpha = 0.18 + agePosition * 0.74;
    ctx.lineWidth = 0.7 + agePosition * 4.8;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  resetGlow(ctx);
  ctx.restore();
}
function getDashIntensity(player) {
  if (!player?.isDashing) return 0;
  const remaining = Number(player.dashRemainingSeconds);
  if (!Number.isFinite(remaining)) return 1;
  return Math.max(0, Math.min(1, remaining / DASH_DURATION_SECONDS));
}
function drawDashTrail(ctx, player, theme = VISUAL_THEME) {
  const intensity = getDashIntensity(player);
  if (intensity <= 0) return;
  ctx.save();
  const rearX = player.x - player.width / 2;
  const maxLength = player.width * theme.dash.maxTrailLengthMultiplier;
  setGlow(ctx, theme.dash.trail, 10 + intensity * 6);
  ctx.strokeStyle = theme.dash.trail;
  ctx.lineWidth = theme.dash.lineWidth;
  for (const line of theme.dash.lines) {
    const length = maxLength * line.lengthMultiplier * (0.72 + intensity * 0.28);
    ctx.globalAlpha = line.alpha * (0.55 + intensity * 0.45);
    ctx.beginPath();
    ctx.moveTo(rearX, player.y + player.height * line.verticalOffset);
    ctx.lineTo(rearX - length, player.y + player.height * line.verticalOffset);
    ctx.stroke();
  }
  ctx.restore();
}
function drawDashShockRing(ctx, player, theme = VISUAL_THEME) {
  if (!player?.isDashing) return;
  const elapsed = DASH_DURATION_SECONDS * (1 - getDashIntensity(player));
  if (elapsed >= 0.24) return;
  const progress = elapsed / 0.24;
  const radius = player.width * (0.65 + progress * 0.9);
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(0.65, 1);
  ctx.globalAlpha = (1 - progress) * 0.95;
  setGlow(ctx, theme.dashBurst, 20);
  for (const [color, width] of [[theme.dashBurst, 4], ["#f4ffff", 1.8]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0.15, 2.9);
    ctx.arc(0, 0, radius, 3.3, 6.05);
    ctx.stroke();
  }
  ctx.strokeStyle = "#efffff";
  ctx.lineWidth = 1.4;
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4 + 0.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * (radius + 3), Math.sin(angle) * (radius + 3));
    ctx.lineTo(Math.cos(angle) * (radius + 9 + progress * 8), Math.sin(angle) * (radius + 9 + progress * 8));
    ctx.stroke();
  }
  resetGlow(ctx);
  ctx.restore();
}
function getTimingGuideWidth(obstacle, difficulty) {
  if (obstacle?.kind !== "special" || !obstacle.showTimingGuide) return 0;
  if (obstacle.passed && Number.isFinite(obstacle.timingGuideWidthPx)) return Math.max(0, obstacle.timingGuideWidthPx);
  const speed = Number(difficulty?.scrollSpeed);
  const windowSeconds = Number(difficulty?.timingWindowSeconds);
  if (!Number.isFinite(speed) || !Number.isFinite(windowSeconds)) return 0;
  return Math.max(0, speed * windowSeconds);
}
function drawSpecialTimingGuide(ctx, obstacle, difficulty, width, reducedMotion = false) {
  if (width <= 0) return;
  const playerX = Number.isFinite(difficulty?.playerX) ? difficulty.playerX : 240;
  const leadingEdge = getSpecialSuccessBounds({ x: playerX, y: 0 }).right;
  const progress = Math.max(0, Math.min(1, 1 - (obstacle.x - leadingEdge) / Math.max(1, width)));
  const elapsed = Number.isFinite(difficulty?.elapsedSeconds) ? difficulty.elapsedSeconds : 0;
  const pulse = reducedMotion ? 0 : Math.sin(elapsed * 6) * 0.04;
  const left = obstacle.x - width;
  ctx.save();
  ctx.globalAlpha = reducedMotion ? 0.42 : Math.max(0.31, Math.min(0.47, 0.35 + progress * 0.08 + pulse));
  ctx.fillStyle = "#55f6e5";
  ctx.fillRect(left, 0, width, WORLD_HEIGHT);
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = "#cafffa";
  ctx.lineWidth = 2;
  setGlow(ctx, "#55f6e5", reducedMotion ? 8 : 13);
  ctx.beginPath();
  ctx.moveTo(left, 0);
  ctx.lineTo(left, WORLD_HEIGHT);
  ctx.moveTo(obstacle.x, 0);
  ctx.lineTo(obstacle.x, WORLD_HEIGHT);
  ctx.stroke();
  resetGlow(ctx);
  ctx.restore();
}
function resolveStageTheme(stageId) {
  return stageId ? getStageVisualTheme(stageId) : VISUAL_THEME;
}
function getStageAsset(visualAssets, stageId, assetName) {
  const stageManifest = VISUAL_ASSET_MANIFEST.stages[stageId];
  if (!stageManifest) return null;
  return visualAssets?.get(`stages.${stageId}.${assetName}`) ?? visualAssets?.get(stageManifest[assetName]) ?? null;
}
function drawClippedWallAsset(ctx, image, obstacle, y, height, sourceXRatio, sourceWidthRatio) {
  if (!image || height <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(obstacle.x, y, obstacle.width, height);
  ctx.clip();
  const sourceX = image.width * sourceXRatio;
  const sourceWidth = image.width * sourceWidthRatio;
  const tileHeight = image.height * (obstacle.width / sourceWidth);
  for (let tileY = y; tileY < y + height; tileY += tileHeight) {
    ctx.drawImage(
      image,
      sourceX,
      0,
      sourceWidth,
      image.height,
      obstacle.x,
      tileY,
      obstacle.width,
      tileHeight
    );
  }
  ctx.restore();
}
function drawObstacle(ctx, obstacle, theme = VISUAL_THEME, difficulty = null, visualAssets = null, reducedMotion = false) {
  if (obstacle.kind === "hybrid") {
    drawObstacle(ctx, { ...obstacle, kind: "normal", showTimingGuide: false, breakEffect: null }, theme, difficulty, visualAssets, reducedMotion);
    const barrier = getDashBarrierBounds(obstacle);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, obstacle.gapCenter - obstacle.gapHeight / 2, WORLD_WIDTH, obstacle.gapHeight);
    ctx.clip();
    const breakEffect = obstacle.breakEffect ?? (obstacle.barrierBroken ? { centerY: obstacle.barrierBreakY, remainingSeconds: 0, durationSeconds: 1, seed: 0 } : null);
    drawObstacle(ctx, { ...obstacle, ...barrier, kind: "special", breakEffect }, theme, difficulty, visualAssets, reducedMotion);
    ctx.restore();
    return;
  }
  const isSpecial = obstacle.kind === "special";
  const visual = obstacle.stageId ? resolveStageTheme(obstacle.stageId) : theme;
  const primary = isSpecial ? visual.specialObstacle : visual.obstacle;
  const accent = isSpecial ? visual.specialAccent : visual.obstacleAccent;
  const gapTop = obstacle.gapCenter - obstacle.gapHeight / 2;
  const bottomTop = obstacle.gapCenter + obstacle.gapHeight / 2;
  const timingGuideWidth = getTimingGuideWidth(obstacle, difficulty);
  const wallAsset = getStageAsset(
    visualAssets,
    obstacle.stageId,
    isSpecial ? "specialWall" : "normalWall"
  );
  ctx.save();
  setGlow(ctx, primary, theme.obstacleGlow ?? 12);
  ctx.fillStyle = primary;
  if (isSpecial) {
    const effect = obstacle.breakEffect;
    const opening = effect ? Math.max(0, Math.min(WORLD_HEIGHT, effect.centerY ?? 0)) : null;
    const effectProgress = effect ? Math.max(0, Math.min(1, 1 - effect.remainingSeconds / Math.max(1e-3, effect.durationSeconds ?? 0.65))) : 0;
    const openingHalfHeight = (theme.breakOpeningHalfHeight ?? 28) + effectProgress * 24;
    if (opening === null) ctx.fillRect(obstacle.x, 0, obstacle.width, WORLD_HEIGHT);
    else {
      const top = Math.max(0, opening - openingHalfHeight);
      const bottom = Math.min(WORLD_HEIGHT, opening + openingHalfHeight);
      ctx.fillRect(obstacle.x, 0, obstacle.width, top);
      ctx.fillRect(obstacle.x, bottom, obstacle.width, WORLD_HEIGHT - bottom);
      ctx.strokeStyle = theme.breakFragment;
      ctx.lineWidth = 2;
      for (let index = 0; index < 4; index += 1) {
        const y = opening + (index - 1.5) * 12;
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width / 2, y);
        ctx.lineTo(obstacle.x + (index % 2 ? -10 : obstacle.width + 10), y + (index - 1.5) * 8);
        ctx.stroke();
      }
    }
    if (wallAsset) {
      const effect2 = obstacle.breakEffect;
      if (!effect2) {
        drawClippedWallAsset(ctx, wallAsset, obstacle, 0, WORLD_HEIGHT, 0.455, 0.09);
      } else {
        const opening2 = Math.max(0, Math.min(WORLD_HEIGHT, effect2.centerY ?? 0));
        const progress = Math.max(0, Math.min(1, 1 - effect2.remainingSeconds / Math.max(1e-3, effect2.durationSeconds ?? 0.65)));
        const halfHeight = (theme.breakOpeningHalfHeight ?? 28) + progress * 24;
        const top = Math.max(0, opening2 - halfHeight);
        const bottom = Math.min(WORLD_HEIGHT, opening2 + halfHeight);
        drawClippedWallAsset(ctx, wallAsset, obstacle, 0, top, 0.455, 0.09);
        drawClippedWallAsset(ctx, wallAsset, obstacle, bottom, WORLD_HEIGHT - bottom, 0.455, 0.09);
      }
    }
  } else {
    ctx.fillRect(obstacle.x, 0, obstacle.width, gapTop);
    ctx.fillRect(obstacle.x, bottomTop, obstacle.width, WORLD_HEIGHT - bottomTop);
    if (wallAsset) {
      drawClippedWallAsset(ctx, wallAsset, obstacle, 0, gapTop, 0.37, 0.26);
      drawClippedWallAsset(ctx, wallAsset, obstacle, bottomTop, WORLD_HEIGHT - bottomTop, 0.37, 0.26);
    }
  }
  resetGlow(ctx);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (isSpecial) {
    ctx.moveTo(obstacle.x, 0);
    ctx.lineTo(obstacle.x, WORLD_HEIGHT);
    ctx.moveTo(obstacle.x + obstacle.width, 0);
    ctx.lineTo(obstacle.x + obstacle.width, WORLD_HEIGHT);
  } else {
    ctx.moveTo(obstacle.x, gapTop);
    ctx.lineTo(obstacle.x + obstacle.width, gapTop);
    ctx.moveTo(obstacle.x, bottomTop);
    ctx.lineTo(obstacle.x + obstacle.width, bottomTop);
  }
  ctx.stroke();
  if (isSpecial) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (let y = 14; y < WORLD_HEIGHT; y += 24) {
      ctx.beginPath();
      ctx.moveTo(obstacle.x + 8, y);
      ctx.lineTo(obstacle.x + obstacle.width - 8, y + 10);
      ctx.stroke();
    }
    const effect = obstacle.breakEffect;
    if (effect) {
      const progress = Math.max(0, Math.min(1, 1 - effect.remainingSeconds / Math.max(1e-3, effect.durationSeconds ?? 0.65)));
      const centerX = obstacle.x + obstacle.width / 2;
      const centerY = Math.max(0, Math.min(WORLD_HEIGHT, effect.centerY ?? 0));
      const seed = Number.isFinite(effect.seed) ? effect.seed : 0;
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.95;
      ctx.strokeStyle = theme.breakRing ?? "#7cfff2";
      ctx.lineWidth = 4 - progress * 2;
      setGlow(ctx, theme.breakRing ?? "#7cfff2", 18);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12 + progress * 72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = (1 - progress) * 0.9;
      ctx.strokeStyle = theme.breakFragment;
      ctx.lineWidth = 3 - progress * 1.5;
      for (let index = 0; index < 8; index += 1) {
        const angle = seed + index / 8 * Math.PI * 2;
        const inner = 8 + progress * 22;
        const outer = 22 + progress * 68;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
        ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
        ctx.stroke();
      }
      resetGlow(ctx);
      ctx.restore();
    }
  } else {
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    const style = visual.obstacleStyle;
    for (const y of [Math.max(8, gapTop * 0.48), bottomTop + (WORLD_HEIGHT - bottomTop) * 0.5]) {
      if (y < 0 || y > WORLD_HEIGHT) continue;
      ctx.beginPath();
      if (style === "industrial" || style === "solar") {
        ctx.moveTo(obstacle.x + 5, y);
        ctx.lineTo(obstacle.x + obstacle.width - 5, y);
      } else if (style === "gravity") {
        ctx.moveTo(obstacle.x + obstacle.width / 2, y - 7);
        ctx.lineTo(obstacle.x + obstacle.width / 2, y + 7);
      } else {
        ctx.moveTo(obstacle.x + 6, y - 6);
        ctx.lineTo(obstacle.x + obstacle.width - 6, y + 6);
      }
      ctx.stroke();
    }
  }
  if (timingGuideWidth > 0) drawSpecialTimingGuide(ctx, obstacle, difficulty, timingGuideWidth, reducedMotion);
  ctx.restore();
}
function drawStageArtwork(ctx, background, elapsedSeconds = 0, reducedMotion = false, scrollDistancePx = 0, scrollSpeed = 240, stableVertical = false) {
  const sceneAlpha = ctx.globalAlpha ?? 1;
  const scale = 1.12;
  const width = WORLD_WIDTH * scale;
  const height = WORLD_HEIGHT * scale;
  const overflowY = height - WORLD_HEIGHT;
  const offsetY = overflowY / 2 + (reducedMotion || stableVertical ? 0 : Math.sin(elapsedSeconds * 0.12) * Math.min(overflowY * 0.18, 7));
  if (reducedMotion) {
    ctx.drawImage(background, -(width - WORLD_WIDTH) / 2, -offsetY, width, height);
  } else {
    const overlap = Math.min(width * 0.12, Math.max(12, scrollSpeed * 0.25 * 0.35));
    const period = width - overlap;
    const phase = (scrollDistancePx % period + period) % period;
    const firstX = -phase;
    const nextX = period - phase;
    ctx.drawImage(background, firstX, -offsetY, width, height);
    const strips = 8;
    for (let index = 0; index < strips; index += 1) {
      const stripX = nextX + overlap * index / strips;
      const stripWidth = overlap / strips + 1;
      ctx.save();
      ctx.beginPath();
      ctx.rect(stripX, 0, stripWidth, WORLD_HEIGHT);
      ctx.clip();
      ctx.globalAlpha = sceneAlpha * (index + 1) / strips;
      ctx.drawImage(background, nextX, -offsetY, width, height);
      ctx.restore();
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(nextX + overlap, 0, WORLD_WIDTH - nextX - overlap, WORLD_HEIGHT);
    ctx.clip();
    ctx.drawImage(background, nextX, -offsetY, width, height);
    ctx.restore();
  }
  ctx.fillStyle = "rgba(2, 6, 18, 0.34)";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}
function drawStageBackground(ctx, stageId, elapsedSeconds = 0, boss = false, visualAssets = null, reducedMotion = false, scrollDistancePx = 0, scrollSpeed = 240) {
  const theme = resolveStageTheme(stageId);
  const background = getStageAsset(visualAssets, stageId, boss ? "bossBackground" : "background");
  if (background) {
    drawStageArtwork(ctx, background, elapsedSeconds, reducedMotion, scrollDistancePx, scrollSpeed, boss);
    return;
  }
  ctx.fillStyle = boss ? theme.bossBackground : theme.background;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  const gradient = ctx.createRadialGradient?.(
    WORLD_WIDTH * 0.63,
    WORLD_HEIGHT * 0.46,
    18,
    WORLD_WIDTH * 0.63,
    WORLD_HEIGHT * 0.46,
    WORLD_WIDTH * 0.8
  );
  if (gradient) {
    gradient.addColorStop(0, `${theme.backgroundGlow}${boss ? "55" : "88"}`);
    gradient.addColorStop(1, `${boss ? theme.bossBackground : theme.background}00`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }
  ctx.fillStyle = theme.star;
  for (let index = 0; index < STAR_FIELD.length; index += 1) {
    const [baseX, baseY, radius] = STAR_FIELD[index];
    const x = ((baseX - scrollDistancePx * (0.7 + index * 0.04)) % WORLD_WIDTH + WORLD_WIDTH) % WORLD_WIDTH;
    const y = baseY + (boss ? 0 : Math.sin(elapsedSeconds * 0.22 + index) * 4);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.globalAlpha = boss ? 0.17 : 0.12;
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 1;
  const style = theme.particleStyle;
  for (let index = 0; index < 7; index += 1) {
    const x = ((index * 173 - scrollDistancePx) % (WORLD_WIDTH + 100) + WORLD_WIDTH + 100) % (WORLD_WIDTH + 100) - 50;
    const y = (index * 89 + 24) % WORLD_HEIGHT;
    ctx.beginPath();
    if (style === "gravity") {
      ctx.arc(x, y, 18 + index % 3 * 8, -0.5, 1.4);
    } else if (style === "industrial" || style === "solar") {
      ctx.moveTo(x - 24, y);
      ctx.lineTo(x + 24, y);
      ctx.lineTo(x + 24, y + 16);
    } else if (style === "abyssal") {
      ctx.moveTo(x - 28, y);
      ctx.lineTo(x - 12, y - 4);
      ctx.lineTo(x + 6, y + 3);
      ctx.lineTo(x + 28, y - 2);
    } else {
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x + 12, y);
      ctx.lineTo(x, y + 18);
      ctx.lineTo(x - 12, y);
      ctx.closePath();
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 18, 0.1)";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.restore();
}
function drawBackground(ctx, theme) {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  const gradient = ctx.createRadialGradient?.(WORLD_WIDTH / 2, 0, 20, WORLD_WIDTH / 2, 0, WORLD_HEIGHT);
  if (gradient) {
    gradient.addColorStop(0, `${theme.backgroundGlow}99`);
    gradient.addColorStop(1, `${theme.background}00`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }
  ctx.fillStyle = theme.star;
  for (const [x, y, radius] of STAR_FIELD) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
function backgroundKeyToId(key) {
  return (key ?? "crystal-gates").replace(/-boss$/, "");
}
function drawBackgroundTransition(ctx, stage, elapsedSeconds, visualAssets = null, reducedMotion = null, scrollDistancePx = 0, scrollSpeed = 240) {
  const transition = stage?.transition;
  const prefersReducedMotion = resolveReducedMotion(reducedMotion);
  if (!transition) {
    drawStageBackground(ctx, stage?.id, elapsedSeconds, stage?.mode === "boss", visualAssets, prefersReducedMotion, scrollDistancePx, scrollSpeed);
    return;
  }
  const key = transition.swapped ? transition.toKey : transition.fromKey;
  drawStageBackground(
    ctx,
    backgroundKeyToId(key),
    elapsedSeconds,
    String(key).endsWith("-boss"),
    visualAssets,
    prefersReducedMotion,
    scrollDistancePx,
    scrollSpeed
  );
}
function drawStageAtmosphere(ctx, mode, elapsedSeconds = 0) {
  if (mode !== "warning" && mode !== "boss") return;
  ctx.save();
  if (mode === "boss") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  } else {
    const pulse = 0.035 + (Math.sin(elapsedSeconds * 5) + 1) * 0.012;
    ctx.fillStyle = `rgba(255, 42, 86, ${pulse})`;
  }
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.restore();
}
function drawMenuNebula(ctx, theme) {
  const gradient = ctx.createRadialGradient?.(280, 250, 30, 280, 250, 360);
  if (!gradient) return;
  gradient.addColorStop(0, "#553cbd44");
  gradient.addColorStop(0.55, `${theme.backgroundGlow}44`);
  gradient.addColorStop(1, `${theme.background}00`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}
function drawMenuDepthLines(ctx, theme) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = theme.star;
  ctx.lineWidth = 1;
  for (let offset = -160; offset <= 160; offset += 80) {
    ctx.beginPath();
    ctx.moveTo(WORLD_WIDTH, WORLD_HEIGHT / 2 + offset * 0.3);
    ctx.lineTo(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + offset);
    ctx.stroke();
  }
  ctx.restore();
}
function drawBoss(ctx, difficulty, theme, boss = null, elapsedSeconds = 0, visualAssets = null, stageId = null, reducedMotion = false) {
  if (!difficulty?.isBoss) {
    return;
  }
  ctx.save();
  const hitProgress = boss?.hitEffect ? Math.max(0, Math.min(1, boss.hitEffect.remainingSeconds / (boss.hitEffect.durationSeconds || 1))) : 0;
  const entryProgress = boss?.entranceDurationSeconds ? Math.max(0, Math.min(1, 1 - (boss.entranceRemainingSeconds ?? 0) / boss.entranceDurationSeconds)) : 1;
  const identity = boss?.stageId ?? stageId;
  const pose = boss?.pose ?? getBossPose({ animation: boss?.animation, idleElapsedSeconds: boss?.motionSeconds ?? elapsedSeconds, reducedMotion });
  const geometry = boss?.geometry ?? getBossGeometry(identity, entryProgress, boss?.motionSeconds ?? 0);
  const { x, y } = geometry.center;
  const image = getStageAsset(visualAssets, identity, "boss");
  const rig = BOSS_RIGS[identity] ?? BOSS_RIGS["crystal-gates"];
  if (image) {
    ctx.globalAlpha = 1;
    const prepared = getPreparedBossRig(identity, image);
    if (prepared) drawBossRig(ctx, {
      rig,
      prepared,
      pose,
      box: geometry.box,
      projectileImage: getStageAsset(visualAssets, identity, "projectile"),
      reducedMotion,
      geometryIncludesRecoil: Boolean(boss?.geometry)
    });
    else ctx.drawImage(image, geometry.box.x, geometry.box.y, 192, 128);
    drawBossActionEffects(ctx, { rig, pose, box: geometry.box, action: boss?.roar, reducedMotion });
    if (hitProgress > 0) {
      ctx.globalAlpha = hitProgress * 0.65;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, 58, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    ctx.globalAlpha = 0.9;
    setGlow(ctx, theme.boss, 28);
    ctx.fillStyle = theme.boss;
    ctx.beginPath();
    ctx.arc(x, y, 68, 0, Math.PI * 2);
    ctx.fill();
    resetGlow(ctx);
    ctx.fillStyle = theme.background ?? "#050816";
    ctx.beginPath();
    ctx.arc(x, y, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hitProgress > 0 ? "#ffffff" : theme.boss;
    ctx.beginPath();
    ctx.arc(x - 18, y - 9, 7, 0, Math.PI * 2);
    ctx.arc(x + 18, y - 9, 7, 0, Math.PI * 2);
    ctx.fill();
    const style = theme.bossStyle;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (style === "gravity-crescent") {
      ctx.arc(x, y, 80, -1.15, 1.15);
    } else if (style === "orbital-factory" || style === "solar-machine") {
      ctx.moveTo(x - 74, y - 50);
      ctx.lineTo(x - 96, y - 12);
      ctx.lineTo(x - 72, y + 47);
      ctx.moveTo(x + 55, y - 40);
      ctx.lineTo(x + 82, y);
      ctx.lineTo(x + 54, y + 42);
    } else if (style === "abyssal-leviathan") {
      ctx.moveTo(x - 54, y + 38);
      ctx.lineTo(x - 98, y + 62);
      ctx.lineTo(x - 76, y + 6);
      ctx.moveTo(x - 54, y - 38);
      ctx.lineTo(x - 98, y - 62);
      ctx.lineTo(x - 76, y - 6);
    } else {
      ctx.moveTo(x - 60, y - 54);
      ctx.lineTo(x - 80, y);
      ctx.lineTo(x - 60, y + 54);
      ctx.moveTo(x + 60, y - 54);
      ctx.lineTo(x + 80, y);
      ctx.lineTo(x + 60, y + 54);
    }
    ctx.stroke();
  }
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.restore();
}
function drawProjectile(ctx, attack, theme, visualAssets = null, stageId = null) {
  if (attack?.type === "volley") {
    for (const projectile of attack.projectiles ?? []) {
      if (projectile.state !== "resolved") drawProjectile(ctx, projectile, theme, visualAssets, attack.stageId ?? stageId);
    }
    return;
  }
  if (!attack || attack.type !== "projectile") return;
  const color = theme.projectile;
  ctx.save();
  if (attack.state === "charging" && attack.telegraphPoints?.length > 1) {
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    setGlow(ctx, color, 16);
    ctx.beginPath();
    attack.telegraphPoints.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    resetGlow(ctx);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#f4ffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    attack.telegraphPoints.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
    attack.telegraphPoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#f4ffff";
      ctx.fill();
    });
  } else if (attack.state === "charging") {
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    setGlow(ctx, color, 16);
    ctx.beginPath();
    ctx.moveTo(attack.bossX, attack.bossY);
    ctx.lineTo(attack.targetX, attack.targetY);
    ctx.stroke();
    resetGlow(ctx);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#f4ffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(attack.bossX, attack.bossY);
    ctx.lineTo(attack.targetX, attack.targetY);
    ctx.stroke();
  }
  if (attack.state !== "charging") {
    ctx.globalAlpha = attack.state === "returning" ? 1 : 0.92;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    setGlow(ctx, color, 18);
    ctx.beginPath();
    ctx.arc(attack.x, attack.y, 18, 0, Math.PI * 2);
    ctx.stroke();
    resetGlow(ctx);
    ctx.strokeStyle = "#f4ffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(attack.x, attack.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    setGlow(ctx, color, attack.state === "returning" ? 18 : 12);
    const image = getStageAsset(visualAssets, stageId, "projectile");
    if (image) {
      ctx.save();
      ctx.translate(attack.x, attack.y);
      if (attack.state === "returning") ctx.rotate(Math.PI);
      ctx.drawImage(image, -16, -11, 32, 22);
      ctx.restore();
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(attack.x, attack.y, attack.state === "returning" ? 9 : 7, 0, Math.PI * 2);
      ctx.fill();
    }
    resetGlow(ctx);
    if (attack.state === "returning") {
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(attack.x, attack.y);
      ctx.lineTo(attack.bossX, attack.bossY);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function drawCounterattack(ctx, counterattack, theme) {
  if (!counterattack) return;
  const t = Math.max(0, Math.min(1, counterattack.elapsedSeconds / counterattack.durationSeconds));
  const x = counterattack.fromX + (counterattack.toX - counterattack.fromX) * t;
  const y = counterattack.fromY + (counterattack.toY - counterattack.fromY) * t;
  ctx.save();
  ctx.strokeStyle = "#f0fcff";
  ctx.lineWidth = 5;
  setGlow(ctx, theme.accent, 20);
  ctx.beginPath();
  ctx.moveTo(x - 42, y);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawManualLaser(ctx, shot, player, theme, _core) {
  if (!shot || !player) return;
  const x = (shot.fromX ?? player.x) + 28, y = shot.fromY ?? player.y;
  const target = { x: WORLD_WIDTH, y };
  ctx.save();
  setGlow(ctx, theme.accent, 24);
  if (shot.elapsedSeconds < shot.chargeSeconds) {
    const progress = shot.elapsedSeconds / shot.chargeSeconds;
    const glow3 = ctx.createRadialGradient(x, y, 0, x, y, 8 + progress * 14);
    glow3.addColorStop(0, "#ffffff");
    glow3.addColorStop(0.3, "#bafcff");
    glow3.addColorStop(1, "#65dcff00");
    ctx.fillStyle = glow3;
    ctx.beginPath();
    ctx.arc(x, y, 8 + progress * 14, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.lineCap = "round";
    for (const [width, color, alpha] of [[24, theme.accent, 0.25], [11, "#85edff", 0.85], [4, "#ffffff", 1]]) {
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(target.x, target.y, 16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawChallengeEffects(ctx, challenge, feedbackEffect, player = null, reducedMotion = false) {
  if (challenge?.active) {
    ctx.save();
    ctx.fillStyle = "rgba(2, 4, 12, 0.66)";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.restore();
  }
  drawChallengeFailure(ctx, feedbackEffect, player, { reducedMotion });
}
function drawDashCooldown(ctx, player) {
  const remaining = player?.dashCooldownRemainingSeconds ?? 0;
  if (!(remaining > 0)) return;
  const progress = 1 - Math.max(0, Math.min(1, remaining / DASH_COOLDOWN_SECONDS));
  const radius = 8, x = player.x - 36, y = player.y - 24;
  ctx.save();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "rgba(2, 8, 20, 0.85)";
  ctx.beginPath();
  ctx.arc(x, y, radius + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineCap = "round";
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
function createRenderer(canvas, { visualAssets = null, reducedMotion = null } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context\uB97C \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }
  let resolution = null;
  let lastScene = null;
  let destroyed = false;
  function syncResolution() {
    const bounds = canvas.getBoundingClientRect?.();
    const next = getRenderResolution({ width: bounds?.width, height: bounds?.height, dpr: getDevicePixelRatio() });
    const changed = !resolution || canvas.width !== next.width || canvas.height !== next.height;
    resolution = next;
    if (canvas.width !== next.width) canvas.width = next.width;
    if (canvas.height !== next.height) canvas.height = next.height;
    canvas.style.aspectRatio = "auto";
    if (changed) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.setTransform?.(next.scaleX, 0, 0, next.scaleY, 0, 0);
    }
    return changed;
  }
  function resize() {
    if (destroyed || !syncResolution() || !lastScene) return;
    if (lastScene.kind === "menu") renderMenuBackground();
    else render(lastScene.snapshot, lastScene.options);
  }
  function render(snapshot, { showPlayerHitbox = false } = {}) {
    if (destroyed) return;
    syncResolution();
    lastScene = { kind: "game", snapshot, options: { showPlayerHitbox } };
    ctx.save();
    ctx.setTransform?.(resolution.scaleX, 0, 0, resolution.scaleY, 0, 0);
    const stage = snapshot.stage ?? { id: "crystal-gates", mode: "normal", elapsedSeconds: snapshot.elapsedSeconds ?? 0 };
    const theme = resolveStageTheme(stage.id);
    const elapsed = stage.elapsedSeconds ?? snapshot.elapsedSeconds ?? 0;
    const prefersReducedMotion = resolveReducedMotion(reducedMotion);
    const backgroundScroll = snapshot.backgroundScrollDistancePx ?? elapsed * (snapshot.difficulty?.scrollSpeed ?? 240) * 0.25;
    const scrollSpeed = snapshot.backgroundScrollSpeed ?? snapshot.difficulty?.scrollSpeed ?? 240;
    drawBackgroundTransition(ctx, stage, elapsed, visualAssets, reducedMotion, backgroundScroll, scrollSpeed);
    drawStageAtmosphere(ctx, stage.mode, elapsed);
    if (stage.transition?.kind === "portal") {
      drawPortal(ctx, {
        transition: stage.transition,
        destinationBackground: getStageAsset(visualAssets, stage.transition.destinationStageId, "background"),
        ornamentImage: getStageAsset(visualAssets, stage.transition.destinationStageId, "portalOrnaments"),
        reducedMotion: prefersReducedMotion
      });
    }
    for (const obstacle of snapshot.obstacles ?? []) {
      const stageObstacle = obstacle.stageId ? obstacle : { ...obstacle, stageId: stage.id };
      drawObstacle(ctx, stageObstacle, theme, {
        ...snapshot.difficulty,
        playerX: snapshot.player?.x ?? 240,
        elapsedSeconds: snapshot.elapsedSeconds ?? elapsed
      }, visualAssets, prefersReducedMotion);
    }
    if (snapshot.bossEntry?.darkness > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${snapshot.bossEntry.darkness})`;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      ctx.restore();
    }
    drawLaser(ctx, snapshot.boss?.attack ?? snapshot.ambientAttack);
    drawProjectile(ctx, snapshot.boss?.attack, theme, visualAssets, stage.id);
    drawBoss(ctx, snapshot.difficulty, theme, snapshot.boss, elapsed, visualAssets, stage.id, prefersReducedMotion);
    drawCounterattack(ctx, snapshot.boss?.counterattack, theme);
    if (!snapshot.deathEffect) {
      drawDashTrail(ctx, snapshot.player, VISUAL_THEME);
      drawDashShockRing(ctx, snapshot.player, VISUAL_THEME);
    }
    if (snapshot.deathEffect) {
      drawShipDeathEffect(ctx, snapshot.deathEffect, snapshot.deathEffect.aircraftId ?? snapshot.aircraft?.id, prefersReducedMotion);
    } else {
      drawShipExhaust(ctx, snapshot.player, snapshot.aircraft?.id, elapsed, snapshot.flightTrail);
      const shot = snapshot.boss?.weapon?.firing;
      const facing = shot ? { ...snapshot.player, facingAngle: 0 } : snapshot.player;
      drawShip(ctx, facing, VISUAL_THEME, snapshot.aircraft?.id, visualAssets);
      drawManualLaser(ctx, shot, snapshot.player, theme);
    }
    drawChallengeEffects(ctx, snapshot.challenge, snapshot.feedbackEffect, snapshot.player, prefersReducedMotion);
    if (!snapshot.deathEffect) drawDashCooldown(ctx, snapshot.player);
    if (showPlayerHitbox && !snapshot.deathEffect && snapshot.player) {
      const b = getPlayerBounds(snapshot.player);
      if (b && Object.values(b).every(Number.isFinite)) {
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        ctx.strokeRect(b.left, b.top, b.right - b.left, b.bottom - b.top);
        ctx.restore();
      }
    }
    if (snapshot.feedbackEffect) {
      drawLaser(ctx, snapshot.boss?.attack ?? snapshot.ambientAttack);
      drawProjectile(ctx, snapshot.boss?.attack, theme, visualAssets, snapshot.boss?.stageId ?? stage.id);
    }
    drawTransitionOverlay(ctx, { transition: stage.transition, reducedMotion: prefersReducedMotion });
    ctx.restore();
  }
  function renderMenuBackground() {
    if (destroyed) return;
    syncResolution();
    lastScene = { kind: "menu" };
    ctx.save();
    ctx.setTransform?.(resolution.scaleX, 0, 0, resolution.scaleY, 0, 0);
    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    const background = visualAssets?.get("menuBackground") ?? visualAssets?.get(VISUAL_ASSET_MANIFEST.menuBackground);
    if (background) {
      ctx.drawImage(background, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    } else {
      drawBackground(ctx, VISUAL_THEME);
      drawMenuNebula(ctx, VISUAL_THEME);
      drawMenuDepthLines(ctx, VISUAL_THEME);
    }
    ctx.restore();
  }
  resize();
  globalThis.addEventListener?.("resize", resize);
  const resizeObserver = typeof globalThis.ResizeObserver === "function" ? new globalThis.ResizeObserver(resize) : null;
  resizeObserver?.observe(canvas);
  return {
    resize,
    render,
    renderMenuBackground,
    destroy() {
      destroyed = true;
      lastScene = null;
      resizeObserver?.disconnect();
      globalThis.removeEventListener?.("resize", resize);
    }
  };
}
export {
  createRenderer,
  drawBoss,
  drawDashCooldown,
  drawDashShockRing,
  drawDashTrail,
  drawManualLaser,
  drawObstacle,
  drawShip,
  drawShipDeathEffect,
  drawShipExhaust
};
