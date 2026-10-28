import { afterEach, describe, expect, it, vi } from 'vitest';
import { BOSS_RIGS } from '../../src/game/boss-rigs.js';
import { getBossGeometry } from '../../src/game/boss-geometry.js';
import {
  prepareBossRig, getPreparedBossRig, getBossPose, drawBossRig, drawBossActionEffects,
} from '../../src/game/boss-motion.js';

function context() {
  const ctx = { globalAlpha: 1, globalCompositeOperation: 'source-over' };
  const stack = [];
  for (const name of ['drawImage', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'clip',
    'fill', 'stroke', 'clearRect', 'arc', 'ellipse', 'translate', 'rotate']) ctx[name] = vi.fn();
  ctx.save = vi.fn(() => stack.push({ globalAlpha: ctx.globalAlpha,
    globalCompositeOperation: ctx.globalCompositeOperation }));
  ctx.restore = vi.fn(() => Object.assign(ctx, stack.pop()));
  ctx.createRadialGradient = vi.fn(() => ({ addColorStop: vi.fn() }));
  return ctx;
}

function canvasFactory() {
  const canvases = [];
  const factory = vi.fn((width, height) => {
    const ctx = context();
    const canvas = { width, height, ctx, getContext: vi.fn(() => ctx) };
    canvases.push(canvas);
    return canvas;
  });
  factory.canvases = canvases;
  return factory;
}

function offscreen(factory) {
  vi.stubGlobal('OffscreenCanvas', function (width, height) { return factory(width, height); });
}

function draw(stageId, { time = 0, reducedMotion = false, animation, projectileImage } = {}) {
  const rig = BOSS_RIGS[stageId];
  const prepared = prepareBossRig({ rig, image: { width: 1200, height: 800 }, canvasFactory: canvasFactory() });
  const pose = getBossPose({ animation, idleElapsedSeconds: time, reducedMotion });
  const ctx = context(), box = getBossGeometry(stageId).box;
  drawBossRig(ctx, { rig, prepared, pose, box, reducedMotion, projectileImage });
  return { ctx, prepared, box, pose };
}

