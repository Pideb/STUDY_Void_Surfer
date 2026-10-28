import { describe, expect, it } from 'vitest';
import { createPortalTransition, advancePortalTransition } from '../../src/game/portal-transition.js';

const make = () => createPortalTransition({ fromKey: 'crystal-gates-boss', toKey: 'abyssal-beast', fromStageId: 'crystal-gates', destinationStageId: 'abyssal-beast', crossingX: 240, crossingY: 270 });
describe('engine-owned destination portal timeline', () => {
  it.each([240, 480, 960, 2005])('moves 960 world pixels at wall speed before a covered scenery swap (%s)', speed => {
    const t = make();
    advancePortalTransition(t, .45, speed);
    expect(t.phase).toBe('approach'); expect(t.portalX).toBe(1200); expect(t.swapped).toBe(false);
    advancePortalTransition(t, 480 / speed, speed);
    expect(t.travelledPixels).toBeCloseTo(480); expect(t.portalX).toBeCloseTo(720);
    advancePortalTransition(t, 480 / speed, speed);
    expect(t.phase).toBe('white-out'); expect(t.portalX).toBe(240); expect(t.swapped).toBe(false);
    advancePortalTransition(t, .199, speed); expect(t.swapped).toBe(false);
    advancePortalTransition(t, .001, speed); expect(t.phase).toBe('hold'); expect(t.swapped).toBe(true);
    advancePortalTransition(t, .1, speed); expect(t.phase).toBe('reveal');
    advancePortalTransition(t, .599, speed); expect(t.phase).toBe('reveal');
    advancePortalTransition(t, .001, speed); expect(t.phase).toBe('complete');
    expect(t.elapsedSeconds).toBeCloseTo(.45 + 960 / speed + .9);
  });

  it('integrates a changing speed rather than recalculating travel from a new duration', () => {
    const t = make(); advancePortalTransition(t, .45, 240);
    advancePortalTransition(t, 1, 240); advancePortalTransition(t, .5, 480);
    expect(t.travelledPixels).toBe(480);
    advancePortalTransition(t, .5, 960);
    expect(t.phase).toBe('white-out'); expect(t.elapsedSeconds).toBeCloseTo(2.45);
  });

  it('carries fractional frame time through phase boundaries and ignores invalid deltas', () => {
    const t = make(); advancePortalTransition(t, .5, 240);
    expect(t.phase).toBe('approach'); expect(t.travelledPixels).toBeCloseTo(12);
    const snapshot = { ...t }; advancePortalTransition(t, NaN, 240); advancePortalTransition(t, -1, 240);
    expect(t).toEqual(snapshot);
    advancePortalTransition(t, 100, 240); expect(t.phase).toBe('complete');
    const finished = { ...t }; advancePortalTransition(t, 1, 240); expect(t).toEqual(finished);
  });
});
