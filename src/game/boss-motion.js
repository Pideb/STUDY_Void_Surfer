import { BOSS_RIGS } from './boss-rigs.js';

const TAU = Math.PI * 2;
const preparedRigs = new Map();
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, finite(value, min)));
const seconds = (value) => clamp(value, 0, 1e9);
const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const pointValid = (point) => Array.isArray(point) && point.length >= 2
  && point.slice(0, 2).every((n) => Number.isFinite(n) && n >= 0 && n <= 1);
const boxValid = (box) => box && [box.x, box.y, box.w, box.h].every(Number.isFinite)
  && box.w > 0 && box.h > 0;

function rigValid(rig) {
  return rig && pointValid(rig.core) && Number.isFinite(rig.core[2]) && rig.core[2] > 0
    && pointValid(rig.muzzle) && Array.isArray(rig.parts) && rig.parts.every((part) => part
      && pointValid(part.pivot) && Array.isArray(part.poly) && part.poly.length >= 3
      && part.poly.every(pointValid)
      && ['side', 'amplitude', 'open'].every((key) => Number.isFinite(part[key]))
      && ['slide', 'lift', 'recoil'].every((key) => part[key] === undefined || Number.isFinite(part[key])));
}

function imageSize(image) {
  return [image?.naturalWidth ?? image?.width, image?.naturalHeight ?? image?.height];
}

function defaultCanvasFactory(width, height) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
  // JSDOM may have a getContext mock for the main canvas, but no real raster API.
  if (typeof CanvasRenderingContext2D === 'undefined' || typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
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
    ctx = canvas.getContext?.('2d');
  } catch {
    return null; // Optional raster APIs can be present but unavailable.
  }
  const methods = ['drawImage', 'save', 'restore', 'beginPath', 'moveTo', 'lineTo',
    'closePath', 'clip', 'fill', 'stroke', 'clearRect'];
  return ctx && methods.every((method) => typeof ctx[method] === 'function') ? { canvas, ctx } : null;
}

function polygon(ctx, points, width, height) {
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i) ctx.lineTo(x * width, y * height);
    else ctx.moveTo(x * width, y * height);
  });
  ctx.closePath();
}

/** Synchronously prepare the approved 768px cutouts; no assets are loaded here. */
export function prepareBossRig({ rig, image, canvasFactory = defaultCanvasFactory } = {}) {
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

    // Erase only the polygon interior. A 1px source underlap prevents the two
    // antialiased cut edges from creating a transparent seam at game scale.
    erase.ctx.clearRect(0, 0, width, height);
    erase.ctx.save();
    polygon(erase.ctx, part.poly, width, height);
    erase.ctx.fillStyle = '#fff';
    erase.ctx.fill();
    erase.ctx.globalCompositeOperation = 'destination-out';
    erase.ctx.strokeStyle = '#fff';
    erase.ctx.lineWidth = 2;
    erase.ctx.lineJoin = 'round';
    erase.ctx.stroke();
    erase.ctx.restore();
    base.ctx.save();
    base.ctx.globalCompositeOperation = 'destination-out';
    base.ctx.drawImage(erase.canvas, 0, 0);
    base.ctx.restore();
    return {
      ...part, pivot: [...part.pivot], poly: part.poly.map((point) => [...point]), canvas: cutout.canvas,
    };
  });
  return { width, height, base: base.canvas, parts };
}

/** Two-entry LRU, including failures so unsupported canvases are not retried per frame. */
export function getPreparedBossRig(stageId, image) {
  const rig = BOSS_RIGS[stageId];
  if (!rig) return null;
  const [width, height] = imageSize(image);
  const src = image?.currentSrc || image?.src;
  const cached = preparedRigs.get(stageId);
  if (cached && cached.image === image && cached.rig === rig
    && Object.is(cached.width, width) && Object.is(cached.height, height) && cached.src === src) {
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

/** Engine hit snapshots start at impact; the preview's counterattack travel is external. */
export function getBossPose({ animation, idleElapsedSeconds = 0, reducedMotion = false } = {}) {
  const pose = { time: reducedMotion ? 0 : seconds(idleElapsedSeconds), charge: 0, fire: 0, roar: 0, hit: 0 };
  const t = seconds(animation?.elapsedSeconds);
  const defaults = { attack: 2.6, roar: .8, hit: .38 };
  const duration = finite(animation?.durationSeconds) > 0 ? animation.durationSeconds : defaults[animation?.kind];
  if (t >= duration) return pose;
  if (animation?.kind === 'attack') {
    pose.charge = smooth(t / .9) * (1 - smooth((t - 1.35) / .45));
    pose.fire = t >= 1.1 ? Math.exp(-(t - 1.1) * 8) : 0;
  }
  if (animation?.kind === 'roar') pose.roar = Math.sin(Math.PI * clamp(t / duration));
  if (animation?.kind === 'hit') pose.hit = Math.exp(-t * 5);
  return pose;
}

function normalizedPose(pose, reducedMotion) {
  return {
    time: reducedMotion ? 0 : seconds(pose?.time),
    charge: clamp(pose?.charge), fire: clamp(pose?.fire), roar: clamp(pose?.roar), hit: clamp(pose?.hit),
  };
}

function drawWarped(ctx, source, width, height, time, tail) {
  if (!tail) { ctx.drawImage(source, 0, 0, width, height); return; }
  const steps = 64, strip = source.width / steps;
  for (let i = 0; i < steps; i++) {
    const u = (i + .5) / steps, strength = Math.pow(clamp((u - .56) / .44), 2);
    const dy = Math.sin(time * 2.5 - u * 7) * height * .055 * strength;
    ctx.drawImage(source, i * strip, 0, strip + .3, source.height,
      i * width / steps, dy, width / steps + .25, height);
  }
}

function glow(ctx, x, y, radius, color, strength = 1) {
  if (!(radius > 0 && strength > 0)) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = clamp(strength);
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, radius));
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(.18, color);
  gradient.addColorStop(1, `${color}00`);
  ctx.fillStyle = gradient;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
  ctx.restore();
}

