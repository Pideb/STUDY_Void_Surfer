import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_COMPLETE_MESSAGE,
  completeOAuthPopup,
  createAuthCallbackUrl,
  waitForPopupCompletion,
} from '../../src/auth/oauth-popup.js';

function makeWindow() {
  const listeners = new Set();
  return {
    location: { origin: 'https://void-surfer.example' },
    document: { querySelector: vi.fn(() => ({ textContent: '' })) },
    opener: { closed: false, postMessage: vi.fn() },
    close: vi.fn(),
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

afterEach(() => vi.useRealTimers());

describe('OAuth popup helpers', () => {
  it('builds a same-origin callback URL', () => {
    expect(createAuthCallbackUrl({ origin: 'https://void-surfer.example' }))
      .toBe('https://void-surfer.example/auth/callback');
  });

  it('only resolves a popup message from the same origin and popup window', async () => {
    const windowRef = makeWindow();
    const popup = { closed: false };
    const result = waitForPopupCompletion({ popup, windowRef, timeoutMs: 1000, pollIntervalMs: 10 });

    windowRef.emitMessage({
      origin: 'https://attacker.example',
      source: popup,
      data: { type: AUTH_COMPLETE_MESSAGE },
    });
    windowRef.emitMessage({
      origin: windowRef.location.origin,
      source: {},
      data: { type: AUTH_COMPLETE_MESSAGE },
    });
    windowRef.emitMessage({
      origin: windowRef.location.origin,
      source: popup,
      data: { type: AUTH_COMPLETE_MESSAGE },
    });

    await expect(result).resolves.toBeUndefined();
  });

  it('treats closing the popup as login cancellation', async () => {
    vi.useFakeTimers();
    const windowRef = makeWindow();
    const popup = { closed: true };
    const result = waitForPopupCompletion({ popup, windowRef, timeoutMs: 1000, pollIntervalMs: 10 });
    const rejection = expect(result).rejects.toMatchObject({ code: 'AUTH_CANCELLED' });
    await vi.advanceTimersByTimeAsync(10);

    await rejection;
  });

  it('notifies the opener and closes after a valid callback session', async () => {
    const windowRef = makeWindow();
    const user = { id: 'user-1' };
    const client = { auth: { getSession: vi.fn(async () => ({ data: { session: { user } }, error: null })) } };

    await expect(completeOAuthPopup(client, windowRef)).resolves.toBe(user);
    expect(windowRef.opener.postMessage).toHaveBeenCalledWith(
      { type: AUTH_COMPLETE_MESSAGE },
      windowRef.location.origin,
    );
    expect(windowRef.close).toHaveBeenCalledOnce();
  });

  it('shows an accessible error when callback has no authenticated session', async () => {
    const windowRef = makeWindow();
    const status = { textContent: '' };
    windowRef.document.querySelector.mockReturnValue(status);
    const client = { auth: { getSession: vi.fn(async () => ({ data: { session: null }, error: null })) } };

    await expect(completeOAuthPopup(client, windowRef)).rejects.toBeDefined();
    expect(status.textContent).toMatch(/로그인을 완료하지 못했습니다/);
  });
});
