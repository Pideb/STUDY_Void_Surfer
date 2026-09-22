import { createAuthCallbackUrl, signInWithMicrosoftPopup } from '../auth/oauth-popup.js';
import { normalizeAuthError } from './auth-errors.js';
import { syncMicrosoftProfile } from './profile-service.js';

export async function signInWithMicrosoft(client, options = {}) {
  try {
    const user = await signInWithMicrosoftPopup(client, options);
    await syncMicrosoftProfile(client, user);
    return { user, error: null };
  } catch (error) {
    return { user: null, error: normalizeAuthError(error) };
  }
}

export async function getSessionUser(client) {
  const { data, error } = await client.auth.getSession();
  if (error) throw normalizeAuthError(error);
  return data?.session?.user ?? null;
}

export function subscribeToAuth(client, callback) {
  const { data, error } = client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  if (error) throw normalizeAuthError(error);

  return () => data?.subscription?.unsubscribe?.();
}

export async function signOut(client) {
  const { error } = await client.auth.signOut();
  if (error) throw normalizeAuthError(error);
}

export { createAuthCallbackUrl };
