const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;

export function createApp(root) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError('앱 루트는 HTMLElement여야 합니다.');
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  canvas.className = 'game-canvas';
  canvas.width = LOGICAL_WIDTH;
  canvas.height = LOGICAL_HEIGHT;
  canvas.setAttribute('aria-label', 'VOID SURFER 게임 화면');

  const uiRoot = document.createElement('div');
  uiRoot.id = 'ui-root';
  uiRoot.className = 'ui-root';

  const liveRegion = document.createElement('div');
  liveRegion.id = 'live-region';
  liveRegion.className = 'sr-only';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');

  root.replaceChildren(canvas, uiRoot, liveRegion);

  return { canvas, uiRoot, liveRegion };
}

export { LOGICAL_HEIGHT, LOGICAL_WIDTH };
