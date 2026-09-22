import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppController } from '../../src/ui/app-controller.js';

const pilot = { id: 'pilot-1', email: 'pilot@example.com', user_metadata: { name: 'Pilot' } };

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function makeHarness({ user = pilot, leaderboard = {} } = {}) {
  const root = document.createElement('div');
  document.body.append(root);
  const snapshot = { state: 'menu', score: 0, player: { x: 200, y: 200, velocityY: 0 } };
  const gameEngine = {
    start: vi.fn(() => { snapshot.state = 'playing'; snapshot.score = 0; }),
    update: vi.fn(),
    lift: vi.fn(),
    dash: vi.fn(),
    pause: vi.fn(() => { snapshot.state = 'paused'; snapshot.score = Math.max(0, snapshot.score - 10); return { score: snapshot.score }; }),
    resume: vi.fn(() => { snapshot.state = 'playing'; }),
    stop: vi.fn(() => { snapshot.state = 'game-over'; }),
    getSnapshot: vi.fn(() => ({ ...snapshot, player: { ...snapshot.player } })),
  };
  const authService = {
    getSessionUser: vi.fn(async () => user),
    subscribeToAuth: vi.fn(() => vi.fn()),
    signInWithMicrosoft: vi.fn(async () => ({ user: pilot, error: null })),
    signOut: vi.fn(async () => {}),
  };
  const leaderboardService = {
    submitBestScore: vi.fn(leaderboard.submitBestScore ?? (async () => ({ error: null }))),
    fetchTopScores: vi.fn(leaderboard.fetchTopScores ?? (async () => ({ rows: [], error: null }))),
    fetchPlayerNeighborhood: vi.fn(leaderboard.fetchPlayerNeighborhood ?? (async () => ({ rows: [], error: null }))),
  };
  const renderer = { render: vi.fn(), renderMenuBackground: vi.fn(), destroy: vi.fn() };
  const audioManager = { isMuted: () => false, setMuted: vi.fn(), play: vi.fn(), destroy: vi.fn() };
  const frames = [];
  const raf = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
  const controller = createAppController({
    authService, leaderboardService, gameEngine, renderer, audioManager, root,
    canvas: document.createElement('canvas'),
  });
  return {
    root, controller, authService, leaderboardService, gameEngine, renderer, audioManager,
    snapshot, frames, raf, cancel,
  };
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('app controller product flow', () => {
  let harness;
  afterEach(() => {
    harness?.controller.destroy();
    harness?.root.remove();
    vi.restoreAllMocks();
    harness = null;
  });

  it('keeps the game behind the Microsoft login gate and shows connection errors', async () => {
    harness = makeHarness({ user: null });
    harness.controller.mount();
    await settle();

    expect(harness.root.textContent).toContain('Microsoft 계정으로 로그인');
    expect(harness.root.textContent).not.toContain('게임 시작');
    harness.controller.dispatch({ type: 'START_GAME_FROM_MENU' });
    expect(harness.gameEngine.start).not.toHaveBeenCalled();
  });

  it('routes menu through tutorial, immediate restart, and menu back through tutorial', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();

    harness.root.querySelector('button')?.click();
    expect(harness.root.textContent).toContain('클릭/터치: 위로 상승');
    harness.root.querySelector('button')?.click();
    expect(harness.root.textContent).toContain('점수 0');
    harness.controller.dispatch({ type: 'GAME_OVER' });
    expect(harness.root.textContent).toContain('최종 점수 0');

    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '재시작').click();
    expect(harness.root.textContent).toContain('점수 0');
    expect(harness.gameEngine.start).toHaveBeenCalledTimes(2);

    harness.controller.dispatch({ type: 'GAME_OVER' });
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '메인 메뉴').click();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '게임 시작').click();
    expect(harness.root.textContent).toContain('출격 전 조작 안내');
  });

  it('renders the menu scene and returns from tutorial without starting a run', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();

    expect(harness.renderer.renderMenuBackground).toHaveBeenCalledTimes(1);
    harness.controller.dispatch('SHOW_TUTORIAL');
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '메인 메뉴').click();

    expect(harness.gameEngine.start).not.toHaveBeenCalled();
    expect(harness.renderer.renderMenuBackground).toHaveBeenCalledTimes(2);
    expect(harness.root.textContent).toContain('게임 시작');
  });

  it('paints game-over score and actions before leaderboard promises settle', async () => {
    const submit = deferred();
    const top = deferred();
    const neighborhood = deferred();
    harness = makeHarness({ leaderboard: {
      submitBestScore: () => submit.promise,
      fetchTopScores: () => top.promise,
      fetchPlayerNeighborhood: () => neighborhood.promise,
    } });
    harness.controller.mount();
    await settle();
    harness.controller.dispatch({ type: 'START_GAME_FROM_MENU' });
    harness.controller.dispatch({ type: 'START_PLAYING' });
    harness.controller.dispatch({ type: 'GAME_OVER' });

    expect(harness.root.textContent).toContain('최종 점수 0');
    expect(harness.root.textContent).toContain('재시작');
    expect(harness.root.textContent).toContain('메인 메뉴');
    expect(harness.root.textContent).toContain('불러오는 중');
    expect(harness.leaderboardService.submitBestScore).toHaveBeenCalledWith(pilot, { score: 0, displayName: 'Pilot' });
  });

  it('submits and queries leaderboard independently then displays rows in safe text cells', async () => {
    harness = makeHarness({ leaderboard: {
      submitBestScore: async () => ({ error: null }),
      fetchTopScores: async () => ({ rows: [{ rank: 1, userId: 'other', displayName: '<img src=x>', bestScore: 18 }], error: null }),
      fetchPlayerNeighborhood: async () => ({ rows: [{ rank: 2, userId: 'pilot-1', displayName: 'Pilot', bestScore: 0, isCurrentUser: true }], error: null }),
    } });
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    harness.controller.dispatch('GAME_OVER');
    await settle();

    expect(harness.root.querySelector('img')).toBeNull();
    expect(harness.root.textContent).toContain('<img src=x>');
    expect(harness.root.querySelector('[aria-current="true"]')).not.toBeNull();
    expect(harness.root.textContent).toContain('TOP 10');
    expect(harness.root.textContent).toContain('내 주변 순위');
  });

  it('plays dash feedback only for successful special-wall dashes and announces mode changes once', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');

    const space = harness.root.querySelector('.mobile-space-button');
    space.click();
    expect(harness.audioManager.play).not.toHaveBeenCalledWith('dash');
    harness.gameEngine.dash.mockReturnValue(true);
    space.click();
    expect(harness.audioManager.play).toHaveBeenCalledOnce();
    expect(harness.audioManager.play).toHaveBeenCalledWith('dash');

    harness.snapshot.difficulty = { isWarning: true, isBoss: false };
    harness.frames.shift()(16);
    expect(harness.audioManager.play).toHaveBeenCalledWith('warning');
    harness.frames.shift()(32);
    expect(harness.audioManager.play.mock.calls.filter(([event]) => event === 'warning')).toHaveLength(1);

    harness.snapshot.difficulty = { isWarning: true, isBoss: true };
    harness.frames.shift()(48);
    expect(harness.audioManager.play).toHaveBeenCalledWith('boss');
    expect(document.querySelector('#live-region').textContent).toContain('BOSS WARNING');
  });
});
