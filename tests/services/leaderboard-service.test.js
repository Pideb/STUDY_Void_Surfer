import { describe, expect, it, vi } from 'vitest';
import {
  fetchPlayerNeighborhood,
  fetchPlayerBestScore,
  fetchTopScores,
  normalizeLeaderboardRows,
  submitBestScore,
} from '../../src/services/leaderboard-service.js';
import { mapLeaderboardError } from '../../src/services/leaderboard-errors.js';

function makeClient({ rpcImpl, userId = 'player-1' } = {}) {
  return {
    rpc: rpcImpl ?? vi.fn(async () => ({ data: [], error: null })),
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { user: { id: userId } } }, error: null })),
    },
  };
}

function dbRow(overrides = {}) {
  return {
    rank: 1,
    user_id: 'player-1',
    display_name: '<Pilot>',
    best_score: 25,
    achieved_at: '2026-09-22T00:00:00.000Z',
    aircraft_id: 'velocity',
    ...overrides,
  };
}

describe('submitBestScore', () => {
  it('submits only through the score RPC and normalizes the returned record', async () => {
    const client = makeClient({
      rpcImpl: vi.fn(async () => ({
        data: { user_id: 'player-1', best_score: 31, achieved_at: '2026-09-22T01:00:00Z', aircraft_id: 'aegis' },
        error: null,
      })),
    });

    const result = await submitBestScore(client, { score: 31, displayName: '  Pilot  ', aircraftId: 'aegis' });

    expect(result).toEqual({
      updated: true,
      record: { userId: 'player-1', bestScore: 31, achievedAt: '2026-09-22T01:00:00Z', aircraftId: 'aegis' },
      error: null,
    });
    expect(client.rpc).toHaveBeenCalledExactlyOnceWith('submit_score', {
      p_score: 31,
      p_display_name: 'Pilot',
      p_aircraft_id: 'aegis',
    });
  });

  it('reports a lower submitted score as not updated and returns the saved best', async () => {
    const client = makeClient({
      rpcImpl: vi.fn(async () => ({
        data: { user_id: 'player-1', best_score: 40, achieved_at: '2026-09-21T22:00:00Z' },
        error: null,
      })),
    });

    const result = await submitBestScore(client, { score: 12, displayName: 'Pilot' });

    expect(result.updated).toBe(false);
    expect(result.record.bestScore).toBe(40);
    expect(result.error).toBeNull();
  });

  it.each([
    [-1, 'Pilot'],
    [1.5, 'Pilot'],
    [1, '   '],
  ])('rejects invalid submission values before calling RPC', async (score, displayName) => {
    const client = makeClient();
    const result = await submitBestScore(client, { score, displayName });

    expect(result.updated).toBe(false);
    expect(result.record).toBeNull();
    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('rejects unknown aircraft IDs before calling the RPC', async () => {
    const client = makeClient();
    const result = await submitBestScore(client, { score: 1, displayName: 'Pilot', aircraftId: 'admin' });

    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('maps authenticated and network errors into UI-safe service errors', async () => {
    const authClient = makeClient({
      rpcImpl: vi.fn(async () => ({ data: null, error: { code: '42501', message: 'Authentication is required' } })),
    });
    const networkClient = makeClient({ rpcImpl: vi.fn(async () => { throw new TypeError('Failed to fetch'); }) });

    const authResult = await submitBestScore(authClient, { score: 2, displayName: 'Pilot' });
    const networkResult = await submitBestScore(networkClient, { score: 2, displayName: 'Pilot' });

    expect(authResult.error).toMatchObject({ code: 'AUTH_REQUIRED', requiresAuth: true, retryable: false });
    expect(networkResult.error).toMatchObject({ code: 'NETWORK_ERROR', requiresAuth: false, retryable: true });
  });
});

describe('leaderboard queries', () => {
  it('loads the authenticated account best score for aircraft unlocks', async () => {
    const client = makeClient({ rpcImpl: vi.fn(async () => ({ data: { best_score: 50 }, error: null })) });

    await expect(fetchPlayerBestScore(client)).resolves.toEqual({ bestScore: 50, error: null });
    expect(client.rpc).toHaveBeenCalledWith('get_player_best_score');
  });

  it('falls back to the authenticated player_scores row when the best-score RPC is not deployed', async () => {
    const maybeSingle = vi.fn(async () => ({ data: { best_score: 74 }, error: null }));
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const client = makeClient({
      rpcImpl: vi.fn(async () => ({
        data: null,
        error: { code: 'PGRST202', message: 'Could not find the function public.get_player_best_score' },
      })),
    });
    client.from = vi.fn(() => ({ select }));

    await expect(fetchPlayerBestScore(client)).resolves.toEqual({ bestScore: 74, error: null });
    expect(client.from).toHaveBeenCalledExactlyOnceWith('player_scores');
    expect(select).toHaveBeenCalledExactlyOnceWith('best_score');
    expect(eq).toHaveBeenCalledExactlyOnceWith('user_id', 'player-1');
    expect(maybeSingle).toHaveBeenCalledOnce();
  });

  it('returns zero when the authenticated player has no score row in the fallback table', async () => {
    const client = makeClient({
      rpcImpl: vi.fn(async () => ({ data: null, error: { code: 'PGRST202' } })),
    });
    client.from = vi.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
    }));

    await expect(fetchPlayerBestScore(client)).resolves.toEqual({ bestScore: 0, error: null });
  });

  it('does not use the table fallback for unrelated RPC errors', async () => {
    const client = makeClient({
      rpcImpl: vi.fn(async () => ({ data: null, error: { code: '42501', message: 'permission denied' } })),
    });
    client.from = vi.fn();

    const result = await fetchPlayerBestScore(client);

    expect(result).toMatchObject({ bestScore: 0, error: { code: 'AUTH_REQUIRED' } });
    expect(client.from).not.toHaveBeenCalled();
  });

  it('reports a query error from the fallback table instead of silently returning zero', async () => {
    const client = makeClient({
      rpcImpl: vi.fn(async () => ({ data: null, error: { code: 'PGRST202' } })),
    });
    client.from = vi.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: '42501' } }) }) }),
    }));

    const result = await fetchPlayerBestScore(client);

    expect(result).toMatchObject({ bestScore: 0, error: { code: 'AUTH_REQUIRED' } });
  });

  it.each([
    [0, 0],
    [[{ best_score: 64 }], 64],
  ])('normalizes valid scalar or one-row best-score responses', async (data, bestScore) => {
    const client = makeClient({ rpcImpl: vi.fn(async () => ({ data, error: null })) });
    await expect(fetchPlayerBestScore(client)).resolves.toEqual({ bestScore, error: null });
  });

  it.each([null, [], { best_score: null }, { best_score: 1.5 }])(
    'rejects malformed best-score payloads instead of silently unlocking aircraft', async (data) => {
      const client = makeClient({ rpcImpl: vi.fn(async () => ({ data, error: null })) });
      const result = await fetchPlayerBestScore(client);
      expect(result.bestScore).toBe(0);
      expect(result.error).toMatchObject({ code: 'DATABASE_ERROR' });
    },
  );

  it('clamps top-list limits, marks the current user, and preserves server order', async () => {
    const rows = [dbRow({ rank: 4, user_id: 'other', display_name: 'Other' }), dbRow({ rank: 7 })];
    const client = makeClient({ rpcImpl: vi.fn(async () => ({ data: rows, error: null })) });

    const result = await fetchTopScores(client, 99);

    expect(client.rpc).toHaveBeenCalledWith('get_leaderboard', { p_limit: 50 });
    expect(result.rows.map((row) => row.rank)).toEqual([4, 7]);
    expect(result.rows[0].isCurrentUser).toBe(false);
    expect(result.rows[1].isCurrentUser).toBe(true);
    expect(result.rows[1].displayName).toBe('<Pilot>');
  });

  it('returns an empty list for an empty top leaderboard', async () => {
    const result = await fetchTopScores(makeClient(), 0);
    expect(result).toEqual({ rows: [], error: null });
  });

  it('loads a player neighborhood with the default radius and handles a single-row response', async () => {
    const client = makeClient({ rpcImpl: vi.fn(async () => ({ data: [dbRow()], error: null })) });

    const result = await fetchPlayerNeighborhood(client);

    expect(client.rpc).toHaveBeenCalledWith('get_player_neighborhood', { p_radius: 2 });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].isCurrentUser).toBe(true);
  });

  it('clamps neighborhood radius and returns retryable query errors', async () => {
    const client = makeClient({ rpcImpl: vi.fn(async () => ({ data: null, error: { message: 'database unavailable', status: 503 } })) });

    const result = await fetchPlayerNeighborhood(client, 100);

    expect(client.rpc).toHaveBeenCalledWith('get_player_neighborhood', { p_radius: 10 });
    expect(result.rows).toEqual([]);
    expect(result.error).toMatchObject({ code: 'NETWORK_ERROR', retryable: true });
  });
});

