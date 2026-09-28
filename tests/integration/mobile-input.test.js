import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppController } from '../../src/ui/app-controller.js';

function flush() {
  return Promise.resolve().then(() => Promise.resolve());
}

describe('mobile and keyboard controls', () => {
  let controller;
  let root;
  let canvas;
  let engine;
  let audioManager;

  afterEach(() => {
    controller?.destroy();
    root?.remove();
    canvas?.remove();
    document.querySelector('#live-region')?.remove();
    vi.restoreAllMocks();
  });

  it('routes pointer, virtual SPACE, P, and Escape without duplicate touch lifting', async () => {
    root = document.createElement('div');
    canvas = document.createElement('canvas');
    document.body.append(canvas, root);
    const snapshot = { state: 'menu', score: 15, player: {} };
    engine = {
      start: vi.fn(() => { snapshot.state = 'playing'; }), update: vi.fn(), lift: vi.fn(), dash: vi.fn(),
      pause: vi.fn(() => { snapshot.state = 'paused'; snapshot.score = 5; return { score: 5 }; }),
      resume: vi.fn(() => { snapshot.state = 'playing'; }), stop: vi.fn(), getSnapshot: vi.fn(() => ({ ...snapshot })),
    };
    audioManager = { isMuted: () => false, unlock() {}, setMuted() {}, play: vi.fn(), destroy() {} };
    controller = createAppController({
      root, canvas, gameEngine: engine,
      authService: { getSessionUser: async () => ({ id: 'pilot', email: 'pilot@example.com' }), subscribeToAuth: () => vi.fn(), signInWithMicrosoft: vi.fn(), signOut: vi.fn() },
      leaderboardService: {
        submitBestScore: async (_user, { score, aircraftId = 'default' }) => ({
          updated: true,
          record: { userId: 'pilot-1', bestScore: score, achievedAt: '2026-09-28T00:00:00.000Z', aircraftId },
          error: null,
        }),
        fetchTopScores: async () => ({ rows: [] }), fetchPlayerNeighborhood: async () => ({ rows: [] }),
      },
      renderer: { render() {}, destroy() {} }, audioManager,
    });
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    controller.mount();
    await flush();
    controller.dispatch('START_GAME_FROM_MENU');
    controller.dispatch('START_PLAYING');

    canvas.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
    canvas.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
    expect(engine.lift).toHaveBeenCalledTimes(1);

    const space = root.querySelector('.mobile-space-button');
    space.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
    space.click();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true }));
    expect(engine.dash).toHaveBeenCalledTimes(2);
    expect(audioManager.play).not.toHaveBeenCalledWith('dash');

    engine.dash.mockReturnValue(true);
    space.click();
    expect(audioManager.play).toHaveBeenCalledWith('dash');

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP', bubbles: true, cancelable: true }));
    expect(engine.pause).toHaveBeenCalledTimes(1);
    [...root.querySelectorAll('button')].find((button) => button.textContent === '계속하기').click();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }));
    expect(engine.pause).toHaveBeenCalledTimes(2);
  });
});
