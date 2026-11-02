import { describe, it, expect, vi } from 'vitest';
import { drawChallengeFailure, isStrongGlitch } from '../../src/game/challenge-effects.js';

function context() {
  return { save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), ellipse: vi.fn(), clip: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), fill: vi.fn(), fillRect: vi.fn(),
    createRadialGradient: () => ({ addColorStop() {} }) };
}
const player = { x: 240, y: 270 };
describe('approved playable failure overlays', () => {
  it('uses four localized ink stains plus five drips, preserving the ship corridor', () => {
    const c = context(); drawChallengeFailure(c, { kind: 'ink', durationSeconds: 5, remainingSeconds: 4 }, player);
    expect(c.fill).toHaveBeenCalledTimes(9); expect(c.fillRect).not.toHaveBeenCalled();
    expect(c.ellipse).toHaveBeenCalledWith(240, 270, 74, 52, 0, 0, Math.PI * 2);
    expect(c.clip).toHaveBeenCalledWith('evenodd');
  });
  it('changes glitch bands over time, but holds them still with reduced motion', () => {
    const draw = (remainingSeconds, reducedMotion = false) => {
      const c = context(); drawChallengeFailure(c, { kind: 'glitch', durationSeconds: 5, remainingSeconds }, player, { reducedMotion });
      return c.fillRect.mock.calls;
    };
    expect(draw(4)).not.toEqual(draw(3.8));
    expect(draw(4, true)).toEqual(draw(3.8, true));
  });
  it('ends after five seconds and fades over its final1.2 seconds', () => {
    const c = context(); drawChallengeFailure(c, { kind: 'ink', durationSeconds: 5, remainingSeconds: 0 }, player);
    expect(c.fill).not.toHaveBeenCalled();
    drawChallengeFailure(c, { kind: 'ink', durationSeconds: 5, remainingSeconds: .6 }, player);
    expect(c.globalAlpha).toBeCloseTo(.42);
  });
});

it("uses six exact .18-second opaque bursts without a player clip",()=>{for(const t of [.9,2.1,3.15,4.55,5.7,6.9]){expect(isStrongGlitch(t-.001)).toBe(false);expect(isStrongGlitch(t+.179)).toBe(true);expect(isStrongGlitch(t+.181)).toBe(false);}const c=context();drawChallengeFailure(c,{kind:"glitch",durationSeconds:8,remainingSeconds:7},player);expect(c.clip).not.toHaveBeenCalled();expect(c.fillRect).toHaveBeenCalledWith(0,0,960,540);});
