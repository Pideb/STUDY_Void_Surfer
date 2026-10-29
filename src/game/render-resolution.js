const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;
export const MAX_RENDER_WIDTH = 1920;
export const MAX_RENDER_HEIGHT = 1080;
export const MAX_RENDER_PIXELS = MAX_RENDER_WIDTH * MAX_RENDER_HEIGHT;

export function getRenderResolution({ width, height, dpr } = {}) {
  const cssWidth = Number.isFinite(width) && width > 0 ? width : WORLD_WIDTH;
  const cssHeight = Number.isFinite(height) && height > 0 ? height : WORLD_HEIGHT;
  const pixelRatio = Number.isFinite(dpr) ? Math.max(1, Math.min(2, dpr)) : 1;
  // Fit both axes, including ultrawide/portrait views, without changing the CSS
  // viewport or960x540 simulation. Small screens keep their existing DPR scale.
  const limit = Math.min(pixelRatio, MAX_RENDER_WIDTH / cssWidth, MAX_RENDER_HEIGHT / cssHeight);
  const physicalWidth = Math.max(1, Math.floor(cssWidth * limit));
  const physicalHeight = Math.max(1, Math.floor(cssHeight * limit));
  return { width: physicalWidth, height: physicalHeight,
    scaleX: physicalWidth / WORLD_WIDTH, scaleY: physicalHeight / WORLD_HEIGHT, pixelRatio };
}
