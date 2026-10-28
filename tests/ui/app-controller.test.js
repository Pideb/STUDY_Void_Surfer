import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppController } from '../../src/ui/app-controller.js';
import { GUEST_RECORD_STORAGE_KEY, readGuestRecord } from '../../src/services/guest-record-service.js';

const pilot = { id: 'pilot-1', email: 'pilot@example.com', user_metadata: { name: 'Pilot' } };

function savedScoreResult(score = 0, aircraftId = 'default', userId = pilot.id) {
  return {
    updated: true,
    record: { userId, bestScore: score, achievedAt: '2026-09-28T00:00:00.000Z', aircraftId },
    error: null,
  };
}

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
    setGuestMode: vi.fn((enabled) => enabled),
    setInvincibilityEnabled: vi.fn((enabled) => enabled),
    handleChallengeKey: vi.fn(() => true),
  };
  const authService = {
    getSessionUser: vi.fn(async () => user),
    subscribeToAuth: vi.fn(() => vi.fn()),
    signInWithMicrosoft: vi.fn(async () => ({ user: pilot, error: null })),
    signOut: vi.fn(async () => {}),
  };
  const leaderboardService = {
    submitBestScore: vi.fn(leaderboard.submitBestScore ?? (async (_user, { score, aircraftId }) => savedScoreResult(score, aircraftId))),
    fetchTopScores: vi.fn(leaderboard.fetchTopScores ?? (async () => ({ rows: [], error: null }))),
    fetchLeaderboardPage: vi.fn(leaderboard.fetchLeaderboardPage ?? (async () => ({ rows: [], error: null }))),
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
    setMusicDucked: vi.fn(),
    resetRun: vi.fn(),
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
    localStorage.removeItem(GUEST_RECORD_STORAGE_KEY);
    localStorage.removeItem('void-surfer:admin-settings:v1');
  });

  it('shows the title menu as GUEST and keeps sign-in errors from blocking play', async () => {
    harness = makeHarness({ user: null });
    harness.controller.mount();
    await settle();

    expect(harness.root.textContent).toContain('GUEST');
    expect(harness.root.textContent).toContain('게임 시작');
    expect(harness.root.textContent).toContain('로그인');
    expect(harness.root.textContent).not.toContain('Microsoft 계정으로 로그인하고 최고 기록을 안전하게 보존하세요.');
    expect(harness.authService.signInWithMicrosoft).not.toHaveBeenCalled();

    harness.authService.signInWithMicrosoft.mockResolvedValueOnce({
      user: null, error: Object.assign(new Error('offline'), { code: 'NETWORK_ERROR' }),
    });
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '로그인').click();
    await settle();
    expect(harness.root.textContent).toContain('GUEST');
    expect(harness.root.querySelector('[role="alert"]')).not.toBeNull();

    harness.controller.dispatch({ type: 'START_GAME_FROM_MENU' });
    expect(harness.root.textContent).toContain('출격 전 안내');
    harness.controller.dispatch('START_PLAYING');
    expect(harness.gameEngine.start).toHaveBeenCalledOnce();
    expect(harness.leaderboardService.submitBestScore).not.toHaveBeenCalled();
  });

  it('signs out back to the guest title menu without starting a login gate', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '로그아웃').click();
    await settle();

    expect(harness.root.textContent).toContain('GUEST');
    expect(harness.root.textContent).toContain('로그인');
    expect(document.querySelector('#live-region').textContent).toContain('로그아웃했습니다.');
    expect(harness.root.textContent).toContain('게임 시작');
  });

  it('gates persistent admin settings to the designated account and clears active settings on sign-out', async () => {
    harness = makeHarness({ user: { id: 'admin-1', email: ' GH.LEE@DEXCONSULTING.NET ' } });
    harness.controller.mount();
    await settle();

    const open = [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '관리자 설정');
    expect(open).toBeTruthy();
    open.click();
    const dialog = harness.root.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    const invincibility = dialog.querySelector('[aria-label="기체 무적"]');
    invincibility.checked = true;
    invincibility.dispatchEvent(new Event('change', { bubbles: true }));
    expect(harness.gameEngine.setInvincibilityEnabled).toHaveBeenCalledWith(true);
    expect(JSON.parse(localStorage.getItem('void-surfer:admin-settings:v1'))).toMatchObject({
      version: 1, invincibilityEnabled: true, adminModeEnabled: false,
    });

    harness.root.querySelector('[role="dialog"] button').click();
    expect(document.activeElement?.textContent).toBe('관리자 설정');
    harness.root.querySelector('.account-actions button').click();
    await settle();
    expect(harness.root.querySelector('[data-admin-settings-trigger]')).toBeNull();
    expect(harness.gameEngine.setInvincibilityEnabled).toHaveBeenLastCalledWith(false);
    expect(localStorage.getItem('void-surfer:admin-settings:v1')).not.toBeNull();
  });

  it.each([false,true])('renders the debug toggle only for an active designated admin mode=%s',async adminModeEnabled=>{
    localStorage.setItem('void-surfer:admin-settings:v1',JSON.stringify({version:1,adminModeEnabled,invincibilityEnabled:false}));
    harness=makeHarness({user:{id:'admin-1',email:'gh.lee@dexconsulting.net'}});harness.controller.mount();await settle();
    harness.root.querySelector('[data-admin-settings-trigger]').click();
    const toggle=harness.root.querySelector('[aria-label="플레이어 히트박스 표시"]');
    expect(toggle.checked).toBe(false);toggle.checked=true;toggle.dispatchEvent(new Event('change',{bubbles:true}));
    expect(JSON.parse(localStorage.getItem('void-surfer:admin-settings:v1')).showPlayerHitbox).toBe(true);
    harness.controller.dispatch('START_GAME_FROM_MENU');harness.controller.dispatch('START_PLAYING');
    harness.frames.shift()(16);
    expect(harness.renderer.render.mock.calls.at(-1)[1]).toEqual({showPlayerHitbox:adminModeEnabled});
    expect(harness.gameEngine.setInvincibilityEnabled).toHaveBeenLastCalledWith(false);
  });

  it.each([null,pilot])('ignores persisted debug settings for a guest or ordinary account',async user=>{
    localStorage.setItem('void-surfer:admin-settings:v1',JSON.stringify({version:1,adminModeEnabled:true,invincibilityEnabled:true,showPlayerHitbox:true}));
    harness=makeHarness({user});harness.controller.mount();await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');harness.controller.dispatch('START_PLAYING');harness.frames.shift()(16);
    expect(harness.renderer.render.mock.calls.at(-1)[1]).toEqual({showPlayerHitbox:false});
  });

  it('skips leaderboard writes for admin-mode runs while retaining score and a neutral notice', async () => {
    harness = makeHarness({ user: { id: 'admin-1', email: 'gh.lee@dexconsulting.net' } });
    harness.controller.mount();
    await settle();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '관리자 설정').click();
    const toggle = harness.root.querySelector('[role="dialog"] [aria-label="관리자 모드"]');
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    harness.snapshot.score = 42;
    harness.controller.dispatch('GAME_OVER');
    await settle();

    expect(harness.leaderboardService.submitBestScore).not.toHaveBeenCalled();
    expect(harness.root.textContent).toContain('42');
    expect(harness.root.textContent).toContain('관리자 테스트 점수는 리더보드에 저장되지 않습니다.');
    expect(harness.root.querySelector('.error-message')).toBeNull();
  });

  it('traps admin-dialog keyboard focus and closes on Escape', async () => {
    harness = makeHarness({ user: { id: 'admin-1', email: 'gh.lee@dexconsulting.net' } });
    harness.controller.mount();
    await settle();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '관리자 설정').click();

    const dialog = harness.root.querySelector('[role="dialog"]');
    const first = dialog.querySelector('[aria-label="관리자 모드"]');
    const last = dialog.querySelector('button');
    last.focus();
    globalThis.window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab' }));
    expect(document.activeElement).toBe(first);
    globalThis.window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
    expect(harness.root.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement?.textContent).toBe('관리자 설정');
  });

  it('does not show admin controls to guest or other accounts', async () => {
    for (const user of [null, pilot]) {
      harness = makeHarness({ user });
      harness.controller.mount();
      await settle();
      expect(harness.root.querySelector('[data-admin-settings-trigger]')).toBeNull();
      harness.controller.destroy();
      harness.root.remove();
      harness = null;
    }
  });

  it('keeps the title menu available when session lookup fails', async () => {
    harness = makeHarness({ user: null });
    harness.authService.getSessionUser.mockRejectedValueOnce(
      Object.assign(new Error('offline'), { code: 'NETWORK_ERROR' }),
    );
    harness.controller.mount();
    await settle();

    expect(harness.root.textContent).toContain('GUEST');
    expect(harness.root.textContent).toContain('게임 시작');
    expect(harness.root.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('signs in from the guest menu and returns to the account menu', async () => {
    harness = makeHarness({ user: null });
    harness.controller.mount();
    await settle();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '로그인').click();
    await settle();

    expect(harness.root.querySelector('.menu-greeting strong').textContent).toBe('Pilot');
    expect([...harness.root.querySelectorAll('.account-actions button')].map((button) => button.textContent))
      .toEqual(['로그아웃']);
    expect(harness.authService.signInWithMicrosoft).toHaveBeenCalledOnce();
  });

  it('lets guests select all aircraft and labels their hangar score as browser-local', async () => {
    harness = makeHarness({ user: null });
    harness.controller.mount();
    await settle();
    expect(harness.gameEngine.setGuestMode).toHaveBeenCalledWith(true);
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '기체 선택').click();

    expect(harness.root.querySelector('.hangar-best-score').textContent).toBe('게스트 최고 기록 0점');
    const aircraftButtons = [...harness.root.querySelectorAll('.aircraft-option')];
    expect(aircraftButtons).toHaveLength(3);
    expect(aircraftButtons.every((button) => !button.disabled)).toBe(true);
    aircraftButtons.find((button) => button.getAttribute('aria-label').startsWith('VELOCITY')).click();
    expect(harness.root.querySelector('.aircraft-option.is-selected')?.getAttribute('aria-label')).toContain('VELOCITY');
  });

  it('stores a guest final best locally and never transfers it after sign-in', async () => {
    harness = makeHarness({ user: null });
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    Object.assign(harness.snapshot, {
      state: 'playing', score: 29, finalScore: 44, aircraft: { id: 'velocity' },
    });
    harness.controller.dispatch('GAME_OVER');
    await settle();

    expect(readGuestRecord()).toMatchObject({ bestScore: 44, aircraftId: 'velocity' });
    expect(harness.leaderboardService.submitBestScore).not.toHaveBeenCalled();

    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '메인 메뉴').click();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '로그인').click();
    await settle();
    expect(readGuestRecord()).toMatchObject({ bestScore: 44, aircraftId: 'velocity' });
    expect(harness.leaderboardService.submitBestScore).not.toHaveBeenCalled();
  });

  it('loads ranking pages from the menu and pins the guest-local best below the table', async () => {
    localStorage.setItem(GUEST_RECORD_STORAGE_KEY, JSON.stringify({
      version: 1, bestScore: 28, aircraftId: 'aegis', achievedAt: '2026-09-29T00:00:00.000Z',
    }));
    const firstPage = Array.from({ length: 50 }, (_, index) => ({
      rank: index + 1, displayName: `Pilot ${index + 1}`, aircraftId: 'default',
      bestScore: 100 - index, userId: null, isCurrentUser: false,
    }));
    const secondPage = [{
      rank: 51, displayName: 'Pilot 51', aircraftId: 'velocity', bestScore: 1,
      userId: null, isCurrentUser: false,
    }];
    harness = makeHarness({ user: null, leaderboard: {
      fetchLeaderboardPage: vi.fn(async ({ offset }) => ({
        rows: offset === 0 ? firstPage : secondPage,
        error: null,
      })),
    } });
    harness.controller.mount();
    await settle();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '파일럿 랭킹').click();
    await settle();

    expect(harness.leaderboardService.fetchLeaderboardPage).toHaveBeenCalledWith({ limit: 50, offset: 0 });
    expect(harness.root.querySelectorAll('.pilot-ranking-table tbody tr')).toHaveLength(50);
    expect(harness.root.querySelector('.ranking-personal-record').textContent)
      .toContain('전역 순위 없음 · GUEST · AEGIS · 28점');
    expect(harness.leaderboardService.submitBestScore).not.toHaveBeenCalled();

    harness.root.querySelector('.ranking-load-more').click();
    await settle();
    expect(harness.leaderboardService.fetchLeaderboardPage).toHaveBeenLastCalledWith({ limit: 50, offset: 50 });
    expect(harness.root.querySelectorAll('.pilot-ranking-table tbody tr')).toHaveLength(51);
    expect(harness.root.textContent).toContain('모든 순위를 불러왔습니다.');
  });

  it('pins the signed-in player record and returns to the game-over view', async () => {
    harness = makeHarness({ leaderboard: {
      fetchLeaderboardPage: async () => ({ rows: [], error: null }),
      fetchPlayerNeighborhood: async () => ({ rows: [{
        rank: 9, displayName: 'Pilot', aircraftId: 'velocity', bestScore: 73,
        userId: 'pilot-1', isCurrentUser: true,
      }], error: null }),
    } });
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    harness.controller.dispatch('GAME_OVER');
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '파일럿 랭킹').click();
    await settle();

    expect(harness.root.querySelector('.ranking-personal-record').textContent)
      .toContain('9위 · Pilot · VELOCITY · 73점');
    harness.root.querySelector('.pilot-ranking-screen button:last-child').click();
    expect(harness.root.querySelector('.game-over-screen')).not.toBeNull();
  });

  it('deduplicates page loads and ignores a ranking response after returning to the menu', async () => {
    const pending = deferred();
    harness = makeHarness({ user: null, leaderboard: {
      fetchLeaderboardPage: vi.fn(() => pending.promise),
    } });
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('OPEN_PILOT_RANKING');
    harness.controller.dispatch('LOAD_MORE_RANKING');
    expect(harness.leaderboardService.fetchLeaderboardPage).toHaveBeenCalledOnce();
    harness.controller.dispatch('CLOSE_PILOT_RANKING');
    pending.resolve({ rows: [{ rank: 1, displayName: 'Stale', aircraftId: 'default', bestScore: 1 }], error: null });
    await settle();

    expect(harness.root.querySelector('.menu-overlay')).not.toBeNull();
    expect(harness.root.textContent).not.toContain('Stale');
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
    expect(harness.root.textContent).toContain('출격 전 안내');
  });

  it('renders the menu scene and returns from tutorial without starting a run', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();

    expect(harness.renderer.renderMenuBackground).toHaveBeenCalledTimes(2);
    harness.controller.dispatch('SHOW_TUTORIAL');
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '메인 메뉴').click();

    expect(harness.gameEngine.start).not.toHaveBeenCalled();
    expect(harness.renderer.renderMenuBackground).toHaveBeenCalledTimes(3);
    expect(harness.root.textContent).toContain('게임 시작');
  });

  it('renders no controls action on the menu while retaining the tutorial route', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();

    expect([...harness.root.querySelectorAll('button')].map((button) => button.textContent.trim()))
      .not.toContain('조작법');
    harness.controller.dispatch('SHOW_TUTORIAL');
    expect(harness.root.textContent).toContain('출격 전 안내');
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

  it('shows the updated AEGIS gravity and lift in the aircraft selection', async () => {
    harness = makeHarness({ bestScore: 50 });
    harness.controller.mount();
    await settle();
    [...harness.root.querySelectorAll('button')].find((button) => button.textContent === '기체 선택').click();

    const aegis = [...harness.root.querySelectorAll('.aircraft-option')]
      .find((button) => button.getAttribute('aria-label').startsWith('AEGIS'));
    expect(aegis.querySelector('.aircraft-performance').textContent).toBe('중력 ×1.3 · 상승력 70%');
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

  it('ignores a late best-score rejection after the authenticated account changes', async () => {
    let rejectFirstRequest;
    let notifyAuth;
    const oldRequest = new Promise((_resolve, reject) => { rejectFirstRequest = reject; });
    harness = makeHarness({ leaderboard: {
      fetchPlayerBestScore: vi.fn()
        .mockReturnValueOnce(oldRequest)
        .mockResolvedValue({ bestScore: 100, error: null }),
    } });
    harness.authService.subscribeToAuth.mockImplementation((listener) => {
      notifyAuth = listener;
      return vi.fn();
    });
    harness.controller.mount();
    await settle();

    notifyAuth({ id: 'pilot-2', email: 'second@example.com', user_metadata: { name: 'Second' } });
    await settle();
    harness.controller.dispatch('OPEN_HANGAR');
    await settle();
    rejectFirstRequest(new Error('old account request failed late'));
    await settle();

    expect([...harness.root.querySelectorAll('.aircraft-option')].filter((button) => !button.disabled))
      .toHaveLength(3);
    expect(harness.root.textContent).not.toContain('湲곕낯 湲곗껜留??ъ슜');
  });

  it('routes challenge keys with a focused button and preserves editable controls', async () => {
    harness = makeHarness();
    harness.snapshot.challenge = { active: true, sequence: ['KeyW'], cursor: 0 };
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');

    const space = new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true });
    globalThis.window.dispatchEvent(space);
    globalThis.window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
    const focusedButton = document.createElement('button');
    document.body.append(focusedButton);
    focusedButton.focus();
    const wasd = new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true, cancelable: true });
    focusedButton.dispatchEvent(wasd);
    focusedButton.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', repeat: true, bubbles: true, cancelable: true }));
    const input = document.createElement('input');
    document.body.append(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', bubbles: true, cancelable: true }));

    harness.canvas.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
    expect(harness.gameEngine.handleChallengeKey).toHaveBeenCalledOnce();
    expect(harness.gameEngine.handleChallengeKey).toHaveBeenCalledWith('KeyW');
    expect(harness.gameEngine.dash).not.toHaveBeenCalled();
    expect(harness.gameEngine.lift).not.toHaveBeenCalled();
    expect(harness.gameEngine.pause).not.toHaveBeenCalled();
    focusedButton.remove();
    input.remove();
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

  it('waits for the engine death effect to finish before showing game over or submitting score', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');

    harness.gameEngine.update
      .mockImplementationOnce(() => {})
      .mockImplementationOnce(() => {
        harness.snapshot.state = 'game-over';
        harness.snapshot.gameOverReason = 'obstacle';
      });
    harness.frames.shift()(100);

    expect(harness.snapshot.state).toBe('playing');
    expect(harness.root.textContent).not.toContain('寃뚯엫 ?ㅻ쾭');
    expect(harness.leaderboardService.submitBestScore).not.toHaveBeenCalled();

    harness.frames.shift()(200);
    await settle();
    expect(harness.root.textContent).toContain('비행 종료');
    expect(harness.leaderboardService.submitBestScore).toHaveBeenCalledOnce();
  });

  it('submits and queries leaderboard independently then displays rows in safe text cells', async () => {
    harness = makeHarness({ leaderboard: {
      submitBestScore: async (_user, { score, aircraftId }) => savedScoreResult(score, aircraftId),
      fetchTopScores: async () => ({ rows: [{ rank: 1, userId: 'other', displayName: '<img src=x>', bestScore: 18 }], error: null }),
      fetchPlayerNeighborhood: async () => ({ rows: [{ rank: 2, userId: 'pilot-1', displayName: 'Pilot', bestScore: 0, isCurrentUser: true }], error: null }),
    } });
    harness.controller.mount();
    await settle();
    Object.assign(harness.snapshot, {
      score: 33, baseScore: 33, finalScore: 50, scoreMultiplier: 1.5,
      aircraft: { id: 'velocity' },
    });
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    harness.controller.dispatch('GAME_OVER');
    await settle();

    expect(harness.leaderboardService.submitBestScore).toHaveBeenCalledWith(pilot, {
      score: 50, displayName: 'Pilot', aircraftId: 'velocity',
    });
    expect(harness.root.textContent).toContain('기본 점수 33 × 1.5 = 최종 점수 50');
    expect(harness.root.querySelector('img')).toBeNull();
    expect(harness.root.textContent).toContain('<img src=x>');
    expect(harness.root.querySelector('[aria-current="true"]')).not.toBeNull();
    expect(harness.root.textContent).toContain('TOP 10');
    expect(harness.root.textContent).toContain('내 주변 순위');
  });

  it('retries a failed score write, then refreshes the leaderboard after success', async () => {
    const submitBestScore = vi.fn()
      .mockResolvedValueOnce({ error: new Error('temporary write failure') })
      .mockResolvedValueOnce(savedScoreResult());
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

  it('does not report a malformed resolved score response as saved', async () => {
    harness = makeHarness({ leaderboard: { submitBestScore: async () => ({ error: null }) } });
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    harness.controller.dispatch('GAME_OVER');
    await settle();

    expect(harness.root.textContent).toContain('점수를 저장하지 못했습니다');
    expect(harness.root.textContent).not.toContain('점수가 계정에 등록되었습니다');
  });

  it('shows a migration hint when the score RPC is missing', async () => {
    harness = makeHarness({ leaderboard: {
      submitBestScore: async () => ({ error: {
        code: 'SCHEMA_MISSING',
        message: 'Supabase 리더보드 함수가 없습니다. 프로젝트의 DB migration이 모두 적용되었는지 확인하세요.',
      } }),
    } });
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    harness.controller.dispatch('GAME_OVER');
    await settle();

    expect(harness.root.textContent).toContain('DB migration이 모두 적용되었는지 확인하세요');
  });

  it('keeps a successful score save distinct from a failed leaderboard refresh', async () => {
    harness = makeHarness({ leaderboard: {
      fetchTopScores: async () => { throw new Error('read failed'); },
    } });
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    harness.controller.dispatch('GAME_OVER');
    await settle();

    expect(harness.root.textContent).toContain('점수가 계정에 등록되었습니다');
    expect(harness.root.textContent).not.toContain('점수를 저장하지 못했습니다');
    expect(harness.leaderboardService.submitBestScore).toHaveBeenCalledOnce();
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
    expect(harness.audioManager.play).not.toHaveBeenCalledWith('boss');
    expect(document.querySelector('#live-region').textContent).toContain('BOSS');
  });

  it('plays one siren during preview, starts boss music with entrance and resets cues for a new run', async () => {
    harness = makeHarness();
    harness.controller.mount();
    await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU');
    harness.controller.dispatch('START_PLAYING');
    expect(harness.audioManager.resetRun).toHaveBeenCalledOnce();
    harness.snapshot.bossPreview = { warningIndex: 2, pattern: 'slow', remainingSeconds: 1.5 };
    harness.frames.shift()(16);
    harness.frames.shift()(32);
    expect(harness.audioManager.play.mock.calls.filter(([name]) => name === 'bossEntry')).toHaveLength(1);
    expect(harness.audioManager.setMusicDucked).toHaveBeenLastCalledWith(true);
    expect(harness.audioManager.setMusicMode).not.toHaveBeenCalledWith('boss');
    const firstId = harness.audioManager.play.mock.calls.find(([name]) => name === 'bossEntry')[1].id;
    harness.snapshot.bossPreview = null;
    harness.snapshot.difficulty = { isBoss: true, isWarning: true };
    harness.snapshot.boss = { hp: 3, maxHp: 3, entranceRemainingSeconds: 1 };
    harness.frames.shift()(48);
    expect(harness.renderer.render.mock.calls.at(-1)[0].boss.entranceRemainingSeconds).toBe(1);
    expect(harness.audioManager.setMusicMode).toHaveBeenLastCalledWith('boss');
    expect(harness.audioManager.setMusicDucked).toHaveBeenLastCalledWith(false);
    expect(harness.audioManager.play).not.toHaveBeenCalledWith('boss');
    harness.controller.dispatch('GAME_OVER');
    harness.snapshot.boss = null;
    harness.snapshot.difficulty = {};
    harness.snapshot.bossPreview = { warningIndex: 2, pattern: 'slow', remainingSeconds: 1.5 };
    harness.controller.dispatch('RESTART_IMMEDIATE');
    const entries = harness.audioManager.play.mock.calls.filter(([name]) => name === 'bossEntry');
    expect(entries).toHaveLength(2);
    expect(entries[1][1].id).not.toBe(firstId);
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

  it('plays the locked-stage roar once and permits flight until actual WASD starts', async () => {
    harness = makeHarness(); harness.controller.mount(); await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU'); harness.controller.dispatch('START_PLAYING');
    harness.snapshot.stage = { id: 'crystal-gates' };
    harness.snapshot.boss = { number: 1, hp: 3, maxHp: 3, stageId: 'abyssal-beast', roar: { id: 'roar-1', elapsedSeconds: 0, durationSeconds: .8 } };
    harness.frames.shift()(16); harness.frames.shift()(32);
    expect(harness.audioManager.play).toHaveBeenCalledWith('bossRoar', { id: '1:roar-1', stageId: 'abyssal-beast' });
    expect(harness.audioManager.play.mock.calls.filter(([event]) => event === 'bossRoar')).toHaveLength(1);
    harness.canvas.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    expect(harness.gameEngine.lift).toHaveBeenCalledOnce();
    expect(harness.audioManager.play.mock.calls.filter(([event]) => event === 'lift')).toHaveLength(1);
    harness.snapshot.challenge = { active: true, sequence: ['KeyW'], cursor: 0, remainingSeconds: 5, timeLimitSeconds: 5 };
    harness.frames.shift()(48);
    harness.canvas.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    expect(harness.gameEngine.lift).toHaveBeenCalledOnce();
  });

  it('plays one explosion at death-effect start and refuses to pause the death sequence', async () => {
    harness = makeHarness(); harness.controller.mount(); await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU'); harness.controller.dispatch('START_PLAYING');
    harness.snapshot.deathEffect = { reason: 'projectile', elapsedSeconds: 0, durationSeconds: .5 };
    harness.frames.shift()(16); harness.frames.shift()(32);
    expect(harness.snapshot.state).toBe('playing');
    expect(harness.audioManager.play).toHaveBeenCalledWith('collision', { id: '1:death' });
    expect(harness.audioManager.play.mock.calls.filter(([event]) => event === 'collision')).toHaveLength(1);
    expect(harness.audioManager.setMusicMode).toHaveBeenLastCalledWith('none');
    harness.controller.dispatch('PAUSE'); expect(harness.gameEngine.pause).not.toHaveBeenCalled();
    expect(harness.leaderboardService.submitBestScore).not.toHaveBeenCalled();
  });

  it('gives identical roar event IDs a new run namespace after restart', async () => {
    harness = makeHarness(); harness.controller.mount(); await settle();
    harness.controller.dispatch('START_GAME_FROM_MENU'); harness.controller.dispatch('START_PLAYING');
    harness.snapshot.boss = { stageId: 'solar-forge', roar: { id: 'roar-1' } };
    harness.frames.shift()(16);
    harness.snapshot.state = 'game-over'; harness.frames.shift()(32); await settle();
    harness.controller.dispatch('RESTART_IMMEDIATE');
    const sounds = harness.audioManager.play.mock.calls.filter(([event]) => event === 'bossRoar');
    expect(sounds.map(([, meta]) => meta.id)).toEqual(['1:roar-1', '2:roar-1']);
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
    expect(harness.audioManager.play).toHaveBeenCalledWith('bossCharge', { id: '1:shot-1' });
    expect(harness.audioManager.play.mock.calls.filter(([event]) => event === 'bossCharge')).toHaveLength(1);
    expect(harness.audioManager.setMusicScene).toHaveBeenCalledWith('crystal-gates');

    harness.snapshot.boss.attack.state = 'returning';
    harness.snapshot.boss.hp = 2;
    harness.frames.shift()(48);
    expect(harness.audioManager.play).toHaveBeenCalledWith('projectileReflect', { id: '1:shot-1' });
    expect(harness.audioManager.play).toHaveBeenCalledWith('bossHit', { id: '1:3:2' });

    harness.snapshot.boss.attack = { id: 'laser-1', type: 'laser', kind: 'single', telegraphRemainingSeconds: 0.7 };
    harness.frames.shift()(64);
    expect(harness.audioManager.play).toHaveBeenCalledWith('laserTelegraph', { id: '1:laser-1' });
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
    expect(harness.audioManager.play).toHaveBeenCalledWith('challengeFailureGlitch', { id: '1:challenge-2' });
  });
});
