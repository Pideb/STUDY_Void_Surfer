import { WORLD_HEIGHT, WORLD_WIDTH } from './constants.js';
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

export function drawObstacle(ctx, obstacle, theme = VISUAL_THEME) {
  const isSpecial = obstacle.kind === 'special';
  const primary = isSpecial ? theme.specialObstacle : theme.obstacle;
  const accent = isSpecial ? theme.specialAccent : theme.obstacleAccent;
  const gapTop = obstacle.gapCenter - obstacle.gapHeight / 2;
  const bottomTop = obstacle.gapCenter + obstacle.gapHeight / 2;

  ctx.save();
  setGlow(ctx, primary, theme.obstacleGlow);
  ctx.fillStyle = primary;
  ctx.fillRect(obstacle.x, 0, obstacle.width, gapTop);
  ctx.fillRect(obstacle.x, bottomTop, obstacle.width, WORLD_HEIGHT - bottomTop);
  resetGlow(ctx);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(obstacle.x, gapTop);
  ctx.lineTo(obstacle.x + obstacle.width, gapTop);
  ctx.moveTo(obstacle.x, bottomTop);
  ctx.lineTo(obstacle.x + obstacle.width, bottomTop);
  ctx.stroke();

  if (isSpecial) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (let y = 14; y < gapTop; y += 24) {
      ctx.beginPath();
      ctx.moveTo(obstacle.x + 8, y);
      ctx.lineTo(obstacle.x + obstacle.width - 8, y + 10);
      ctx.stroke();
    }
    for (let y = bottomTop + 14; y < WORLD_HEIGHT; y += 24) {
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
      drawObstacle(ctx, obstacle, VISUAL_THEME);
    }

    drawBoss(ctx, snapshot.difficulty, VISUAL_THEME);
    drawShip(ctx, snapshot.player, VISUAL_THEME);
    drawWarningOverlay(ctx, snapshot.difficulty, VISUAL_THEME);
    ctx.restore();
  }

  resize();
  globalThis.addEventListener?.('resize', resize);

  return {
    resize,
    render,
    destroy() {
      globalThis.removeEventListener?.('resize', resize);
    },
  };
}
