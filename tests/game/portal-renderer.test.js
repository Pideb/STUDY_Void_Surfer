import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import * as renderer from '../../src/game/portal-renderer.js';

const { drawPortal, drawTransitionOverlay, getPortalWhiteAlpha } = renderer;
const destinations = [
  ['crystal-gates', '#8bd7ff'], ['industrial-void', '#ffad58'],
  ['signal-monoliths', '#d49bff'], ['gravity-well', '#be9bff'],
  ['abyssal-beast', '#62f1ee'], ['solar-forge', '#ffb24f'],
];
const transition = overrides => ({
  kind: 'portal', destinationStageId: 'crystal-gates', phase: 'approach',
  elapsedSeconds: 1.7, phaseElapsedSeconds: 1.25, travelledPixels: 600,
  portalX: 600, crossingX: 240, crossingY: 270, swapped: false,
  ...overrides,
});
const ornamentImage = Object.freeze({ width: 1536, height: 1024 });
const destinationBackground = Object.freeze({ width: 1920, height: 1080 });

// Record both commands and canvas properties, including save/restore semantics.
function context() {
  const operations = [], fills = [], images = [], stack = [];
  const state = { globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '#000000', shadowBlur: 0 };
  const c = { operations, fills, images };
  for (const key of ['globalAlpha', 'globalCompositeOperation', 'fillStyle', 'strokeStyle', 'lineWidth', 'shadowColor', 'shadowBlur']) {
    Object.defineProperty(c, key, {
      get: () => state[key],
      set: value => {
        state[key] = value;
        operations.push(['set', key, value?.gradientId ?? value]);
      },
    });
  }
  for (const method of ['save', 'restore', 'translate', 'rotate', 'scale', 'beginPath', 'closePath',
    'moveTo', 'arc', 'ellipse', 'rect', 'clip', 'stroke', 'fill', 'fillRect', 'drawImage']) {
    c[method] = vi.fn((...args) => {
      operations.push([method, ...args]);
      if (method === 'save') stack.push({ ...state });
      if (method === 'restore') {
        const previous = stack.pop();
        if (!previous) throw new Error('Unbalanced canvas restore');
        for (const key of Object.keys(state)) delete state[key];
        Object.assign(state, previous);
      }
      if (method === 'fillRect') fills.push({ args, ...state });
      if (method === 'drawImage') images.push({ args, ...state });
    });
  }
  let gradientId = 0;
  c.createRadialGradient = vi.fn((...args) => {
    const id = `gradient:${gradientId++}`;
    operations.push(['createRadialGradient', ...args]);
    return { gradientId: id, addColorStop: (...stop) => operations.push(['addColorStop', id, ...stop]) };
  });
  return c;
}

// Use the read-only approved drawing functions as an independent regression oracle.
// This compares every drawing command, not just counts or copies of our formulas.
const preview = readFileSync('.memory/previews/2026-10-28-portal-motion-review/portal.js', 'utf8');
const previewDrawing = preview.slice(preview.indexOf('  function glow('), preview.indexOf('  function ship('));
const approvedPortal = new Function('c', 'assets', 'state', 'stages', 'clamp', `${previewDrawing}\nreturn portal;`);

