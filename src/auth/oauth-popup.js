import { AuthFlowError } from '../services/auth-errors.js';

export const AUTH_CALLBACK_PATH = '/auth/callback';
export const AUTH_COMPLETE_MESSAGE = 'VOID_SURFER_AUTH_COMPLETE';

export function createAuthCallbackUrl(locationRef = globalThis.location) {
  return new URL(AUTH_CALLBACK_PATH, locationRef.origin).toString();
}

export async function completeOAuthPopup(client, windowRef = globalThis.window) {
  const status = windowRef.document?.querySelector('[data-auth-status]');

  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      throw error;
    }

    if (!data?.session?.user) {
      throw new AuthFlowError('AUTH_FAILED');
    }

    if (!windowRef.opener || windowRef.opener.closed) {
      throw new AuthFlowError('AUTH_FAILED');
    }

    windowRef.opener.postMessage(
      { type: AUTH_COMPLETE_MESSAGE },
      windowRef.location.origin,
    );
    windowRef.close();
    return data.session.user;
  } catch (error) {
    if (status) {
      status.textContent = '로그인을 완료하지 못했습니다. 이 창을 닫고 다시 시도해 주세요.';
    }
    throw error;
  }
}

export function waitForPopupCompletion({
  popup,
  windowRef = globalThis.window,
  timeoutMs = 120_000,
  pollIntervalMs = 250,
}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let pollTimer;
    let timeoutTimer;

    const cleanup = () => {
      windowRef.removeEventListener('message', handleMessage);
      windowRef.clearInterval(pollTimer);
      windowRef.clearTimeout(timeoutTimer);
    };

    const settle = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };

    const handleMessage = (event) => {
      if (event.origin !== windowRef.location.origin
        || event.source !== popup
        || event.data?.type !== AUTH_COMPLETE_MESSAGE) {
        return;
      }
      settle();
    };

    windowRef.addEventListener('message', handleMessage);
    pollTimer = windowRef.setInterval(() => {
      if (popup.closed) {
        settle(new AuthFlowError('AUTH_CANCELLED'));
      }
    }, pollIntervalMs);
    timeoutTimer = windowRef.setTimeout(() => {
      try {
        if (!popup.closed) popup.close();
      } finally {
        settle(new AuthFlowError('AUTH_TIMEOUT'));
      }
    }, timeoutMs);
  });
}

export async function signInWithMicrosoftPopup(client, {
  windowRef = globalThis.window,
  redirectTo = createAuthCallbackUrl(windowRef.location),
  timeoutMs = 120_000,
  pollIntervalMs = 250,
} = {}) {
  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo,
        scopes: 'openid profile email',
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      throw error ?? new Error('OAuth URL was not returned');
    }

    const popup = windowRef.open(
      data.url,
      'void-surfer-microsoft-login',
      'popup=yes,width=520,height=720,resizable=yes,scrollbars=yes',
    );

    if (!popup) {
      throw new AuthFlowError('POPUP_BLOCKED');
    }

    await waitForPopupCompletion({ popup, windowRef, timeoutMs, pollIntervalMs });
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData?.session?.user) {
      throw sessionError ?? new Error('OAuth session was not restored');
    }

    return sessionData.session.user;
  } catch (error) {
    throw normalizePopupError(error);
  }
}

function normalizePopupError(error) {
  if (error instanceof AuthFlowError) return error;
  if (error?.code === 'CONFIG_MISSING' || error?.code === 'CONFIG_INVALID') {
    return new AuthFlowError(error.code, undefined, error);
  }
  return new AuthFlowError('AUTH_FAILED', undefined, error);
}