function expectBalanced(ctx) {
  expect(ctx.save).toHaveBeenCalledTimes(ctx.restore.mock.calls.length);
  expect(ctx.globalAlpha).toBe(1);
  expect(ctx.globalCompositeOperation).toBe('source-over');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('boss rig masks and cache', () => {
  it.each(Object.keys(BOSS_RIGS))('cuts exact approved polygons for %s at 768px with a narrow seam underlap', (id) => {
    const rig = BOSS_RIGS[id], before = JSON.stringify(rig), factory = canvasFactory();
    const image = { width: 1200, height: 800 };
    const prepared = prepareBossRig({ rig, image, canvasFactory: factory });
    expect(prepared).toMatchObject({ width: 768, height: 512 });
    expect(prepared.parts).toHaveLength(rig.parts.length);
    const [original, base, erase] = factory.canvases;
    expect(original.ctx.drawImage).toHaveBeenCalledExactlyOnceWith(image, 0, 0, 768, 512);
    expect(base.ctx.drawImage.mock.calls[0]).toEqual([original, 0, 0]);
    for (const [i, part] of prepared.parts.entries()) {
      const source = rig.parts[i], ctx = part.canvas.ctx;
      expect(part).toMatchObject(source);
      expect(part.pivot).not.toBe(source.pivot);
      expect(part.poly).not.toBe(source.poly);
      expect(ctx.moveTo).toHaveBeenCalledExactlyOnceWith(source.poly[0][0] * 768, source.poly[0][1] * 512);
      expect(ctx.lineTo.mock.calls).toEqual(source.poly.slice(1).map(([x, y]) => [x * 768, y * 512]));
      expect(ctx.clip).toHaveBeenCalledOnce();
      expect(ctx.clip.mock.invocationCallOrder[0]).toBeLessThan(ctx.drawImage.mock.invocationCallOrder[0]);
      expect(ctx.drawImage).toHaveBeenCalledExactlyOnceWith(original, 0, 0);
      expect(base.ctx.drawImage.mock.calls[i + 1]).toEqual([erase, 0, 0]);
      expectBalanced(ctx);
    }
    expect(erase.ctx.clearRect).toHaveBeenCalledTimes(rig.parts.length);
    expect(erase.ctx.fill).toHaveBeenCalledTimes(rig.parts.length);
    expect(erase.ctx.stroke).toHaveBeenCalledTimes(rig.parts.length);
    expect(erase.ctx.lineWidth).toBe(2); // One source pixel retained inside each boundary.
    expectBalanced(base.ctx);
    expectBalanced(erase.ctx);
    expect(JSON.stringify(rig)).toBe(before);
  });

  it('returns null for unavailable/incomplete canvas APIs, unloaded images and invalid rigs', () => {
    const rig = BOSS_RIGS['crystal-gates'], image = { width: 1200, height: 800 };
    for (const factory of [() => null, () => ({ getContext: () => null }),
      () => ({ getContext: () => ({ drawImage() {} }) }), () => { throw new Error('unavailable'); }]) {
      expect(prepareBossRig({ rig, image, canvasFactory: factory })).toBeNull();
    }
    const factory = canvasFactory();
    for (const invalid of [null, {}, { width: 0, height: 800 }, { width: NaN, height: 20 },
      { width: 1, height: Infinity }, { naturalWidth: 0, naturalHeight: 0, width: 20, height: 20 }]) {
      expect(prepareBossRig({ rig, image: invalid, canvasFactory: factory })).toBeNull();
    }
    expect(prepareBossRig({ rig: { ...rig, parts: [{ ...rig.parts[0], pivot: [NaN, 0] }] },
      image, canvasFactory: factory })).toBeNull();
    expect(factory).not.toHaveBeenCalled();
  });

  it('avoids document.getContext entirely in JSDOM and caches the failure', () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    vi.stubGlobal('CanvasRenderingContext2D', undefined);
    const create = vi.spyOn(document, 'createElement');
    const image = { width: 1200, height: 800 };
    expect(prepareBossRig({ rig: BOSS_RIGS['crystal-gates'], image })).toBeNull();
    expect(getPreparedBossRig('crystal-gates', image)).toBeNull();
    const factory = canvasFactory();
    offscreen(factory);
    expect(getPreparedBossRig('crystal-gates', image)).toBeNull();
    expect(create).not.toHaveBeenCalled();
    expect(factory).not.toHaveBeenCalled();
  });

  it('uses a document canvas when the browser has 2D canvas but no OffscreenCanvas', () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    vi.stubGlobal('CanvasRenderingContext2D', function () {});
    const factory = canvasFactory();
    const create = vi.spyOn(document, 'createElement').mockImplementation(() => factory());
    expect(prepareBossRig({ rig: BOSS_RIGS['industrial-void'], image: { width: 1200, height: 800 } })).not.toBeNull();
    expect(create.mock.calls.every(([tag]) => tag === 'canvas')).toBe(true);
    expect(factory.canvases.every((canvas) => canvas.width === 768 && canvas.height === 512)).toBe(true);
  });

  it('reuses masks without allocating per frame, evicts the least recently used third rig and replaces changed images', () => {
    const factory = canvasFactory();
    offscreen(factory);
    const image = { width: 1200, height: 800, src: 'approved.png' };
    const a = getPreparedBossRig('crystal-gates', image);
    const b = getPreparedBossRig('industrial-void', image);
    const allocated = factory.mock.calls.length;
    for (let frame = 0; frame < 60; frame++) expect(getPreparedBossRig('crystal-gates', image)).toBe(a);
    expect(factory).toHaveBeenCalledTimes(allocated);
    getPreparedBossRig('signal-monoliths', image);
    expect(getPreparedBossRig('crystal-gates', image)).toBe(a);
    expect(getPreparedBossRig('industrial-void', image)).not.toBe(b);
    const replacement = getPreparedBossRig('industrial-void', { ...image });
    expect(replacement).not.toBe(b);
    image.src = 'replacement.png';
    expect(getPreparedBossRig('industrial-void', image)).not.toBe(replacement);
    const beforeUnknown = factory.mock.calls.length;
    expect(getPreparedBossRig('unknown', image)).toBeNull();
    expect(factory).toHaveBeenCalledTimes(beforeUnknown);
  });

  it('caches a real context failure and retries only when the image changes or becomes loaded', () => {
    const factory = vi.fn(() => ({ getContext: () => null }));
    offscreen(factory);
    const image = { width: 1200, height: 800 };
    for (let frame = 0; frame < 60; frame++) expect(getPreparedBossRig('solar-forge', image)).toBeNull();
    expect(factory).toHaveBeenCalledOnce();
    const validFactory = canvasFactory();
    offscreen(validFactory);
    image.width = 0;
    expect(getPreparedBossRig('solar-forge', image)).toBeNull();
    image.width = 1200;
    expect(getPreparedBossRig('solar-forge', image)).not.toBeNull();
    expect(validFactory).toHaveBeenCalled();
  });

  it('does not conceal drawing errors after capability validation', () => {
    const factory = canvasFactory();
    const brokenFactory = (w, h) => {
      const canvas = factory(w, h);
      canvas.ctx.drawImage.mockImplementation(() => { throw new Error('invalid source'); });
      return canvas;
    };
    expect(() => prepareBossRig({ rig: BOSS_RIGS['gravity-well'], image: { width: 100, height: 100 },
      canvasFactory: brokenFactory })).toThrow('invalid source');
  });
});

