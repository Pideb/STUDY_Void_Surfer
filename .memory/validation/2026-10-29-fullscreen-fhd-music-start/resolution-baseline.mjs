const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;
export const MAX_RENDER_PIXELS = 3840 * 2160;

export function getRenderResolution({ width, height, dpr } = {}) {
  const cssWidth = Number.isFinite(width) && width > 0 ? width : WORLD_WIDTH;
  const cssHeight = Number.isFinite(height) && height > 0 ? height : WORLD_HEIGHT;
  const pixelRatio = Number.isFinite(dpr) ? Math.max(1, Math.min(2, dpr)) : 1;
  // Scaling CSS dimensions first also avoids overflow from multiplying huge extents.
  const limit = Math.min(pixelRatio, Math.sqrt(MAX_RENDER_PIXELS / cssWidth / cssHeight));
  const physicalWidth = Math.max(1, Math.floor(cssWidth * limit));
  const physicalHeight = Math.max(1, Math.floor(cssHeight * limit));
  return { width: physicalWidth, height: physicalHeight,
    scaleX: physicalWidth / WORLD_WIDTH, scaleY: physicalHeight / WORLD_HEIGHT, pixelRatio };
}
