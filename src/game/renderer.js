import { DASH_DURATION_SECONDS, WORLD_HEIGHT, WORLD_WIDTH } from './constants.js';
import { STAR_FIELD, VISUAL_THEME } from './visual-theme.js';

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

export function drawShip(ctx, player, theme = VISUAL_THEME) {
  const tilt = Math.max(-0.35, Math.min(0.35, player.velocityY / 1000));

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(tilt);
  setGlow(ctx, theme.shipAccent, theme.shipGlow);
  ctx.fillStyle = theme.ship;
  ctx.beginPath();
  ctx.moveTo(player.width / 2, 0);
  ctx.lineTo(-player.width / 2, -player.height / 2);
  ctx.lineTo(-player.width / 2 + 8, 0);
  ctx.lineTo(-player.width / 2, player.height / 2);
  ctx.closePath();
  ctx.fill();

  resetGlow(ctx);
  ctx.fillStyle = theme.shipAccent;
  ctx.beginPath();
  ctx.arc(-player.width / 5, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getDashIntensity(player) {
  if (!player?.isDashing) return 0;
  const remaining = Number(player.dashRemainingSeconds);
  if (!Number.isFinite(remaining)) return 1;
  return Math.max(0, Math.min(1, remaining / DASH_DURATION_SECONDS));
}

function drawDashTrail(ctx, player, theme) {
  const intensity = getDashIntensity(player);
  if (intensity <= 0) return;

  ctx.save();
  ctx.globalAlpha = 0.18 + intensity * 0.45;
  setGlow(ctx, theme.dashTrail, 14);
  ctx.fillStyle = theme.dashTrail;
  const trailLength = player.width * (1.4 + intensity * 2.2);
  ctx.fillRect(
    player.x - player.width / 2 - trailLength,
    player.y - player.height / 4,
    trailLength,
    player.height / 2,
  );
  ctx.restore();
}

function drawSpecialDashBurst(ctx, player, theme) {
  if (!player?.isDashing || player.dashKind !== 'special') return;

  const progress = 1 - getDashIntensity(player);
  const radius = player.width * (1 + progress * 2);
  ctx.save();
  ctx.globalAlpha = Math.max(0, 0.8 - progress * 0.7);
  setGlow(ctx, theme.dashBurst, 20);
  ctx.strokeStyle = theme.dashBurst;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function getTimingGuideWidth(obstacle, difficulty) {
  if (obstacle?.kind !== 'special' || !obstacle.showTimingGuide) return 0;
  const speed = Number(difficulty?.scrollSpeed);
  const windowSeconds = Number(difficulty?.timingWindowSeconds);
  if (!Number.isFinite(speed) || !Number.isFinite(windowSeconds)) return 0;
  return Math.max(0, speed * windowSeconds);
}

export function drawObstacle(ctx, obstacle, theme = VISUAL_THEME, difficulty = null) {
  const isSpecial = obstacle.kind === 'special';
  const primary = isSpecial ? theme.specialObstacle : theme.obstacle;
  const accent = isSpecial ? theme.specialAccent : theme.obstacleAccent;
  const gapTop = obstacle.gapCenter - obstacle.gapHeight / 2;
  const bottomTop = obstacle.gapCenter + obstacle.gapHeight / 2;
  const timingGuideWidth = getTimingGuideWidth(obstacle, difficulty);

  ctx.save();
  if (timingGuideWidth > 0) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = theme.timingGuide;
    ctx.fillRect(obstacle.x - timingGuideWidth, 0, timingGuideWidth, WORLD_HEIGHT);
    ctx.globalAlpha = 1;
  }
  setGlow(ctx, primary, theme.obstacleGlow);
  ctx.fillStyle = primary;
  if (isSpecial) {
    ctx.fillRect(obstacle.x, 0, obstacle.width, WORLD_HEIGHT);
  } else {
    ctx.fillRect(obstacle.x, 0, obstacle.width, gapTop);
    ctx.fillRect(obstacle.x, bottomTop, obstacle.width, WORLD_HEIGHT - bottomTop);
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
  }

  ctx.restore();
}

function drawBackground(ctx, theme) {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  const gradient = ctx.createRadialGradient?.(
    WORLD_WIDTH / 2,
    0,
    20,
    WORLD_WIDTH / 2,
    0,
    WORLD_HEIGHT,
  );
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

function drawBoss(ctx, difficulty, theme) {
  if (!difficulty?.isBoss) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = 0.78;
  setGlow(ctx, theme.boss, 28);
  ctx.fillStyle = theme.boss;
  ctx.beginPath();
  ctx.arc(840, WORLD_HEIGHT / 2, 86, 0, Math.PI * 2);
  ctx.fill();
  resetGlow(ctx);

  ctx.fillStyle = theme.background;
  ctx.beginPath();
  ctx.arc(840, WORLD_HEIGHT / 2, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = theme.boss;
  ctx.beginPath();
  ctx.arc(820, WORLD_HEIGHT / 2 - 10, 8, 0, Math.PI * 2);
  ctx.arc(860, WORLD_HEIGHT / 2 - 10, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`BOSS: ${(difficulty.bossPattern ?? 'shift').toUpperCase()}`, 840, WORLD_HEIGHT / 2 + 122);
  ctx.restore();
}

function drawWarningOverlay(ctx, difficulty, theme) {
  if (!difficulty?.isWarning) {
    return;
  }

  ctx.save();
  ctx.fillStyle = `${theme.warning}18`;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.fillStyle = theme.warning;
  ctx.font = '800 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = theme.warning;
  ctx.shadowBlur = 18;
  ctx.fillText(difficulty.isBoss ? 'BOSS WARNING' : 'WARNING', WORLD_WIDTH / 2, 64);
  ctx.restore();
}

export function createRenderer(canvas) {
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
    drawBackground(ctx, VISUAL_THEME);

    for (const obstacle of snapshot.obstacles ?? []) {
      drawObstacle(ctx, obstacle, VISUAL_THEME, snapshot.difficulty);
    }

    drawBoss(ctx, snapshot.difficulty, VISUAL_THEME);
    drawDashTrail(ctx, snapshot.player, VISUAL_THEME);
    drawSpecialDashBurst(ctx, snapshot.player, VISUAL_THEME);
    drawShip(ctx, snapshot.player, VISUAL_THEME);
    drawWarningOverlay(ctx, snapshot.difficulty, VISUAL_THEME);
    ctx.restore();
  }

  function renderMenuBackground() {
    ctx.save();
    ctx.setTransform?.(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    drawBackground(ctx, VISUAL_THEME);
    drawMenuNebula(ctx, VISUAL_THEME);
    drawMenuDepthLines(ctx, VISUAL_THEME);
    drawShip(ctx, {
      x: 300,
      y: WORLD_HEIGHT / 2,
      velocityY: 0,
      width: 72,
      height: 48,
    }, VISUAL_THEME);
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
