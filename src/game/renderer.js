import {
  DASH_DURATION_SECONDS, STAGE_TRANSITION_SECONDS, WORLD_HEIGHT, WORLD_WIDTH,
} from './constants.js';
import {
  AIRCRAFT_VISUALS,
  getStageVisualTheme,
  STAR_FIELD,
  VISUAL_THEME,
} from './visual-theme.js';
import { VISUAL_ASSET_MANIFEST } from './visual-assets.js';

function getDevicePixelRatio() {
  return Math.max(1, Number(globalThis.devicePixelRatio) || 1);
}

function setGlow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function resetGlow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

export function drawShip(ctx, player, theme = VISUAL_THEME, aircraftId = 'default', visualAssets = null) {
  const tilt = Math.max(-0.35, Math.min(0.35, player.velocityY / 1000));
  const dashIntensity = getDashIntensity(player);
  const craft = AIRCRAFT_VISUALS[aircraftId] ?? AIRCRAFT_VISUALS.default;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(tilt);
  const image = visualAssets?.get(`aircraft.${aircraftId}`)
    ?? visualAssets?.get(VISUAL_ASSET_MANIFEST.aircraft[aircraftId] ?? VISUAL_ASSET_MANIFEST.aircraft.default);
  if (image) {
    const scale = Math.min(player.width / image.width, player.height / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    if (dashIntensity > 0) {
      ctx.globalAlpha = 0.55 + dashIntensity * 0.4;
      setGlow(ctx, theme.dash.outline, 12 + dashIntensity * 8);
      ctx.strokeStyle = theme.dash.outline;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-player.width / 2, -player.height / 2, player.width, player.height);
      ctx.beginPath();
      ctx.arc(-player.width / 4, 0, 2 + dashIntensity * 2, 0, Math.PI * 2);
      ctx.fillStyle = AIRCRAFT_VISUALS[aircraftId]?.accent ?? AIRCRAFT_VISUALS.default.accent;
      ctx.fill();
    }
    resetGlow(ctx);
    ctx.restore();
    return;
  }
  setGlow(ctx, craft.outline, theme.shipGlow);
  ctx.fillStyle = craft.fill;
  ctx.beginPath();
  if (craft.shape === 'slim') {
    ctx.moveTo(player.width / 2, 0);
    ctx.lineTo(-player.width / 2, -player.height * 0.34);
    ctx.lineTo(-player.width / 2 + 5, 0);
    ctx.lineTo(-player.width / 2, player.height * 0.34);
  } else if (craft.shape === 'armored') {
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
  ctx.lineWidth = craft.shape === 'armored' ? 2 : 1.5;
  ctx.beginPath();
  if (craft.shape === 'armored') {
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

function getDashIntensity(player) {
  if (!player?.isDashing) return 0;
  const remaining = Number(player.dashRemainingSeconds);
  if (!Number.isFinite(remaining)) return 1;
  return Math.max(0, Math.min(1, remaining / DASH_DURATION_SECONDS));
}

export function drawDashTrail(ctx, player, theme = VISUAL_THEME) {
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

function drawSpecialDashBurst(ctx, player, theme) {
  if (!player?.isDashing || player.dashKind !== 'special') return;

  const progress = 1 - getDashIntensity(player);
  const radius = player.width * (1 + progress * 2.4);
  ctx.save();
  ctx.globalAlpha = Math.max(0, 0.8 - progress * 0.7);
  setGlow(ctx, theme.dashBurst, 20);
  ctx.strokeStyle = theme.dashBurst;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha *= 0.55;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius * 1.45, 0, Math.PI * 2);
  ctx.stroke();
  for (let index = 0; index < 6; index += 1) {
    const angle = index * Math.PI / 3 + progress;
    ctx.beginPath();
    ctx.moveTo(player.x + Math.cos(angle) * radius, player.y + Math.sin(angle) * radius);
    ctx.lineTo(player.x + Math.cos(angle) * (radius + 16), player.y + Math.sin(angle) * (radius + 16));
    ctx.stroke();
  }
  ctx.restore();
}

function getTimingGuideWidth(obstacle, difficulty) {
  if (obstacle?.kind !== 'special' || !obstacle.showTimingGuide) return 0;
  const speed = Number(difficulty?.scrollSpeed);
  const windowSeconds = Number(difficulty?.timingWindowSeconds);
  if (!Number.isFinite(speed) || !Number.isFinite(windowSeconds)) return 0;
  return Math.max(0, speed * windowSeconds);
}

function resolveStageTheme(stageId) {
  return stageId ? getStageVisualTheme(stageId) : VISUAL_THEME;
}

function getStageAsset(visualAssets, stageId, assetName) {
  const stageManifest = VISUAL_ASSET_MANIFEST.stages[stageId];
  if (!stageManifest) return null;
  return visualAssets?.get(`stages.${stageId}.${assetName}`)
    ?? visualAssets?.get(stageManifest[assetName])
    ?? null;
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
    ctx.drawImage(image, sourceX, 0, sourceWidth, image.height,
      obstacle.x, tileY, obstacle.width, tileHeight);
  }
  ctx.restore();
}

export function drawObstacle(ctx, obstacle, theme = VISUAL_THEME, difficulty = null, visualAssets = null) {
  const isSpecial = obstacle.kind === 'special';
  const visual = obstacle.stageId ? resolveStageTheme(obstacle.stageId) : theme;
  const primary = isSpecial ? visual.specialObstacle : visual.obstacle;
  const accent = isSpecial ? visual.specialAccent : visual.obstacleAccent;
  const gapTop = obstacle.gapCenter - obstacle.gapHeight / 2;
  const bottomTop = obstacle.gapCenter + obstacle.gapHeight / 2;
  const timingGuideWidth = getTimingGuideWidth(obstacle, difficulty);
  const wallAsset = getStageAsset(
    visualAssets,
    obstacle.stageId,
    isSpecial ? 'specialWall' : 'normalWall',
  );

  ctx.save();
  if (timingGuideWidth > 0) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = theme.timingGuide;
    ctx.fillRect(obstacle.x - timingGuideWidth, 0, timingGuideWidth, WORLD_HEIGHT);
    ctx.globalAlpha = 1;
  }
  setGlow(ctx, primary, theme.obstacleGlow ?? 12);
  ctx.fillStyle = primary;
  if (isSpecial) {
    const effect = obstacle.breakEffect;
    const opening = effect ? Math.max(0, Math.min(WORLD_HEIGHT, effect.centerY ?? 0)) : null;
    if (opening === null) ctx.fillRect(obstacle.x, 0, obstacle.width, WORLD_HEIGHT);
    else {
      const top = Math.max(0, opening - (theme.breakOpeningHalfHeight ?? 28));
      const bottom = Math.min(WORLD_HEIGHT, opening + (theme.breakOpeningHalfHeight ?? 28));
      ctx.fillRect(obstacle.x, 0, obstacle.width, top);
      ctx.fillRect(obstacle.x, bottom, obstacle.width, WORLD_HEIGHT - bottom);
      ctx.strokeStyle = theme.breakFragment;
      ctx.lineWidth = 2;
      for (let index = 0; index < 4; index += 1) {
        const y = opening + (index - 1.5) * 12;
        ctx.beginPath(); ctx.moveTo(obstacle.x + obstacle.width / 2, y); ctx.lineTo(obstacle.x + (index % 2 ? -10 : obstacle.width + 10), y + (index - 1.5) * 8); ctx.stroke();
      }
    }
    if (wallAsset) {
      const effect = obstacle.breakEffect;
      if (!effect) {
        drawClippedWallAsset(ctx, wallAsset, obstacle, 0, WORLD_HEIGHT, 0.455, 0.09);
      } else {
        const opening = Math.max(0, Math.min(WORLD_HEIGHT, effect.centerY ?? 0));
        const top = Math.max(0, opening - (theme.breakOpeningHalfHeight ?? 28));
        const bottom = Math.min(WORLD_HEIGHT, opening + (theme.breakOpeningHalfHeight ?? 28));
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
  } else {
    // Quiet stage-specific panel seams add identity without changing the collision silhouette.
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    const style = visual.obstacleStyle;
    for (const y of [Math.max(8, gapTop * 0.48), bottomTop + (WORLD_HEIGHT - bottomTop) * 0.5]) {
      if (y < 0 || y > WORLD_HEIGHT) continue;
      ctx.beginPath();
      if (style === 'industrial' || style === 'solar') {
        ctx.moveTo(obstacle.x + 5, y);
        ctx.lineTo(obstacle.x + obstacle.width - 5, y);
      } else if (style === 'gravity') {
        ctx.moveTo(obstacle.x + obstacle.width / 2, y - 7);
        ctx.lineTo(obstacle.x + obstacle.width / 2, y + 7);
      } else {
        ctx.moveTo(obstacle.x + 6, y - 6);
        ctx.lineTo(obstacle.x + obstacle.width - 6, y + 6);
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawStageBackground(ctx, stageId, elapsedSeconds = 0, boss = false, visualAssets = null) {
  const theme = resolveStageTheme(stageId);
  const background = getStageAsset(visualAssets, stageId, boss ? 'bossBackground' : 'background');
  if (background) {
    ctx.drawImage(background, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    return;
  }
  ctx.fillStyle = boss ? theme.bossBackground : theme.background;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  const gradient = ctx.createRadialGradient?.(WORLD_WIDTH * 0.63, WORLD_HEIGHT * 0.46, 18,
    WORLD_WIDTH * 0.63, WORLD_HEIGHT * 0.46, WORLD_WIDTH * 0.8);
  if (gradient) {
    gradient.addColorStop(0, `${theme.backgroundGlow}${boss ? '55' : '88'}`);
    gradient.addColorStop(1, `${boss ? theme.bossBackground : theme.background}00`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }
  ctx.fillStyle = theme.star;
  for (let index = 0; index < STAR_FIELD.length; index += 1) {
    const [baseX, baseY, radius] = STAR_FIELD[index];
    const x = (baseX + elapsedSeconds * (6 + index * 1.3)) % WORLD_WIDTH;
    const y = baseY + Math.sin(elapsedSeconds * 0.22 + index) * 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Low-contrast motifs occupy the whole field; gameplay remains readable edge-to-edge.
  ctx.save();
  ctx.globalAlpha = boss ? 0.17 : 0.12;
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 1;
  const style = theme.particleStyle;
  for (let index = 0; index < 7; index += 1) {
    const x = (index * 173 + elapsedSeconds * (style === 'industrial' ? 12 : 4)) % (WORLD_WIDTH + 100) - 50;
    const y = (index * 89 + 24) % WORLD_HEIGHT;
    ctx.beginPath();
    if (style === 'gravity') {
      ctx.arc(x, y, 18 + (index % 3) * 8, -0.5, 1.4);
    } else if (style === 'industrial' || style === 'solar') {
      ctx.moveTo(x - 24, y); ctx.lineTo(x + 24, y); ctx.lineTo(x + 24, y + 16);
    } else if (style === 'abyssal') {
      ctx.moveTo(x - 28, y); ctx.lineTo(x - 12, y - 4); ctx.lineTo(x + 6, y + 3); ctx.lineTo(x + 28, y - 2);
    } else {
      ctx.moveTo(x, y - 18); ctx.lineTo(x + 12, y); ctx.lineTo(x, y + 18); ctx.lineTo(x - 12, y); ctx.closePath();
    }
    ctx.stroke();
  }
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
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }
}

function backgroundKeyToId(key) {
  return (key ?? 'crystal-gates').replace(/-boss$/, '');
}

function drawBackgroundTransition(ctx, stage, elapsedSeconds, visualAssets = null, reducedMotion = null) {
  const transition = stage?.transition;
  if (!transition) {
    drawStageBackground(ctx, stage?.id, elapsedSeconds, stage?.mode === 'boss', visualAssets);
    return;
  }
  const progress = Math.max(0, Math.min(1, transition.progress ?? 1));
  const prefersReducedMotion = typeof reducedMotion === 'function'
    ? reducedMotion()
    : reducedMotion ?? Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const durationSeconds = Number(transition.durationSeconds) || STAGE_TRANSITION_SECONDS;
  const crossfadeProgress = Math.min(1, (progress * durationSeconds) / 0.15);
  const spatialProgress = progress * progress * (3 - 2 * progress);
  const scenes = prefersReducedMotion
    ? [
      { key: transition.fromKey, x: 0, alpha: 1 - crossfadeProgress },
      { key: transition.toKey, x: 0, alpha: crossfadeProgress },
    ]
    : [
      { key: transition.fromKey, x: spatialProgress === 0 ? 0 : -spatialProgress * WORLD_WIDTH, alpha: 1 },
      { key: transition.toKey, x: (1 - spatialProgress) * WORLD_WIDTH, alpha: 1 },
    ];

  for (const { key, x, alpha } of scenes) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.clip();
    ctx.globalAlpha = alpha;
    ctx.translate(x, 0);
    drawStageBackground(ctx, backgroundKeyToId(key), elapsedSeconds,
      String(key).endsWith('-boss'), visualAssets);
    ctx.restore();
  }
}

function drawStageAtmosphere(ctx, mode, elapsedSeconds = 0) {
  if (mode !== 'warning' && mode !== 'boss') return;
  ctx.save();
  if (mode === 'boss') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
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

  gradient.addColorStop(0, '#553cbd44');
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

function drawBoss(ctx, difficulty, theme, boss = null, elapsedSeconds = 0, visualAssets = null, stageId = null) {
  if (!difficulty?.isBoss) {
    return;
  }

  ctx.save();
  const hitProgress = boss?.hitEffect
    ? Math.max(0, Math.min(1, boss.hitEffect.remainingSeconds / (boss.hitEffect.durationSeconds || 1)))
    : 0;
  const x = 842 + Math.sin(elapsedSeconds * 1.4) * 4 + hitProgress * 12;
  const y = WORLD_HEIGHT / 2 + Math.sin(elapsedSeconds * 1.1) * 18;
  const image = getStageAsset(visualAssets, stageId, 'boss');
  if (image) {
    ctx.globalAlpha = 0.95;
    setGlow(ctx, theme.boss, 22);
    ctx.drawImage(image, x - 96, y - 64, 192, 128);
    resetGlow(ctx);
    if (hitProgress > 0) {
      ctx.globalAlpha = hitProgress * 0.65;
      ctx.strokeStyle = '#ffffff';
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
    ctx.fillStyle = theme.background ?? '#050816';
    ctx.beginPath();
    ctx.arc(x, y, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hitProgress > 0 ? '#ffffff' : theme.boss;
    ctx.beginPath();
    ctx.arc(x - 18, y - 9, 7, 0, Math.PI * 2);
    ctx.arc(x + 18, y - 9, 7, 0, Math.PI * 2);
    ctx.fill();

    // Distinct stage silhouette signatures, all decorative and outside collision logic.
    const style = theme.bossStyle;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (style === 'gravity-crescent') {
      ctx.arc(x, y, 80, -1.15, 1.15);
    } else if (style === 'orbital-factory' || style === 'solar-machine') {
      ctx.moveTo(x - 74, y - 50); ctx.lineTo(x - 96, y - 12); ctx.lineTo(x - 72, y + 47);
      ctx.moveTo(x + 55, y - 40); ctx.lineTo(x + 82, y); ctx.lineTo(x + 54, y + 42);
    } else if (style === 'abyssal-leviathan') {
      ctx.moveTo(x - 54, y + 38); ctx.lineTo(x - 98, y + 62); ctx.lineTo(x - 76, y + 6);
      ctx.moveTo(x - 54, y - 38); ctx.lineTo(x - 98, y - 62); ctx.lineTo(x - 76, y - 6);
    } else {
      ctx.moveTo(x - 60, y - 54); ctx.lineTo(x - 80, y); ctx.lineTo(x - 60, y + 54);
      ctx.moveTo(x + 60, y - 54); ctx.lineTo(x + 80, y); ctx.lineTo(x + 60, y + 54);
    }
    ctx.stroke();
  }

  ctx.font = '700 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`BOSS: ${(difficulty.bossPattern ?? 'shift').toUpperCase()}`, 840, WORLD_HEIGHT / 2 + 122);
  ctx.restore();
}

function drawProjectile(ctx, attack, theme, visualAssets = null, stageId = null) {
  if (!attack || attack.type !== 'projectile') return;
  const color = theme.projectile;
  ctx.save();
  if (attack.state === 'charging' && attack.telegraphPoints?.length > 1) {
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    attack.telegraphPoints.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.globalAlpha = 0.8;
    attack.telegraphPoints.forEach((point) => {
      ctx.beginPath(); ctx.arc(point.x, point.y, 2, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    });
  } else if (attack.state === 'charging') {
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(attack.bossX, attack.bossY); ctx.lineTo(attack.targetX, attack.targetY); ctx.stroke();
  }
  if (attack.state !== 'charging') {
    ctx.globalAlpha = attack.state === 'returning' ? 1 : 0.92;
    setGlow(ctx, color, attack.state === 'returning' ? 18 : 12);
    const image = getStageAsset(visualAssets, stageId, 'projectile');
    if (image) {
      ctx.save();
      ctx.translate(attack.x, attack.y);
      if (attack.state === 'returning') ctx.rotate(Math.PI);
      ctx.drawImage(image, -16, -11, 32, 22);
      ctx.restore();
    } else {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(attack.x, attack.y, attack.state === 'returning' ? 9 : 7, 0, Math.PI * 2); ctx.fill();
    }
    resetGlow(ctx);
    if (attack.state === 'returning') {
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(attack.x, attack.y); ctx.lineTo(attack.bossX, attack.bossY); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawLaser(ctx, attack, theme, visualAssets = null, stageId = null) {
  if (!attack || attack.type !== 'laser') return;
  const telegraph = attack.telegraphRemainingSeconds > 0;
  const alpha = telegraph ? 0.42 : 0.9;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = theme.laser;
  ctx.fillStyle = theme.laser;
  ctx.lineWidth = Math.max(2, attack.thickness ?? 8);
  setGlow(ctx, theme.laser, telegraph ? 8 : 20);
  const image = getStageAsset(visualAssets, stageId, 'laser');
  const drawLaserImage = (y) => {
    if (!image) return;
    const sourceY = image.height * 0.38;
    const sourceHeight = image.height * 0.24;
    const thickness = attack.thickness ?? 8;
    ctx.drawImage(image, 0, sourceY, image.width, sourceHeight,
      0, y - thickness, WORLD_WIDTH, thickness * 2);
  };
  if (attack.kind === 'single') {
    if (image) {
      drawLaserImage(attack.y);
    } else {
      ctx.beginPath(); ctx.moveTo(0, attack.y); ctx.lineTo(WORLD_WIDTH, attack.y); ctx.stroke();
      if (!telegraph) ctx.fillRect(0, attack.y - (attack.thickness ?? 8) / 2, WORLD_WIDTH, attack.thickness ?? 8);
    }
  } else if (attack.kind === 'quarter') {
    const zoneHeight = attack.zoneHeight ?? WORLD_HEIGHT / 4;
    for (let zone = 0; zone < 4; zone += 1) {
      const top = zone * zoneHeight;
      if (zone === attack.safeZone) {
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect?.(0, top, WORLD_WIDTH, zoneHeight);
        ctx.fillStyle = `${theme.primary}16`;
        ctx.fillRect(0, top, WORLD_WIDTH, zoneHeight);
        ctx.globalAlpha = alpha;
      } else if (!telegraph) {
        ctx.globalAlpha = 0.24;
        ctx.fillRect(0, top, WORLD_WIDTH, zoneHeight);
        drawLaserImage(top + zoneHeight / 2);
        ctx.globalAlpha = alpha;
      }
    }
  }
  resetGlow(ctx);
  ctx.restore();
}

function drawChallengeEffects(ctx, challenge, feedbackEffect) {
  if (challenge?.active) {
    ctx.save();
    ctx.fillStyle = 'rgba(2, 4, 12, 0.66)';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8fbff';
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText('INPUT SEQUENCE', WORLD_WIDTH / 2, 168);
    const sequence = challenge.sequence ?? [];
    const size = Math.min(46, 420 / Math.max(1, sequence.length));
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    sequence.forEach((key, index) => {
      ctx.fillStyle = index < (challenge.cursor ?? 0) ? '#55f6e5' : '#ffffff';
      ctx.fillText(key.slice(-1).toUpperCase(), WORLD_WIDTH / 2 + (index - (sequence.length - 1) / 2) * (size + 18), 258);
    });
    ctx.restore();
  }
  if (!feedbackEffect || feedbackEffect.remainingSeconds <= 0) return;
  const progress = Math.max(0, Math.min(1, feedbackEffect.remainingSeconds / (feedbackEffect.durationSeconds || 1)));
  ctx.save();
  ctx.globalAlpha = progress * 0.58;
  if (feedbackEffect.kind === 'ink') {
    ctx.fillStyle = '#05040a';
    for (let index = 0; index < 8; index += 1) {
      const x = (index * 137 + 83) % WORLD_WIDTH;
      const y = (index * 79 + 38) % WORLD_HEIGHT;
      ctx.beginPath(); ctx.arc(x, y, 34 + (index % 3) * 12, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    ctx.fillStyle = '#bafcff';
    for (let index = 0; index < 11; index += 1) {
      const y = (index * 53 + 17) % WORLD_HEIGHT;
      ctx.fillRect((index * 71) % 460, y, WORLD_WIDTH * (0.25 + (index % 3) * 0.12), 2 + (index % 3));
    }
  }
  ctx.restore();
}

export function createRenderer(canvas, { visualAssets = null, reducedMotion = null } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context를 사용할 수 없습니다.');
  }

  let pixelRatio = 1;

  function resize() {
    pixelRatio = getDevicePixelRatio();
    canvas.width = WORLD_WIDTH * pixelRatio;
    canvas.height = WORLD_HEIGHT * pixelRatio;
    canvas.style.aspectRatio = `${WORLD_WIDTH} / ${WORLD_HEIGHT}`;
    ctx.setTransform?.(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function render(snapshot) {
    ctx.save();
    ctx.setTransform?.(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const stage = snapshot.stage ?? { id: 'crystal-gates', mode: 'normal', elapsedSeconds: snapshot.elapsedSeconds ?? 0 };
    const theme = resolveStageTheme(stage.id);
    const elapsed = stage.elapsedSeconds ?? snapshot.elapsedSeconds ?? 0;
    drawBackgroundTransition(ctx, stage, elapsed, visualAssets, reducedMotion);

    for (const obstacle of snapshot.obstacles ?? []) {
      const stageObstacle = obstacle.stageId ? obstacle : { ...obstacle, stageId: stage.id };
      drawObstacle(ctx, stageObstacle, theme, snapshot.difficulty, visualAssets);
    }

    drawLaser(ctx, snapshot.boss?.attack, theme, visualAssets, stage.id);
    drawProjectile(ctx, snapshot.boss?.attack, theme, visualAssets, stage.id);
    drawBoss(ctx, snapshot.difficulty, theme, snapshot.boss, elapsed, visualAssets, stage.id);
    drawDashTrail(ctx, snapshot.player, VISUAL_THEME);
    drawSpecialDashBurst(ctx, snapshot.player, VISUAL_THEME);
    drawStageAtmosphere(ctx, stage.mode, elapsed);
    drawShip(ctx, snapshot.player, VISUAL_THEME, snapshot.aircraft?.id, visualAssets);
    drawChallengeEffects(ctx, snapshot.challenge, snapshot.feedbackEffect);
    ctx.restore();
  }

  function renderMenuBackground() {
    ctx.save();
    ctx.setTransform?.(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    const background = visualAssets?.get('menuBackground')
      ?? visualAssets?.get(VISUAL_ASSET_MANIFEST.menuBackground);
    if (background) {
      ctx.drawImage(background, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    } else {
      drawBackground(ctx, VISUAL_THEME);
      drawMenuNebula(ctx, VISUAL_THEME);
      drawMenuDepthLines(ctx, VISUAL_THEME);
    }
    drawShip(ctx, {
      x: 300,
      y: WORLD_HEIGHT / 2,
      velocityY: 0,
      width: 72,
      height: 48,
    }, VISUAL_THEME, 'default', visualAssets);
    ctx.restore();
  }

  resize();
  globalThis.addEventListener?.('resize', resize);

  return {
    resize,
    render,
    renderMenuBackground,
    destroy() {
      globalThis.removeEventListener?.('resize', resize);
    },
  };
}
