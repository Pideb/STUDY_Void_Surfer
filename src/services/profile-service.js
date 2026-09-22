import { AuthFlowError } from './auth-errors.js';

const MAX_DISPLAY_NAME_LENGTH = 80;

export function getMicrosoftDisplayName(user) {
  const metadata = user?.user_metadata ?? {};
  const candidates = [metadata.full_name, metadata.name, user?.email];
  const name = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim());

  if (!name) {
    throw new AuthFlowError('AUTH_FAILED', 'Microsoft 계정에서 표시 이름을 확인할 수 없습니다.');
  }

  return name.trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
}

export async function syncDisplayName(client, displayName) {
  const normalizedName = typeof displayName === 'string'
    ? displayName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH)
    : '';

  if (!normalizedName) {
    throw new AuthFlowError('PROFILE_SYNC_FAILED');
  }

  const { data, error } = await client.rpc('sync_profile', {
    p_display_name: normalizedName,
  });

  if (error || !data) {
    throw new AuthFlowError('PROFILE_SYNC_FAILED', undefined, error);
  }

  return data;
}

export async function syncMicrosoftProfile(client, user) {
  return syncDisplayName(client, getMicrosoftDisplayName(user));
}
