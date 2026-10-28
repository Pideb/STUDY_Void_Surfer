import { WORLD_HEIGHT as H, WORLD_WIDTH as W } from './constants.js';

// Keep the approved preview palette: some portal colors differ from stage palettes.
const destinations = [
  ['crystal-gates', '#8bd7ff'],
  ['industrial-void', '#ffad58'],
  ['signal-monoliths', '#d49bff'],
  ['gravity-well', '#be9bff'],
  ['abyssal-beast', '#62f1ee'],
  ['solar-forge', '#ffb24f'],
];
const clamp = x => Math.max(0, Math.min(1, x));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const seconds = value => Math.max(0, finite(value));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

/** Pure phase-local cover opacity; stage swapping belongs to the engine. */
export function getPortalWhiteAlpha(transition) {
  if (transition?.kind !== 'portal') return 0;
  const time = seconds(transition.phaseElapsedSeconds);
  if (transition.phase === 'white-out') return smooth(time / .20);
  if (transition.phase === 'hold') return 1;
  if (transition.phase === 'reveal') return 1 - smooth(time / .60);
  return 0;
}

function imageSize(image) {
  if (!image || image.complete === false) return null;
  const width = image.naturalWidth ?? image.width;
  const height = image.naturalHeight ?? image.height;
  return Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0
    ? { width, height } : null;
}

// No Path2D, raster processing or offscreen canvas is needed for this effect.
function ellipse(c, x, y, rx, ry, rotation, start, end) {
  if (typeof c.ellipse === 'function') {
    c.ellipse(x, y, rx, ry, rotation, start, end);
  } else {
    c.save(); c.translate(x, y); c.rotate(rotation); c.scale(rx, ry);
    c.arc(0, 0, 1, start, end); c.restore();
  }
}

function glow(c, x, y, rx, ry, color, alpha = 1) {
  c.save(); c.translate(x, y); c.scale(1, ry / rx);
  c.globalCompositeOperation = 'screen'; c.globalAlpha = clamp(alpha);
  const g = c.createRadialGradient?.(0, 0, 0, 0, 0, rx);
  if (g) {
    g.addColorStop(0, '#f6fdff'); g.addColorStop(.24, color); g.addColorStop(1, color + '00');
  }
  c.fillStyle = g ?? color;
  c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill(); c.restore();
}

// Exact approved ornament articulation, applied to eight overlapping image masks.
function ornamentPose(stage, sector, time, reduced = false) {
  const theta = (sector + .5) * Math.PI / 4, beat = time * 1.6 + sector * .83;
  if (reduced) return { dx: 0, dy: 0, angle: 0 };
  const n = Math.sin(beat);
  if (stage === 0) return { dx: Math.cos(theta) * n * 4, dy: Math.sin(beat * .73) * 5, angle: Math.sin(beat * .7) * .012 };
  if (stage === 1) {
    const lock = Math.sin(time * 2 + sector * .35) * .8;
    return { dx: Math.cos(theta) * lock, dy: Math.sin(theta) * lock, angle: 0 };
  }
  if (stage === 2) return { dx: Math.sin(beat * .6) * 1.8, dy: Math.sin(time * 2 + sector * 1.3) * 4, angle: 0 };
  if (stage === 3) return { dx: -Math.sin(theta) * Math.sin(beat * .7) * 4, dy: Math.cos(theta) * Math.sin(beat * .7) * 5, angle: Math.sin(beat * .5) * .011 };
  if (stage === 4) return { dx: Math.cos(theta) * Math.sin(time * 1.8 + sector * .25) * 2.5, dy: Math.sin(theta) * Math.sin(time * 1.8 + sector * .25) * 3, angle: Math.sin(beat) * .009 };
  return { dx: Math.cos(theta) * Math.sin(time * 2.5 + sector * .3) * 1.3, dy: Math.sin(theta) * Math.sin(time * 2.5 + sector * .3) * 1.3, angle: 0 };
}

