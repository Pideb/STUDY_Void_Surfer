import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppController } from '../../src/ui/app-controller.js';

const pilot = { id: 'pilot-1', email: 'pilot@example.com', user_metadata: { name: 'Pilot' } };

function flush() {
  return Promise.resolve().then(() => Promise.resolve());
}

function createHarness() {
  const root = document.createElement('div');
  document.body.append(root);
  const snapshot = { state: 'menu', score: 12, player: {} };
  const leaderboardService = {
    submitBestScore: vi.fn(async () => ({ error: null })),
    fetchTopScores: vi.fn(async () => ({ rows: [], error: { code: 'NETWORK_ERROR', retryable: true } })),
    fetchPlayerNeighborhood: vi.fn(async () => ({ rows: [{ rank: 3, displayName: 'Pilot', bestScore: 12, isCurrentUser: true }], error: null })),
  };
  const controller = createAppController({
    root,
    authService: { getSessionUser: async () => pilot, subscribeToAuth: () => vi.fn(), signInWithMicrosoft: vi.fn(), signOut: vi.fn() },
    leaderboardService,
    gameEngine: {
      start() { snapshot.state = 'playing'; }, update() {}, lift() {}, dash() {},
      pause: () => ({ score: 2 }), resume() {}, stop() { snapshot.state = 'game-over'; },
      getSnapshot: () => ({ ...snapshot }),
    },
    renderer: { render() {}, destroy() {} }, audioManager: { isMuted: () => false, unlock() {}, setMuted() {}, play() {}, destroy() {} },
    canvas: document.createElement('canvas'),
  });
  vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
  return { root, controller, leaderboardService };
}

describe('leaderboard failure state', () => {
  let harness;
  afterEach(() => {
    harness?.controller.destroy();
    harness?.root.remove();
    document.querySelector('#live-region')?.remove();
    vi.restoreAllMocks();
    harness = null;
  });

  it('keeps score/actions and retries leaderboard queries without resubmitting the score', async () => {
    harness = createHarness();
    harness.controller.mount();
    await flush();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    harness.controller.dispatch('GAME_OVER');
    await flush();

    expect(harness.root.textContent).toContain('최종 점수 12');
    expect(harness.root.textContent).toContain('불러오지 못했습니다.');
    expect(harness.root.textContent).toContain('재시작');
    expect(harness.root.textContent).toContain('내 주변 순위');
    expect(harness.leaderboardService.submitBestScore).toHaveBeenCalledTimes(1);

    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '다시 시도').click();
    await flush();
    expect(harness.leaderboardService.fetchTopScores).toHaveBeenCalledTimes(2);
    expect(harness.leaderboardService.fetchPlayerNeighborhood).toHaveBeenCalledTimes(2);
    expect(harness.leaderboardService.submitBestScore).toHaveBeenCalledTimes(1);
  });
});
