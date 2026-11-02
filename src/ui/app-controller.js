import { getAuthErrorMessage } from '../services/auth-errors.js';
import { clearLegacyGuestRecord } from '../services/guest-record-service.js';
import { AIRCRAFT_CATALOG, getUnlockedAircraftIds, canSelectAircraft } from '../game/aircraft.js';
import {createMenuNavigation} from './menu-navigation.js';
import {createMenuLayout} from './menu-layout.js';
import {createOrientationController} from './orientation-controller.js';
import {renderOrientationScreen,renderRotationResumeScreen} from './screens.js';
import releases from '../../docs/management/releases.json' with {type:'json'};
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
  renderPreparingScreen,
} from './screens.js';

const ADMIN_EMAIL = 'gh.lee@dexconsulting.net';
export const GAMEPLAY_MUSIC_WAIT_MS = 10000;
const ADMIN_SETTINGS_STORAGE_KEY = 'void-surfer:admin-settings:v1';

function isDesignatedAdmin(user) {
  return String(user?.email ?? '').trim().toLowerCase() === ADMIN_EMAIL;
}

function readAdminSettings(storage) {
  try {
    const raw = storage?.getItem(ADMIN_SETTINGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.version !== 1
      || typeof parsed.adminModeEnabled !== 'boolean'
      || typeof parsed.invincibilityEnabled !== 'boolean') {
      return { adminModeEnabled: false, invincibilityEnabled: false, showPlayerHitbox: false };
    }
    return {
      adminModeEnabled: parsed.adminModeEnabled,
      invincibilityEnabled: parsed.invincibilityEnabled,
      showPlayerHitbox: parsed.showPlayerHitbox === true,
    };
  } catch {
    return { adminModeEnabled: false, invincibilityEnabled: false, showPlayerHitbox: false };
  }
}

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
  return AIRCRAFT_CATALOG.map((craft) => ({
    ...craft,
    unlocked: canSelectAircraft(craft.id,{guestMode:guest,bestScore}),
    description: craft.id === 'velocity'
      ? '최고 속도로 돌파하는 고속 기체'
      : craft.id === 'aegis' ? '무겁지만 정밀한 조작이 가능한 기체' : '균형 잡힌 기본 기체',
    stats: (craft.id === 'velocity'
      ? '시작 속도 ×2 · 최종 점수 ×1.5'
      : craft.id === 'aegis' ? '중력 ×1.3 · 상승력 70% · 보스 레이저 1발 처치' : '속도 · 중력 · 상승력 표준'),
  }));
}

