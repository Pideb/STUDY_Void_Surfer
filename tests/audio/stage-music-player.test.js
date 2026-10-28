import { describe, expect, it, vi } from 'vitest';
import { createStageMusicPlayer } from '../../src/audio/stage-music-player.js';

function context() {
  const sources = [];
  return {
    sources, currentTime: 0,
    createGain: vi.fn(() => ({ gain: { value: 1, setTargetAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() })),
    createBufferSource: vi.fn(() => {
      const source = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
      sources.push(source); return source;
    }),
    decodeAudioData: vi.fn(async (bytes) => ({ duration: 10, key: bytes.key })),
  };
}
const flush = async () => { for (let index = 0; index < 15; index += 1) await Promise.resolve(); };
const response = (key) => ({ ok: true, arrayBuffer: async () => ({ key }) });

describe('stage music loading and playback', () => {
  it('plays ORBIT RUN independently of scene, reuses its loop and preserves pause offset', async () => {
    const ctx = context(), fetcher = vi.fn(async url => response(url));
    const player = createStageMusicPlayer(ctx, { fetcher, destination: {} });
    player.select('crystal-gates', 'menu'); await flush();
    expect(ctx.sources[0].buffer.key).toBe('/assets/audio/menu/orbit-run.wav');
    player.select('solar-forge', 'menu'); expect(ctx.sources).toHaveLength(1);
    ctx.currentTime = 3; player.pause(); ctx.currentTime = 8; player.resume();
    expect(ctx.sources[1].start).toHaveBeenCalledWith(8, 3);
    player.select('solar-forge', 'boss'); await flush();
    expect(ctx.sources.at(-1).buffer.key).toContain('/boss/solar-forge.wav');
    player.destroy(); expect(player.isPlaying()).toBe(false);
  });
  it('cannot let a delayed menu decode replace newly selected gameplay', async () => {
    const ctx = context(), pending = new Map();
    const player = createStageMusicPlayer(ctx, { destination: {}, fetcher: url => new Promise(resolve => pending.set(url, resolve)) });
    player.select('crystal-gates', 'menu'); player.select('solar-forge', 'gameplay'); await flush();
    pending.get('/assets/audio/gameplay/solar-forge.wav')(response('game')); await flush();
    pending.get('/assets/audio/menu/orbit-run.wav')(response('late-menu')); await flush();
    expect(ctx.sources).toHaveLength(1); expect(ctx.sources[0].buffer.key).toBe('game'); player.destroy();
  });
  it('preloads both stage tracks and crossfades cached selections without restarting identical ones', async () => {
    const ctx = context();
    const fetcher = vi.fn(async (url) => response(url));
    const onPlaying = vi.fn();
    const player = createStageMusicPlayer(ctx, { fetcher, destination: {}, onPlaying });
    player.preloadScene('crystal-gates');
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(2);
    player.select('crystal-gates', 'gameplay');
    expect(ctx.sources[0]).toMatchObject({ loop: true, loopStart: 0, loopEnd: 10 });
    expect(ctx.sources[0].buffer.key).toContain('/gameplay/crystal-gates.wav');
    player.select('crystal-gates', 'gameplay');
    expect(ctx.sources).toHaveLength(1);
    ctx.currentTime = 2;
    player.select('crystal-gates', 'boss');
    expect(ctx.sources[0].stop).toHaveBeenCalledWith(2.24);
    expect(ctx.sources[1].buffer.key).toContain('/boss/crystal-gates.wav');
    expect(onPlaying).toHaveBeenLastCalledWith(true);
    player.destroy();
    expect(ctx.sources.every((source) => source.stop.mock.calls.length)).toBe(true);
  });

  it('preserves loop offset on pause and resumes without another fetch', async () => {
    const ctx = context();
    const fetcher = vi.fn(async (url) => response(url));
    const player = createStageMusicPlayer(ctx, { destination: {}, fetcher });
    player.select('solar-forge', 'boss');
    await flush();
    ctx.currentTime = 3.5;
    player.pause();
    expect(player.isPlaying()).toBe(false);
    ctx.currentTime = 20;
    player.resume();
    expect(ctx.sources[1].start).toHaveBeenCalledWith(20, 3.5);
    expect(fetcher).toHaveBeenCalledOnce();
    player.stop();
    expect(player.isPlaying()).toBe(false);
    player.destroy();
  });

  it('rejects late old-scene loads and cannot resurrect stopped or destroyed selections', async () => {
    const ctx = context();
    const pending = new Map();
    const fetcher = vi.fn((url) => new Promise((resolve) => pending.set(url, resolve)));
    const player = createStageMusicPlayer(ctx, { destination: {}, fetcher });
    player.select('crystal-gates', 'gameplay');
    player.select('industrial-void', 'boss');
    await flush();
    pending.get('/assets/audio/gameplay/crystal-gates.wav')(response('old'));
    await flush();
    expect(ctx.sources).toHaveLength(0);
    pending.get('/assets/audio/boss/industrial-void.wav')(response('new'));
    await flush();
    expect(ctx.sources[0].buffer.key).toBe('new');
    player.select('abyssal-beast', 'boss');
    await flush(); player.stop();
    pending.get('/assets/audio/boss/abyssal-beast.wav')(response('stopped'));
    await flush(); expect(ctx.sources).toHaveLength(1);
    player.select('gravity-well', 'gameplay');
    await flush(); player.destroy();
    pending.get('/assets/audio/gameplay/gravity-well.wav')(response('destroyed'));
    await flush();
    player.select('solar-forge', 'boss');
    expect(ctx.sources).toHaveLength(1);
  });

  it('waits while paused and handles missing audio without an unhandled rejection', async () => {
    const ctx = context();
    let resolve;
    const player = createStageMusicPlayer(ctx, { destination: {}, fetcher: () => new Promise((done) => { resolve = done; }) });
    player.select('crystal-gates', 'gameplay');
    await flush(); player.pause(); resolve(response('ready'));
    await flush(); expect(ctx.sources).toHaveLength(0);
    player.resume(); expect(ctx.sources).toHaveLength(1);
    player.destroy();
    const unavailable = createStageMusicPlayer(ctx, { fetcher: async () => ({ ok: false }) });
    unavailable.select('crystal-gates', 'gameplay');
    await flush(); expect(ctx.sources).toHaveLength(1);
    unavailable.destroy();
  });
});
