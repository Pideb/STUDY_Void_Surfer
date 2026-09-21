export function readRuntimeConfig(env) {
  const runtimeEnv = env ?? (typeof import.meta !== 'undefined' ? import.meta.env : {});

  return {
    supabaseUrl: runtimeEnv?.VITE_SUPABASE_URL || null,
    supabaseAnonKey: runtimeEnv?.VITE_SUPABASE_ANON_KEY || null,
  };
}
