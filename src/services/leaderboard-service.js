import { createValidationError, mapLeaderboardError } from './leaderboard-errors.js';
import { normalizeLeaderboardRows, normalizeScoreRecord } from './leaderboard-types.js';
import { AIRCRAFT_CATALOG } from '../game/aircraft.js';

const DEFAULT_TOP_LIMIT = 10;
const MAX_TOP_LIMIT = 50;
const DEFAULT_NEIGHBORHOOD_RADIUS = 2;
const MAX_NEIGHBORHOOD_RADIUS = 10;

function clampInteger(value, fallback, minimum, maximum) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(numeric)));
}

function validateSubmission({ score, displayName, aircraftId }) {
  if (!Number.isInteger(score) || score < 0) {
    return createValidationError('점수는 0 이상의 정수여야 합니다.');
  }

  if (typeof displayName !== 'string' || !displayName.trim()) {
    return createValidationError('표시 이름을 확인할 수 없습니다.');
  }

  if (!AIRCRAFT_CATALOG.some(({ id }) => id === aircraftId)) {
    return createValidationError('선택한 기체 정보를 확인할 수 없습니다.');
  }

  return null;
}

function isMissingAircraftScoreRpc(error) {
  const code = String(error?.code ?? '').toUpperCase();
  if (code === 'PGRST202' || code === '42883') return true;

  const message = typeof error?.message === 'string' ? error.message : '';
  return /could not find (?:the )?function.*submit_score|function .*submit_score.*does not exist|submit_score.*not found/i.test(message);
}

function isMissingBestScoreRpc(error) {
  const code = String(error?.code ?? '').toUpperCase();
  if (code === 'PGRST202' || code === '42883') return true;
  const message = typeof error?.message === 'string' ? error.message : '';
  return /could not find (?:the )?function.*get_player_best_score|function .*get_player_best_score.*does not exist/i.test(message);
}

async function getCurrentUserId(client) {
  try {
    const { data, error } = await client.auth.getSession();
    if (error) return null;
    return data?.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function submitBestScore(client, { score, displayName, aircraftId = 'default' } = {}) {
  const validationError = validateSubmission({ score, displayName, aircraftId });
  if (validationError) {
    return { updated: false, record: null, error: validationError };
  }

  try {
    let { data, error } = await client.rpc('submit_score', {
      p_score: score,
      p_display_name: displayName.trim(),
      p_aircraft_id: aircraftId,
    });

    if (error && isMissingAircraftScoreRpc(error)) {
      ({ data, error } = await client.rpc('submit_score', {
        p_score: score,
        p_display_name: displayName.trim(),
      }));
    }

    if (error) {
      return { updated: false, record: null, error: mapLeaderboardError(error) };
    }

    const record = normalizeScoreRecord(data);
    if (!record) {
      return {
        updated: false,
        record: null,
        error: mapLeaderboardError(new Error('Malformed score response')),
      };
    }

    return {
      updated: record.bestScore === score,
      record,
      error: null,
    };
  } catch (error) {
    return { updated: false, record: null, error: mapLeaderboardError(error) };
  }
}

export async function fetchTopScores(client, limit = DEFAULT_TOP_LIMIT) {
  const safeLimit = clampInteger(limit, DEFAULT_TOP_LIMIT, 1, MAX_TOP_LIMIT);

  try {
    const { data, error } = await client.rpc('get_leaderboard', { p_limit: safeLimit });
    if (error) return { rows: [], error: mapLeaderboardError(error) };

    const currentUserId = await getCurrentUserId(client);
    return { rows: normalizeLeaderboardRows(data, currentUserId), error: null };
  } catch (error) {
    return { rows: [], error: mapLeaderboardError(error) };
  }
}

export async function fetchPlayerNeighborhood(client, radius = DEFAULT_NEIGHBORHOOD_RADIUS) {
  const safeRadius = clampInteger(radius, DEFAULT_NEIGHBORHOOD_RADIUS, 0, MAX_NEIGHBORHOOD_RADIUS);

  try {
    const { data, error } = await client.rpc('get_player_neighborhood', { p_radius: safeRadius });
    if (error) return { rows: [], error: mapLeaderboardError(error) };

    const currentUserId = await getCurrentUserId(client);
    return { rows: normalizeLeaderboardRows(data, currentUserId), error: null };
  } catch (error) {
    return { rows: [], error: mapLeaderboardError(error) };
  }
}

export async function fetchPlayerBestScore(client) {
  try {
    const { data, error } = await client.rpc('get_player_best_score');
    if (error && !isMissingBestScoreRpc(error)) return { bestScore: 0, error: mapLeaderboardError(error) };

    if (error) {
      const userId = await getCurrentUserId(client);
      if (!userId) {
        return { bestScore: 0, error: mapLeaderboardError({ code: '42501' }) };
      }
      const fallback = await client.from('player_scores')
        .select('best_score')
        .eq('user_id', userId)
        .maybeSingle();
      if (fallback.error) return { bestScore: 0, error: mapLeaderboardError(fallback.error) };

      const fallbackScore = fallback.data?.best_score ?? 0;
      const bestScore = Number(fallbackScore);
      if (!Number.isInteger(bestScore) || bestScore < 0) {
        return { bestScore: 0, error: mapLeaderboardError(new Error('Malformed best score response')) };
      }
      return { bestScore, error: null };
    }

    const row = Array.isArray(data) ? data[0] : data;
    const rawScore = row && typeof row === 'object'
      ? row.best_score ?? row.bestScore ?? row.score
      : row;
    const bestScore = Number(rawScore);
    if (rawScore === null || rawScore === undefined || !Number.isInteger(bestScore) || bestScore < 0) {
      return { bestScore: 0, error: mapLeaderboardError(new Error('Malformed best score response')) };
    }

    return { bestScore: Math.trunc(bestScore), error: null };
  } catch (error) {
    return { bestScore: 0, error: mapLeaderboardError(error) };
  }
}

export { normalizeLeaderboardRows };
