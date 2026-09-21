import { describe, expect, it, vi } from 'vitest';
import { createInputController } from '../../src/game/input.js';

function dispatchKey(target, code, repeat = false) {
  target.dispatchEvent(new KeyboardEvent('keydown', { code, repeat, bubbles: true }));
}

describe('input controller', () => {
  it('maps one pointer event to one lift', () => {
    const target = new EventTarget();
    const onLift = vi.fn();
    const controller = createInputController(target, onLift, vi.fn(), vi.fn());

    target.dispatchEvent(new Event('pointerdown'));

    expect(onLift).toHaveBeenCalledTimes(1);
    controller.destroy();
  });

  it('maps non-repeated Space to dash and ignores held-key repeats', () => {
    const target = new EventTarget();
    const onSpace = vi.fn();
    const controller = createInputController(target, vi.fn(), onSpace, vi.fn());

    dispatchKey(target, 'Space');
    dispatchKey(target, 'Space', true);

    expect(onSpace).toHaveBeenCalledTimes(1);
    controller.destroy();
  });

  it('maps P and Escape to pause', () => {
    const target = new EventTarget();
    const onPause = vi.fn();
    const controller = createInputController(target, vi.fn(), vi.fn(), onPause);

    dispatchKey(target, 'KeyP');
    dispatchKey(target, 'Escape');

    expect(onPause).toHaveBeenCalledTimes(2);
    controller.destroy();
  });

  it('stops handling events after destroy', () => {
    const target = new EventTarget();
    const onLift = vi.fn();
    const controller = createInputController(target, onLift, vi.fn());

    controller.destroy();
    target.dispatchEvent(new Event('pointerdown'));

    expect(onLift).not.toHaveBeenCalled();
  });
});