describe('boss action poses', () => {
  it('uses the approved charge and exponential firing envelope at the common 1.1s release', () => {
    const at = (elapsedSeconds) => getBossPose({ animation: { kind: 'attack', elapsedSeconds, durationSeconds: 4 } });
    expect(at(0)).toMatchObject({ charge: 0, fire: 0 });
    expect(at(.45)).toMatchObject({ charge: .5, fire: 0 });
    expect(at(.9)).toMatchObject({ charge: 1, fire: 0 });
    expect(at(1.099).fire).toBe(0);
    expect(at(1.1)).toMatchObject({ charge: 1, fire: 1 });
    expect(at(1.225).fire).toBeCloseTo(Math.exp(-1));
    expect(at(1.575).charge).toBeCloseTo(.5);
    expect(at(1.8).charge).toBe(0);
    expect(at(4)).toMatchObject({ charge: 0, fire: 0 });
  });

  it('opens over the 0.8s roar and begins the 0.38s hit feedback immediately at impact', () => {
    const roar = (elapsedSeconds) => getBossPose({ animation: { kind: 'roar', elapsedSeconds, durationSeconds: .8 } });
    expect(roar(0).roar).toBe(0);
    expect(roar(.4).roar).toBe(1);
    expect(roar(.79).roar).toBeGreaterThan(0);
    expect(roar(.8).roar).toBe(0);
    const hit = (elapsedSeconds) => getBossPose({ animation: { kind: 'hit', elapsedSeconds, durationSeconds: .38 } });
    expect(hit(0).hit).toBe(1);
    expect(hit(.19).hit).toBeCloseTo(Math.exp(-.95));
    expect(hit(.38).hit).toBe(0);
  });

  it('normalizes malformed snapshots, has independent results and freezes only idle time for reduced motion', () => {
    expect(getBossPose()).toEqual({ time: 0, charge: 0, fire: 0, roar: 0, hit: 0 });
    for (const kind of ['idle', 'attack', 'roar', 'hit', 'unknown']) {
      for (const value of [NaN, Infinity, -Infinity, -2, undefined, Number.MAX_VALUE]) {
        const pose = getBossPose({ animation: { kind, elapsedSeconds: value, durationSeconds: value }, idleElapsedSeconds: value });
        expect(Object.values(pose).every(Number.isFinite)).toBe(true);
      }
    }
    const animation = Object.freeze({ kind: 'attack', elapsedSeconds: 1.1, durationSeconds: 4 });
    const first = getBossPose({ animation, idleElapsedSeconds: 20, reducedMotion: true });
    expect(first).toEqual({ time: 0, charge: 1, fire: 1, roar: 0, hit: 0 });
    first.fire = 0;
    expect(getBossPose({ animation }).fire).toBe(1);
  });
});

