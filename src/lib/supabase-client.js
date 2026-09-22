import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(config, createClientImpl = createClient) {
  const url = config?.url?.trim();
  const anonKey = config?.anonKey?.trim();

  if (!url || !anonKey) {
    const error = new Error('Supabase URL과 anon key 환경 변수를 설정해야 합니다.');
    error.code = 'CONFIG_MISSING';
    throw error;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    const error = new Error('VITE_SUPABASE_URL 형식이 올바르지 않습니다.');
    error.code = 'CONFIG_INVALID';
    throw error;
  }

  if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
    const error = new Error('Supabase URL은 HTTP 또는 HTTPS 주소여야 합니다.');
    error.code = 'CONFIG_INVALID';
    throw error;
  }

  return createClientImpl(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function createSupabaseClientFromEnv(env) {
  const runtimeEnv = env ?? import.meta.env;
  return createSupabaseClient({
    url: runtimeEnv?.VITE_SUPABASE_URL,
    anonKey: runtimeEnv?.VITE_SUPABASE_ANON_KEY,
  });
}