/** Draw only the articulated artwork and its approved persistent lighting. */
export function drawBossRig(ctx, { rig, prepared, pose, box, projectileImage, reducedMotion = false } = {}) {
  if (!ctx || !rigValid(rig) || !prepared?.base || !Array.isArray(prepared.parts) || !boxValid(box)) return;
  const p = normalizedPose(pose, reducedMotion);
  const { x, y, w, h } = box;
  ctx.save();
  ctx.translate(x + (reducedMotion ? 0 : p.fire * 5 + p.hit * 9), y);
  drawWarped(ctx, prepared.base, w, h, p.time, rig.id === 'abyssal-beast' && !reducedMotion);
  prepared.parts.forEach((part, i) => {
    const breathing = reducedMotion ? 0 : Math.sin(p.time * (1.7 + i * .13) + i * 1.6);
    const openness = p.charge * .55 + p.roar;
    const angle = breathing * part.amplitude + part.side * part.open * openness;
    const dx = (part.slide || 0) * w * (openness + .24 * breathing) + (part.recoil || 0) * w * p.fire;
    const dy = (part.lift || 0) * h * part.side * (openness + .3 * breathing);
    const [px, py] = part.pivot;
    ctx.save();
    ctx.translate(px * w + dx, py * h + dy);
    ctx.rotate(angle);
    ctx.translate(-px * w, -py * h);
    ctx.drawImage(part.canvas, 0, 0, w, h);
    ctx.restore();
  });
  ctx.restore();

  const [cx, cy, cr] = rig.core, coreX = x + cx * w, coreY = y + cy * h;
  glow(ctx, coreX, coreY, cr * w * (1.25 + p.charge), rig.color, .14 + p.charge * .37 + p.roar * .24);
  if (rig.id === 'gravity-well') {
    ctx.save(); ctx.strokeStyle = rig.color; ctx.globalAlpha = .45; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(coreX, coreY, cr * w * (.5 + i * .19), cr * h * (.5 + i * .19),
        p.time * (i % 2 ? -.4 : .3), p.time + i * 2, p.time + i * 2 + 3.3);
      ctx.stroke();
      const theta = p.time * (i % 2 ? -.6 : .5) + i * 2.1;
      const px = coreX + Math.cos(theta) * w * .21, py = coreY + Math.sin(theta) * h * .29;
      if (projectileImage) ctx.drawImage(projectileImage, px - 12, py - 8, 24, 16);
    }
    ctx.restore();
  }
  if (rig.id === 'signal-monoliths') {
    for (let i = 0; i < 6; i++) {
      glow(ctx, x + w * (.25 + i * .105), y + h * .5, w * .018,
        rig.color, .15 + .6 * Math.pow(Math.max(0, Math.sin(p.time * 4 - i * .9)), 6));
    }
  }
  if (rig.id === 'solar-forge') {
    glow(ctx, x + w * .91, y + h * .5, w * (.08 + .013 * Math.sin(p.time * 21)), '#ff9845', .3 + p.charge * .15);
  }
}

/** Feedback also works over a flat sprite; main owns volleys/counterattack travel. */
export function drawBossActionEffects(ctx, { rig, pose, box, action, reducedMotion = false } = {}) {
  if (!ctx || !rigValid(rig) || !boxValid(box)) return;
  const p = normalizedPose(pose, reducedMotion);
  const { x, y, w, h } = box;
  const mx = x + rig.muzzle[0] * w, my = y + rig.muzzle[1] * h;
  if (p.charge > 0 && p.fire === 0) glow(ctx, mx, my, 12 + p.charge * 28, rig.color, .3 + p.charge * .5);
  if (p.fire > 0) glow(ctx, mx, my, 28, rig.color, p.fire);

  // boss.roar has no kind; an explicit kind on other snapshots takes precedence.
  const isRoar = action && (action.kind === 'roar' || action.kind === undefined);
  const duration = finite(action?.durationSeconds) > 0 ? action.durationSeconds : .8;
  const elapsed = seconds(action?.elapsedSeconds);
  if (isRoar && elapsed < duration) {
    for (let i = 0; i < (reducedMotion ? 1 : 3); i++) {
      const age = elapsed - i * .15;
      if (age < 0) continue;
      const radius = reducedMotion ? 24 : 20 + age * 540;
      ctx.save(); ctx.strokeStyle = rig.color; ctx.lineWidth = 2.5;
      ctx.globalAlpha = Math.max(0, 1 - age / duration) * .8;
      ctx.shadowColor = rig.color; ctx.shadowBlur = reducedMotion ? 0 : 12;
      ctx.beginPath(); ctx.ellipse(mx, my, radius, radius * .7, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }
  if (p.hit > 0) {
    const coreX = x + rig.core[0] * w, coreY = y + rig.core[1] * h;
    glow(ctx, coreX, coreY, w * .35, '#ecfbff', p.hit * .65);
    ctx.save(); ctx.strokeStyle = '#f0fcff'; ctx.globalAlpha = p.hit; ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const theta = i * Math.PI / 5;
      const radius = w * (reducedMotion ? .1 : .1 + (1 - p.hit) * .22);
      ctx.beginPath();
      ctx.moveTo(coreX + Math.cos(theta) * radius, coreY + Math.sin(theta) * radius);
      ctx.lineTo(coreX + Math.cos(theta) * (radius + 12), coreY + Math.sin(theta) * (radius + 12));
      ctx.stroke();
    }
    ctx.restore();
  }
}