describe('portal renderer approved art', () => {
  it('exports exactly the three integration helpers', () => {
    expect(Object.keys(renderer).sort()).toEqual(['drawPortal', 'drawTransitionOverlay', 'getPortalWhiteAlpha']);
  });

  it.each(destinations)('matches every approved drawing command for %s', (id, color) => {
    const stage = destinations.findIndex(([key]) => key === id);
    for (const reduced of [false, true]) {
      for (const [x, time, phase, phaseTime, alpha] of [
        [1200, .45, 'approach', 0, 1], [625, 1.7, 'approach', 1.25, 1],
        [240, 3.25, 'approach', 2.8, 1], [192, 3.35, 'white-out', .1, .5],
      ]) {
        const actual = context(), approved = context();
        drawPortal(actual, {
          transition: transition({ destinationStageId: id, portalX: x, elapsedSeconds: time, phase, phaseElapsedSeconds: phaseTime }),
          ornamentImage, destinationBackground, reducedMotion: reduced,
        });
        approvedPortal(approved, { ornament: ornamentImage, to: destinationBackground },
          { to: stage, time, reduced, ornaments: true }, destinations.map(([key, tint]) => [key, key, tint]),
          value => Math.max(0, Math.min(1, value)))(x, alpha);
        expect(actual.operations).toEqual(approved.operations);
        expect(actual.operations).toContainEqual(['set', 'shadowColor', color]);
      }
    }
  });

  it('excludes the aperture before drawing eight full-image overlapping sectors', () => {
    const c = context();
    drawPortal(c, { transition: transition({ portalX: 240 }), ornamentImage, destinationBackground });
    const exclusion = c.clip.mock.calls.findIndex(([rule]) => rule === 'evenodd');
    expect(exclusion).toBe(0);
    expect(c.clip.mock.invocationCallOrder[0]).toBeLessThan(c.drawImage.mock.invocationCallOrder[0]);
    const [x, y, rx, ry] = c.ellipse.mock.calls[0];
    expect([x, y]).toEqual([240, 270]);
    expect(c.ellipse.mock.calls[1].slice(2, 4)).toEqual([rx - 4, ry - 3]);
    const masks = c.arc.mock.calls.filter(([, , radius]) => radius === 1000);
    expect(masks).toHaveLength(8);
    masks.forEach(([, , , start, end], index) => {
      expect(start).toBeCloseTo(index * Math.PI / 4 - .085, 12);
      expect(end).toBeCloseTo((index + 1) * Math.PI / 4 + .085, 12);
    });
    const art = c.images.filter(({ args }) => args[0] === ornamentImage);
    expect(art).toHaveLength(8);
    for (const { args } of art) {
      expect(args).toEqual([ornamentImage, -375, -250, 750, 500]);
    }
    expect(c.drawImage).toHaveBeenLastCalledWith(destinationBackground, 0, 0, 960, 540);
  });

  it.each([45, 199, 270, 341, 495])('honors captured crossingY=%s without clamping or mutating the snapshot', y => {
    const c = context(), snapshot = Object.freeze(transition({ crossingY: y, portalX: 451 }));
    drawPortal(c, { transition: snapshot, ornamentImage, destinationBackground });
    expect(c.ellipse.mock.calls.every(([x, cy]) => x === 451 && cy === y)).toBe(true);
    expect(snapshot.crossingY).toBe(y);
    expect(snapshot.portalX).toBe(451);
  });

  it('uses the snapshot position independently of elapsed time and speed assumptions', () => {
    for (const x of [1200, 1152, 960, 720, 240, 144]) {
      const c = context();
      drawPortal(c, { transition: transition({ portalX: x, elapsedSeconds: 99, travelledPixels: 12 }) });
      expect(c.ellipse.mock.calls[0][0]).toBe(x);
    }
  });

  it('uses native image dimensions without editing, cropping or replacing textures', () => {
    const image = Object.freeze({ width: 200, height: 100, naturalWidth: 1200, naturalHeight: 1200, complete: true });
    const c = context();
    drawPortal(c, { transition: transition({ portalX: 240 }), ornamentImage: image, destinationBackground });
    expect(c.drawImage.mock.calls.filter(([img]) => img === image)).toEqual(
      Array.from({ length: 8 }, () => [image, -250, -250, 500, 500]),
    );
    expect(c.drawImage.mock.calls.every(args => args.length === 5)).toBe(true);
  });

  it('freezes all eight ornament poses with reduced motion', () => {
    const c = context();
    drawPortal(c, { transition: transition({ crossingY: 301 }), ornamentImage, reducedMotion: true });
    expect(c.translate.mock.calls.slice(0, 8)).toEqual(Array.from({ length: 8 }, () => [600, 301]));
    expect(c.rotate.mock.calls).toEqual(Array.from({ length: 8 }, () => [0]));
  });
});

describe('portal cover and rendering phases', () => {
  it.each([
    ['lead-in', .3, 0], ['approach', 5, 0],
    ['white-out', -.1, 0], ['white-out', 0, 0], ['white-out', .05, .15625],
    ['white-out', .1, .5], ['white-out', .2, 1], ['white-out', .3, 1],
    ['hold', 0, 1], ['hold', .1, 1],
    ['reveal', 0, 1], ['reveal', .15, .84375], ['reveal', .3, .5],
    ['reveal', .6, 0], ['reveal', .8, 0], ['complete', 0, 0], ['unknown', 1, 0],
  ])('%s at %ss has cover alpha %s', (phase, time, alpha) => {
    expect(getPortalWhiteAlpha(transition({ phase, phaseElapsedSeconds: time }))).toBeCloseTo(alpha, 12);
  });

  it.each(['lead-in', 'hold', 'reveal', 'complete', 'unknown'])('does not draw a portal during %s', phase => {
    const c = context();
    drawPortal(c, { transition: transition({ phase }), ornamentImage, destinationBackground });
    expect(c.operations).toEqual([]);
  });

  it('fades portal art only during the first .20s of white-out', () => {
    for (const [time, alpha] of [[0, 1], [.05, .84375], [.1, .5], [.2, 0], [.4, 0]]) {
      const c = context();
      drawPortal(c, { transition: transition({ phase: 'white-out', phaseElapsedSeconds: time }), ornamentImage, destinationBackground });
      if (alpha === 0) expect(c.operations).toEqual([]);
      else expect(c.images.map(image => image.globalAlpha)).toEqual(Array(9).fill(alpha));
    }
  });

  it.each([false, true])('covers all world actors during hold (reduced=%s) and restores canvas state', reducedMotion => {
    const c = context();
    c.globalAlpha = .37; c.globalCompositeOperation = 'screen'; c.fillStyle = 'red';
    c.drawImage({ name: 'world actor' }, 0, 0, 20, 20);
    drawTransitionOverlay(c, { transition: transition({ phase: 'hold', phaseElapsedSeconds: .05 }), reducedMotion });
    expect(c.fills).toEqual([expect.objectContaining({
      args: [0, 0, 960, 540], globalAlpha: 1, globalCompositeOperation: 'source-over',
      fillStyle: reducedMotion ? '#c6dfed' : '#ffffff',
    })]);
    expect(c.fillRect.mock.invocationCallOrder[0]).toBeGreaterThan(c.drawImage.mock.invocationCallOrder[0]);
    expect([c.globalAlpha, c.globalCompositeOperation, c.fillStyle]).toEqual([.37, 'screen', 'red']);
  });

  it('keeps phase-local overlay opacity independent of swapped and total elapsed time', () => {
    for (const swapped of [false, true]) {
      const c = context();
      drawTransitionOverlay(c, { transition: transition({ phase: 'reveal', phaseElapsedSeconds: .3, elapsedSeconds: 100, swapped }) });
      expect(c.fills[0].globalAlpha).toBeCloseTo(.5, 12);
    }
  });

  it('leaves no cover or canvas changes outside the fade phases', () => {
    for (const phase of ['lead-in', 'approach', 'complete']) {
      const c = context();
      drawTransitionOverlay(c, { transition: transition({ phase }) });
      expect(c.operations).toEqual([]);
    }
  });
});

