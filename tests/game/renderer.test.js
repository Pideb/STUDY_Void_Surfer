import { describe, expect, it, vi } from 'vitest';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../../src/game/constants.js';
import { createRenderer, drawObstacle, drawShip } from '../../src/game/renderer.js';
import { VISUAL_THEME } from '../../src/game/visual-theme.js';

function createContext() {
  const gradient = { addColorStop: vi.fn() };
  return {
    calls: [],
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    gradient,
  };
}

describe('renderer', () => {
  it('keeps logical coordinates while resizing the physical canvas for DPR', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const previousDpr = globalThis.devicePixelRatio;
    Object.defineProperty(globalThis, 'devicePixelRatio', { configurable: true, value: 2 });

    const renderer = createRenderer(canvas);

    expect(canvas.width).toBe(WORLD_WIDTH * 2);
    expect(canvas.height).toBe(WORLD_HEIGHT * 2);
    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);

    renderer.destroy();
    Object.defineProperty(globalThis, 'devicePixelRatio', { configurable: true, value: previousDpr ?? 1 });
  });

  it('renders background, obstacles, ship, warning, and boss state', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const renderer = createRenderer(canvas);

    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [{ id: 'wall-1', x: 520, width: 72, gapCenter: 270, gapHeight: 180, kind: 'special' }],
      difficulty: { isWarning: true, isBoss: true, bossPattern: 'fast' },
    });

    expect(context.fillRect).toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalledWith('BOSS: FAST', 840, 392);
    expect(context.fillText).toHaveBeenCalledWith('BOSS WARNING', 480, 64);
    expect(context.arc).toHaveBeenCalled();
    renderer.destroy();
  });

  it('exposes pure drawing helpers for ship and obstacle visuals', () => {
    const context = createContext();

    drawShip(context, { x: 240, y: 270, velocityY: 10, width: 36, height: 24 });
    drawObstacle(context, { x: 520, width: 72, gapCenter: 270, gapHeight: 180, kind: 'normal' });

    expect(context.fill).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalled();
    expect(VISUAL_THEME.ship).not.toBe(VISUAL_THEME.obstacle);
  });

  it('renders special walls as a full-height dash-only barrier', () => {
    const context = createContext();
    drawObstacle(context, { x: 520, width: 72, gapCenter: 270, gapHeight: 180, kind: 'special' });

    expect(context.fillRect).toHaveBeenCalledWith(520, 0, 72, WORLD_HEIGHT);
  });

  it('draws a timing guide only for enabled special walls', () => {
    const context = createContext();
    const specialWall = {
      x: 520, width: 24, gapCenter: 270, gapHeight: 180, kind: 'special', showTimingGuide: true,
    };

    drawObstacle(context, specialWall, VISUAL_THEME, { scrollSpeed: 240, timingWindowSeconds: 0.5 });

    expect(context.fillRect).toHaveBeenCalledWith(400, 0, 120, WORLD_HEIGHT);
    const noGuideContext = createContext();
    drawObstacle(noGuideContext, { ...specialWall, showTimingGuide: false }, VISUAL_THEME, {
      scrollSpeed: 240,
      timingWindowSeconds: 0.5,
    });
    expect(noGuideContext.fillRect).not.toHaveBeenCalledWith(400, 0, 120, WORLD_HEIGHT);
  });

  it('draws a trail for any dash and a ring only for successful special dashes', () => {
    const canvas = document.createElement('canvas');
    const normalContext = createContext();
    canvas.getContext = vi.fn(() => normalContext);
    const normalRenderer = createRenderer(canvas);
    normalRenderer.render({
      player: {
        x: 240, y: 270, velocityY: 0, width: 36, height: 24,
        isDashing: true, dashKind: 'normal', dashRemainingSeconds: 0.6,
      },
      obstacles: [], difficulty: {},
    });

    const specialContext = createContext();
    canvas.getContext = vi.fn(() => specialContext);
    const specialRenderer = createRenderer(canvas);
    specialRenderer.render({
      player: {
        x: 240, y: 270, velocityY: 0, width: 36, height: 24,
        isDashing: true, dashKind: 'special', dashRemainingSeconds: 0.6,
      },
      obstacles: [], difficulty: {},
    });

    expect(normalContext.fillRect).toHaveBeenCalled();
    expect(specialContext.arc.mock.calls.length).toBeGreaterThan(normalContext.arc.mock.calls.length);
    normalRenderer.destroy();
    specialRenderer.destroy();
  });

  it('renders a deterministic static menu scene', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const renderer = createRenderer(canvas);

    renderer.renderMenuBackground();

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    expect(context.createRadialGradient).toHaveBeenCalled();
    expect(context.moveTo).toHaveBeenCalled();
    expect(context.translate).toHaveBeenCalledWith(300, WORLD_HEIGHT / 2);
    renderer.destroy();
  });
});
