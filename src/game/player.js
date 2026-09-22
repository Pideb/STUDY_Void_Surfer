import {
  GRAVITY,
  LIFT_VELOCITY,
  PLAYER_HEIGHT,
  PLAYER_START_X,
  PLAYER_START_Y,
  PLAYER_WIDTH,
} from './constants.js';

export function createPlayer() {
  return {
    x: PLAYER_START_X,
    y: PLAYER_START_Y,
    velocityY: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    isDashing: false,
    dashRemainingSeconds: 0,
    dashTargetId: null,
    dashKind: 'none',
  };
}

export function applyLift(player) {
  player.velocityY = -LIFT_VELOCITY;
}

export function updatePlayer(player, deltaSeconds, gravity = GRAVITY) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    return;
  }

  player.velocityY += gravity * deltaSeconds;
  player.y += player.velocityY * deltaSeconds;
}

export function isOutOfBounds(player, worldHeight) {
  const halfHeight = player.height / 2;
  return player.y - halfHeight <= 0 || player.y + halfHeight >= worldHeight;
}