describe('leaderboard row normalization and error mapping', () => {
  it('skips malformed rows and keeps display names as plain text values', () => {
    expect(normalizeLeaderboardRows([dbRow(), { rank: 'bad' }, null], 'player-1')).toEqual([
      {
        rank: 1,
        userId: 'player-1',
        displayName: '<Pilot>',
        bestScore: 25,
        achievedAt: '2026-09-22T00:00:00.000Z',
        aircraftId: 'velocity',
        isCurrentUser: true,
      },
    ]);
  });

  it('defaults missing or unknown legacy aircraft IDs to the basic ship', () => {
    expect(normalizeLeaderboardRows([
      dbRow({ aircraft_id: null }),
      dbRow({ aircraft_id: 'untrusted-value' }),
    ]).map((row) => row.aircraftId)).toEqual(['default', 'default']);
  });

  it('maps auth, network, and database errors distinctly', () => {
    expect(mapLeaderboardError({ status: 401 })).toMatchObject({ code: 'AUTH_REQUIRED', requiresAuth: true });
    expect(mapLeaderboardError(new TypeError('fetch failed'))).toMatchObject({ code: 'NETWORK_ERROR', retryable: true });
    expect(mapLeaderboardError({ code: '23514', message: 'check constraint failed' })).toMatchObject({ code: 'DATABASE_ERROR', retryable: false });
    expect(mapLeaderboardError({ code: 'PGRST202', message: 'Could not find the function public.get_player_best_score' }))
      .toMatchObject({ code: 'SCHEMA_MISSING', retryable: false });
  });
});
