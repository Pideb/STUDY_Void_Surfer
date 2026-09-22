import { describe, expect, it, vi } from 'vitest';
import { createSupabaseClient } from '../../src/lib/supabase-client.js';

describe('createSupabaseClient', () => {
  it('creates a persistent browser client from public credentials', () => {
    const createClientImpl = vi.fn(() => ({ auth: {} }));
    const client = createSupabaseClient({
      url: 'https://project.supabase.co',
      anonKey: 'public-anon-key',
    }, createClientImpl);

    expect(client).toBeDefined();
    expect(createClientImpl).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'public-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  });

  it('rejects missing credentials with a stable error code', () => {
    expect(() => createSupabaseClient({ url: '', anonKey: '' })).toThrowError(
      expect.objectContaining({ code: 'CONFIG_MISSING' }),
    );
  });

  it('rejects malformed and unsupported URLs', () => {
    expect(() => createSupabaseClient({ url: 'not-a-url', anonKey: 'key' })).toThrowError(
      expect.objectContaining({ code: 'CONFIG_INVALID' }),
    );
    expect(() => createSupabaseClient({ url: 'ftp://project.example', anonKey: 'key' })).toThrowError(
      expect.objectContaining({ code: 'CONFIG_INVALID' }),
    );
  });
});
