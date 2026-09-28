import { describe, expect, it, vi } from 'vitest';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../../src/game/constants.js';
import {
  createRenderer, drawBoss, drawDashTrail, drawObstacle, drawShip, drawShipExhaust,
} from '../../src/game/renderer.js';
import { STAGE_VISUAL_THEMES, VISUAL_THEME } from '../../src/game/visual-theme.js';

function createContext() {
  const gradient = { addColorStop: vi.fn() };
  return {
    calls: [],
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    gradient,
  };
}

describe('renderer', () => {
  it('animates six distinct boss idle signatures and freezes them for reduced motion', () => {
    const stageIds = [
      'crystal-gates', 'industrial-void', 'signal-monoliths',
      'gravity-well', 'abyssal-beast', 'solar-forge',
    ];
    const signatures = [];
    const motionCalls = (context) => JSON.stringify({
      arcs: context.arc.mock.calls,
      moves: context.moveTo.mock.calls,
      lines: context.lineTo.mock.calls,
      rotations: context.rotate.mock.calls,
      images: context.drawImage.mock.calls,
    });

    for (const stageId of stageIds) {
      const image = { name: `${stageId}-boss`, width: 800, height: 600 };
      const assets = { get: (path) => path === `stages.${stageId}.boss` ? image : null };
      const theme = STAGE_VISUAL_THEMES[stageId];
      const first = createContext();
      const later = createContext();
      const reducedA = createContext();
      const reducedB = createContext();
      const boss = Object.freeze({ hp: 3, attack: Object.freeze({ state: 'charging', x: 600 }) });

      drawBoss(first, { isBoss: true, bossPattern: 'shift' }, theme, boss, 0, assets, stageId, false);
      drawBoss(later, { isBoss: true, bossPattern: 'shift' }, theme, boss, 1.2, assets, stageId, false);
      drawBoss(reducedA, { isBoss: true, bossPattern: 'shift' }, theme, boss, 0, assets, stageId, true);
      drawBoss(reducedB, { isBoss: true, bossPattern: 'shift' }, theme, boss, 8, assets, stageId, true);

      expect(motionCalls(first)).not.toBe(motionCalls(later));
      expect(motionCalls(reducedA)).toBe(motionCalls(reducedB));
      signatures.push(motionCalls(later));
      expect(boss).toEqual({ hp: 3, attack: { state: 'charging', x: 600 } });
    }

    expect(new Set(signatures).size).toBe(6);
  });

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
    expect(context.fillText).not.toHaveBeenCalledWith('BOSS WARNING', 480, 64);
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

  it('draws the gameplay ship 20% larger without changing logical hitbox geometry', () => {
    const context = createContext();
    const image = { width: 1774, height: 887 };
    const player = { x: 240, y: 270, velocityY: 0, width: 36, height: 24 };
    drawShip(context, player, VISUAL_THEME, 'velocity', { get: () => image });

    const [, x, y, width, height] = context.drawImage.mock.calls[0];
    expect(x).toBeCloseTo(-21.6);
    expect(y).toBeCloseTo(-10.8);
    expect(width).toBeCloseTo(43.2);
    expect(height).toBeCloseTo(21.6);
    expect(player).toMatchObject({ width: 36, height: 24 });
  });

  it('draws a faint aircraft-accent exhaust during ordinary flight without mutating the player', () => {
    const context = createContext();
    const player = { x: 240, y: 270, width: 36, height: 24, isDashing: false };
    drawShipExhaust(context, player, 'velocity', 1.25);

    expect(context.stroke).toHaveBeenCalledTimes(3);
    expect(context.strokeStyle).toBe('#ff55cf');
    expect(context.globalAlpha).toBeCloseTo(0.72 + (Math.sin(1.25 * 11) + 1) * 0.14);
    expect(player).toEqual({ x: 240, y: 270, width: 36, height: 24, isDashing: false });
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

    expect(normalContext.stroke).toHaveBeenCalledTimes(17);
    expect(specialContext.stroke.mock.calls.length).toBeGreaterThan(normalContext.stroke.mock.calls.length);
    expect(specialContext.arc.mock.calls.length).toBeGreaterThan(normalContext.arc.mock.calls.length);
    normalRenderer.destroy();
    specialRenderer.destroy();
  });

  it('renders exactly four thin acceleration lines for a dash without a filled trail', () => {
    const context = createContext();
    drawDashTrail(context, {
      x: 240, y: 270, velocityY: 0, width: 36, height: 24,
      isDashing: true, dashRemainingSeconds: 0.6,
    });

    expect(context.beginPath).toHaveBeenCalledTimes(4);
    expect(context.moveTo).toHaveBeenCalledTimes(4);
    expect(context.lineTo).toHaveBeenCalledTimes(4);
    expect(context.stroke).toHaveBeenCalledTimes(4);
    expect(context.fillRect).not.toHaveBeenCalled();
  });

  it('omits acceleration lines outside a dash and keeps the procedural ship dash accents', () => {
    const idleTrailContext = createContext();
    drawDashTrail(idleTrailContext, {
      x: 240, y: 270, velocityY: 0, width: 36, height: 24, isDashing: false,
    });
    expect(idleTrailContext.stroke).not.toHaveBeenCalled();

    const dashShipContext = createContext();
    drawShip(dashShipContext, {
      x: 240, y: 270, velocityY: 0, width: 36, height: 24,
      isDashing: true, dashRemainingSeconds: 0.6,
    });
    expect(dashShipContext.stroke).toHaveBeenCalledTimes(3);
    expect(dashShipContext.arc).toHaveBeenCalledTimes(1);
  });

  it('does not draw a rectangular hitbox outline around an image-backed ship during dash', () => {
    const context = createContext();
    const image = { width: 100, height: 60 };
    drawShip(context, {
      x: 240, y: 270, velocityY: 0, width: 36, height: 24,
      isDashing: true, dashRemainingSeconds: 0.6,
    }, VISUAL_THEME, 'default', { get: () => image });

    expect(context.strokeRect).not.toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalledTimes(1);
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
    expect(context.drawImage).not.toHaveBeenCalled();
    renderer.destroy();
  });

  it('renders stage-specific full-screen scenes and crossfades background keys', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const renderer = createRenderer(canvas);
    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [],
      difficulty: {},
      stage: {
        id: 'solar-forge', mode: 'normal', elapsedSeconds: 3,
        transition: { fromKey: 'gravity-well-boss', toKey: 'solar-forge', progress: 0.4 },
      },
    });

    expect(Object.keys(STAGE_VISUAL_THEMES)).toHaveLength(6);
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    expect(context.arc).toHaveBeenCalled();
    renderer.destroy();
  });

  it('scrolls repeated stage artwork leftward and overlaps copies at the wrap seam', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const background = { name: 'scrolling-bg', width: 2048, height: 1152 };
    const renderer = createRenderer(canvas, {
      visualAssets: { get: (path) => path === 'stages.crystal-gates.background' ? background : null },
      reducedMotion: false,
    });

    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [],
      difficulty: { scrollSpeed: 240 },
      backgroundScrollDistancePx: 100,
      stage: { id: 'crystal-gates', mode: 'normal', elapsedSeconds: 0 },
    });

    const backgroundCalls = context.drawImage.mock.calls.filter(([drawn]) => drawn === background);
    expect(backgroundCalls[0][1]).toBe(-100);
    expect(backgroundCalls.length).toBeGreaterThan(2);
    expect(context.clip).toHaveBeenCalled();
    renderer.destroy();
  });

  it('renders boss projectile telegraphs, quarter lasers, and challenge cues from snapshot state', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const renderer = createRenderer(canvas);
    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [],
      difficulty: { isBoss: true, bossPattern: 'signal' },
      stage: { id: 'signal-monoliths', mode: 'boss', elapsedSeconds: 2 },
      boss: {
        hitEffect: { remainingSeconds: 0.2, durationSeconds: 0.38 },
        attack: { type: 'projectile', state: 'charging', telegraphPoints: [{ x: 840, y: 180 }, { x: 240, y: 270 }] },
      },
      challenge: { active: true, sequence: ['KeyW', 'KeyA', 'KeyD'], cursor: 1 },
    });
    expect(context.fillText).toHaveBeenCalledWith('W', expect.any(Number), 258);
    expect(context.fillText).toHaveBeenCalledWith('BOSS: SIGNAL', 840, 392);
    renderer.destroy();
  });

  it('draws the loaded Crystal Gates art in layer order without mutating snapshot geometry', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const image = (name, width = 1024, height = 1024) => ({ name, width, height });
    const assets = new Map([
      ['stages.crystal-gates.background', image('stage-background')],
      ['stages.crystal-gates.normalWall', image('normal-wall', 1024, 1536)],
      ['stages.crystal-gates.specialWall', image('special-wall', 1024, 1536)],
      ['stages.crystal-gates.boss', image('boss')],
      ['stages.crystal-gates.projectile', image('projectile')],
      ['aircraft.velocity', image('velocity', 1774, 887)],
    ]);
    const renderer = createRenderer(canvas, { visualAssets: { get: (path) => assets.get(path) ?? null } });
    const player = Object.freeze({ x: 240, y: 270, velocityY: 0, width: 36, height: 24 });
    const normalWall = Object.freeze({ x: 500, width: 72, gapCenter: 270, gapHeight: 180, kind: 'normal' });
    const specialWall = Object.freeze({ x: 700, width: 24, gapCenter: 270, gapHeight: 180, kind: 'special' });
    const projectile = Object.freeze({ type: 'projectile', state: 'flying', x: 600, y: 260, speed: 320 });

    renderer.render({
      player,
      aircraft: { id: 'velocity' },
      obstacles: [normalWall, specialWall],
      difficulty: { isBoss: true, bossPattern: 'shift' },
      stage: { id: 'crystal-gates', mode: 'normal', elapsedSeconds: 2 },
      boss: { attack: projectile },
    });

    const drawnImages = context.drawImage.mock.calls.map(([drawn]) => drawn.name);
    expect(drawnImages).toContain('stage-background');
    expect(drawnImages).toContain('normal-wall');
    expect(drawnImages).toContain('special-wall');
    expect(drawnImages).toContain('boss');
    expect(drawnImages).toContain('projectile');
    expect(drawnImages.at(-1)).toBe('velocity');
    expect(normalWall).toEqual({ x: 500, width: 72, gapCenter: 270, gapHeight: 180, kind: 'normal' });
    expect(specialWall).toEqual({ x: 700, width: 24, gapCenter: 270, gapHeight: 180, kind: 'special' });
    expect(player).toEqual({ x: 240, y: 270, velocityY: 0, width: 36, height: 24 });
    expect(projectile).toEqual({ type: 'projectile', state: 'flying', x: 600, y: 260, speed: 320 });
    expect(context.clip).toHaveBeenCalled();
    renderer.destroy();
  });

  it('draws Crystal Gates laser art and falls back only when an individual asset is missing', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const stageBackground = { name: 'stage-background', width: 2048, height: 1152 };
    const laser = { name: 'laser', width: 2048, height: 768 };
    const assets = new Map([
      ['stages.crystal-gates.background', stageBackground],
      ['stages.crystal-gates.laser', laser],
    ]);
    const renderer = createRenderer(canvas, { visualAssets: { get: (path) => assets.get(path) ?? null } });

    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [],
      difficulty: {},
      stage: { id: 'crystal-gates', mode: 'normal', elapsedSeconds: 0 },
      boss: { attack: { type: 'laser', kind: 'single', y: 210, thickness: 8, telegraphRemainingSeconds: 0 } },
    });

    expect(context.drawImage.mock.calls.some(([drawn]) => drawn === stageBackground)).toBe(true);
    expect(context.drawImage.mock.calls.some(([drawn]) => drawn === laser)).toBe(true);
    expect(context.fill).toHaveBeenCalled(); // The unavailable player sprite uses the procedural fallback.
    renderer.destroy();
  });

  it('uses the loaded menu background without drawing a duplicate default aircraft', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const background = { name: 'menu-background', width: 2048, height: 1152 };
    const assets = new Map([['menuBackground', background]]);
    const renderer = createRenderer(canvas, { visualAssets: { get: (path) => assets.get(path) ?? null } });

    renderer.renderMenuBackground();

    expect(context.drawImage.mock.calls.map(([drawn]) => drawn.name)).toEqual(['menu-background']);
    renderer.destroy();
  });

  it('pushes Crystal Gates scenes from right to left at explicit travel distances', () => {
    for (const [progress, travelledPixels, outgoingX, incomingX] of [
      [0, 0, 0, 960], [0.25, 240, -240, 720], [0.5, 480, -480, 480], [1, 960, -960, 0],
    ]) {
      const canvas = document.createElement('canvas');
      const context = createContext();
      canvas.getContext = vi.fn(() => context);
      const backgrounds = new Map([
        ['stages.crystal-gates.background', { name: 'normal', width: 1600, height: 900 }],
        ['stages.crystal-gates.bossBackground', { name: 'boss', width: 1600, height: 900 }],
      ]);
      const renderer = createRenderer(canvas, {
        visualAssets: { get: (path) => backgrounds.get(path) ?? null },
      });

      renderer.render({
        player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
        obstacles: [],
        difficulty: {},
        stage: {
          id: 'crystal-gates', mode: 'normal', elapsedSeconds: 0,
          transition: {
            fromKey: 'crystal-gates-boss', toKey: 'crystal-gates', progress, travelledPixels, durationSeconds: 1.5,
          },
        },
      });

      expect(context.translate.mock.calls.slice(0, 2)).toEqual([[outgoingX, 0], [incomingX, 0]]);
      renderer.destroy();
    }
  });

  it('uses a brief crossfade rather than a spatial slide for reduced motion', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const sceneDraws = [];
    context.drawImage = vi.fn((image, x, y) => sceneDraws.push({ name: image.name, x, y, alpha: context.globalAlpha }));
    const backgrounds = new Map([
      ['stages.crystal-gates.background', { name: 'normal', width: 1600, height: 900 }],
      ['stages.crystal-gates.bossBackground', { name: 'boss', width: 1600, height: 900 }],
    ]);
    const renderer = createRenderer(canvas, {
      visualAssets: { get: (path) => backgrounds.get(path) ?? null },
      reducedMotion: true,
    });

    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [],
      difficulty: {},
      stage: {
        id: 'crystal-gates', mode: 'normal', elapsedSeconds: 0,
        transition: {
          fromKey: 'crystal-gates-boss', toKey: 'crystal-gates', progress: 0.02, durationSeconds: 1.5,
        },
      },
    });

    expect(sceneDraws.slice(0, 2).map(({ name, x, y }) => ({ name, x, y }))).toEqual([
      { name: 'boss', x: -57.60000000000002, y: -32.400000000000034 },
      { name: 'normal', x: -57.60000000000002, y: -32.400000000000034 },
    ]);
    expect(sceneDraws[0].alpha).toBeCloseTo(1 - (0.02 * WORLD_WIDTH) / 36);
    expect(sceneDraws[1].alpha).toBeCloseTo((0.02 * WORLD_WIDTH) / 36);
    expect(context.translate.mock.calls.slice(0, 2)).toEqual([[0, 0], [0, 0]]);
    renderer.destroy();
  });
});
