const RASTER = 2;
const PADDING = 4;
const DIRECTIONS = Array.from({ length: 12 }, (_, i) => [Math.cos(i * Math.PI / 6), Math.sin(i * Math.PI / 6)]);

function defaultFactory(width, height) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
  if (typeof CanvasRenderingContext2D === 'undefined' || typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  return canvas;
}

export function createProjectileOutlineCache({ canvasFactory = defaultFactory } = {}) {
  const images = new WeakMap();
  return {
    get(image, frame, width, height, color) {
      if (!image || image.complete === false) return null;
      let variants = images.get(image);
      if (!variants) { variants = new Map(); images.set(image, variants); }
      const key = `${image.currentSrc ?? image.src ?? ''}:${frame.x},${frame.y},${frame.width},${frame.height}:${width},${height}:${color}`;
      if (variants.has(key)) return variants.get(key);
      // Cache failure too, so a browser without these APIs does not retry per frame.
      variants.set(key, null);
      try {
        const pixelWidth = Math.ceil((width + PADDING * 2) * RASTER);
        const pixelHeight = Math.ceil((height + PADDING * 2) * RASTER);
        const mask = canvasFactory(pixelWidth, pixelHeight), canvas = canvasFactory(pixelWidth, pixelHeight);
        if (!mask || !canvas) return null;
        mask.width = canvas.width = pixelWidth; mask.height = canvas.height = pixelHeight;
        const ctx = mask.getContext('2d'), output = canvas.getContext('2d');
        if (!ctx?.getImageData || !ctx.putImageData || !output?.drawImage) return null;
        ctx.drawImage(image, frame.x, frame.y, frame.width, frame.height,
          PADDING * RASTER, PADDING * RASTER, width * RASTER, height * RASTER);
        // Read only this tiny display-size mask once, not the full-resolution art.
        // Ignore faint baked glow so the contour follows the actual projectile.
        const pixels = ctx.getImageData(0, 0, pixelWidth, pixelHeight);
        for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] >= 48 ? 255 : 0;
        ctx.putImageData(pixels, 0, 0);
        ctx.globalCompositeOperation = 'source-in';
        const stamp = (tint, radius) => {
          ctx.fillStyle = tint; ctx.fillRect(0, 0, pixelWidth, pixelHeight);
          for (const [x, y] of DIRECTIONS) output.drawImage(mask, x * radius * RASTER, y * radius * RASTER);
        };
        stamp('#061019', 2.75);
        stamp(color, 1.75);
        const result = { canvas, x: -width / 2 - PADDING, y: -height / 2 - PADDING,
          width: pixelWidth / RASTER, height: pixelHeight / RASTER };
        variants.set(key, result);
        return result;
      } catch { return null; }
    },
  };
}

export const projectileOutlines = createProjectileOutlineCache();
