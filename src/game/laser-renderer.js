import {
  BOSS_LASER_FADE_SECONDS, WORLD_HEIGHT as H, WORLD_WIDTH as W,
} from './constants.js';
import { getLaserFrontX } from './boss-attacks.js';

// Approved v2: soft round rays and moving light filaments, not stretched panels.
const cyan = '#59e8ff';
const white = '#f7ffff';

function charge(ctx, y, radius, strength) {
  ctx.save();
  const glow = ctx.createRadialGradient(W - 8, y, 0, W - 8, y, radius);
  glow.addColorStop(0, `rgba(245,255,255,${strength})`);
  glow.addColorStop(0.28, `rgba(89,232,255,${strength * 0.7})`);
  glow.addColorStop(1, 'rgba(40,154,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(W - radius - 8, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

function beam(ctx, y, height, front, time, opacity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const broad = height > 30;
  const tip = front > 0 ? front : -height * 2;
  const shimmer = 0.96 + Math.sin(time * 9 + y * 0.03) * 0.04;

  // Overlapping soft rays have no rectangular face or hard vertical leading edge.
  function ray(centerY, width, color, alpha, blur = 0, offset = 0) {
    ctx.save();
    ctx.globalAlpha = opacity * alpha * shimmer;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.filter = blur > 0 ? `blur(${blur}px)` : 'none';
    ctx.beginPath();
    ctx.moveTo(W + height * 2, centerY);
    ctx.lineTo(tip + width / 2 + offset, centerY);
    ctx.stroke();
    ctx.restore();
  }

  ray(y, height * 1.45, '#227eff', 0.08, broad ? 20 : 12);
  ray(y, height, '#36caff', 0.17, broad ? 13 : 7);
  ray(y, height * 0.6, cyan, 0.28, broad ? 9 : 4);
  ray(y, height * 0.29, '#a5faff', 0.58, broad ? 6 : 2);
  ray(y, Math.max(2, height * 0.1), white, 0.92, broad ? 3 : 0);

  const filaments = broad ? 11 : 5;
  for (let index = 0; index < filaments; index += 1) {
    const fraction = (index / (filaments - 1) - 0.5) * 2;
    const lineY = y + fraction * height * 0.36
      + Math.sin(time * 5 + index * 1.9) * height * 0.018;
    const alpha = 0.12 + (1 - Math.abs(fraction)) * 0.35;
    ray(lineY, broad ? 1.5 + (index % 3) : 0.9, '#d2ffff', alpha, 2,
      Math.abs(fraction) * height * 0.23);
  }

  // Fine highlights stream left within the glow rather than outlining a box.
  ctx.shadowColor = cyan;
  ctx.shadowBlur = 8;
  ctx.filter = 'none';
  for (let index = 0; index < (broad ? 22 : 10); index += 1) {
    const x = ((index * 103 - time * 980) % (W + 180) + W + 180) % (W + 180) - 90;
    if (x < front + 20 || x > W) continue;
    const offsetY = Math.sin(index * 2.4) * height * 0.39;
    const length = 16 + (index % 5) * 9;
    const highlight = ctx.createLinearGradient(x, 0, x + length, 0);
    highlight.addColorStop(0, 'rgba(221,255,255,0)');
    highlight.addColorStop(0.65, 'rgba(221,255,255,0.55)');
    highlight.addColorStop(1, 'rgba(221,255,255,0)');
    ctx.strokeStyle = highlight;
    ctx.globalAlpha = opacity * 0.6;
    ctx.lineWidth = 1 + index % 2;
    ctx.beginPath(); ctx.moveTo(x, y + offsetY);
    ctx.lineTo(x + length, y + offsetY); ctx.stroke();
  }

  if (front > 0) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowBlur = 0;
    ctx.translate(front + height * 0.18, y);
    ctx.scale(broad ? 0.55 : 1, 1);
    const radius = Math.max(18, height * 0.58);
    const flare = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    flare.addColorStop(0, 'rgba(247,255,255,0.95)');
    flare.addColorStop(0.2, 'rgba(162,249,255,0.65)');
    flare.addColorStop(0.55, 'rgba(52,202,255,0.2)');
    flare.addColorStop(1, 'rgba(52,202,255,0)');
    ctx.fillStyle = flare;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function safeLane(ctx, zone, time, warning) {
  const top = zone * H / 4, height = H / 4;
  ctx.save();
  ctx.fillStyle = warning ? 'rgba(28,223,181,0.05)' : 'rgba(5,30,36,0.14)';
  ctx.fillRect(0, top, W, height);
  ctx.strokeStyle = '#7effd7'; ctx.lineWidth = warning ? 3 : 2;
  ctx.shadowColor = '#7effd7'; ctx.shadowBlur = warning ? 9 : 3;
  ctx.beginPath();
  ctx.moveTo(0, top + 3); ctx.lineTo(W, top + 3);
  ctx.moveTo(0, top + height - 3); ctx.lineTo(W, top + height - 3);
  ctx.stroke();
  ctx.fillStyle = '#7effd7';
  ctx.beginPath();
  ctx.moveTo(22 + Math.sin(time * 3) * 3, top + height / 2);
  ctx.lineTo(38, top + height / 2 - 10); ctx.lineTo(38, top + height / 2 + 10);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}


export function drawLaser(ctx, attack) {
  if (!attack || attack.type !== 'laser') return;
  const warning = attack.telegraphRemainingSeconds > 0;
  const fading = attack.activeRemainingSeconds <= 0;
  const opacity = fading ? Math.max(0, (attack.fadeRemainingSeconds ?? 0) / BOSS_LASER_FADE_SECONDS) : 1;
  if (!warning && opacity <= 0) return;
  const time = attack.elapsedSeconds ?? 0;
  const front = getLaserFrontX(attack);
  const warningProgress = 1 - attack.telegraphRemainingSeconds / (attack.telegraphDurationSeconds || 1);
  ctx.save();
  if (attack.kind === 'single') {
    if (warning) {
      ctx.strokeStyle = '#8defff'; ctx.globalAlpha = 0.65;
      ctx.setLineDash([12, 12]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, attack.y); ctx.lineTo(W, attack.y); ctx.stroke();
      ctx.setLineDash([]);
      charge(ctx, attack.y, 24 + 17 * warningProgress, 0.5 + 0.4 * warningProgress);
    } else {
      beam(ctx, attack.y, attack.thickness ?? 18, front, time, opacity);
      charge(ctx, attack.y, 48, opacity);
    }
  } else if (attack.kind === 'quarter') {
    const zoneHeight = attack.zoneHeight ?? H / 4;
    if (warning) {
      for (let zone = 0; zone < 4; zone += 1) {
        if (zone === attack.safeZone) continue;
        ctx.save();
        ctx.strokeStyle = 'rgba(99,226,255,0.25)'; ctx.setLineDash([14, 16]);
        ctx.lineWidth = 1;
        for (const fraction of [0.2, 0.5, 0.8]) {
          const y = (zone + fraction) * zoneHeight;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.restore();
        charge(ctx, (zone + 0.5) * zoneHeight, 28, 0.3 + warningProgress * 0.44);
      }
    } else {
      ctx.save(); ctx.beginPath();
      if (attack.safeZone > 0) ctx.rect(0, 0, W, attack.safeZone * zoneHeight);
      if (attack.safeZone < 3) {
        const safeBottom = (attack.safeZone + 1) * zoneHeight;
        ctx.rect(0, safeBottom, W, H - safeBottom);
      }
      ctx.clip();
      for (let zone = 0; zone < 4; zone += 1) {
        if (zone === attack.safeZone) continue;
        beam(ctx, (zone + 0.5) * zoneHeight, zoneHeight - 8, front, time, opacity);
        charge(ctx, (zone + 0.5) * zoneHeight, 60, opacity);
      }
      ctx.restore();
    }
    // Draw the boundaries last so the safe route stays readable over the bloom.
    safeLane(ctx, attack.safeZone, time, warning);
  }
  ctx.restore();
}
