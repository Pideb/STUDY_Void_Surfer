import './styles.css';
import { createApp } from './app/create-app.js';
import { createSupabaseClientFromEnv } from './lib/supabase-client.js';
import { completeOAuthPopup } from './auth/oauth-popup.js';
import { createAudioManager } from './audio/audio-manager.js';
import { createGameEngine } from './game/game-engine.js';
import { createRenderer } from './game/renderer.js';
import { getSessionUser, signInWithMicrosoft, signOut, subscribeToAuth } from './services/auth-service.js';
import {
  fetchPlayerBestScore, fetchPlayerNeighborhood, fetchTopScores, submitBestScore,
} from './services/leaderboard-service.js';
import { createAppController } from './ui/app-controller.js';

if (window.location.pathname === '/auth/callback') {
  const status = document.querySelector('#auth-callback-status');
  try {
    const client = createSupabaseClientFromEnv();
    await completeOAuthPopup(client);
  } catch {
    if (status) {
      status.hidden = false;
      status.textContent = '로그인을 완료하지 못했습니다. 이 창을 닫고 다시 시도해 주세요.';
    }
  }
} else {
  const root = document.querySelector('#app');

  if (!root) {
    throw new Error('VOID SURFER 앱 마운트 지점을 찾을 수 없습니다.');
  }

  const { canvas, uiRoot, liveRegion } = createApp(root);
  canvas.tabIndex = 0;
  let client = null;
  let configError = null;
  try {
    client = createSupabaseClientFromEnv();
  } catch (error) {
    configError = error;
  }

  const authService = client ? {
    getSessionUser: () => getSessionUser(client),
    subscribeToAuth: (callback) => subscribeToAuth(client, callback),
    signInWithMicrosoft: () => signInWithMicrosoft(client),
    signOut: () => signOut(client),
  } : {
    async getSessionUser() { throw configError; },
    subscribeToAuth() { return () => {}; },
    async signInWithMicrosoft() { return { user: null, error: configError }; },
    async signOut() { throw configError; },
  };

  const leaderboardService = client ? {
    submitBestScore: (_user, payload) => submitBestScore(client, payload),
    fetchPlayerBestScore: () => fetchPlayerBestScore(client),
    fetchTopScores: () => fetchTopScores(client),
    fetchPlayerNeighborhood: () => fetchPlayerNeighborhood(client),
  } : {
    async submitBestScore() { return { updated: false, record: null, error: configError }; },
    async fetchPlayerBestScore() { return { bestScore: 0, error: configError }; },
    async fetchTopScores() { return { rows: [], error: configError }; },
    async fetchPlayerNeighborhood() { return { rows: [], error: configError }; },
  };

  const controller = createAppController({
    authService,
    leaderboardService,
    gameEngine: createGameEngine(),
    renderer: createRenderer(canvas),
    audioManager: createAudioManager(),
    root: uiRoot,
    liveRegion,
    canvas,
  });
  controller.mount();
}
