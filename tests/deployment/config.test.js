import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const verifier = resolve('scripts/verify-config.mjs');
const folders = [];
const config = { routes: [{ route: '/auth/callback', rewrite: '/index.html' }] };

function fixture({ source = config, built = config, env = 'VITE_SUPABASE_URL=\nVITE_SUPABASE_ANON_KEY=\n' } = {}) {
  const folder = mkdtempSync(join(tmpdir(), 'void-surfer-host-config-'));
  folders.push(folder);
  mkdirSync(join(folder, 'public'));
  mkdirSync(join(folder, 'dist'));
  writeFileSync(join(folder, '.env.example'), env);
  writeFileSync(join(folder, 'vercel.json'), JSON.stringify({ rewrites: [{ source: '/auth/callback', destination: '/index.html' }] }));
  writeFileSync(join(folder, 'dist/index.html'), '<!doctype html><title>Host fixture</title>');
  for (const [location, value] of [['public', source], ['dist', built]]) {
    if (value !== null) writeFileSync(join(folder, location, 'staticwebapp.config.json'), typeof value === 'string' ? value : JSON.stringify(value));
  }
  return spawnSync(process.execPath, [verifier], { cwd: folder, encoding: 'utf8' });
}

afterEach(() => {
  for (const folder of folders.splice(0)) {
    const target = resolve(folder);
    expect(dirname(target)).toBe(resolve(tmpdir()));
    expect(basename(target)).toMatch(/^void-surfer-host-config-/);
    rmSync(target, { recursive: true });
  }
});

describe('deployment artifact contract', () => {
  it('accepts the emitted anonymous callback rewrite and existing Vercel support', () => {
    expect(fixture().status).toBe(0);
  });
  it('rejects a missing emitted Azure config even when the source is correct', () => {
    const result = fixture({ built: null });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('staticwebapp.config.json is missing');
  });
  it('rejects source/output disagreement instead of validating a stale artifact', () => {
    const result = fixture({ built: { ...config, globalHeaders: { 'X-Content-Type-Options': 'nosniff' } } });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('source and built configuration differ');
  });
  it.each([
    { routes: [] },
    { routes: [{ route: '/auth/callback', redirect: '/index.html' }] },
    { routes: [{ route: '/auth/callback', rewrite: '/index.html', allowedRoles: ['authenticated'] }] },
    { routes: [{ route: '/auth/callback', rewrite: '/index.html', methods: ['POST'] }] },
  ])('rejects unusable callback configuration %j', (invalid) => {
    const result = fixture({ source: invalid, built: invalid });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('anonymous OAuth callback');
  });
  it('reports malformed JSON and keeps public env placeholders empty', () => {
    expect(fixture({ built: '{invalid' }).status).toBe(1);
    const result = fixture({ env: 'VITE_SUPABASE_URL=unexpected-value\nVITE_SUPABASE_ANON_KEY=\n' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('empty placeholder');
    expect(result.stderr).not.toContain('unexpected-value');
  });
});
