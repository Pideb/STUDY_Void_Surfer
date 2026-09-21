import {
  GRAVITY,
  MAX_FRAME_DELTA_SECONDS,
  PAUSE_SCORE_PENALTY,
  WORLD_HEIGHT,
} from './constants.js';
import { createPlayer, isOutOfBounds, updatePlayer } from './player.js';
import { GAME_STATES } from './game-state.js';

export function createGameEngine(deps = {}) {
  const now = deps.now ?? (() => performance.now());
  const gravity = deps.gravity ?? GRAVITY;
  const initialScore = Math.max(0, Math.trunc(deps.initialScore ?? 0));

  let state = GAME_STATES.MENU;
  let player = createPlayer();
  let score = initialScore;
  let elapsedSeconds = 0;
  let lastUpdateMs = null;
  let gameOverReason = null;

  function start() {
    player = createPlayer();
    score = initialScore;
    elapsedSeconds = 0;
    gameOverReason = null;
    lastUpdateMs = now();
    state = GAME_STATES.PLAYING;
  }

  function update(nowMs) {
    if (state !== GAME_STATES.PLAYING || !Number.isFinite(nowMs)) {
      return;
    }

    if (lastUpdateMs === null) {
      lastUpdateMs = nowMs;
      return;
    }

    const rawDelta = Math.max(0, (nowMs - lastUpdateMs) / 1000);
    const deltaSeconds = Math.min(rawDelta, MAX_FRAME_DELTA_SECONDS);
    lastUpdateMs = nowMs;

    updatePlayer(player, deltaSeconds, gravity);
    elapsedSeconds += deltaSeconds;

    if (isOutOfBounds(player, WORLD_HEIGHT)) {
      stop('boundary');
    }
  }

  function pause() {
    if (state !== GAME_STATES.PLAYING) {
      return { score };
    }

    score = Math.max(0, score - PAUSE_SCORE_PENALTY);
    state = GAME_STATES.PAUSED;
    return { score };
  }

  function resume() {
    if (state !== GAME_STATES.PAUSED) {
      return;
    }

    lastUpdateMs = now();
    state = GAME_STATES.PLAYING;
  }

  function stop(reason = 'unknown') {
    if (state === GAME_STATES.GAME_OVER) {
      return;
    }

    gameOverReason = reason;
    state = GAME_STATES.GAME_OVER;
  }

  function getSnapshot() {
    return {
      state,
      score,
      elapsedSeconds,
      gameOverReason,
      player: { ...player },
    };
  }

  return { start, update, pause, resume, stop, getSnapshot };
}
