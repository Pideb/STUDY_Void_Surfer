import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app/create-app.js';
import { readRuntimeConfig } from '../../src/app/config.js';

describe('createApp', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="root"></main>';
  });

  it('creates the logical canvas, UI root, and live region', () => {
    const root = document.querySelector('#root');
    const result = createApp(root);

    expect(result.canvas.id).toBe('game-canvas');
    expect(result.canvas.width).toBe(960);
    expect(result.canvas.height).toBe(540);
    expect(result.uiRoot.id).toBe('ui-root');
    expect(root.querySelector('#live-region').getAttribute('aria-live')).toBe('polite');
  });

  it('rejects a non-element app root', () => {
    expect(() => createApp(null)).toThrow(TypeError);
  });
});

describe('readRuntimeConfig', () => {
  it('returns null values when environment variables are absent', () => {
    expect(readRuntimeConfig({})).toEqual({
      supabaseUrl: null,
      supabaseAnonKey: null,
    });
  });

  it('reads the public Supabase environment variables', () => {
    expect(readRuntimeConfig({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'public-anon-key',
    })).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'public-anon-key',
    });
  });
});
