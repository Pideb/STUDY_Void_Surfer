import {
  GRAVITY,
  LIFT_VELOCITY,
  PLAYER_HEIGHT,
  PLAYER_START_X,
  PLAYER_START_Y,
  PLAYER_WIDTH,
} from './constants.js';
import { getPlayerBounds } from './player-geometry.js';

export function createPlayer() {
  return {
    x: PLAYER_START_X,
    y: PLAYER_START_Y,
    velocityY: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    isDashing: false,
    dashRemainingSeconds: 0,
    dashCooldownRemainingSeconds: 0,
    dashTargetId: null,
    dashKind: 'none',
  };
}

export function applyLift(player, liftVelocity = LIFT_VELOCITY) {
  const safeLiftVelocity = Number.isFinite(liftVelocity) ? Math.max(0, liftVelocity) : LIFT_VELOCITY;
  player.velocityY = -safeLiftVelocity;
}

export function updatePlayer(player, deltaSeconds, gravity = GRAVITY) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    return;
  }

  player.velocityY += gravity * deltaSeconds;
  player.y += player.velocityY * deltaSeconds;
}

export function isOutOfBounds(player, worldHeight) {
  const bounds = getPlayerBounds(player);
  return !bounds || bounds.top <= 0 || bounds.bottom >= worldHeight;
}
