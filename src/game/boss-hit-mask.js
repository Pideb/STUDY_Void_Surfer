import { getPreparedBossRig } from './boss-motion.js';
import { intersectsBossBeam } from './boss-beam.js';

// Compile alpha to normalized opaque rectangles once; collision never reads pixels.
export function alphaRectangles(data, width, height, stripWidth = width) {
  const rectangles = [], active = new Map();
  for (let y = 0; y < height; y++) {
    const next = new Map();
    for (let x = 0; x < width;) {
      if (data[(y * width + x) * 4 + 3] < 64) { x++; continue; }
      const start = x, end = Math.min(width, (Math.floor(x / stripWidth) + 1) * stripWidth);
      while (x < end && data[(y * width + x) * 4 + 3] >= 64) x++;
      const key = `${start}:${x}`, previous = active.get(key);
      const rect = previous ?? [start / width, y / height, x / width, (y + 1) / height];
      if (previous) rect[3] = (y + 1) / height;
      else rectangles.push(rect);
      next.set(key, rect);
    }
    active.clear(); for (const [key, rect] of next) active.set(key, rect);
  }
  return rectangles;
}

function canvasFactory(width, height) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  return canvas;
}

export function createBossBeamContact(visualAssets, { prepare = getPreparedBossRig, makeCanvas = canvasFactory,
  reducedMotion = () => Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches),
} = {}) {
  const cache = new WeakMap();
  return input => {
    const image = visualAssets?.get?.(`stages.${input.stageId}.boss`);
    let silhouette = null;
    if (image) {
      let stages = cache.get(image);
      if (!stages) { stages = new Map(); cache.set(image, stages); }
      if (!stages.has(input.stageId)) {
        try {
          const prepared = prepare(input.stageId, image);
          if (prepared) {
            const width = 192, height = 128, canvas = makeCanvas(width, height);
            const ctx = canvas?.getContext?.('2d', { willReadFrequently: true });
            if (ctx?.getImageData) {
              const read = (layer, strips = false) => {
                ctx.clearRect(0, 0, width, height); ctx.drawImage(layer, 0, 0, width, height);
                return alphaRectangles(ctx.getImageData(0, 0, width, height).data, width, height, strips ? width / 64 : width);
              };
              silhouette = { base: read(prepared.base, input.stageId === 'abyssal-beast'), parts: prepared.parts.map(part => read(part.canvas)) };
            }
          }
        } catch { /* Optional raster API unavailable: use the procedural fallback. */ }
        stages.set(input.stageId, silhouette);
      }
      silhouette = stages.get(input.stageId);
    }
    return intersectsBossBeam({ ...input, silhouette, reducedMotion: typeof reducedMotion === 'function' ? reducedMotion() : reducedMotion });
  };
}