describe('approved articulated drawing', () => {
  it.each(Object.keys(BOSS_RIGS))('anchors %s while individual parts change over time', (id) => {
    const a = draw(id, { time: .2 }), b = draw(id, { time: .7 });
    expect(a.ctx.translate.mock.calls[0]).toEqual([a.box.x, a.box.y]);
    expect(b.ctx.translate.mock.calls[0]).toEqual([b.box.x, b.box.y]);
    expect(a.ctx.rotate.mock.calls).not.toEqual(b.ctx.rotate.mock.calls);
    expect(a.ctx.drawImage.mock.calls.filter(([image]) => a.prepared.parts.some((part) => part.canvas === image)))
      .toHaveLength(BOSS_RIGS[id].parts.length);
    expectBalanced(a.ctx);
    expectBalanced(b.ctx);
  });

  it('opens the abyssal jaw/fins on roar and deforms the tail in 64 strips with an anchored root', () => {
    const { ctx, prepared, box } = draw('abyssal-beast', { time: .6, animation: { kind: 'roar', elapsedSeconds: .4 } });
    const strips = ctx.drawImage.mock.calls.filter(([source]) => source === prepared.base);
    expect(strips).toHaveLength(64);
    expect(strips.every((args) => args.length === 9)).toBe(true);
    expect(strips.slice(0, 35).every((args) => args[6] === 0)).toBe(true);
    expect(strips.slice(36).some((args) => Math.abs(args[6]) > 0)).toBe(true);
    expect(strips.every((args) => Math.abs(args[6]) <= box.h * .055)).toBe(true);
    expect(ctx.rotate.mock.calls[0][0]).toBeLessThan(-.17); // Jaw's approved -.19 opening.
    expect(ctx.rotate.mock.calls[1][0]).toBeGreaterThan(.04);
  });

  it('adds approved weapon recoil and signal armor slide/lift during a charge', () => {
    const industrial = draw('industrial-void', { time: 0, animation: { kind: 'attack', elapsedSeconds: 1.1 } });
    expect(industrial.ctx.translate.mock.calls[0]).toEqual([industrial.box.x + 5, industrial.box.y]);
    expect(industrial.ctx.translate.mock.calls[1][0]).toBeCloseTo((.43 + .026) * industrial.box.w);
    const signalIdle = draw('signal-monoliths', { reducedMotion: true });
    const signalCharge = draw('signal-monoliths', { reducedMotion: true, animation: { kind: 'attack', elapsedSeconds: 1 } });
    expect(signalCharge.ctx.translate.mock.calls[1][0]).toBeGreaterThan(signalIdle.ctx.translate.mock.calls[1][0]);
    expect(signalCharge.ctx.translate.mock.calls[5][1]).toBeLessThan(signalIdle.ctx.translate.mock.calls[5][1]);
  });

  it('draws gravity lens arcs and three orbiting projectile sprites, tolerating a missing projectile', () => {
    const projectileImage = { width: 60, height: 30 };
    const a = draw('gravity-well', { time: 0, projectileImage });
    const b = draw('gravity-well', { time: 1, projectileImage });
    expect(a.ctx.ellipse).toHaveBeenCalledTimes(3);
    const orbits = (ctx) => ctx.drawImage.mock.calls.filter(([image]) => image === projectileImage);
    expect(orbits(a.ctx)).toHaveLength(3);
    expect(orbits(a.ctx)).not.toEqual(orbits(b.ctx));
    expect(draw('gravity-well').ctx.ellipse).toHaveBeenCalledTimes(3);
  });

  it('keeps signal chase lighting and solar heat anchored to their approved normalized positions', () => {
    const signal = draw('signal-monoliths', { time: .2 });
    expect(signal.ctx.createRadialGradient).toHaveBeenCalledTimes(7);
    const heat = draw('solar-forge', { time: .2 });
    expect(heat.ctx.createRadialGradient.mock.calls[1].slice(0, 2))
      .toEqual([heat.box.x + heat.box.w * .91, heat.box.y + heat.box.h * .5]);
    expect(heat.ctx.createRadialGradient.mock.calls[1][5])
      .not.toBe(draw('solar-forge', { time: .3 }).ctx.createRadialGradient.mock.calls[1][5]);
  });

  it.each(Object.keys(BOSS_RIGS))('freezes idle cutouts, tail, lens/orbits and lights for reduced-motion %s', (id) => {
    const projectileImage = {};
    const a = draw(id, { time: .2, reducedMotion: true, projectileImage });
    const b = draw(id, { time: 9, reducedMotion: true, projectileImage });
    expect(a.ctx.rotate.mock.calls.every(([angle]) => angle === 0)).toBe(true);
    expect(a.ctx.translate.mock.calls).toEqual(b.ctx.translate.mock.calls);
    expect(a.ctx.ellipse.mock.calls).toEqual(b.ctx.ellipse.mock.calls);
    expect(a.ctx.createRadialGradient.mock.calls).toEqual(b.ctx.createRadialGradient.mock.calls);
    expect(a.ctx.drawImage.mock.calls.filter(([image]) => image === a.prepared.base)).toHaveLength(1);
    expect(a.ctx.drawImage.mock.calls.filter(([image]) => image === projectileImage))
      .toEqual(b.ctx.drawImage.mock.calls.filter(([image]) => image === projectileImage));
  });
});

