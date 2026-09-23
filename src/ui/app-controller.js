import { getAuthErrorMessage } from '../services/auth-errors.js';
import { AIRCRAFT_CATALOG, getUnlockedAircraftIds } from '../game/aircraft.js';
import { announce } from './components.js';
import { createGameHud } from './game-hud.js';
import {
  renderGameOverScreen,
  renderHangarScreen,
  renderLoginScreen,
  renderMenuScreen,
  renderPausedScreen,
  renderTutorialScreen,
} from './screens.js';

function getDisplayName(user) {
  return user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? user?.email?.split('@')[0]
    ?? '파일럿';
}

function getHangarAircraft(bestScore) {
  const unlocked = new Set(getUnlockedAircraftIds(bestScore));
  return AIRCRAFT_CATALOG.map((craft) => ({
    ...craft,
    unlocked: unlocked.has(craft.id),
    description: craft.id === 'velocity'
      ? '최고 속도로 돌파하는 고속 기체'
      : craft.id === 'aegis' ? '무겁지만 정밀한 조작이 가능한 기체' : '균형 잡힌 기본 기체',
    stats: craft.id === 'velocity'
      ? '이동 속도 ×2 · 벽 점수 ×2'
      : craft.id === 'aegis' ? '중력 ×2 · 상승력 35%' : '속도 · 중력 · 상승력 표준',
  }));
}

