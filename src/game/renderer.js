import {
  DASH_DURATION_SECONDS, WORLD_HEIGHT, WORLD_WIDTH,
} from './constants.js';
import {
  AIRCRAFT_VISUALS,
  getStageVisualTheme,
  STAR_FIELD,
  VISUAL_THEME,
} from './visual-theme.js';
import { getDashBarrierBounds } from './obstacles.js';
import { drawLaser } from './laser-renderer.js';
import { VISUAL_ASSET_MANIFEST } from './visual-assets.js';

function getDevicePixelRatio() {
  return Math.max(1, Number(globalThis.devicePixelRatio) || 1);
}

function resolveReducedMotion(preference) {
  return typeof preference === 'function'
    ? Boolean(preference())
    : preference ?? Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
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

export function drawShipDeathEffect(ctx, effect, aircraftId = 'default', reducedMotion = false) {
  if (!effect || !Number.isFinite(effect.durationSeconds) || effect.durationSeconds <= 0) return;
  const progress = Math.max(0, Math.min(1, effect.elapsedSeconds / effect.durationSeconds));
  const craft = AIRCRAFT_VISUALS[aircraftId] ?? AIRCRAFT_VISUALS.default;
  const alpha = (1 - progress) * (reducedMotion ? 0.5 : 1);
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
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
      const size = 2 + (index % 3) * 1.2;
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

export function drawShipExhaust(ctx, player, aircraftId = 'default', _elapsedSeconds = 0, flightTrail = []) {
  const craft = AIRCRAFT_VISUALS[aircraftId] ?? AIRCRAFT_VISUALS.default;
  if (!Array.isArray(flightTrail) || flightTrail.length < 2) return;

  ctx.save();
  ctx.strokeStyle = craft.accent;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
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

export function drawDashShockRing(ctx, player, theme = VISUAL_THEME) {
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
  for (const [color, width] of [[theme.dashBurst, 4], ['#f4ffff', 1.8]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0.15, 2.9);
    ctx.arc(0, 0, radius, 3.3, 6.05);
    ctx.stroke();
  }
  ctx.strokeStyle = '#efffff';
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
  if (obstacle?.kind !== 'special' || !obstacle.showTimingGuide) return 0;
  const speed = Number(difficulty?.scrollSpeed);
  const windowSeconds = Number(difficulty?.timingWindowSeconds);
  if (!Number.isFinite(speed) || !Number.isFinite(windowSeconds)) return 0;
  return Math.max(0, speed * windowSeconds);
}

function drawSpecialTimingGuide(ctx, obstacle, difficulty, width, reducedMotion = false) {
  if (width <= 0) return;
  const playerX = Number.isFinite(difficulty?.playerX) ? difficulty.playerX : 240;
  const progress = Math.max(0, Math.min(1, 1 - (obstacle.x - playerX) / Math.max(1, width)));
  const elapsed = Number.isFinite(difficulty?.elapsedSeconds) ? difficulty.elapsedSeconds : 0;
  const pulse = reducedMotion ? 0 : Math.sin(elapsed * 6) * 0.04;
  const left = obstacle.x - width;

  ctx.save();
  ctx.globalAlpha = reducedMotion ? 0.42 : Math.max(0.31, Math.min(0.47, 0.35 + progress * 0.08 + pulse));
  ctx.fillStyle = '#55f6e5';
  ctx.fillRect(left, 0, width, WORLD_HEIGHT);
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = '#cafffa';
  ctx.lineWidth = 2;
  setGlow(ctx, '#55f6e5', reducedMotion ? 8 : 13);
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

export function drawObstacle(ctx, obstacle, theme = VISUAL_THEME, difficulty = null, visualAssets = null, reducedMotion = false) {
  if (obstacle.kind === 'hybrid') {
    drawObstacle(ctx, { ...obstacle, kind: 'normal', showTimingGuide: false, breakEffect: null }, theme, difficulty, visualAssets, reducedMotion);
    const barrier = getDashBarrierBounds(obstacle);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, obstacle.gapCenter - obstacle.gapHeight / 2, WORLD_WIDTH, obstacle.gapHeight);
    ctx.clip();
    const breakEffect = obstacle.breakEffect ?? (obstacle.barrierBroken
      ? { centerY: obstacle.barrierBreakY, remainingSeconds: 0, durationSeconds: 1, seed: 0 } : null);
    drawObstacle(ctx, { ...obstacle, ...barrier, kind: 'special', breakEffect }, theme, difficulty, visualAssets, reducedMotion);
    ctx.restore();
    return;
  }
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
  setGlow(ctx, primary, theme.obstacleGlow ?? 12);
  ctx.fillStyle = primary;
  if (isSpecial) {
    const effect = obstacle.breakEffect;
    const opening = effect ? Math.max(0, Math.min(WORLD_HEIGHT, effect.centerY ?? 0)) : null;
    const effectProgress = effect
      ? Math.max(0, Math.min(1, 1 - effect.remainingSeconds / Math.max(0.001, effect.durationSeconds ?? 0.65)))
      : 0;
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
        ctx.beginPath(); ctx.moveTo(obstacle.x + obstacle.width / 2, y); ctx.lineTo(obstacle.x + (index % 2 ? -10 : obstacle.width + 10), y + (index - 1.5) * 8); ctx.stroke();
      }
    }
    if (wallAsset) {
      const effect = obstacle.breakEffect;
      if (!effect) {
        drawClippedWallAsset(ctx, wallAsset, obstacle, 0, WORLD_HEIGHT, 0.455, 0.09);
      } else {
        const opening = Math.max(0, Math.min(WORLD_HEIGHT, effect.centerY ?? 0));
        const progress = Math.max(0, Math.min(1, 1 - effect.remainingSeconds / Math.max(0.001, effect.durationSeconds ?? 0.65)));
        const halfHeight = (theme.breakOpeningHalfHeight ?? 28) + progress * 24;
        const top = Math.max(0, opening - halfHeight);
        const bottom = Math.min(WORLD_HEIGHT, opening + halfHeight);
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
      const progress = Math.max(0, Math.min(1, 1 - effect.remainingSeconds / Math.max(0.001, effect.durationSeconds ?? 0.65)));
      const centerX = obstacle.x + obstacle.width / 2;
      const centerY = Math.max(0, Math.min(WORLD_HEIGHT, effect.centerY ?? 0));
      const seed = Number.isFinite(effect.seed) ? effect.seed : 0;
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.95;
      ctx.strokeStyle = theme.breakRing ?? '#7cfff2';
      ctx.lineWidth = 4 - progress * 2;
      setGlow(ctx, theme.breakRing ?? '#7cfff2', 18);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12 + progress * 72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = (1 - progress) * 0.9;
      ctx.strokeStyle = theme.breakFragment;
      ctx.lineWidth = 3 - progress * 1.5;
      for (let index = 0; index < 8; index += 1) {
        const angle = seed + (index / 8) * Math.PI * 2;
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

  if (timingGuideWidth > 0) drawSpecialTimingGuide(ctx, obstacle, difficulty, timingGuideWidth, reducedMotion);
  ctx.restore();
}

function drawStageArtwork(ctx, background, elapsedSeconds = 0, reducedMotion = false, scrollDistancePx = 0, scrollSpeed = 240) {
  const sceneAlpha = ctx.globalAlpha ?? 1;
  const scale = 1.12;
  const width = WORLD_WIDTH * scale;
  const height = WORLD_HEIGHT * scale;
  const overflowY = height - WORLD_HEIGHT;
  const offsetY = overflowY / 2 + (reducedMotion ? 0 : Math.sin(elapsedSeconds * 0.12) * Math.min(overflowY * 0.18, 7));
  if (reducedMotion) {
    ctx.drawImage(background, -(width - WORLD_WIDTH) / 2, -offsetY, width, height);
  } else {
    const overlap = Math.min(width * 0.12, Math.max(12, scrollSpeed * 0.25 * 0.35));
    const period = width - overlap;
    const phase = ((scrollDistancePx % period) + period) % period;
    const firstX = -phase;
    const nextX = period - phase;
    ctx.drawImage(background, firstX, -offsetY, width, height);

    // Crossfade the repeated image over the overlap so its edge is never a hard seam.
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
  ctx.fillStyle = 'rgba(2, 6, 18, 0.34)';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function drawStageBackground(ctx, stageId, elapsedSeconds = 0, boss = false, visualAssets = null, reducedMotion = false, scrollDistancePx = 0, scrollSpeed = 240) {
  const theme = resolveStageTheme(stageId);
  const background = getStageAsset(visualAssets, stageId, boss ? 'bossBackground' : 'background');
  if (background) {
    drawStageArtwork(ctx, background, elapsedSeconds, reducedMotion, scrollDistancePx, scrollSpeed);
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
    const x = ((baseX - scrollDistancePx * (0.7 + index * 0.04)) % WORLD_WIDTH + WORLD_WIDTH) % WORLD_WIDTH;
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
    const x = ((index * 173 - scrollDistancePx) % (WORLD_WIDTH + 100) + WORLD_WIDTH + 100) % (WORLD_WIDTH + 100) - 50;
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
  ctx.save();
  ctx.fillStyle = 'rgba(2, 6, 18, 0.1)';
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
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }
}

function backgroundKeyToId(key) {
  return (key ?? 'crystal-gates').replace(/-boss$/, '');
}

function drawBackgroundTransition(ctx, stage, elapsedSeconds, visualAssets = null, reducedMotion = null, scrollDistancePx = 0, scrollSpeed = 240) {
  const transition = stage?.transition;
  const prefersReducedMotion = resolveReducedMotion(reducedMotion);
  if (!transition) {
    drawStageBackground(ctx, stage?.id, elapsedSeconds, stage?.mode === 'boss', visualAssets, prefersReducedMotion, scrollDistancePx, scrollSpeed);
    return;
  }
  const progress = Math.max(0, Math.min(1, transition.progress ?? 1));
  const travelled = Math.max(0, Math.min(WORLD_WIDTH, transition.travelledPixels ?? progress * WORLD_WIDTH));
  function scene(key, left = 0, width = WORLD_WIDTH, alpha = 1) {
    if (width <= 0 || alpha <= 0) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(left, 0, width, WORLD_HEIGHT); ctx.clip();
    ctx.globalAlpha = alpha;
    drawStageBackground(ctx, backgroundKeyToId(key), elapsedSeconds, String(key).endsWith('-boss'),
      visualAssets, prefersReducedMotion, scrollDistancePx, scrollSpeed);
    ctx.restore();
  }
  scene(transition.fromKey);
  if (prefersReducedMotion) {
    scene(transition.toKey, 0, WORLD_WIDTH, progress);
    return;
  }
  // Only the reveal boundary travels at wall speed; texture retains its subtle parallax.
  const edge = WORLD_WIDTH - travelled;
  const feather = Math.min(48, travelled, WORLD_WIDTH - travelled);
  if (feather > 0) {
    for (let index = 0; index < 8; index += 1) {
      scene(transition.toKey, edge + feather * index / 8, feather / 8 + 0.5, (index + 1) / 8);
    }
  }
  scene(transition.toKey, edge + feather, WORLD_WIDTH - edge - feather);
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

function drawBossIdleAccents(ctx, style, x, y, elapsedSeconds, theme, reducedMotion) {
  const time = reducedMotion ? 0 : elapsedSeconds;
  ctx.save();
  ctx.globalAlpha = 0.58;
  ctx.strokeStyle = theme.accent;
  ctx.fillStyle = theme.boss;
  ctx.lineWidth = 2.5;
  setGlow(ctx, theme.accent, 10);

  if (style === 'crystal-guardian') {
    for (let index = 0; index < 2; index += 1) {
      const angle = time * 0.8 + index * Math.PI;
      const shardX = x + Math.cos(angle) * 92;
      const shardY = y + Math.sin(angle) * 58;
      ctx.beginPath();
      ctx.moveTo(shardX + 7, shardY);
      ctx.lineTo(shardX, shardY - 11);
      ctx.lineTo(shardX - 7, shardY);
      ctx.lineTo(shardX, shardY + 11);
      ctx.closePath();
      ctx.fill();
    }
  } else if (style === 'orbital-factory') {
    ctx.translate(x, y);
    ctx.rotate(time * 0.42);
    ctx.beginPath();
    ctx.arc(0, 0, 87, 0, Math.PI * 2);
    ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * 87, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'signal-sentinel') {
    const scanY = y + Math.sin(time * 1.6) * 58;
    ctx.globalAlpha = 0.68;
    ctx.beginPath();
    ctx.moveTo(x - 100, scanY);
    ctx.lineTo(x + 100, scanY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 76 + Math.sin(time * 1.6) * 3, -0.5, 0.5);
    ctx.stroke();
  } else if (style === 'gravity-crescent') {
    ctx.beginPath();
    ctx.arc(x, y, 82, time * 0.55, time * 0.55 + Math.PI * 1.55);
    ctx.stroke();
    for (let index = 0; index < 3; index += 1) {
      const angle = time * 0.72 + index * Math.PI * 2 / 3;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * 98, y + Math.sin(angle) * 65, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'abyssal-leviathan') {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x - 60, y + side * 30);
      for (let index = 1; index <= 4; index += 1) {
        const pointX = x - 60 - index * 16;
        const pointY = y + side * (30 + index * 10) + Math.sin(time * 1.8 + index * 0.8) * 7;
        ctx.lineTo(pointX, pointY);
      }
      ctx.stroke();
    }
  } else if (style === 'solar-machine') {
    const pulse = 77 + Math.sin(time * 2) * 8;
    ctx.globalAlpha = 0.4 + (Math.sin(time * 2) + 1) * 0.12;
    ctx.beginPath();
    ctx.arc(x, y, pulse, 0, Math.PI * 2);
    ctx.stroke();
    const ventY = y + Math.sin(time * 2) * 5;
    ctx.beginPath();
    ctx.moveTo(x - 38, ventY - 51);
    ctx.lineTo(x - 13, ventY - 57);
    ctx.moveTo(x + 13, ventY + 57);
    ctx.lineTo(x + 38, ventY + 51);
    ctx.stroke();
  }

  resetGlow(ctx);
  ctx.restore();
}

export function drawBoss(ctx, difficulty, theme, boss = null, elapsedSeconds = 0, visualAssets = null, stageId = null, reducedMotion = false) {
  if (!difficulty?.isBoss) {
    return;
  }

  ctx.save();
  const hitProgress = boss?.hitEffect
    ? Math.max(0, Math.min(1, boss.hitEffect.remainingSeconds / (boss.hitEffect.durationSeconds || 1)))
    : 0;
  const idleTime = reducedMotion ? 0 : elapsedSeconds;
  const entryProgress = boss?.entranceDurationSeconds
    ? Math.max(0, Math.min(1, 1 - (boss.entranceRemainingSeconds ?? 0) / boss.entranceDurationSeconds)) : 1;
  const eased = entryProgress * entryProgress * (3 - 2 * entryProgress);
  const x = (WORLD_WIDTH + 200) + (842 - WORLD_WIDTH - 200) * eased
    + (Math.sin(idleTime * 1.4) * 4 + hitProgress * 12) * eased;
  const y = WORLD_HEIGHT / 2 + Math.sin(idleTime * 1.1) * 18;
  drawBossIdleAccents(ctx, theme.bossStyle, x, y, idleTime, theme, reducedMotion);
  const image = getStageAsset(visualAssets, stageId, 'boss');
  if (image) {
    ctx.globalAlpha = 1;
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
  ctx.fillText(`BOSS: ${(difficulty.bossPattern ?? 'shift').toUpperCase()}`, x - 2, WORLD_HEIGHT / 2 + 122);
  ctx.restore();
}

function drawProjectile(ctx, attack, theme, visualAssets = null, stageId = null) {
  if (!attack || attack.type !== 'projectile') return;
  const color = theme.projectile;
  ctx.save();
  if (attack.state === 'charging' && attack.telegraphPoints?.length > 1) {
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
    ctx.strokeStyle = '#f4ffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    attack.telegraphPoints.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
    attack.telegraphPoints.forEach((point) => {
      ctx.beginPath(); ctx.arc(point.x, point.y, 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      ctx.beginPath(); ctx.arc(point.x, point.y, 2, 0, Math.PI * 2); ctx.fillStyle = '#f4ffff'; ctx.fill();
    });
  } else if (attack.state === 'charging') {
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    setGlow(ctx, color, 16);
    ctx.beginPath(); ctx.moveTo(attack.bossX, attack.bossY); ctx.lineTo(attack.targetX, attack.targetY); ctx.stroke();
    resetGlow(ctx);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#f4ffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(attack.bossX, attack.bossY); ctx.lineTo(attack.targetX, attack.targetY); ctx.stroke();
  }
  if (attack.state !== 'charging') {
    ctx.globalAlpha = attack.state === 'returning' ? 1 : 0.92;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    setGlow(ctx, color, 18);
    ctx.beginPath(); ctx.arc(attack.x, attack.y, 18, 0, Math.PI * 2); ctx.stroke();
    resetGlow(ctx);
    ctx.strokeStyle = '#f4ffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(attack.x, attack.y, 12, 0, Math.PI * 2); ctx.stroke();
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
    canvas.style.aspectRatio = 'auto';
    ctx.setTransform?.(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function render(snapshot) {
    ctx.save();
    ctx.setTransform?.(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const stage = snapshot.stage ?? { id: 'crystal-gates', mode: 'normal', elapsedSeconds: snapshot.elapsedSeconds ?? 0 };
    const theme = resolveStageTheme(stage.id);
    const elapsed = stage.elapsedSeconds ?? snapshot.elapsedSeconds ?? 0;
    const prefersReducedMotion = resolveReducedMotion(reducedMotion);
    const backgroundScroll = snapshot.backgroundScrollDistancePx ?? elapsed * (snapshot.difficulty?.scrollSpeed ?? 240) * 0.25;
    const scrollSpeed = snapshot.difficulty?.scrollSpeed ?? 240;
    drawBackgroundTransition(ctx, stage, elapsed, visualAssets, reducedMotion, backgroundScroll, scrollSpeed);
    drawStageAtmosphere(ctx, stage.mode, elapsed);

    for (const obstacle of snapshot.obstacles ?? []) {
      const stageObstacle = obstacle.stageId ? obstacle : { ...obstacle, stageId: stage.id };
      drawObstacle(ctx, stageObstacle, theme, {
        ...snapshot.difficulty,
        playerX: snapshot.player?.x ?? 240,
        elapsedSeconds: snapshot.elapsedSeconds ?? elapsed,
      }, visualAssets, prefersReducedMotion);
    }

    drawLaser(ctx, snapshot.boss?.attack);
    drawProjectile(ctx, snapshot.boss?.attack, theme, visualAssets, stage.id);
    drawBoss(ctx, snapshot.difficulty, theme, snapshot.boss, elapsed, visualAssets, stage.id, prefersReducedMotion);
    if (!snapshot.deathEffect) {
      drawDashTrail(ctx, snapshot.player, VISUAL_THEME);
      drawDashShockRing(ctx, snapshot.player, VISUAL_THEME);
    }
    if (snapshot.deathEffect) {
      drawShipDeathEffect(ctx, snapshot.deathEffect, snapshot.deathEffect.aircraftId ?? snapshot.aircraft?.id, prefersReducedMotion);
    } else {
      drawShipExhaust(ctx, snapshot.player, snapshot.aircraft?.id, elapsed, snapshot.flightTrail);
      drawShip(ctx, snapshot.player, VISUAL_THEME, snapshot.aircraft?.id, visualAssets);
    }
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