function shell(c, { x, y, rx, ry, alpha, stage, time: t, reducedMotion, ornamentImage, size }) {
  const h = ry * 2.7, w = h * size.width / size.height;
  c.save(); c.globalAlpha = alpha;
  c.beginPath(); c.rect(-1000, -1000, 3000, 3000);
  ellipse(c, x, y, rx + 4, ry + 3, 0, 0, Math.PI * 2); c.clip('evenodd');
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, b = (i + 1) * Math.PI / 4;
    const p = ornamentPose(stage, i, t, reducedMotion);
    c.save(); c.translate(x + p.dx, y + p.dy); c.rotate(p.angle);
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 1000, a - .085, b + .085);
    c.closePath(); c.clip();
    c.drawImage(ornamentImage, -w / 2, -h / 2, w, h); c.restore();
  }
  c.restore();
  const color = destinations[stage][1];
  if (stage === 0) {
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3 + t * .12;
      glow(c, x + Math.cos(a) * (rx + 33), y + Math.sin(a) * ry * .83, 3.5, 3.5, color, alpha * (.2 + .25 * Math.sin(t * 2 + i) ** 2));
    }
  } else if (stage === 1) {
    for (let i = 0; i < 4; i++) {
      const side = i % 2 ? 1 : -1, yy = y + (i < 2 ? -1 : 1) * ry * .62;
      glow(c, x + side * (rx + 20), yy, 6, 3, color, alpha * (.2 + .35 * Math.max(0, Math.sin(t * 2 - i))));
    }
  } else if (stage === 2) {
    for (let i = 0; i < 6; i++) {
      const a = (i + .5) * Math.PI / 3;
      glow(c, x + Math.cos(a) * (rx + 23), y + Math.sin(a) * ry * .88, 4, 4, color, alpha * (.12 + .5 * Math.max(0, Math.sin(t * 3 - i * .7)) ** 4));
    }
  } else if (stage === 3) {
    c.save(); c.strokeStyle = color; c.lineWidth = 1; c.globalAlpha = alpha * .22;
    for (let i = 0; i < 2; i++) {
      c.beginPath();
      ellipse(c, x, y, rx + 25 + i * 8, ry + 6 + i * 6, Math.sin(t * .3) * .04, t * .4 + i * Math.PI, t * .4 + i * Math.PI + 1.8);
      c.stroke();
    }
    c.restore();
  } else if (stage === 4) {
    for (let i = 0; i < 4; i++) {
      const a = (i + .5) * Math.PI / 2;
      glow(c, x + Math.cos(a) * (rx + 25), y + Math.sin(a) * ry * .8, 6, 11, color, alpha * (.10 + .16 * Math.sin(t * 1.8 - i) ** 2));
    }
  } else {
    for (let i = 0; i < 10; i++) {
      const life = (t * .43 + i * .173) % 1, a = i * 2.4;
      const px = x + Math.cos(a) * (rx + 22 + life * 15), py = y + Math.sin(a) * ry * .83 - life * 25;
      glow(c, px, py, 2.2, 2.2, '#ffc277', alpha * (1 - life) * .65);
    }
  }
}

/** Draw before world actors; coordinates and travel are owned by the transition. */
export function drawPortal(c, { transition, destinationBackground, ornamentImage, reducedMotion = false } = {}) {
  if (!c || transition?.kind !== 'portal') return;
  if (transition.phase !== 'approach' && transition.phase !== 'white-out') return;
  const alpha = transition.phase === 'white-out' ? 1 - getPortalWhiteAlpha(transition) : 1;
  if (alpha <= 0) return;
  const found = destinations.findIndex(([id]) => id === transition.destinationStageId);
  const stage = found < 0 ? 0 : found, color = destinations[stage][1];
  const x = finite(transition.portalX,
    finite(transition.crossingX, W / 4) + 960 - Math.max(0, finite(transition.travelledPixels)));
  // Fixed vertical opening: even the enlarged ship near either boundary fits.
  const y = H / 2, time = seconds(transition.elapsedSeconds);
  const near = clamp((1080 - x) / 850), rx = 70 + near * 34, ry = H / 2 + 100;
  const size = imageSize(ornamentImage);
  if (size) shell(c, { x, y, rx, ry, alpha, stage, time, reducedMotion, ornamentImage, size });
  c.save(); c.globalAlpha = alpha;
  c.save(); c.beginPath(); ellipse(c, x, y, rx, ry, 0, 0, Math.PI * 2); c.clip();
  if (imageSize(destinationBackground)) c.drawImage(destinationBackground, 0, 0, W, H);
  c.fillStyle = '#ddf8ff66'; c.fillRect(0, 0, W, H); c.restore();
  c.globalCompositeOperation = 'screen'; c.shadowColor = color; c.shadowBlur = 24;
  for (let i = 0; i < 4; i++) {
    c.strokeStyle = i === 3 ? '#f3fdff' : color; c.globalAlpha = alpha * (.18 + i * .17); c.lineWidth = i === 3 ? 2 : 7 - i;
    c.beginPath(); ellipse(c, x, y, rx + i * 3, ry + i * 5, 0, 0, Math.PI * 2); c.stroke();
  }
  for (let i = 0; i < 18; i++) {
    const angle = i * Math.PI / 9 + time * .35, swell = 1 + .035 * Math.sin(time * 7 + i);
    const px = x + Math.cos(angle) * rx * swell, py = y + Math.sin(angle) * ry * swell;
    c.fillStyle = '#e6fcff'; c.globalAlpha = alpha * .7;
    c.beginPath(); c.arc(px, py, 1.2 + (i % 3) * .5, 0, Math.PI * 2); c.fill();
  }
  c.restore(); glow(c, x, y, rx * 1.8, ry * 1.35, color, alpha * .16);
}

/** Call after all world actors so the opaque hold conceals the stage swap. */
export function drawTransitionOverlay(c, { transition, reducedMotion = false } = {}) {
  const alpha = getPortalWhiteAlpha(transition);
  if (!c || alpha <= 0) return;
  c.save();
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = alpha;
  c.fillStyle = reducedMotion ? '#c6dfed' : '#ffffff';
  c.fillRect(0, 0, W, H);
  c.restore();
}
