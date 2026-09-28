import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppController } from '../../src/ui/app-controller.js';

const pilot = { id: 'pilot-1', email: 'pilot@example.com', user_metadata: { name: 'Pilot' } };

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function makeHarness({ user = pilot, leaderboard = {}, bestScore = 0 } = {}) {
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
    setAircraft: vi.fn((id) => id),
    setAccountBestScore: vi.fn((score) => score),
    handleChallengeKey: vi.fn(() => true),
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
    fetchPlayerBestScore: vi.fn(leaderboard.fetchPlayerBestScore ?? (async () => ({ bestScore, error: null }))),
  };
  const renderer = { render: vi.fn(), renderMenuBackground: vi.fn(), destroy: vi.fn() };
  const audioManager = {
    isMuted: () => false,
    unlock: vi.fn(async () => {}),
    setMuted: vi.fn(),
    setMusicMode: vi.fn(),
    setMusicScene: vi.fn(),
    pauseMusic: vi.fn(),
    resumeMusic: vi.fn(),
    play: vi.fn(),
    destroy: vi.fn(),
  };
  const frames = [];
  const raf = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
  const canvas = document.createElement('canvas');
  const controller = createAppController({
    authService, leaderboardService, gameEngine, renderer, audioManager, root,
    canvas,
  });
  return {
    root, controller, authService, leaderboardService, gameEngine, renderer, audioManager,
    snapshot, frames, raf, cancel, canvas,
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

  it('renders no controls action on the menu while retaining the tutorial route', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();

    expect([...harness.root.querySelectorAll('button')].map((button) => button.textContent.trim()))
      .not.toContain('조작법');
    harness.controller.dispatch('SHOW_TUTORIAL');
    expect(harness.root.textContent).toContain('출격 전 조작 안내');
  });

  it('loads account unlocks, preserves hangar choice on return, and starts with that aircraft', async () => {
    harness = makeHarness({ bestScore: 100 });
    harness.controller.mount();
    await settle();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '기체 선택').click();
    const velocity = [...harness.root.querySelectorAll('.aircraft-option')]
      .find((button) => button.getAttribute('aria-label').startsWith('VELOCITY'));
    expect(velocity.disabled).toBe(false);
    velocity.click();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '뒤로가기').click();
    expect(harness.root.querySelector('.menu-aircraft-status').textContent).toContain('VELOCITY');
    expect(harness.root.querySelector('.menu-aircraft-image').getAttribute('src')).toContain('/assets/game/aircraft/velocity.png');
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '게임 시작').click();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '출격하기').click();
    expect(harness.gameEngine.setAccountBestScore).toHaveBeenCalledWith(100);
    expect(harness.gameEngine.setAircraft).toHaveBeenCalledWith('velocity');
  });

  it('falls back to the default aircraft and explains a failed best-score lookup', async () => {
    harness = makeHarness({ leaderboard: {
      fetchPlayerBestScore: async () => ({ bestScore: 0, error: new Error('offline') }),
    } });
    harness.controller.mount();
    await settle();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '기체 선택').click();
    expect(harness.root.textContent).toContain('기본 기체만 사용할 수 있습니다');
    expect([...harness.root.querySelectorAll('.aircraft-option')].filter((button) => !button.disabled))
      .toHaveLength(1);
  });

  it('routes only WASD to an active challenge and suppresses flight/pause inputs', async () => {
    harness = makeHarness();
    harness.snapshot.challenge = { active: true, sequence: ['KeyW'], cursor: 0 };
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');

    const space = new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true });
    globalThis.window.dispatchEvent(space);
    globalThis.window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
    const wasd = new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true, cancelable: true });
    globalThis.window.dispatchEvent(wasd);

    harness.canvas.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
    expect(harness.gameEngine.handleChallengeKey).toHaveBeenCalledOnce();
    expect(harness.gameEngine.handleChallengeKey).toHaveBeenCalledWith('KeyW');
    expect(harness.gameEngine.dash).not.toHaveBeenCalled();
    expect(harness.gameEngine.lift).not.toHaveBeenCalled();
    expect(harness.gameEngine.pause).not.toHaveBeenCalled();
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
    expect(harness.leaderboardService.submitBestScore).toHaveBeenCalledWith(pilot, {
      score: 0, displayName: 'Pilot', aircraftId: 'default',
    });
  });

  it('submits and queries leaderboard independently then displays rows in safe text cells', async () => {
    harness = makeHarness({ leaderboard: {
      submitBestScore: async () => ({ error: null }),
      fetchTopScores: async () => ({ rows: [{ rank: 1, userId: 'other', displayName: '<img src=x>', bestScore: 18 }], error: null }),
      fetchPlayerNeighborhood: async () => ({ rows: [{ rank: 2, userId: 'pilot-1', displayName: 'Pilot', bestScore: 0, isCurrentUser: true }], error: null }),
    } });
    harness.controller.mount();
    await settle();
    harness.snapshot.aircraft = { id: 'velocity' };
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    harness.controller.dispatch('GAME_OVER');
    await settle();

    expect(harness.leaderboardService.submitBestScore).toHaveBeenCalledWith(pilot, {
      score: 0, displayName: 'Pilot', aircraftId: 'velocity',
    });
    expect(harness.root.querySelector('img')).toBeNull();
    expect(harness.root.textContent).toContain('<img src=x>');
    expect(harness.root.querySelector('[aria-current="true"]')).not.toBeNull();
    expect(harness.root.textContent).toContain('TOP 10');
    expect(harness.root.textContent).toContain('내 주변 순위');
  });

  it('retries a failed score write, then refreshes the leaderboard after success', async () => {
    const submitBestScore = vi.fn()
      .mockResolvedValueOnce({ error: new Error('temporary write failure') })
      .mockResolvedValueOnce({ error: null });
    harness = makeHarness({ leaderboard: { submitBestScore } });
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    harness.controller.dispatch('GAME_OVER');
    await settle();

    expect(submitBestScore).toHaveBeenCalledTimes(1);
    harness.root.querySelector('.leaderboard-panel button').click();
    await settle();

    expect(submitBestScore).toHaveBeenCalledTimes(2);
    expect(harness.root.textContent).toContain('점수가 계정에 등록되었습니다.');
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

  it('synchronizes menu, gameplay, warning, boss, pause, and game-over music transitions', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();

    expect(harness.audioManager.setMusicMode).toHaveBeenCalledWith('menu');
    harness.audioManager.setMusicMode.mockClear();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    expect(harness.audioManager.unlock).toHaveBeenCalledOnce();
    expect(harness.audioManager.setMusicMode).toHaveBeenCalledWith('gameplay');

    harness.snapshot.difficulty = { isWarning: true, isBoss: false };
    harness.frames.shift()(16);
    expect(harness.audioManager.play).toHaveBeenCalledWith('warning');
    expect(harness.audioManager.setMusicMode).not.toHaveBeenCalledWith('boss');

    harness.snapshot.difficulty = { isWarning: true, isBoss: true };
    harness.frames.shift()(32);
    expect(harness.audioManager.setMusicMode).toHaveBeenCalledWith('boss');

    harness.snapshot.difficulty = { isWarning: false, isBoss: false };
    harness.frames.shift()(48);
    expect(harness.audioManager.setMusicMode).toHaveBeenLastCalledWith('gameplay');

    harness.controller.dispatch('PAUSE');
    expect(harness.audioManager.pauseMusic).toHaveBeenCalledOnce();
    harness.controller.dispatch('RESUME');
    expect(harness.audioManager.resumeMusic).toHaveBeenCalledOnce();
    harness.controller.dispatch('GAME_OVER');
    expect(harness.audioManager.setMusicMode).toHaveBeenLastCalledWith('none');
    harness.controller.dispatch('RETURN_TO_MENU');
    expect(harness.audioManager.setMusicMode).toHaveBeenLastCalledWith('menu');
  });

  it('plays combat cues once per attack phase and crossfades stage scenes', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');

    harness.snapshot.stage = { id: 'crystal-gates' };
    harness.snapshot.boss = {
      number: 3, hp: 3, maxHp: 3,
      attack: { id: 'shot-1', type: 'projectile', state: 'charging' },
    };
    harness.frames.shift()(16);
    harness.frames.shift()(32);
    expect(harness.audioManager.play).toHaveBeenCalledWith('bossCharge', { id: 'shot-1' });
    expect(harness.audioManager.play.mock.calls.filter(([event]) => event === 'bossCharge')).toHaveLength(1);
    expect(harness.audioManager.setMusicScene).toHaveBeenCalledWith('crystal-gates');

    harness.snapshot.boss.attack.state = 'returning';
    harness.snapshot.boss.hp = 2;
    harness.frames.shift()(48);
    expect(harness.audioManager.play).toHaveBeenCalledWith('projectileReflect', { id: 'shot-1' });
    expect(harness.audioManager.play).toHaveBeenCalledWith('bossHit', { id: '3:2' });

    harness.snapshot.boss.attack = { id: 'laser-1', type: 'laser', kind: 'single', telegraphRemainingSeconds: 0.7 };
    harness.frames.shift()(64);
    expect(harness.audioManager.play).toHaveBeenCalledWith('laserTelegraph', { id: 'laser-1' });
  });

  it('plays WASD outcome cues once and selects the ink or glitch failure timbre', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');

    harness.snapshot.challenge = { active: true, result: 'pending' };
    harness.frames.shift()(16);
    harness.snapshot.challenge = { active: false, result: 'success' };
    harness.frames.shift()(32);
    harness.frames.shift()(48);
    expect(harness.audioManager.play.mock.calls.filter(([event]) => event === 'challengeSuccess')).toHaveLength(1);

    harness.snapshot.challenge = { active: true, result: 'pending' };
    harness.frames.shift()(64);
    harness.snapshot.challenge = { active: false, result: 'failure' };
    harness.snapshot.feedbackEffect = { kind: 'glitch', remainingSeconds: 0.7 };
    harness.frames.shift()(80);
    expect(harness.audioManager.play).toHaveBeenCalledWith('challengeFailureGlitch', { id: 'challenge-2' });
  });
});