export function createAppController(deps) {
  const { authService, leaderboardService, gameEngine, renderer, audioManager, root } = deps;
  if (!(root instanceof HTMLElement)) throw new TypeError('앱 UI 루트는 HTMLElement여야 합니다.');
  const suppliedLiveRegion = deps.liveRegion ?? root.parentElement?.querySelector('#live-region');
  const liveRegion = suppliedLiveRegion ?? document.createElement('div');
  const ownsLiveRegion = !suppliedLiveRegion;
  if (ownsLiveRegion) {
    liveRegion.id = 'live-region';
    liveRegion.className = 'sr-only';
    root.insertAdjacentElement('afterend', liveRegion);
  }

  const state = {
    screen: 'loading', user: null, error: null, connectionError: false, busy: false,
    muted: Boolean(audioManager.isMuted?.()), snapshot: null, leaderboard: null,
    submitError: false, gameOverRequest: 0, selectedAircraftId: 'default',
    accountBestScore: 0, accountBestScoreError: false,
  };
  let unsubscribeAuth = () => {};
  let pointerTarget = null;
  let handlePointerDown = null;
  let animationFrame = null;
  let mounted = false;
  let gameHud = null;
  let lastDifficultyMode = 'normal';
  let accountRequestId = 0;

  function paint() {
    gameHud = null;
    if (state.screen === 'loading') {
      const loading = document.createElement('p');
      loading.className = 'screen-panel';
      loading.textContent = '계정 연결 확인 중…';
      root.replaceChildren(loading);
      return;
    }
    if (state.screen === 'login') {
      root.replaceChildren(renderLoginScreen({
        error: state.error,
        connectionError: state.connectionError,
        busy: state.busy,
      }, {
        signIn: handleSignIn,
        retry: refreshSession,
      }));
      return;
    }
    if (state.screen === 'menu') {
      renderer.renderMenuBackground?.();
      audioManager.setMusicMode?.('menu');
      root.replaceChildren(renderMenuScreen({
        displayName: getDisplayName(state.user), muted: state.muted,
        selectedAircraft: AIRCRAFT_CATALOG.find(({ id }) => id === state.selectedAircraftId)?.name ?? 'DEFAULT',
      }, {
        start: () => dispatch({ type: 'START_GAME_FROM_MENU' }),
        hangar: () => dispatch({ type: 'OPEN_HANGAR' }),
        toggleMute: toggleMute,
        signOut: handleSignOut,
      }));
      return;
    }
    if (state.screen === 'hangar') {
      root.replaceChildren(renderHangarScreen({
        aircraft: getHangarAircraft(state.accountBestScore),
        selectedAircraftId: state.selectedAircraftId,
        bestScore: state.accountBestScore,
        error: state.accountBestScoreError,
      }, {
        select: (aircraftId) => dispatch({ type: 'SELECT_AIRCRAFT', aircraftId }),
        back: () => dispatch({ type: 'RETURN_TO_MENU' }),
      }));
      return;
    }
    if (state.screen === 'tutorial') {
      root.replaceChildren(renderTutorialScreen({}, {
        start: () => dispatch({ type: 'START_PLAYING' }),
        menu: () => dispatch({ type: 'RETURN_TO_MENU' }),
      }));
      return;
    }
    if (state.screen === 'paused') {
      root.replaceChildren(renderPausedScreen({ score: state.snapshot?.score ?? 0 }, {
        resume: () => dispatch({ type: 'RESUME' }),
        menu: () => dispatch({ type: 'RETURN_TO_MENU' }),
      }));
      return;
    }
    if (state.screen === 'game-over') {
      root.replaceChildren(renderGameOverScreen({
        score: state.snapshot?.score ?? 0,
        leaderboard: state.leaderboard ?? {
          top: { loading: true }, neighborhood: { loading: true },
        },
        submitError: state.submitError,
      }, {
        restart: () => dispatch({ type: 'RESTART_IMMEDIATE' }),
        menu: () => dispatch({ type: 'RETURN_TO_MENU' }),
        retryLeaderboard: () => loadGameOverData({ submitScore: false }),
      }));
      return;
    }

    gameHud = createGameHud({
      muted: state.muted,
      getMuted: () => state.muted,
    }, {
      pause: () => dispatch({ type: 'PAUSE' }),
      toggleMute,
      space: triggerDash,
    });
    root.replaceChildren(gameHud.element);
    gameHud.update(state.snapshot ?? { score: 0 });
  }

  function setScreen(screen, message = '') {
    state.screen = screen;
    paint();
    if (message) announce(liveRegion, message);
  }

  async function refreshSession() {
    state.screen = 'loading';
    paint();
    try {
      const user = await authService.getSessionUser();
      state.user = user;
      state.error = null;
      state.connectionError = false;
      if (user) void loadAccountBestScore(user);
      else {
        state.accountBestScore = 0;
        state.accountBestScoreError = false;
        state.selectedAircraftId = 'default';
      }
      setScreen(user ? 'menu' : 'login');
    } catch (error) {
      state.user = null;
      state.error = getAuthErrorMessage(error);
      state.connectionError = error?.code === 'CONFIG_MISSING'
        || error?.code === 'CONFIG_INVALID'
        || error?.code === 'NETWORK_ERROR';
      setScreen('login');
    }
  }

  async function loadAccountBestScore(user) {
    const requestId = ++accountRequestId;
    state.accountBestScore = 0;
    state.accountBestScoreError = false;
    if (typeof leaderboardService.fetchPlayerBestScore !== 'function') return;
    try {
      const result = await leaderboardService.fetchPlayerBestScore(user);
      if (requestId !== accountRequestId || state.user?.id !== user?.id) return;
      if (result?.error || !Number.isFinite(Number(result?.bestScore))) {
        state.accountBestScore = 0;
        state.accountBestScoreError = true;
      } else {
        state.accountBestScore = Math.max(0, Math.trunc(Number(result.bestScore)));
        state.accountBestScoreError = false;
      }
      if (!getUnlockedAircraftIds(state.accountBestScore).includes(state.selectedAircraftId)) {
        state.selectedAircraftId = 'default';
      }
      if (state.screen === 'hangar') paint();
    } catch {
      if (requestId !== accountRequestId) return;
      state.accountBestScore = 0;
      state.accountBestScoreError = true;
      state.selectedAircraftId = 'default';
      if (state.screen === 'hangar') paint();
    }
  }

  async function handleSignIn() {
    if (state.busy) return;
    state.busy = true;
    state.error = null;
    paint();
    const result = await authService.signInWithMicrosoft();
    state.busy = false;
    if (result?.error || !result?.user) {
      state.error = getAuthErrorMessage(result?.error);
      state.connectionError = result?.error?.code === 'CONFIG_MISSING'
        || result?.error?.code === 'CONFIG_INVALID';
      setScreen('login');
      return;
    }
    state.user = result.user;
    void loadAccountBestScore(result.user);
    setScreen('menu', 'Microsoft 계정에 로그인했습니다.');
  }

  async function handleSignOut() {
    try {
      await authService.signOut();
      state.user = null;
      state.error = null;
      accountRequestId += 1;
      state.accountBestScore = 0;
      state.accountBestScoreError = false;
      state.selectedAircraftId = 'default';
      audioManager.setMusicMode?.('none');
      setScreen('login', '로그아웃했습니다.');
    } catch (error) {
      state.error = getAuthErrorMessage(error);
      setScreen('menu');
    }
  }

  function toggleMute() {
    state.muted = !state.muted;
    audioManager.setMuted(state.muted);
    if (state.screen === 'playing') gameHud?.update(state.snapshot ?? { score: 0 });
    else paint();
  }

  function triggerLift() {
    if (state.screen !== 'playing') return;
    if (state.snapshot?.challenge?.active) return;
    gameEngine.lift?.();
    audioManager.play('lift');
  }

  function triggerDash() {
    if (state.screen !== 'playing') return;
    if (gameEngine.dash?.()) {
      audioManager.play('dash');
    }
  }

  function getDifficultyMode(snapshot) {
    if (snapshot?.difficulty?.isBoss) return 'boss';
    if (snapshot?.difficulty?.isWarning) return 'warning';
    return 'normal';
  }

  function syncDifficultyFeedback(snapshot) {
    const nextMode = getDifficultyMode(snapshot);
    if (nextMode === lastDifficultyMode) return;
    const previousMode = lastDifficultyMode;
    lastDifficultyMode = nextMode;
    if (nextMode === 'warning') {
      if (previousMode === 'boss') audioManager.setMusicMode?.('gameplay');
      audioManager.play('warning');
      announce(liveRegion, 'WARNING 구간이 시작되었습니다. 특수 벽 대시 타이밍에 주의하세요.');
    } else if (nextMode === 'boss') {
      audioManager.play('boss');
      audioManager.setMusicMode?.('boss');
      announce(liveRegion, 'BOSS WARNING. 속도 변화와 특수 벽에 주의하세요.');
    } else if (previousMode === 'boss') {
      audioManager.setMusicMode?.('gameplay');
    }
  }

  function stopLoop() {
    if (animationFrame !== null) {
      globalThis.cancelAnimationFrame?.(animationFrame);
      animationFrame = null;
    }
  }

  function finishGame() {
    if (state.screen === 'game-over') return;
    stopLoop();
    audioManager.setMusicMode?.('none');
    state.snapshot = gameEngine.getSnapshot();
    state.leaderboard = null;
    state.submitError = false;
    state.screen = 'game-over';
    lastDifficultyMode = 'normal';
    paint();
    announce(liveRegion, `게임 종료. 최종 점수 ${state.snapshot?.score ?? 0}.`);
    void loadGameOverData();
  }

  function renderFrame(timestamp) {
    animationFrame = null;
    if (state.screen !== 'playing') return;
    gameEngine.update(timestamp);
    state.snapshot = gameEngine.getSnapshot();
    renderer.render(state.snapshot);
    gameHud?.update(state.snapshot);
    syncDifficultyFeedback(state.snapshot);
    if (state.snapshot.state === 'game-over') {
      finishGame();
      return;
    }
    animationFrame = globalThis.requestAnimationFrame(renderFrame);
  }

  function beginPlaying() {
    if (!state.user) {
      state.error = '게임을 시작하려면 Microsoft 계정으로 로그인해 주세요.';
      setScreen('login');
      return;
    }
    state.snapshot = null;
    lastDifficultyMode = 'normal';
    gameEngine.setAccountBestScore?.(state.accountBestScore);
    gameEngine.setAircraft?.(state.selectedAircraftId);
    gameEngine.start();
    audioManager.setMusicMode?.('gameplay');
    Promise.resolve(audioManager.unlock?.()).catch(() => {});
    state.snapshot = gameEngine.getSnapshot();
    setScreen('playing', '게임 시작. 클릭 또는 터치로 상승하세요.');
    stopLoop();
    animationFrame = globalThis.requestAnimationFrame(renderFrame);
  }

  function loadGameOverData({ submitScore = true } = {}) {
    const requestId = ++state.gameOverRequest;
    const score = state.snapshot?.score ?? 0;
    const displayName = getDisplayName(state.user);
    state.leaderboard = {
      top: { loading: true }, neighborhood: { loading: true },
    };
    state.submitError = false;
    paint();

    const submit = submitScore
      ? leaderboardService.submitBestScore(state.user, { score, displayName })
      : Promise.resolve({ error: null });
    const top = leaderboardService.fetchTopScores();
    const neighborhood = leaderboardService.fetchPlayerNeighborhood();
    Promise.all([submit, top, neighborhood]).then(([submitResult, topResult, neighborhoodResult]) => {
      if (requestId !== state.gameOverRequest || state.screen !== 'game-over') return;
      state.submitError = Boolean(submitResult?.error);
      state.leaderboard = {
        top: { rows: topResult?.rows ?? [], error: topResult?.error ?? null },
        neighborhood: { rows: neighborhoodResult?.rows ?? [], error: neighborhoodResult?.error ?? null },
        submitError: state.submitError,
      };
      paint();
    }).catch(() => {
      if (requestId !== state.gameOverRequest || state.screen !== 'game-over') return;
      state.submitError = true;
      state.leaderboard = {
        top: { error: true }, neighborhood: { error: true }, submitError: true,
      };
      paint();
    });
  }

  function dispatch(event) {
    const type = typeof event === 'string' ? event : event?.type;
    switch (type) {
      case 'START_GAME_FROM_MENU':
      case 'SHOW_TUTORIAL':
        if (state.user && state.screen === 'menu') setScreen('tutorial');
        break;
      case 'OPEN_HANGAR':
        if (state.screen === 'menu' && state.user) setScreen('hangar');
        break;
      case 'SELECT_AIRCRAFT':
        if (state.screen === 'hangar'
          && getUnlockedAircraftIds(state.accountBestScore).includes(event.aircraftId)) {
          state.selectedAircraftId = event.aircraftId;
          paint();
          announce(liveRegion, `${AIRCRAFT_CATALOG.find(({ id }) => id === event.aircraftId)?.name ?? '기체'} 선택됨.`);
        }
        break;
      case 'START_PLAYING':
        if (state.screen === 'tutorial') beginPlaying();
        break;
      case 'RESTART_IMMEDIATE':
        if (state.screen === 'game-over') beginPlaying();
        break;
      case 'RETURN_TO_MENU':
        if (!state.user) setScreen('login');
        else {
          stopLoop();
          lastDifficultyMode = 'normal';
          setScreen('menu');
        }
        break;
      case 'PAUSE':
        if (state.screen === 'playing') {
          state.snapshot = gameEngine.pause();
          audioManager.pauseMusic?.();
          audioManager.play('pause');
          setScreen('paused', '게임을 일시정지했습니다. 10점이 차감되었습니다.');
        }
        break;
      case 'RESUME':
        if (state.screen === 'paused') {
          gameEngine.resume();
          audioManager.resumeMusic?.();
          state.snapshot = gameEngine.getSnapshot();
          setScreen('playing', '게임을 다시 시작합니다.');
          animationFrame = globalThis.requestAnimationFrame(renderFrame);
        }
        break;
      case 'GAME_OVER':
        if (state.screen === 'playing') {
          gameEngine.stop?.('manual');
          finishGame();
        }
        break;
      default:
        break;
    }
  }

  function handleKeyDown(event) {
    if (event.target?.closest?.('button, input, select, textarea, a, [contenteditable="true"]')) return;
    if (state.screen === 'playing' && state.snapshot?.challenge?.active) {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault();
        gameEngine.handleChallengeKey?.(event.code);
      } else if (event.code === 'Space') {
        event.preventDefault();
      }
      return;
    }
    if (event.code === 'Space' && state.screen === 'playing') {
      event.preventDefault();
      triggerDash();
    } else if ((event.code === 'KeyP' || event.code === 'Escape') && state.screen === 'playing') {
      event.preventDefault();
      dispatch({ type: 'PAUSE' });
    }
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    pointerTarget = deps.canvas ?? root.querySelector('canvas');
    handlePointerDown = (event) => {
      if (state.screen !== 'playing') return;
      event.preventDefault?.();
      triggerLift();
    };
    pointerTarget?.addEventListener('pointerdown', handlePointerDown);
    globalThis.window?.addEventListener('keydown', handleKeyDown);
    try {
      unsubscribeAuth = authService.subscribeToAuth((user) => {
        if (!user) {
          state.user = null;
          stopLoop();
          audioManager.setMusicMode?.('none');
          setScreen('login');
        } else {
          const changedUser = state.user?.id !== user.id;
          state.user = user;
          if (changedUser) {
            state.selectedAircraftId = 'default';
            void loadAccountBestScore(user);
          }
          if (state.screen === 'login' || state.screen === 'loading') setScreen('menu');
        }
      });
    } catch (error) {
      state.error = getAuthErrorMessage(error);
      state.connectionError = true;
    }
    void refreshSession();
  }

  function destroy() {
    mounted = false;
    stopLoop();
    pointerTarget?.removeEventListener('pointerdown', handlePointerDown);
    pointerTarget = null;
    handlePointerDown = null;
    globalThis.window?.removeEventListener('keydown', handleKeyDown);
    unsubscribeAuth?.();
    renderer.destroy?.();
    audioManager.destroy?.();
    if (ownsLiveRegion) liveRegion.remove();
  }

  return { mount, destroy, dispatch };
}
