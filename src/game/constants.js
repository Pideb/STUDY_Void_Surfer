export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;

export const PLAYER_START_X = 240;
export const PLAYER_START_Y = WORLD_HEIGHT / 2;
export const PLAYER_WIDTH = 36;
export const PLAYER_HEIGHT = 24;

export const GRAVITY = 900;
export const LIFT_VELOCITY = 360;
export const MAX_FRAME_DELTA_SECONDS = 0.1;
export const PAUSE_SCORE_PENALTY = 10;

export const BASE_SCROLL_SPEED = 240;
export const SPEED_STEP_SECONDS = 20;
export const SPEED_STEP_MULTIPLIER = 1.1;
export const OBSTACLE_WIDTH = 72;
export const BASE_GAP_HEIGHT = 180;
export const WARNING_GAP_MULTIPLIER = 0.75;
export const SPECIAL_UNLOCK_SCORE = 10;
export const WARNING_START_SCORE = 20;
export const WARNING_SCORE_STEP = 10;
export const NORMAL_SPECIAL_CHANCE = 0.2;
export const WARNING_SPECIAL_CHANCE = 0.5;
export const NORMAL_TIMING_WINDOW_SECONDS = 0.5;
export const WARNING_TIMING_WINDOW_SECONDS = 0.25;
export const DASH_DURATION_SECONDS = 0.6;
export const BOSS_SLOW_MULTIPLIER = 0.5;
export const BOSS_FAST_MULTIPLIER = 1.8;

export const BOSS_PATTERNS = Object.freeze({
  SLOW: 'slow',
  FAST: 'fast',
  SHIFT: 'shift',
});