describe('action feedback over prepared or flat artwork', () => {
  it.each(Object.keys(BOSS_RIGS))('uses shared %s geometry for muzzle rings and core hit rays without drawing projectiles', (id) => {
    const ctx = context(), rig = BOSS_RIGS[id], { box, core, muzzle } = getBossGeometry(id, .5);
    drawBossActionEffects(ctx, { rig, box,
      pose: { hit: 1 }, action: { id: 'roar', elapsedSeconds: .4, durationSeconds: .8 } });
    expect(ctx.ellipse).toHaveBeenCalledTimes(3);
    expect(ctx.ellipse.mock.calls.every(([x, y]) => x === muzzle.x && y === muzzle.y)).toBe(true);
    expect(ctx.createRadialGradient.mock.calls[0].slice(0, 2)).toEqual([core.x, core.y]);
    expect(ctx.lineTo).toHaveBeenCalledTimes(10);
    expect(ctx.drawImage).not.toHaveBeenCalled();
    expectBalanced(ctx);
  });

  it('draws charge/release feedback without prepared masks and expires roar rings', () => {
    const rig = BOSS_RIGS['industrial-void'], { box, muzzle } = getBossGeometry(rig.id);
    const ctx = context();
    drawBossActionEffects(ctx, { rig, box, pose: getBossPose({ animation: { kind: 'attack', elapsedSeconds: .9 } }) });
    drawBossActionEffects(ctx, { rig, box, pose: getBossPose({ animation: { kind: 'attack', elapsedSeconds: 1.1 } }) });
    expect(ctx.createRadialGradient.mock.calls.every(([x, y]) => x === muzzle.x && y === muzzle.y)).toBe(true);
    expect(ctx.createRadialGradient).toHaveBeenCalledTimes(2);
    for (const action of [{ kind: 'roar', elapsedSeconds: .8, durationSeconds: .8 },
      { kind: 'idle', elapsedSeconds: .1 }, null]) drawBossActionEffects(ctx, { rig, box, action });
    expect(ctx.ellipse).not.toHaveBeenCalled();
  });

  it('retains fixed-size roar/hit/charge feedback under reduced motion', () => {
    const rig = BOSS_RIGS['abyssal-beast'], { box } = getBossGeometry(rig.id);
    const draws = [.2, .4].map((elapsedSeconds) => {
      const ctx = context();
      drawBossActionEffects(ctx, { rig, box, reducedMotion: true, pose: { hit: .8, charge: 1 },
        action: { elapsedSeconds, durationSeconds: .8 } });
      expect(ctx.ellipse).toHaveBeenCalledOnce();
      expect(ctx.lineTo).toHaveBeenCalledTimes(10);
      expect(ctx.createRadialGradient).toHaveBeenCalledTimes(2);
      return ctx;
    });
    expect(draws[0].ellipse.mock.calls).toEqual(draws[1].ellipse.mock.calls);
    expect(draws[0].lineTo.mock.calls).toEqual(draws[1].lineTo.mock.calls);
  });

  it('ignores invalid bounds and keeps malformed pose numbers finite', () => {
    const rig = BOSS_RIGS['solar-forge'], { box } = getBossGeometry(rig.id);
    for (const invalid of [null, { ...box, w: 0 }, { ...box, x: NaN }, { ...box, h: Infinity }]) {
      const ctx = context();
      drawBossRig(ctx, { rig, prepared: {}, box: invalid });
      drawBossActionEffects(ctx, { rig, box: invalid });
      expect(ctx.save).not.toHaveBeenCalled();
    }
    const factory = canvasFactory(), prepared = prepareBossRig({ rig, image: { width: 100, height: 100 }, canvasFactory: factory });
    const ctx = context(), pose = { time: Infinity, charge: NaN, fire: -Infinity, roar: 2, hit: .5 };
    drawBossRig(ctx, { rig, prepared, box, pose });
    drawBossActionEffects(ctx, { rig, box, pose });
    for (const method of ['translate', 'rotate', 'arc', 'ellipse', 'createRadialGradient', 'moveTo', 'lineTo']) {
      expect(ctx[method].mock.calls.flat().every(Number.isFinite)).toBe(true);
    }
    expectBalanced(ctx);
  });
});
