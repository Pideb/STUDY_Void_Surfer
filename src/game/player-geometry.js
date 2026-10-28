import { PLAYER_HITBOX_SIZE, PLAYER_SUCCESS_WIDTH, PLAYER_SUCCESS_HEIGHT } from './constants.js';

function centeredBounds(player, width, height) {
  if (!Number.isFinite(player?.x) || !Number.isFinite(player?.y)) return null;
  return { left: player.x - width / 2, right: player.x + width / 2,
    top: player.y - height / 2, bottom: player.y + height / 2 };
}

export function getPlayerBounds(player) {
  return centeredBounds(player, PLAYER_HITBOX_SIZE, PLAYER_HITBOX_SIZE);
}

export function getSpecialSuccessBounds(player) {
  return centeredBounds(player, PLAYER_SUCCESS_WIDTH, PLAYER_SUCCESS_HEIGHT);
}
