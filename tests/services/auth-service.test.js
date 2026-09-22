import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSessionUser, signInWithMicrosoft, signOut, subscribeToAuth } from '../../src/services/auth-service.js';

function makeWindow() {
  const listeners = new Set();
  return {
    location: { origin: 'https://void-surfer.example' },
    open: vi.fn(() => ({ closed: false, close: vi.fn() })),
    addEventListener: vi.fn((_type, listener) => listeners.add(listener)),
    removeEventListener: vi.fn((_type, listener) => listeners.delete(listener)),
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
    emitMessage(event) {
      for (const listener of listeners) listener(event);
    },
  };
}

function makeClient(overrides = {}) {
  const user = { id: 'user-1', email: 'pilot@example.com', user_metadata: { full_name: 'Pilot One' } };
  return {
    user,
    auth: {
      signInWithOAuth: vi.fn(async () => ({ data: { url: 'https://login.microsoftonline.com/authorize' }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: { user } }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(async () => ({ error: null })),
      ...overrides.auth,
    },
    rpc: vi.fn(async () => ({ data: { user_id: 'user-1', display_name: 'Pilot One' }, error: null })),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('auth service', () => {
  it('opens Microsoft OAuth in a popup, restores session, and syncs latest name', async () => {
    const client = makeClient();
    const windowRef = makeWindow();
    const popup = windowRef.open.mock.results[0]?.value;

    const resultPromise = signInWithMicrosoft(client, { windowRef, timeoutMs: 1000, pollIntervalMs: 10 });
    await Promise.resolve();
    await Promise.resolve();
    const openedPopup = windowRef.open.mock.results[0].value;
    windowRef.emitMessage({
      origin: windowRef.location.origin,
      source: openedPopup,
      data: { type: 'VOID_SURFER_AUTH_COMPLETE' },
    });

    const result = await resultPromise;

    expect(result.user).toEqual(client.user);
    expect(result.error).toBeNull();
    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'azure',
      options: {
        redirectTo: 'https://void-surfer.example/auth/callback',
        scopes: 'openid profile email',
        skipBrowserRedirect: true,
      },
    });
    expect(client.rpc).toHaveBeenCalledWith('sync_profile', { p_display_name: 'Pilot One' });
    expect(popup).toBeUndefined();
  });

  it('returns a POPUP_BLOCKED error when the browser blocks the window', async () => {
    const client = makeClient();
    const windowRef = makeWindow();
    windowRef.open.mockReturnValue(null);

    const result = await signInWithMicrosoft(client, { windowRef });

    expect(result.user).toBeNull();
    expect(result.error.code).toBe('POPUP_BLOCKED');
  });

  it('returns an AUTH_FAILED error when the OAuth provider rejects the request', async () => {
    const client = makeClient({ auth: {
      signInWithOAuth: vi.fn(async () => ({ data: null, error: new Error('provider unavailable') })),
    } });

    const result = await signInWithMicrosoft(client, { windowRef: makeWindow() });

    expect(result.error.code).toBe('AUTH_FAILED');
  });

  it('restores the current user and normalizes a signed-out session to null', async () => {
    const client = makeClient();
    expect(await getSessionUser(client)).toEqual(client.user);
    client.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect(await getSessionUser(client)).toBeNull();
  });

  it('subscribes to session changes and returns an unsubscribe callback', () => {
    let listener;
    const unsubscribe = vi.fn();
    const client = makeClient({ auth: {
      onAuthStateChange: vi.fn((callback) => {
        listener = callback;
        return { data: { subscription: { unsubscribe } } };
      }),
    } });
    const onUser = vi.fn();

    const stop = subscribeToAuth(client, onUser);
    listener('SIGNED_IN', { user: client.user });
    listener('SIGNED_OUT', null);
    stop();

    expect(onUser).toHaveBeenNthCalledWith(1, client.user);
    expect(onUser).toHaveBeenNthCalledWith(2, null);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('signs out and propagates sign-out failures as auth errors', async () => {
    const client = makeClient();
    await signOut(client);
    expect(client.auth.signOut).toHaveBeenCalledOnce();

    client.auth.signOut.mockResolvedValue({ error: new Error('network') });
    await expect(signOut(client)).rejects.toMatchObject({ code: 'AUTH_FAILED' });
  });
});
