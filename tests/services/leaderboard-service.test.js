import { describe, expect, it, vi } from 'vitest';
import {
  fetchPlayerNeighborhood,
  fetchPlayerBestScore,
  fetchLeaderboardPage,
  fetchPlayerAircraftRecord,
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

describe('aircraft ranking scope', () => {
  it('routes scoped pagination without filtering away independent bests', async () => {
    const client=makeClient({rpcImpl:vi.fn(async()=>({data:[dbRow({aircraft_id:'aegis'})],error:null}))});
    const result=await fetchLeaderboardPage(client,{aircraftId:'aegis',limit:10,offset:50});
    expect(client.rpc).toHaveBeenCalledWith('get_aircraft_leaderboard',{p_aircraft_id:'aegis',p_limit:10,p_offset:50});
    expect(result.rows[0].aircraftId).toBe('aegis');
    client.rpc.mockClear();expect((await fetchLeaderboardPage(client,{aircraftId:'invalid'})).error).toBeTruthy();expect(client.rpc).not.toHaveBeenCalled();
  });
  it('returns private-field-free personal records, valid empty state and explicit migration errors', async () => {
    const client=makeClient({rpcImpl:vi.fn().mockResolvedValueOnce({data:[dbRow({duration_ms:123})]}).mockResolvedValueOnce({data:[]}).mockResolvedValueOnce({error:{code:'PGRST202'}})});
    const own=await fetchPlayerAircraftRecord(client,'velocity');expect(own.record).toMatchObject({isCurrentUser:true,aircraftId:'velocity'});expect(own.record).not.toHaveProperty('duration_ms');
    expect(await fetchPlayerAircraftRecord(client,'aegis')).toEqual({record:null,error:null});
    expect((await fetchPlayerAircraftRecord(client,'default')).error).toBeTruthy();expect(client.rpc).toHaveBeenCalledTimes(3);
    expect((await fetchPlayerAircraftRecord(client,'invalid')).error).toBeTruthy();expect(client.rpc).toHaveBeenCalledTimes(3);
  });
});

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
      p_duration_ms: 0,
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

  it.each(['guest','missing-auth','expired-session'])('loads game-over TOP10 publicly for %s',async mode=>{
    const row=dbRow();delete row.user_id;
    const client=makeClient({userId:null,rpcImpl:vi.fn(async()=>({data:[row],error:null}))});
    if(mode==='missing-auth')client.auth=undefined;
    if(mode==='expired-session')client.auth.getSession.mockRejectedValue(new Error('JWT expired'));
    const result=await fetchTopScores(client);
    expect(result.error).toBeNull();expect(result.rows).toHaveLength(1);
    expect(client.rpc).toHaveBeenCalledExactlyOnceWith('get_public_leaderboard',{p_limit:10,p_offset:0});
    expect(result.rows[0].userId).toBeNull();
  });

  it('falls back to public TOP10 on a signed-in authentication error without retrying writes',async()=>{
    const client=makeClient({rpcImpl:vi.fn().mockResolvedValueOnce({error:{code:'42501',message:'Authentication is required'}}).mockResolvedValueOnce({data:[dbRow({user_id:undefined})],error:null})});
    const result=await fetchTopScores(client,20);
    expect(result.error).toBeNull();expect(result.rows).toHaveLength(1);
    expect(client.rpc.mock.calls.map(call=>call[0])).toEqual(['get_leaderboard','get_public_leaderboard']);
    expect(client.rpc).toHaveBeenLastCalledWith('get_public_leaderboard',{p_limit:20,p_offset:0});
  });

  it('does not hide schema or network failures behind an authentication fallback',async()=>{
    const client=makeClient({rpcImpl:vi.fn(async()=>({error:{code:'PGRST202'}}))});
    expect((await fetchTopScores(client)).error.code).toBe('SCHEMA_MISSING');expect(client.rpc).toHaveBeenCalledOnce();
  });

  it('loads a public leaderboard page without authentication or private user IDs', async () => {
    const client = makeClient({
      rpcImpl: vi.fn(async () => ({
        data: [{
          rank: 4,
          display_name: 'Guest-visible pilot',
          best_score: 57,
          achieved_at: '2026-09-30T00:00:00.000Z',
          aircraft_id: 'aegis',
        }],
        error: null,
      })),
    });
    client.auth = undefined;

    const result = await fetchLeaderboardPage(client, { limit: 20, offset: 30 });

    expect(client.rpc).toHaveBeenCalledWith('get_public_leaderboard', { p_limit: 20, p_offset: 30 });
    expect(result).toEqual({
      rows: [{
        rank: 4,
        userId: null,
        displayName: 'Guest-visible pilot',
        bestScore: 57,
        achievedAt: '2026-09-30T00:00:00.000Z',
        aircraftId: 'aegis',
        isCurrentUser: false,
      }],
      error: null,
    });
  });

  it('clamps public leaderboard page size and offset to the RPC limits', async () => {
    const client = makeClient();
    await fetchLeaderboardPage(client, { limit: 500, offset: -10 });
    expect(client.rpc).toHaveBeenCalledWith('get_public_leaderboard', { p_limit: 50, p_offset: 0 });
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

  it('normalizes public rows without requiring private user identifiers', () => {
    expect(normalizeLeaderboardRows([{
      rank: 8,
      display_name: 'Public pilot',
      best_score: 19,
      achieved_at: '2026-09-30T00:00:00.000Z',
      aircraft_id: 'default',
    }])).toEqual([{
      rank: 8,
      userId: null,
      displayName: 'Public pilot',
      bestScore: 19,
      achievedAt: '2026-09-30T00:00:00.000Z',
      aircraftId: 'default',
      isCurrentUser: false,
    }]);
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

describe('duration-aware score compatibility',()=>{
 it.each([NaN,Infinity,-1,1.5,604800001,null])('rejects invalid duration%s',async durationMs=>{const c=makeClient();expect((await submitBestScore(c,{score:1,displayName:'Pilot',durationMs})).error.code).toBe('VALIDATION_ERROR');expect(c.rpc).not.toHaveBeenCalled();});
 it('falls back4 to3 to2 only for exact missing-function codes',async()=>{const c=makeClient({rpcImpl:vi.fn().mockResolvedValueOnce({error:{code:'PGRST202'}}).mockResolvedValueOnce({error:{code:'42883'}}).mockResolvedValueOnce({data:dbRow(),error:null})});await submitBestScore(c,{score:25,displayName:'Pilot',aircraftId:'velocity',durationMs:1234});expect(c.rpc.mock.calls.map(([,p])=>Object.keys(p).length)).toEqual([4,3,2]);expect(c.rpc.mock.calls[0][1].p_duration_ms).toBe(1234);});
 it('does not hide a permission error behind a legacy retry',async()=>{const c=makeClient({rpcImpl:vi.fn(async()=>({error:{code:'42501',message:'permission denied'}}))});expect((await submitBestScore(c,{score:25,displayName:'Pilot',durationMs:50})).error.code).toBe('AUTH_REQUIRED');expect(c.rpc).toHaveBeenCalledOnce();});
 it('rejects a changed account before sending its frozen score',async()=>{const c=makeClient({userId:'other'});expect((await submitBestScore(c,{score:25,displayName:'Pilot',expectedUserId:'original'})).error.code).toBe('AUTH_REQUIRED');expect(c.rpc).not.toHaveBeenCalled();});
});