export function createAppController(deps) {
  const { authService, leaderboardService, gameEngine, renderer, audioManager, root } = deps;
  if (!(root instanceof HTMLElement)) throw new TypeError('앱 UI 루트는 HTMLElement여야 합니다.');
  const menuNavigation=createMenuNavigation(root);
  const playTracker=deps.playSessionTracker??null;
  let finishedTiming=null;
  const menuLayout=createMenuLayout(root,{isMobile:deps.orientationIsMobile});
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
    rankingRows: [], rankingOffset: 0, rankingHasMore: false, rankingLoading: false,
    rankingError: null, rankingPersonalRecord: null, rankingPersonalLoading: false,
    rankingPersonalError: null, rankingReturnScreen: 'menu',
    submitState: 'idle',
    adminModeEnabled: false, invincibilityEnabled: false, showPlayerHitbox: false, adminDialogOpen: false,
  };
  const adminSettingsStorage = deps.adminSettingsStorage ?? globalThis.localStorage;
  let unsubscribeAuth = () => {};
  let pointerTarget = null;
  let handlePointerDown = null;
  let animationFrame = null;
  let mounted = false;
  let orientationState={mobile:false,portrait:false,resumePending:false,priorScreen:null};
  let orientationWasBlocking=false;
  const orientationHost=document.createElement('div');orientationHost.className='orientation-host';orientationHost.hidden=true;
  let orientationController=null;
  function syncOrientation(next){
    orientationState=next;const blocked=next.portrait||next.resumePending,wasBlocking=orientationWasBlocking;
    orientationWasBlocking=blocked;
    gameEngine.setSuspended?.('orientation',blocked);root.inert=blocked;
    if(blocked)playTracker?.suspend('orientation');else playTracker?.resume('orientation');
    orientationHost.hidden=!blocked;
    if(blocked){
      if(!orientationHost.isConnected)(root.parentElement??document.body).append(orientationHost);
      orientationHost.replaceChildren(next.portrait?renderOrientationScreen():renderRotationResumeScreen({resume:()=>orientationController.confirmResume()}));
      if(!wasBlocking){handleBlur();stopLoop();audioManager.pauseMusic?.();}
    }else if(wasBlocking){
      if(state.screen!=='paused')audioManager.resumeMusic?.();
      if(state.screen==='playing'&&mounted)animationFrame=globalThis.requestAnimationFrame(renderFrame);
      if(state.screen==='preparing'&&pendingStart?.ready)activatePreparedStart(pendingStart);
    }
    if(mounted)menuLayout.refresh();
  }
  let pendingStart = null;
  let gameHud = null;
  let lastDifficultyMode = 'normal';
  let accountRequestId = 0;
  let lastStageId = null;
  let lastAttackId = null;
  let lastAttackPhase = null;
  let previousBoss = null;
  let challengeRunId = 0;
  let lastWrongChallengeEvent = null;
  let previousChallengeActive = false;
  let lastBossPreviewId = null;
  let audioRunId = 0;
  let lastRoarId = null;
  let lastDeathEffectId = null;
  let rankingObserver = null;
  let rankingRequestId = 0;
  let rankingPersonalRequestId = 0;
  let adminTriggerElement = null;
  let spaceHeld = false;
  let audioGesturePromise = null;
  let audioGestureReady = false;
  const audioGestureEvents = ['pointerdown', 'pointerup', 'keydown'];

  function tryStartupAudio() {
    if (!mounted || orientationWasBlocking || state.screen !== 'menu' || state.muted) return;
    try { Promise.resolve(audioManager.tryAutoplay?.()).catch(() => {}); }
    catch { /* The normal first-input path remains available. */ }
  }

  function removeAudioGestureListeners() {
    for (const type of audioGestureEvents) globalThis.window?.removeEventListener(type, handleAudioGesture, true);
  }

  function handleAudioGesture(event) {
    if (!mounted || audioGestureReady || audioGesturePromise) return;
    if (event.type === 'pointerdown' && event.pointerType && event.pointerType !== 'mouse') return;
    if (event.type === 'pointerup' && event.pointerType === 'mouse') return;
    if (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.metaKey || event.altKey
      || !/^(Enter|Space|Key[A-Z]|Digit[0-9]|Arrow\w+)$/.test(event.code))) return;
    try {
      // Call inside the actual gesture, before awaiting anything: browsers use
      // this activation to permit AudioContext.resume() after blocked autoplay.
      const request = audioManager.unlock?.();
      audioGesturePromise = Promise.resolve(request).then(() => {
        if (!mounted) return;
        audioGestureReady = true;
        removeAudioGestureListeners();
      }).catch(() => {
        // A later interaction can retry a rejected resume without starting a run.
      }).finally(() => { audioGesturePromise = null; });
    } catch {
      audioGesturePromise = null;
    }
  }

  function replaceMenuKeepingPreview(nextMenu) {
    const previous = root.querySelector('.menu-screen');
    const preview = previous?.matches('.menu-screen') ? previous.querySelector('.menu-aircraft-preview') : null;
    const nextPreview = nextMenu.querySelector('.menu-aircraft-preview');
    if (!preview || preview.dataset.aircraftId !== nextPreview?.dataset.aircraftId) {
      root.replaceChildren(nextMenu);
      return;
    }
    // Keep the animated subtree connected: detaching/rebuilding it restarts the
    // float on mute, account and async status repaints, causing a visible jump.
    for (const child of [...previous.children]) if (child !== preview) child.remove();
    for (const child of [...nextMenu.children]) if (child !== nextPreview) previous.append(child);
  }
  const fireKeys = new Set(['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight']);
  const fireHeld = new Set();
  const physicalKeys=new Set(),blockedRestartKeys=new Set();
  const scoreSaveJobs=new Map();
  let activeRun=null,finishedRun=null,runSequence=0;
  let arrowUpDown = false;
  const handleKeyUp = (event) => { physicalKeys.delete(event.code);blockedRestartKeys.delete(event.code); if (event.code === 'Space') spaceHeld = false; if(event.code==='ArrowUp')arrowUpDown=false; fireHeld.delete(event.code); };
  const handleBlur = () => { physicalKeys.clear();blockedRestartKeys.clear();spaceHeld = false; arrowUpDown=false; fireHeld.clear(); };

  function paint() {
    root.dataset.screen=state.screen;
    queueMicrotask(()=>{if(mounted){menuLayout.refresh();if(!orientationWasBlocking&&!['playing','game-over','preparing'].includes(state.screen))menuNavigation.refresh();}});
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
      if (!root.querySelector('.menu-screen')) renderer.renderMenuBackground?.();
      audioManager.setMusicMode?.('menu');
      audioManager.setMusicScene?.(null);
      replaceMenuKeepingPreview(renderMenuScreen({
        displayName: state.user ? getDisplayName(state.user) : 'GUEST',
        signedIn: Boolean(state.user), authError: state.authActionError, busy: state.busy,
        muted: state.muted,
        selectedAircraftId: state.selectedAircraftId,
        selectedAircraft: AIRCRAFT_CATALOG.find(({ id }) => id === state.selectedAircraftId)?.name ?? 'DEFAULT',
        adminEligible: isDesignatedAdmin(state.user),
        adminDialogOpen: state.adminDialogOpen,
        adminModeEnabled: state.adminModeEnabled,
        invincibilityEnabled: state.invincibilityEnabled,
        showPlayerHitbox: state.showPlayerHitbox,
      }, {
        start: () => dispatch({ type: 'START_GAME_FROM_MENU' }),
        hangar: () => dispatch({ type: 'OPEN_HANGAR' }),
        ranking: () => dispatch({ type: 'OPEN_PILOT_RANKING', returnScreen: 'menu' }),
        toggleMute: toggleMute,
        signIn: handleSignIn,
        signOut: handleSignOut,
        openAdminSettings: openAdminSettings,
        closeAdminSettings: closeAdminSettings,
        toggleAdminMode: setAdminModeEnabled,
        toggleInvincibility: setInvincibilityEnabled,
        togglePlayerHitbox: setShowPlayerHitbox,
      }));
      if (state.adminDialogOpen) root.querySelector('[role="dialog"] [aria-label="관리자 모드"]')?.focus();
      return;
    }
    if (state.screen === 'hangar') {
      root.replaceChildren(renderHangarScreen({
        aircraft: getHangarAircraft(state.user ? state.accountBestScore : 0, !state.user),
        selectedAircraftId: state.selectedAircraftId,
        bestScore: state.user ? state.accountBestScore : 0,
        guestMode: !state.user,
        recordLabel: '계정 최고 기록',
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
    if (state.screen === 'preparing') {
      root.replaceChildren(renderPreparingScreen({}, { menu: () => dispatch('RETURN_TO_MENU') }));
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
        guestMode: !state.user,
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
        ranking: () => dispatch({ type: 'OPEN_PILOT_RANKING', returnScreen: 'game-over' }),
      }));
      return;
    }
    if (state.screen === 'pilot-ranking') {
      const rankingScreen = renderPilotRankingScreen({
        guestMode: !state.user,
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
      fire: triggerFire,
      challengeKey: submitChallengeKey,
    });
    root.replaceChildren(gameHud.element);
    gameHud.update(state.snapshot ?? { score: 0 });
  }

  function setScreen(screen, message = '') {
    if(screen==='menu'&&['playing','paused'].includes(state.screen))playTracker?.finish('abandoned');
    if (state.screen === 'preparing' && screen !== 'preparing') cancelPendingStart();
    state.screen = screen;
    paint();
    if (message) announce(liveRegion, message);
  }

  function applyAdminSettingsForUser(user) {
    state.adminDialogOpen = false;
    if (!isDesignatedAdmin(user)) {
      state.adminModeEnabled = false;
      state.invincibilityEnabled = false;
      state.showPlayerHitbox = false;
      gameEngine.setInvincibilityEnabled?.(false);
      return;
    }
    const settings = readAdminSettings(adminSettingsStorage);
    state.adminModeEnabled = settings.adminModeEnabled;
    state.invincibilityEnabled = settings.invincibilityEnabled;
    state.showPlayerHitbox = settings.showPlayerHitbox;
    gameEngine.setInvincibilityEnabled?.(state.invincibilityEnabled);
  }

  function persistAdminSettings() {
    if (!isDesignatedAdmin(state.user)) return;
    try {
      adminSettingsStorage?.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify({
        version: 1,
        adminModeEnabled: state.adminModeEnabled,
        invincibilityEnabled: state.invincibilityEnabled,
        showPlayerHitbox: state.showPlayerHitbox,
      }));
    } catch {
      // Test controls remain usable for this session when browser storage is unavailable.
    }
  }

  function openAdminSettings() {
    if (!isDesignatedAdmin(state.user) || state.screen !== 'menu') return;
    adminTriggerElement = root.querySelector('[data-admin-settings-trigger]');
    state.adminDialogOpen = true;
    paint();
  }

  function closeAdminSettings() {
    if (!state.adminDialogOpen) return;
    state.adminDialogOpen = false;
    paint();
    root.querySelector('[data-admin-settings-trigger]')?.focus();
    adminTriggerElement = null;
  }

  function setAdminModeEnabled(enabled) {
    if (!isDesignatedAdmin(state.user)) return;
    state.adminModeEnabled = Boolean(enabled);
    persistAdminSettings();
    paint();
  }

  function setInvincibilityEnabled(enabled) {
    if (!isDesignatedAdmin(state.user)) return;
    state.invincibilityEnabled = Boolean(enabled);
    gameEngine.setInvincibilityEnabled?.(state.invincibilityEnabled);
    persistAdminSettings();
    paint();
  }

  function setShowPlayerHitbox(enabled) {
    if (!isDesignatedAdmin(state.user)) return;
    state.showPlayerHitbox = Boolean(enabled);
    persistAdminSettings();
    paint();
  }

  async function refreshSession() {
    try {
      const user = await authService.getSessionUser();
      state.user = user;
      applyAdminSettingsForUser(user);
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
      if(!canSelectAircraft(state.selectedAircraftId,{guestMode:true,bestScore:0}))state.selectedAircraftId = 'default';
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
      if(!canSelectAircraft(state.selectedAircraftId,{guestMode:!state.user,bestScore:0}))state.selectedAircraftId = 'default';
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
    applyAdminSettingsForUser(state.user);
    gameEngine.setGuestMode?.(false);
    state.authActionError = null;
    void loadAccountBestScore(result.user);
    setScreen('menu', 'Microsoft 계정에 로그인했습니다.');
  }

  async function handleSignOut() {
    try {
      await authService.signOut();
      state.user = null;
      state.selectedAircraftId = 'default';
      state.adminModeEnabled = false;
      state.invincibilityEnabled = false;
      state.showPlayerHitbox = false;
      state.adminDialogOpen = false;
      gameEngine.setInvincibilityEnabled?.(false);
      state.adminModeEnabled = false;
      state.invincibilityEnabled = false;
      state.showPlayerHitbox = false;
      state.adminDialogOpen = false;
      gameEngine.setInvincibilityEnabled?.(false);
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
    if (state.snapshot?.challenge?.active || state.snapshot?.deathEffect) return;
    if (gameEngine.lift?.() !== false) audioManager.play('lift');
  }

  function triggerDash() {
    if (state.screen !== 'playing' || state.snapshot?.challenge?.active || state.snapshot?.deathEffect) return;
    if (gameEngine.dash?.()) {
      audioManager.play('dash');
    }
  }

  function triggerFire() {
    if (state.screen !== 'playing' || state.snapshot?.challenge?.active || state.snapshot?.deathEffect) return;
    if (gameEngine.fire?.() === true) {
      state.snapshot = gameEngine.getSnapshot();
      gameHud?.update(state.snapshot);
      const id = state.snapshot.boss?.weapon?.firing?.id;
      audioManager.play('projectileReflect', { id: `${audioRunId}:${id}` });
    }
  }

  function submitChallengeKey(code) {
    if (state.screen !== 'playing' || !['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) return;
    if (!gameEngine.getSnapshot().challenge?.active) return;
    gameEngine.handleChallengeKey?.(code);
    state.snapshot = gameEngine.getSnapshot();
    gameHud?.update(state.snapshot);
    syncCombatAudio(state.snapshot);
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
      audioManager.setMusicMode?.('boss');
      announce(liveRegion, 'BOSS 구간이 시작되었습니다. 속도 변화와 특수 벽에 주의하세요.');
    } else if (previousMode === 'boss') {
      audioManager.setMusicMode?.('gameplay');
    }
  }

  function syncCombatAudio(snapshot) {
    if (snapshot?.deathEffect) {
      const id = `${audioRunId}:death`;
      if (lastDeathEffectId !== id) {
        lastDeathEffectId = id;
        audioManager.setMusicMode?.('none');
        audioManager.play('collision', { id });
      }
      return;
    }
    const roar = snapshot?.boss?.roar;
    if (roar?.id && roar.id !== lastRoarId) {
      lastRoarId = roar.id;
      audioManager.play('bossRoar', { id: `${audioRunId}:${roar.id}`, stageId: snapshot.boss.stageId });
    } else if (!roar) lastRoarId = null;
    const previewId = snapshot?.bossPreview?.warningIndex ?? null;
    if (previewId !== lastBossPreviewId) {
      lastBossPreviewId = previewId;
      audioManager.setMusicDucked?.(previewId !== null);
      if (previewId !== null) audioManager.play('bossEntry', { id: `${audioRunId}:${previewId}` });
    }
    const stageId = snapshot?.stage?.id ?? null;
    if (stageId !== lastStageId) {
      lastStageId = stageId;
      audioManager.setMusicScene?.(stageId);
    }

    const attack = snapshot?.boss?.attack ?? snapshot?.ambientAttack;
    if (!attack) {
      lastAttackId = null;
      lastAttackPhase = null;
    } else {
      if (attack.id !== lastAttackId) {
        lastAttackId = attack.id;
        lastAttackPhase = null;
      }
      if ((attack.type === 'projectile' || attack.type === 'volley') && attack.state === 'charging' && lastAttackPhase !== 'charging') {
        audioManager.play('bossCharge', { id: `${audioRunId}:${attack.id}` });
        lastAttackPhase = 'charging';
      } else if (attack.type === 'projectile' && attack.state === 'returning' && lastAttackPhase !== 'returning') {
        audioManager.play('projectileReflect', { id: `${audioRunId}:${attack.id}` });
        lastAttackPhase = 'returning';
      } else if (attack.type === 'laser' && attack.telegraphRemainingSeconds > 0 && lastAttackPhase !== 'telegraph') {
        audioManager.play('laserTelegraph', { id: `${audioRunId}:${attack.id}` });
        lastAttackPhase = 'telegraph';
      }
    }

    const boss = snapshot?.boss;
    if (boss) {
      const bossKey = String(boss.number ?? 'boss');
      const previous = previousBoss?.key === bossKey ? previousBoss.hp : boss.maxHp;
      if (Number.isFinite(previous) && Number.isFinite(boss.hp) && boss.hp < previous) {
        audioManager.play('bossHit', { id: `${audioRunId}:${bossKey}:${boss.hp}` });
      }
      previousBoss = { key: bossKey, hp: boss.hp };
    } else {
      previousBoss = null;
    }

    const challenge = snapshot?.challenge;
    if (challenge?.active && !previousChallengeActive) challengeRunId += 1;
    if (challenge?.active && challenge.wrongKeyEventId > 0) {
      const eventId = `${audioRunId}:challenge-${challengeRunId}:wrong-${challenge.wrongKeyEventId}`;
      if (lastWrongChallengeEvent !== eventId) {
        lastWrongChallengeEvent = eventId;
        audioManager.play('challengeWrongKey', { id: eventId });
      }
    }
    if (challenge && !challenge.active && previousChallengeActive) {
      const challengeId = `${audioRunId}:challenge-${challengeRunId}`;
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
    finishedTiming??=playTracker?.finish('dead')??null;
    state.leaderboard = null;
    state.submitError = false;
    state.submitErrorMessage = null;
    state.submitState = 'idle';
    finishedRun=Object.freeze({...activeRun,runId:activeRun?.runId??String(++runSequence),score:state.snapshot?.finalScore??state.snapshot?.score??0,aircraftId:state.snapshot?.aircraft?.id??'default',durationMs:finishedTiming?.durationMs??0});
    blockedRestartKeys.clear();for(const code of physicalKeys)blockedRestartKeys.add(code);
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
    if(state.snapshot.deathEffect||state.snapshot.state==='game-over')finishedTiming??=playTracker?.finish('dead')??null;
    renderer.render(state.snapshot, { showPlayerHitbox: Boolean(isDesignatedAdmin(state.user)
      && state.adminModeEnabled && state.showPlayerHitbox) });
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
    finishedTiming=null;
    spaceHeld=false;arrowUpDown=false;fireHeld.clear();finishedRun=null;
    activeRun=Object.freeze({runId:String(++runSequence),user:state.user?structuredClone(state.user):null,userId:state.user?.id??null,adminRun:Boolean(isDesignatedAdmin(state.user)&&state.adminModeEnabled)});
    const prepareMusic = typeof audioManager.prepareGameplay === 'function';
    state.snapshot = null;
    lastDifficultyMode = 'normal';
    audioRunId += 1;
    lastRoarId = null;
    lastDeathEffectId = null;
    lastBossPreviewId = null;
    audioManager.resetRun?.();
    gameEngine.setGuestMode?.(!state.user);
    gameEngine.setInvincibilityEnabled?.(isDesignatedAdmin(state.user) && state.invincibilityEnabled);
    gameEngine.setAccountBestScore?.(state.accountBestScore);
    gameEngine.setAircraft?.(state.selectedAircraftId);
    gameEngine.start({aircraftId:state.selectedAircraftId,guestMode:!state.user,accountBestScore:state.user?state.accountBestScore:0,
      ...(prepareMusic ? { deferStart: true } : {})});
    state.snapshot = gameEngine.getSnapshot();
    lastStageId = state.snapshot?.stage?.id ?? null;
    if (prepareMusic) {
      stopLoop();
      renderer.render(state.snapshot);
      setScreen('preparing', '스테이지 음악을 준비하고 있습니다.');
      const request = { sceneId: lastStageId, timer: null };
      pendingStart = request;
      request.timer = globalThis.setTimeout(() => activatePreparedStart(request), GAMEPLAY_MUSIC_WAIT_MS);
      try {
        Promise.resolve(audioManager.prepareGameplay(lastStageId)).then((ready) => {
          if (ready) activatePreparedStart(request);
        }).catch(() => { /* The10s gate still guarantees departure after failure. */ });
      } catch { /* Unsupported/failed audio must not strand the player. */ }
      return;
    }
    if (lastStageId) audioManager.setMusicScene?.(lastStageId);
    audioManager.setMusicMode?.('gameplay');
    Promise.resolve(audioManager.unlock?.()).catch(() => {});
    finishDeparture();
  }

  function cancelPendingStart() {
    if (!pendingStart) return;
    globalThis.clearTimeout(pendingStart.timer);
    pendingStart = null;
    audioManager.resetRun?.();
    gameEngine.stop?.('preparation-cancelled');
  }

  function activatePreparedStart(request) {
    if (!mounted || pendingStart !== request || state.screen !== 'preparing') return;
    if(orientationWasBlocking){request.ready=true;return;}
    globalThis.clearTimeout(request.timer);
    pendingStart = null;
    if (gameEngine.beginPreparedRun?.() === false) {
      audioManager.resetRun?.(); setScreen('menu'); return;
    }
    state.snapshot = gameEngine.getSnapshot();
    try { audioManager.startPreparedGameplay?.(request.sceneId); }
    catch { /* Optional audio cannot prevent an already prepared game starting. */ }
    finishDeparture();
  }

  function finishDeparture() {
    if(playTracker&&!activeRun?.statsStarted){
      let statsRunId=null;
      try{statsRunId=playTracker.begin({ownerUserId:activeRun?.userId??null,version:releases.currentVersion,aircraftId:state.snapshot?.aircraft?.id??state.selectedAircraftId,isAdminTest:activeRun?.adminRun??false});}
      catch{/* Optional record creation must never strand the preparing screen. */}
      activeRun=Object.freeze({...activeRun,statsRunId,statsStarted:true});
    }
    spaceHeld = false; fireHeld.clear();
    lastAttackId = null;
    lastAttackPhase = null;
    previousBoss = null;
    previousChallengeActive = false;
    syncCombatAudio(state.snapshot);
    setScreen('playing', '게임 시작. 클릭 또는 터치로 상승하세요.');
    stopLoop();
    animationFrame = globalThis.requestAnimationFrame(renderFrame);
  }

  async function queueRunScore(run,{retry=true}={}){
    let job=scoreSaveJobs.get(run.runId);
    if(job?.state==='saving')return job.promise;
    if(job?.state==='saved'||(job?.state==='error'&&!retry))return job.result;
    job={run,state:'saving',promise:null,result:null};scoreSaveJobs.set(run.runId,job);
    job.promise=(async()=>{
      let result;try{if(state.user?.id!==run.userId)throw Object.assign(new Error('Account changed before score submission'),{code:'SESSION_CHANGED'});result=await leaderboardService.submitBestScore(run.user,{score:run.score,displayName:getDisplayName(run.user),aircraftId:run.aircraftId,durationMs:run.durationMs});}catch(error){result={error};}
      if(!isValidScoreSubmission(result,run.score,run.userId)&&!result?.error)result={error:new Error('Invalid score submission response')};
      job.result=result;job.state=result?.error?'error':'saved';
      const complete=[...scoreSaveJobs.entries()].filter(([,j])=>j.state!=='saving');for(const [id]of complete.slice(0,Math.max(0,complete.length-20)))scoreSaveJobs.delete(id);
      return result;
    })();return job.promise;
  }

  async function loadGameOverData({ submitScore = true } = {}) {
    const run=finishedRun;if(!run)return;
    const requestId = ++state.gameOverRequest;
    const {score,aircraftId,adminRun}=run;
    const shouldSubmitScore=Boolean(run.user&&!adminRun);
    const isCurrent=()=>requestId===state.gameOverRequest&&finishedRun?.runId===run.runId
      &&(state.user?.id??null)===run.userId
      &&(state.screen==='game-over'||(state.screen==='pilot-ranking'&&state.rankingReturnScreen==='game-over'));
    const paintResult=()=>{if(state.screen==='game-over')paint();};
    state.leaderboard = {
      top: { loading: true }, neighborhood: { loading: true },
    };
    state.submitError = false;
    if (adminRun) {
      state.submitState = 'admin-skipped';
      state.submitErrorMessage = '관리자 테스트 점수는 리더보드에 저장되지 않습니다.';
    }
    if (shouldSubmitScore) {
      state.submitState = 'saving';
      state.submitErrorMessage = null;
    }
    paint();

    let submitResult = null;
    if (shouldSubmitScore) {
      try {
        submitResult = await queueRunScore(run,{retry:submitScore});
      } catch (error) {
        submitResult = { error };
      }
      if(!isCurrent())return;
      if (isValidScoreSubmission(submitResult, score, run.userId)) state.submitState = 'saved';
      else {
        submitResult = submitResult?.error
          ? submitResult
          : { ...submitResult, error: new Error('Invalid score submission response') };
        state.submitState = 'error';
        state.submitErrorMessage = submitResult.error?.code === 'SCHEMA_MISSING'
          ? submitResult.error.message
          : submitResult.error?.code
            ? submitResult.error.message
            : '점수를 저장하지 못했습니다. 로그인 및 연결 상태를 확인해 주세요.';
      }
    }

    if(!isCurrent())return;
    state.submitError = shouldSubmitScore
      ? !isValidScoreSubmission(submitResult, score, run.userId)
      : state.submitState === 'error';
    state.leaderboard.submitError = state.submitError;
    paintResult();
    const loadList=async(key,read)=>{
      let result;
      try{result=await read();}catch(error){result={rows:[],error};}
      if(!isCurrent())return;
      state.leaderboard={...state.leaderboard,[key]:{rows:result?.rows??[],error:result?.error??null}};
      paintResult();
    };
    await Promise.all([
      loadList('top',()=>leaderboardService.fetchTopScores()),
      loadList('neighborhood',()=>run.user?leaderboardService.fetchPlayerNeighborhood():Promise.resolve({rows:[],error:null})),
    ]);
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
      state.rankingPersonalRecord = null;
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
    if(orientationWasBlocking&&type!=='RETURN_TO_MENU')return;
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
          && canSelectAircraft(event.aircraftId,{guestMode:!state.user,bestScore:state.accountBestScore})) {
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
        if (state.screen === 'playing' && !state.snapshot?.challenge?.active && !state.snapshot?.deathEffect) {
          state.snapshot = gameEngine.pause();
          playTracker?.suspend('manual');
          audioManager.pauseMusic?.();
          audioManager.play('pause');
          setScreen('paused', '게임을 일시정지했습니다. 10점이 차감되었습니다.');
        }
        break;
      case 'RESUME':
        if (state.screen === 'paused') {
          gameEngine.resume();
          playTracker?.resume('manual');
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
    if(orientationWasBlocking){event.preventDefault();if(orientationState.resumePending&&!event.repeat&&['Space','Enter'].includes(event.code))orientationController.confirmResume();return;}
    const wasHeld=physicalKeys.has(event.code);physicalKeys.add(event.code);
    if(state.screen==='game-over'){event.preventDefault();if(event.repeat||wasHeld||blockedRestartKeys.has(event.code))return;dispatch(event.code==='Escape'?'RETURN_TO_MENU':'RESTART_IMMEDIATE');return;}
    if (state.screen === 'preparing') {
      if (event.code === 'Escape') { event.preventDefault(); dispatch('RETURN_TO_MENU'); }
      return;
    }
    const isFireKey = fireKeys.has(event.code);
    const repeatedFire = isFireKey && (fireHeld.size > 0 || event.repeat);
    if (isFireKey) fireHeld.add(event.code);
    if (event.code === 'Space') {
      const repeated = spaceHeld || event.repeat;
      spaceHeld = true;
      if (repeated) { if (state.screen === 'playing') event.preventDefault(); return; }
    }
    if (state.adminDialogOpen) {
      const dialog = root.querySelector('[role="dialog"]');
      const focusable = [...(dialog?.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])') ?? [])]
        .filter((element) => !element.disabled);
      if (event.code === 'Escape') {
        event.preventDefault();
        closeAdminSettings();
        return;
      }
      if (event.key === 'Tab' && focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
    }
    if(!['playing','game-over','preparing'].includes(state.screen)&&menuNavigation.handleKey(event))return;
    if (event.target?.closest?.('input, select, textarea, [contenteditable="true"]')) return;
    if (isFireKey && state.screen === 'playing') {
      event.preventDefault();
      if (!repeatedFire) triggerFire();
      return;
    }
    if (state.screen === 'playing' && state.snapshot?.challenge?.active) {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault();
        if (!event.repeat) submitChallengeKey(event.code);
      } else if (event.code === 'Space') {
        event.preventDefault();
      }
      return;
    }
    // Handle the mobile dash button's keyboard press ourselves: native Space
    // clicks on keyup would otherwise queue a dash across the cooldown boundary.
    if(event.code==='ArrowUp'&&state.screen==='playing'){
      event.preventDefault();if(!arrowUpDown&&!event.repeat){arrowUpDown=true;triggerLift();}return;
    }
    if (event.target?.closest?.('button, a') && !event.target?.closest?.('.mobile-space-button')) return;
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
    void playTracker?.flush();
    globalThis.window?.addEventListener('pagehide',handlePageHide);
    globalThis.window?.addEventListener('pageshow',handlePageShow);
    audioGestureReady = false;
    for (const type of audioGestureEvents) globalThis.window?.addEventListener(type, handleAudioGesture, true);
    clearLegacyGuestRecord(deps.guestRecordStorage);
    paint();
    if (globalThis.document?.readyState === 'complete') tryStartupAudio();
    else globalThis.window?.addEventListener('load', tryStartupAudio, { once: true });
    pointerTarget = deps.canvas ?? root.querySelector('canvas');
    handlePointerDown = (event) => {
      if(!orientationWasBlocking&&state.screen==='game-over'){event.preventDefault?.();dispatch('RESTART_IMMEDIATE');return;}
      if (orientationWasBlocking || state.screen !== 'playing') return;
      event.preventDefault?.();
      triggerLift();
    };
    pointerTarget?.addEventListener('pointerdown', handlePointerDown);
    globalThis.window?.addEventListener('keydown', handleKeyDown);
    globalThis.window?.addEventListener('keyup', handleKeyUp);
    globalThis.window?.addEventListener('blur', handleBlur);
    try {
      unsubscribeAuth = authService.subscribeToAuth((user) => {
        queueMicrotask(()=>{if(mounted)void playTracker?.flush();});
        if (!user) {
          accountRequestId += 1;
          state.user = null;
      state.selectedAircraftId = 'default';
          state.adminModeEnabled = false;
          state.invincibilityEnabled = false;
          state.showPlayerHitbox = false;
          state.adminDialogOpen = false;
          gameEngine.setInvincibilityEnabled?.(false);
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
          if (changedUser) {
            if (state.screen === 'preparing') setScreen('menu');
            applyAdminSettingsForUser(user);
          }
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
    playTracker?.destroy();
    globalThis.window?.removeEventListener('pagehide',handlePageHide);
    globalThis.window?.removeEventListener('pageshow',handlePageShow);
    menuNavigation.destroy();
    menuLayout.destroy();orientationController.destroy();orientationHost.remove();root.inert=false;gameEngine.setSuspended?.('orientation',false);
    cancelPendingStart();
    removeAudioGestureListeners();
    globalThis.window?.removeEventListener('load', tryStartupAudio);
    stopLoop();
    rankingObserver?.disconnect();
    rankingObserver = null;
    pointerTarget?.removeEventListener('pointerdown', handlePointerDown);
    pointerTarget = null;
    handlePointerDown = null;
    globalThis.window?.removeEventListener('keydown', handleKeyDown);
    globalThis.window?.removeEventListener('keyup', handleKeyUp);
    globalThis.window?.removeEventListener('blur', handleBlur);
    unsubscribeAuth?.();
    renderer.destroy?.();
    audioManager.destroy?.();
    if (ownsLiveRegion) liveRegion.remove();
  }

  function handlePageHide(event){if(event.persisted){playTracker?.suspend('bfcache');gameEngine.setSuspended?.('bfcache',true);stopLoop();audioManager.pauseMusic?.();}else playTracker?.finish('abandoned');void playTracker?.flush();}
  function handlePageShow(event){if(!event.persisted)return;playTracker?.resume('bfcache');gameEngine.setSuspended?.('bfcache',false);if(state.screen==='playing'&&!orientationWasBlocking){audioManager.resumeMusic?.();stopLoop();animationFrame=globalThis.requestAnimationFrame(renderFrame);}void playTracker?.flush();}
  orientationController=createOrientationController({isMobile:deps.orientationIsMobile,getScreen:()=>state.screen,onChange:syncOrientation});
  return { mount, destroy, dispatch };
}