describe('portal drawing fallbacks', () => {
  it.each([undefined, null, {}, { width: 0, height: 10 }, { width: 10, height: Infinity },
    { width: 10, height: 10, complete: false }, { width: 10, height: 10, naturalWidth: 0, naturalHeight: 0 },
  ])('keeps an energy portal when textures are unavailable: %j', image => {
    const c = context();
    drawPortal(c, { transition: transition(), ornamentImage: image, destinationBackground: image });
    expect(c.drawImage).not.toHaveBeenCalled();
    expect(c.stroke).toHaveBeenCalledTimes(4);
    expect(c.fill).toHaveBeenCalledTimes(19);
    expect(c.fillRect).toHaveBeenCalledWith(0, 0, 960, 540);
  });

  it('draws either available texture independently', () => {
    const backgroundOnly = context(), ornamentOnly = context();
    drawPortal(backgroundOnly, { transition: transition(), destinationBackground });
    drawPortal(ornamentOnly, { transition: transition(), ornamentImage });
    expect(backgroundOnly.drawImage).toHaveBeenCalledExactlyOnceWith(destinationBackground, 0, 0, 960, 540);
    expect(ornamentOnly.drawImage).toHaveBeenCalledTimes(8);
  });

  it('works without ellipse, gradients, Path2D or raster APIs', () => {
    const c = context();
    delete c.ellipse; delete c.createRadialGradient;
    drawPortal(c, { transition: transition({ destinationStageId: 'gravity-well' }), ornamentImage, destinationBackground });
    expect(c.arc.mock.calls.filter(([, , radius]) => radius === 1)).toHaveLength(8);
    expect(c.drawImage).toHaveBeenCalledTimes(9);
    expect(c.save).toHaveBeenCalledTimes(c.restore.mock.calls.length);
  });

  it.each([null, undefined, {}, { kind: 'wipe', phase: 'hold' }])('ignores absent or unrelated transitions: %j', snapshot => {
    const c = context();
    expect(getPortalWhiteAlpha(snapshot)).toBe(0);
    drawPortal(c, { transition: snapshot }); drawTransitionOverlay(c, { transition: snapshot });
    expect(c.operations).toEqual([]);
    expect(() => { drawPortal(c); drawTransitionOverlay(c); drawPortal(null); drawTransitionOverlay(null); }).not.toThrow();
  });

  it.each([NaN, Infinity, -Infinity, undefined])('normalizes invalid numerical inputs (%s) without NaN geometry or opacity', invalid => {
    const c = context(), snapshot = transition({
      portalX: invalid, crossingX: invalid, crossingY: invalid, travelledPixels: invalid,
      elapsedSeconds: invalid, phaseElapsedSeconds: invalid, destinationStageId: '__proto__',
    });
    drawPortal(c, { transition: snapshot, ornamentImage, destinationBackground });
    drawTransitionOverlay(c, { transition: { ...snapshot, phase: 'white-out' } });
    expect(c.ellipse.mock.calls[0].slice(0, 2)).toEqual([1200, 270]);
    expect(c.operations).toContainEqual(['set', 'shadowColor', '#8bd7ff']);
    for (const operation of c.operations) {
      expect(operation.filter(value => typeof value === 'number').every(Number.isFinite)).toBe(true);
    }
    expect(getPortalWhiteAlpha({ ...snapshot, phase: 'reveal' })).toBe(1);
  });

  it('restores canvas state after drawing and is deterministic for frozen inputs', () => {
    const snapshot = Object.freeze(transition()), first = context(), second = context();
    for (const c of [first, second]) {
      c.globalAlpha = .37; c.globalCompositeOperation = 'source-over'; c.fillStyle = 'red';
      drawPortal(c, { transition: snapshot, ornamentImage, destinationBackground });
      expect([c.globalAlpha, c.globalCompositeOperation, c.fillStyle]).toEqual([.37, 'source-over', 'red']);
      expect(c.save).toHaveBeenCalledTimes(c.restore.mock.calls.length);
    }
    expect(first.operations).toEqual(second.operations);
  });
});
