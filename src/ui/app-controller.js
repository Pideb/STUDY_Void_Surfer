import { getAuthErrorMessage } from '../services/auth-errors.js';
import { readGuestRecord, writeGuestRecord } from '../services/guest-record-service.js';
import { AIRCRAFT_CATALOG, getUnlockedAircraftIds } from '../game/aircraft.js';
import { announce } from './components.js';
import { createGameHud } from './game-hud.js';
import {
  renderGameOverScreen,
  renderHangarScreen,
  renderLoginScreen,
  renderMenuScreen,
  renderPausedScreen,
  renderPilotRankingScreen,
  renderTutorialScreen,
} from './screens.js';

function getDisplayName(user) {
  return user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? user?.email?.split('@')[0]
    ?? '파일럿';
}

function isValidScoreSubmission(result, submittedScore, expectedUserId) {
  const record = result?.record;
  return !result?.error
    && typeof result?.updated === 'boolean'
    && record
    && String(record.userId ?? '') === String(expectedUserId ?? '')
    && Number.isInteger(record.bestScore)
    && record.bestScore >= submittedScore
    && typeof record.achievedAt === 'string'
    && Boolean(record.achievedAt)
    && AIRCRAFT_CATALOG.some(({ id }) => id === record.aircraftId);
}

function getHangarAircraft(bestScore, guest = false) {
  const unlocked = new Set(getUnlockedAircraftIds(bestScore));
  return AIRCRAFT_CATALOG.map((craft) => ({
    ...craft,
    unlocked: guest || unlocked.has(craft.id),
    description: craft.id === 'velocity'
      ? '최고 속도로 돌파하는 고속 기체'
      : craft.id === 'aegis' ? '무겁지만 정밀한 조작이 가능한 기체' : '균형 잡힌 기본 기체',
    stats: craft.id === 'velocity'
      ? '이동 속도 ×2 · 최종 점수 ×1.5'
      : craft.id === 'aegis' ? '중력 ×1.3 · 상승력 70%' : '속도 · 중력 · 상승력 표준',
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
    screen: 'menu', user: null, error: null, authActionError: null, connectionError: false, busy: false,
    muted: Boolean(audioManager.isMuted?.()), snapshot: null, leaderboard: null,
    submitError: false, submitErrorMessage: null, gameOverRequest: 0, selectedAircraftId: 'default',
    accountBestScore: 0, accountBestScoreLoading: false, accountBestScoreError: false,
    guestBestRecord: readGuestRecord(deps.guestRecordStorage),
    rankingRows: [], rankingOffset: 0, rankingHasMore: false, rankingLoading: false,
    rankingError: null, rankingPersonalRecord: null, rankingPersonalLoading: false,
    rankingPersonalError: null, rankingReturnScreen: 'menu',
    submitState: 'idle',
  };
  let unsubscribeAuth = () => {};
  let pointerTarget = null;
  let handlePointerDown = null;
  let animationFrame = null;
  let mounted = false;
  let gameHud = null;
  let lastDifficultyMode = 'normal';
  let accountRequestId = 0;
  let lastStageId = null;
  let lastAttackId = null;
  let lastAttackPhase = null;
  let previousBoss = null;
  let challengeRunId = 0;
  let previousChallengeActive = false;
  let rankingObserver = null;
  let rankingRequestId = 0;
  let rankingPersonalRequestId = 0;

  function paint() {
    rankingObserver?.disconnect();
    rankingObserver = null;
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
      audioManager.setMusicScene?.(null);
      root.replaceChildren(renderMenuScreen({
        displayName: state.user ? getDisplayName(state.user) : 'GUEST',
        signedIn: Boolean(state.user), authError: state.authActionError, busy: state.busy,
        muted: state.muted,
        selectedAircraftId: state.selectedAircraftId,
        selectedAircraft: AIRCRAFT_CATALOG.find(({ id }) => id === state.selectedAircraftId)?.name ?? 'DEFAULT',
      }, {
        start: () => dispatch({ type: 'START_GAME_FROM_MENU' }),
        hangar: () => dispatch({ type: 'OPEN_HANGAR' }),
        ranking: () => dispatch({ type: 'OPEN_PILOT_RANKING', returnScreen: 'menu' }),
        toggleMute: toggleMute,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }));
      return;
    }
    if (state.screen === 'hangar') {
      root.replaceChildren(renderHangarScreen({
        aircraft: getHangarAircraft(state.user ? state.accountBestScore : state.guestBestRecord.bestScore, !state.user),
        selectedAircraftId: state.selectedAircraftId,
        bestScore: state.user ? state.accountBestScore : state.guestBestRecord.bestScore,
        recordLabel: state.user ? '계정 최고 기록' : '게스트 최고 기록',
        loading: Boolean(state.user) && state.accountBestScoreLoading,
        error: Boolean(state.user) && state.accountBestScoreError,
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
        score: state.snapshot?.finalScore ?? state.snapshot?.score ?? 0,
        baseScore: state.snapshot?.baseScore ?? state.snapshot?.score ?? 0,
        scoreMultiplier: state.snapshot?.scoreMultiplier ?? state.snapshot?.aircraft?.scoreMultiplier ?? 1,
        aircraftId: state.snapshot?.aircraft?.id ?? 'default',
        leaderboard: state.leaderboard ?? {
          top: { loading: true }, neighborhood: { loading: true },
        },
        submitError: state.submitError,
        submitErrorMessage: state.submitErrorMessage,
        submitState: state.submitState,
      }, {
        restart: () => dispatch({ type: 'RESTART_IMMEDIATE' }),
        menu: () => dispatch({ type: 'RETURN_TO_MENU' }),
        retryLeaderboard: () => loadGameOverData({ submitScore: state.submitState === 'error' }),
        ranking: () => dispatch({ type: 'OPEN_PILOT_RANKING', returnScreen: 'game-over' }),
      }));
      return;
    }
    if (state.screen === 'pilot-ranking') {
      const rankingScreen = renderPilotRankingScreen({
        rows: state.rankingRows,
        loading: state.rankingLoading,
        hasMore: state.rankingHasMore,
        error: state.rankingError,
        personalRecord: state.rankingPersonalRecord,
        personalLoading: state.rankingPersonalLoading,
        personalError: state.rankingPersonalError,
      }, {
        loadMore: () => dispatch({ type: 'LOAD_MORE_RANKING' }),
        back: () => dispatch({ type: 'CLOSE_PILOT_RANKING' }),
      });
      root.replaceChildren(rankingScreen);
      attachRankingObserver();
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
    try {
      const user = await authService.getSessionUser();
      state.user = user;
      gameEngine.setGuestMode?.(!user);
      state.error = null;
      state.authActionError = null;
      state.connectionError = false;
      if (user) void loadAccountBestScore(user);
      else {
        accountRequestId += 1;
        state.accountBestScore = 0;
        state.accountBestScoreLoading = false;
        state.accountBestScoreError = false;
      }
      setScreen('menu');
    } catch (error) {
      state.user = null;
      gameEngine.setGuestMode?.(true);
      accountRequestId += 1;
      state.accountBestScore = 0;
      state.accountBestScoreLoading = false;
      state.accountBestScoreError = false;
      state.authActionError = getAuthErrorMessage(error);
      state.connectionError = error?.code === 'CONFIG_MISSING'
        || error?.code === 'CONFIG_INVALID'
        || error?.code === 'NETWORK_ERROR';
      setScreen('menu', state.authActionError);
    }
  }

  async function loadAccountBestScore(user) {
    const requestId = ++accountRequestId;
    state.accountBestScoreLoading = true;
    if (state.screen === 'hangar') paint();
    if (typeof leaderboardService.fetchPlayerBestScore !== 'function') {
      state.accountBestScoreLoading = false;
      state.accountBestScoreError = true;
      if (state.screen === 'hangar') paint();
      return;
    }
    try {
      const result = await leaderboardService.fetchPlayerBestScore(user);
      if (requestId !== accountRequestId || state.user?.id !== user?.id) return;
      if (result?.error || !Number.isFinite(Number(result?.bestScore))) {
        state.accountBestScore = 0;
        state.accountBestScoreLoading = false;
        state.accountBestScoreError = true;
      } else {
        state.accountBestScore = Math.max(0, Math.trunc(Number(result.bestScore)));
        state.accountBestScoreLoading = false;
        state.accountBestScoreError = false;
      }
      if (!getUnlockedAircraftIds(state.accountBestScore).includes(state.selectedAircraftId)) {
        state.selectedAircraftId = 'default';
      }
      if (state.screen === 'hangar') paint();
    } catch {
      if (requestId !== accountRequestId || state.user?.id !== user?.id) return;
      state.accountBestScore = 0;
      state.accountBestScoreLoading = false;
      state.accountBestScoreError = true;
      state.selectedAircraftId = 'default';
      if (state.screen === 'hangar') paint();
    }
  }

  async function handleSignIn() {
    if (state.busy || state.user) return;
    state.busy = true;
    state.authActionError = null;
    paint();
    let result;
    try {
      result = await authService.signInWithMicrosoft();
    } catch (error) {
      result = { error };
    }
    state.busy = false;
    if (result?.error || !result?.user) {
      state.authActionError = getAuthErrorMessage(result?.error);
      state.connectionError = result?.error?.code === 'CONFIG_MISSING'
        || result?.error?.code === 'CONFIG_INVALID';
      setScreen('menu', state.authActionError);
      return;
    }
    state.user = result.user;
    gameEngine.setGuestMode?.(false);
    state.authActionError = null;
    void loadAccountBestScore(result.user);
    setScreen('menu', 'Microsoft 계정에 로그인했습니다.');
  }

  async function handleSignOut() {
    try {
      await authService.signOut();
      state.user = null;
      gameEngine.setGuestMode?.(true);
      state.error = null;
      state.authActionError = null;
      accountRequestId += 1;
      state.accountBestScore = 0;
      state.accountBestScoreLoading = false;
      state.accountBestScoreError = false;
      audioManager.setMusicMode?.('none');
      setScreen('menu', '로그아웃했습니다.');
    } catch (error) {
      state.authActionError = getAuthErrorMessage(error);
      setScreen('menu', state.authActionError);
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

  function syncCombatAudio(snapshot) {
    const stageId = snapshot?.stage?.id ?? null;
    if (stageId !== lastStageId) {
      lastStageId = stageId;
      audioManager.setMusicScene?.(stageId);
    }

    const attack = snapshot?.boss?.attack;
    if (!attack) {
      lastAttackId = null;
      lastAttackPhase = null;
    } else {
      if (attack.id !== lastAttackId) {
        lastAttackId = attack.id;
        lastAttackPhase = null;
      }
      if (attack.type === 'projectile' && attack.state === 'charging' && lastAttackPhase !== 'charging') {
        audioManager.play('bossCharge', { id: attack.id });
        lastAttackPhase = 'charging';
      } else if (attack.type === 'projectile' && attack.state === 'returning' && lastAttackPhase !== 'returning') {
        audioManager.play('projectileReflect', { id: attack.id });
        lastAttackPhase = 'returning';
      } else if (attack.type === 'laser' && attack.telegraphRemainingSeconds > 0 && lastAttackPhase !== 'telegraph') {
        audioManager.play('laserTelegraph', { id: attack.id });
        lastAttackPhase = 'telegraph';
      }
    }

    const boss = snapshot?.boss;
    if (boss) {
      const bossKey = String(boss.number ?? 'boss');
      const previous = previousBoss?.key === bossKey ? previousBoss.hp : boss.maxHp;
      if (Number.isFinite(previous) && Number.isFinite(boss.hp) && boss.hp < previous) {
        audioManager.play('bossHit', { id: `${bossKey}:${boss.hp}` });
      }
      previousBoss = { key: bossKey, hp: boss.hp };
    } else {
      previousBoss = null;
    }

    const challenge = snapshot?.challenge;
    if (challenge?.active && !previousChallengeActive) challengeRunId += 1;
    if (challenge && !challenge.active && previousChallengeActive) {
      const challengeId = `challenge-${challengeRunId}`;
      if (challenge.result === 'success') {
        audioManager.play('challengeSuccess', { id: challengeId });
      } else if (challenge.result === 'failure') {
        const effectKind = snapshot.feedbackEffect?.kind;
        audioManager.play(effectKind === 'glitch' ? 'challengeFailureGlitch' : 'challengeFailureInk', { id: challengeId });
      }
    }
    previousChallengeActive = Boolean(challenge?.active);
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
    state.submitErrorMessage = null;
    state.submitState = 'idle';
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
    syncCombatAudio(state.snapshot);
    if (state.snapshot.state === 'game-over') {
      finishGame();
      return;
    }
    animationFrame = globalThis.requestAnimationFrame(renderFrame);
  }

  function beginPlaying() {
    state.snapshot = null;
    lastDifficultyMode = 'normal';
    gameEngine.setGuestMode?.(!state.user);
    gameEngine.setAccountBestScore?.(state.accountBestScore);
    gameEngine.setAircraft?.(state.selectedAircraftId);
    gameEngine.start();
    audioManager.setMusicMode?.('gameplay');
    Promise.resolve(audioManager.unlock?.()).catch(() => {});
    state.snapshot = gameEngine.getSnapshot();
    lastStageId = null;
    lastAttackId = null;
    lastAttackPhase = null;
    previousBoss = null;
    previousChallengeActive = false;
    syncCombatAudio(state.snapshot);
    setScreen('playing', '게임 시작. 클릭 또는 터치로 상승하세요.');
    stopLoop();
    animationFrame = globalThis.requestAnimationFrame(renderFrame);
  }

  async function loadGameOverData({ submitScore = true } = {}) {
    if (state.submitState === 'saving') return;
    const requestId = ++state.gameOverRequest;
    const score = state.snapshot?.finalScore ?? state.snapshot?.score ?? 0;
    const displayName = getDisplayName(state.user);
    const aircraftId = state.snapshot?.aircraft?.id ?? 'default';
    if (!state.user) {
      const savedRecord = writeGuestRecord({
        bestScore: score,
        aircraftId,
        achievedAt: new Date().toISOString(),
      }, deps.guestRecordStorage);
      if (savedRecord) state.guestBestRecord = savedRecord;
    }
    const shouldSubmitScore = Boolean(submitScore && state.user);
    state.leaderboard = {
      top: { loading: true }, neighborhood: { loading: true },
    };
    state.submitError = false;
    if (shouldSubmitScore) {
      state.submitState = 'saving';
      state.submitErrorMessage = null;
    }
    paint();

    let submitResult = null;
    if (shouldSubmitScore) {
      try {
        submitResult = await leaderboardService.submitBestScore(state.user, { score, displayName, aircraftId });
      } catch (error) {
        submitResult = { error };
      }
      if (requestId !== state.gameOverRequest || state.screen !== 'game-over') return;
      if (isValidScoreSubmission(submitResult, score, state.user?.id)) state.submitState = 'saved';
      else {
        submitResult = submitResult?.error
          ? submitResult
          : { ...submitResult, error: new Error('Invalid score submission response') };
        state.submitState = 'error';
        state.submitErrorMessage = submitResult.error?.code === 'SCHEMA_MISSING'
          ? submitResult.error.message
          : submitResult.error?.code
            ? submitResult.error.message
            : '점수를 저장하지 못했습니다. 다시 시도해 주세요.';
      }
    }

    try {
      const [topResult, neighborhoodResult] = await Promise.all([
        leaderboardService.fetchTopScores(),
        leaderboardService.fetchPlayerNeighborhood(),
      ]);
      if (requestId !== state.gameOverRequest || state.screen !== 'game-over') return;
      state.submitError = shouldSubmitScore
        ? !isValidScoreSubmission(submitResult, score, state.user?.id)
        : state.submitState === 'error';
      state.leaderboard = {
        top: { rows: topResult?.rows ?? [], error: topResult?.error ?? null },
        neighborhood: { rows: neighborhoodResult?.rows ?? [], error: neighborhoodResult?.error ?? null },
        submitError: state.submitError,
      };
      paint();
    } catch {
      if (requestId !== state.gameOverRequest || state.screen !== 'game-over') return;
      state.submitError = state.submitState === 'error';
      state.leaderboard = {
        top: { error: true }, neighborhood: { error: true }, submitError: true,
      };
      paint();
    }
  }

  function attachRankingObserver() {
    const Observer = globalThis.IntersectionObserver;
    const scrollRegion = root.querySelector('.pilot-ranking-table-scroll');
    const sentinel = root.querySelector('.ranking-load-more');
    if (!Observer || !scrollRegion || !sentinel || !state.rankingHasMore) return;
    rankingObserver = new Observer((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) dispatch({ type: 'LOAD_MORE_RANKING' });
    }, { root: scrollRegion, rootMargin: '0px 0px 120px 0px' });
    rankingObserver.observe(sentinel);
  }

  async function loadRankingPage({ reset = false } = {}) {
    if (reset) {
      rankingRequestId += 1;
      state.rankingRows = [];
      state.rankingOffset = 0;
      state.rankingHasMore = true;
      state.rankingError = null;
    } else if (state.rankingLoading || !state.rankingHasMore) {
      return;
    }
    const requestId = rankingRequestId;
    state.rankingLoading = true;
    state.rankingError = null;
    paint();
    try {
      const result = await leaderboardService.fetchLeaderboardPage({ limit: 50, offset: state.rankingOffset });
      if (requestId !== rankingRequestId || state.screen !== 'pilot-ranking') return;
      if (result?.error) {
        state.rankingError = result.error;
        state.rankingLoading = false;
        paint();
        announce(liveRegion, '파일럿 순위를 불러오지 못했습니다. 다시 시도할 수 있습니다.');
        return;
      }
      const rows = Array.isArray(result?.rows) ? result.rows : [];
      state.rankingRows = [...state.rankingRows, ...rows];
      state.rankingOffset += rows.length;
      state.rankingHasMore = rows.length === 50;
      state.rankingLoading = false;
      paint();
      announce(liveRegion, `${state.rankingRows.length}명의 파일럿 순위를 불러왔습니다.`);
    } catch (error) {
      if (requestId !== rankingRequestId || state.screen !== 'pilot-ranking') return;
      state.rankingError = error;
      state.rankingLoading = false;
      paint();
      announce(liveRegion, '파일럿 순위를 불러오지 못했습니다. 다시 시도할 수 있습니다.');
    }
  }

  async function loadRankingPersonalRecord() {
    rankingPersonalRequestId += 1;
    const requestId = rankingPersonalRequestId;
    if (!state.user) {
      state.rankingPersonalRecord = {
        rank: null,
        displayName: 'GUEST',
        aircraftId: state.guestBestRecord.aircraftId,
        bestScore: state.guestBestRecord.bestScore,
        guest: true,
      };
      state.rankingPersonalLoading = false;
      state.rankingPersonalError = null;
      paint();
      return;
    }

    state.rankingPersonalLoading = true;
    state.rankingPersonalRecord = null;
    state.rankingPersonalError = null;
    paint();
    try {
      const neighborhood = await leaderboardService.fetchPlayerNeighborhood();
      if (requestId !== rankingPersonalRequestId || state.screen !== 'pilot-ranking') return;
      if (neighborhood?.error) throw neighborhood.error;
      const ownRecord = neighborhood?.rows?.find((row) => row.isCurrentUser);
      if (ownRecord) {
        state.rankingPersonalRecord = {
          rank: ownRecord.rank,
          displayName: ownRecord.displayName,
          aircraftId: ownRecord.aircraftId,
          bestScore: ownRecord.bestScore,
          guest: false,
        };
      } else {
        const best = await leaderboardService.fetchPlayerBestScore(state.user);
        if (requestId !== rankingPersonalRequestId || state.screen !== 'pilot-ranking') return;
        if (best?.error) throw best.error;
        state.rankingPersonalRecord = {
          rank: null,
          displayName: getDisplayName(state.user),
          aircraftId: 'default',
          bestScore: best?.bestScore ?? 0,
          guest: false,
        };
      }
      state.rankingPersonalLoading = false;
      paint();
    } catch (error) {
      if (requestId !== rankingPersonalRequestId || state.screen !== 'pilot-ranking') return;
      state.rankingPersonalLoading = false;
      state.rankingPersonalError = error;
      paint();
    }
  }

  function openPilotRanking(returnScreen) {
    state.rankingReturnScreen = returnScreen === 'game-over' ? 'game-over' : 'menu';
    state.rankingRows = [];
    state.rankingOffset = 0;
    state.rankingHasMore = true;
    state.rankingLoading = true;
    state.rankingError = null;
    state.rankingPersonalRecord = null;
    state.rankingPersonalLoading = Boolean(state.user);
    state.rankingPersonalError = null;
    setScreen('pilot-ranking');
    void loadRankingPage({ reset: true });
    void loadRankingPersonalRecord();
  }

  function dispatch(event) {
    const type = typeof event === 'string' ? event : event?.type;
    switch (type) {
      case 'START_GAME_FROM_MENU':
      case 'SHOW_TUTORIAL':
        if (state.screen === 'menu') setScreen('tutorial');
        break;
      case 'OPEN_HANGAR':
        if (state.screen === 'menu') {
          if (state.user) void loadAccountBestScore(state.user);
          setScreen('hangar');
        }
        break;
      case 'OPEN_PILOT_RANKING':
        if (state.screen === 'menu' || state.screen === 'game-over') {
          openPilotRanking(event?.returnScreen ?? state.screen);
        }
        break;
      case 'CLOSE_PILOT_RANKING':
        if (state.screen === 'pilot-ranking') {
          rankingRequestId += 1;
          rankingPersonalRequestId += 1;
          state.rankingLoading = false;
          setScreen(state.rankingReturnScreen);
        }
        break;
      case 'LOAD_MORE_RANKING':
        if (state.screen === 'pilot-ranking') void loadRankingPage();
        break;
      case 'SELECT_AIRCRAFT':
        if (state.screen === 'hangar'
          && (!state.user || getUnlockedAircraftIds(state.accountBestScore).includes(event.aircraftId))) {
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
        stopLoop();
        lastDifficultyMode = 'normal';
        lastAttackId = null;
        lastAttackPhase = null;
        previousBoss = null;
        previousChallengeActive = false;
        setScreen('menu');
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
    paint();
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
          accountRequestId += 1;
          state.user = null;
          gameEngine.setGuestMode?.(true);
          stopLoop();
          audioManager.setMusicMode?.('none');
          state.accountBestScore = 0;
          state.accountBestScoreLoading = false;
          state.accountBestScoreError = false;
          state.authActionError = null;
          setScreen('menu');
        } else {
          const changedUser = state.user?.id !== user.id;
          state.user = user;
          gameEngine.setGuestMode?.(false);
          if (changedUser) {
            state.selectedAircraftId = 'default';
            void loadAccountBestScore(user);
          }
          if (state.screen === 'login' || state.screen === 'loading' || state.screen === 'menu') setScreen('menu');
        }
      });
    } catch (error) {
      state.authActionError = getAuthErrorMessage(error);
      state.connectionError = true;
      setScreen('menu', state.authActionError);
    }
    void refreshSession();
  }

  function destroy() {
    mounted = false;
    stopLoop();
    rankingObserver?.disconnect();
    rankingObserver = null;
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
