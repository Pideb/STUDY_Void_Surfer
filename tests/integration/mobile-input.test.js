import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppController } from '../../src/ui/app-controller.js';
import { createGameEngine } from '../../src/game/game-engine.js';

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
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', repeat: true, bubbles: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true }));
    expect(engine.dash).toHaveBeenCalledTimes(2);
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', repeat: true, bubbles: true, cancelable: true }));
    expect(engine.dash).toHaveBeenCalledTimes(2);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true }));
    expect(engine.dash).toHaveBeenCalledTimes(3);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
    const focusedPress=new KeyboardEvent('keydown',{code:'Space',bubbles:true,cancelable:true});
    space.dispatchEvent(focusedPress);
    expect(focusedPress.defaultPrevented).toBe(true);
    expect(engine.dash).toHaveBeenCalledTimes(4);
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space',bubbles:true}));
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

  it('completes a real boss challenge with successive touch clicks without frame delays or world inputs', async () => {
    root = document.createElement('div');
    canvas = document.createElement('canvas');
    document.body.append(canvas, root);
    let currentTime = 0;
    const frames = [];
    engine = createGameEngine({
      now: () => currentTime, gravity: 0, initialScore: 60,
      initialCompletedWarningCount: 1, rng: () => 0.5,
    });
    audioManager = { isMuted: () => false, unlock() {}, setMuted() {}, play: vi.fn(), destroy() {} };
    controller = createAppController({
      root, canvas, gameEngine: engine,
      authService: { getSessionUser: async () => null, subscribeToAuth: () => vi.fn() },
      leaderboardService: {},
      renderer: { render() {}, renderMenuBackground() {}, destroy() {} }, audioManager,
    });
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    controller.mount();
    await flush();
    controller.dispatch('START_GAME_FROM_MENU');
    controller.dispatch('START_PLAYING');
    engine.setInvincibilityEnabled(true);
    for (let frame = 0; frame < 1000 && !engine.getSnapshot().challenge?.active; frame += 1) {
      currentTime += 100;
      frames.shift()(currentTime);
    }

    const before = engine.getSnapshot();
    expect(before.challenge?.active).toBe(true);
    const input = vi.spyOn(engine, 'handleChallengeKey');
    const lift = vi.spyOn(engine, 'lift');
    const dash = vi.spyOn(engine, 'dash');
    const controls = root.querySelector('.challenge-touch-controls');
    const buttons = [...controls.querySelectorAll('button')];
    expect(controls.hidden).toBe(false);

    controller.dispatch('PAUSE');
    expect(engine.getSnapshot().state).toBe('playing');
    expect(root.querySelector('.wasd-challenge-overlay')).not.toBeNull();
    for (const [index, code] of before.challenge.sequence.entries()) {
      const button = controls.querySelector(`[data-code="${code}"]`);
      button.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
      button.click();
      expect(input).toHaveBeenCalledTimes(index + 1);
      expect(engine.getSnapshot().challenge.cursor).toBe(index + 1);
      expect([...controls.querySelectorAll('button')]).toEqual(buttons);
    }

    const after = engine.getSnapshot();
    expect(after.boss).toMatchObject({ hp: 3, successfulChallenges: 0 });
    expect(after.boss.counterattack).not.toBeNull();
    expect(after.player).toEqual(before.player);
    expect(after.elapsedSeconds).toBe(before.elapsedSeconds);
    expect(controls.hidden).toBe(true);
    expect(buttons.every((button) => button.disabled)).toBe(true);
    buttons[0].click();
    expect(input).toHaveBeenCalledTimes(before.challenge.sequence.length);
    expect(lift).not.toHaveBeenCalled();
    expect(dash).not.toHaveBeenCalled();
    expect(root.querySelector('.boss-health-text').textContent).toBe('3 / 3');
    expect(audioManager.play.mock.calls.filter(([event]) => event === 'challengeSuccess')).toHaveLength(1);
    for (let frame = 0; frame < 4; frame++) {
      currentTime += 100;
      frames.shift()(currentTime);
    }
    expect(engine.getSnapshot().boss).toMatchObject({ hp: 2, successfulChallenges: 1 });
    expect(root.querySelector('.boss-health-text').textContent).toBe('2 / 3');
    expect(audioManager.play.mock.calls.filter(([event]) => event === 'challengeSuccess')).toHaveLength(1);
  });
});
