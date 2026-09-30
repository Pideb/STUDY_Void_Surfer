import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppController } from '../../src/ui/app-controller.js';

const pilot = { id: 'pilot-1', email: 'pilot@example.com', user_metadata: { name: 'Pilot' } };

function flush() {
  return Promise.resolve().then(() => Promise.resolve());
}

function createFlowHarness({ leaderboard = {} } = {}) {
  const canvas = document.createElement('canvas');
  const root = document.createElement('div');
  document.body.append(canvas, root);
  const frames = [];
  const snapshot = {
    state: 'menu', score: 0, player: { x: 240, y: 270, velocityY: 0 }, difficulty: {},
  };
  const gameEngine = {
    start: vi.fn(() => { Object.assign(snapshot, { state: 'playing', score: 0, difficulty: {} }); }),
    update: vi.fn(), lift: vi.fn(), dash: vi.fn(),
    pause: vi.fn(() => { snapshot.state = 'paused'; snapshot.score = Math.max(0, snapshot.score - 10); return { score: snapshot.score }; }),
    resume: vi.fn(() => { snapshot.state = 'playing'; }),
    stop: vi.fn(() => { snapshot.state = 'game-over'; }),
    getSnapshot: vi.fn(() => ({ ...snapshot, player: { ...snapshot.player }, difficulty: { ...snapshot.difficulty } })),
  };
  const authService = {
    getSessionUser: vi.fn(async () => pilot), subscribeToAuth: vi.fn(() => vi.fn()),
    signInWithMicrosoft: vi.fn(), signOut: vi.fn(),
  };
  const leaderboardService = {
    submitBestScore: vi.fn(leaderboard.submitBestScore ?? (async (_user, { score, aircraftId = 'default' }) => ({
      updated: true,
      record: { userId: 'pilot-1', bestScore: score, achievedAt: '2026-09-28T00:00:00.000Z', aircraftId },
      error: null,
    }))),
    fetchTopScores: vi.fn(leaderboard.fetchTopScores ?? (async () => ({ rows: [], error: null }))),
    fetchPlayerNeighborhood: vi.fn(leaderboard.fetchPlayerNeighborhood ?? (async () => ({ rows: [], error: null }))),
  };
  const audioManager = { isMuted: () => false, unlock: vi.fn(), setMuted: vi.fn(), play: vi.fn(), destroy: vi.fn() };
  const controller = createAppController({
    authService, leaderboardService, gameEngine, root, canvas,
    renderer: { render: vi.fn(), destroy: vi.fn() }, audioManager,
  });
  const raf = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
  return { root, canvas, frames, snapshot, gameEngine, leaderboardService, audioManager, controller, raf, cancel };
}

function clickByLabel(root, label) {
  const button = [...root.querySelectorAll('button')].find((item) => item.textContent === label);
  if (!button) throw new Error(`${label} 버튼을 찾을 수 없습니다.`);
  button.click();
}

describe('authenticated game flow', () => {
  let harness;

  afterEach(() => {
    harness?.controller.destroy();
    harness?.canvas.remove();
    harness?.root.remove();
    document.querySelector('#live-region')?.remove();
    vi.restoreAllMocks();
    harness = null;
  });

  it('runs as a guest from title → tutorial → play → warning/boss → game-over', async () => {
    const authService = {
      getSessionUser: vi.fn(async () => null), subscribeToAuth: vi.fn(() => vi.fn()),
      signInWithMicrosoft: vi.fn(), signOut: vi.fn(),
    };
    harness = createFlowHarness();
    harness.controller.destroy();
    harness.controller = createAppController({
      authService,
      leaderboardService: harness.leaderboardService,
      gameEngine: harness.gameEngine,
      root: harness.root,
      canvas: harness.canvas,
      renderer: { render: vi.fn(), destroy: vi.fn() },
      audioManager: harness.audioManager,
    });
    harness.controller.mount();
    await flush();
    expect(harness.root.textContent).toContain('GUEST');
    expect(harness.root.textContent).toContain('게임 시작');

    clickByLabel(harness.root, '게임 시작');
    expect(harness.root.textContent).toContain('출격 전 안내');
    clickByLabel(harness.root, '출격하기');
    expect(harness.root.textContent).toContain('점수 0');
    expect(harness.audioManager.unlock).toHaveBeenCalledOnce();

    harness.canvas.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
    expect(harness.gameEngine.lift).toHaveBeenCalledOnce();

    harness.snapshot.score = 20;
    harness.snapshot.difficulty = { isWarning: true, isBoss: true, bossPattern: 'fast' };
    harness.frames.shift()(16);
    expect(harness.root.textContent).toContain('BOSS');

    harness.snapshot.state = 'game-over';
    harness.frames.shift()(32);
    expect(harness.root.textContent).toContain('최종 점수 20');
    expect(harness.root.textContent).toContain('재시작');
    expect(harness.root.textContent).toContain('메인 메뉴');
    await flush();
    expect(harness.leaderboardService.submitBestScore).not.toHaveBeenCalled();
  });
});
