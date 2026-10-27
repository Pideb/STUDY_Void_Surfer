import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUDIO_EVENTS, createAudioManager } from '../../src/audio/audio-manager.js';

class MockAudioContext {
  static instances = [];

  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = {};
    this.oscillators = [];
    this.resume = vi.fn(async () => { this.state = 'running'; });
    this.close = vi.fn();
    this.createGain = vi.fn(() => ({
      gain: { value: 1, setTargetAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }));
    this.createOscillator = vi.fn(() => {
      const oscillator = {
        type: 'sine',
        frequency: { value: 0 },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      this.oscillators.push(oscillator);
      return oscillator;
    });
    this.sampleRate = 22050;
    this.createBuffer = vi.fn((_channels, length) => ({ getChannelData: () => new Float32Array(length) }));
    this.createBufferSource = vi.fn(() => ({
      connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(),
    }));
    MockAudioContext.instances.push(this);
  }
}

afterEach(() => {
  vi.useRealTimers();
  MockAudioContext.instances = [];
});

describe('audio manager', () => {
  it('plays decoded scene loops through the shared mute path and retains position across pause', async () => {
    vi.useFakeTimers();
    class DecodedContext extends MockAudioContext {
      constructor() {
        super();
        this.decodeAudioData = vi.fn(async () => ({ duration: 10 }));
      }
    }
    const fetcher = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
    const manager = createAudioManager(DecodedContext, { fetcher });
    manager.setMusicScene('solar-forge');
    manager.setMusicMode('gameplay');
    await manager.unlock();
    for (let index = 0; index < 15; index += 1) await Promise.resolve();
    const ctx = MockAudioContext.instances[0];
    expect(fetcher.mock.calls.map(([url]) => url)).toContain('/assets/audio/boss/solar-forge.wav');
    expect(ctx.createBufferSource.mock.results[0].value.loop).toBe(true);
    const voices = ctx.createOscillator.mock.calls.length;
    vi.advanceTimersByTime(1500);
    expect(ctx.createOscillator).toHaveBeenCalledTimes(voices);
    ctx.currentTime = 2;
    manager.pauseMusic();
    ctx.currentTime = 9;
    manager.resumeMusic();
    expect(ctx.createBufferSource.mock.results.at(-1).value.start).toHaveBeenCalledWith(9, 2);
    manager.setMuted(true);
    expect(ctx.createGain.mock.results[0].value.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 9, 0.01);
    manager.setMusicMode('boss');
    expect(ctx.createBufferSource.mock.results.at(-1).value.loop).toBe(true);
    manager.destroy();
  });

  it('ducks once for the selected siren, preserves it on pause and cancels/restores on entry or menu', async () => {
    const manager = createAudioManager(MockAudioContext);
    await manager.unlock();
    const ctx = MockAudioContext.instances[0];
    manager.setMusicDucked(true);
    manager.play('bossEntry', { id: 'preview-1' });
    manager.play('bossEntry', { id: 'preview-1' });
    expect(ctx.createBufferSource).toHaveBeenCalledOnce();
    const first = ctx.createBufferSource.mock.results[0].value;
    manager.pauseMusic();
    expect(first.stop).toHaveBeenCalled();
    ctx.currentTime = 4;
    manager.resumeMusic();
    expect(ctx.createBufferSource.mock.results[1].value.start).toHaveBeenCalledWith(4, 0);
    manager.play('lift');
    expect(ctx.createGain.mock.results[1].value.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.028, 0, 0.04);
    manager.setMusicMode('menu');
    expect(ctx.createBufferSource.mock.results[1].value.stop).toHaveBeenCalled();
    expect(ctx.createGain.mock.results[1].value.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.14, 4, 0.01);
    manager.resetRun();
    manager.setMusicDucked(true);
    manager.play('bossEntry', { id: 'preview-1' });
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(3);
    manager.setMuted(true);
    manager.play('bossEntry', { id: 'muted' });
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(3);
    manager.destroy();
  });

  it('records music selection without creating or resuming AudioContext before unlock', () => {
    const manager = createAudioManager(MockAudioContext);

    manager.setMusicMode('menu');
    manager.play('lift');

    expect(MockAudioContext.instances).toHaveLength(0);
    expect(manager.isMuted()).toBe(false);
  });

  it('runs exactly one original music scheduler and replaces it when the mode changes', async () => {
    vi.useFakeTimers();
    const manager = createAudioManager(MockAudioContext);
    manager.setMusicMode('menu');

    await manager.unlock();
    const context = MockAudioContext.instances[0];
    expect(context.createOscillator).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(420);
    expect(context.createOscillator).toHaveBeenCalledTimes(2);

    manager.setMusicMode('menu');
    expect(context.createOscillator).toHaveBeenCalledTimes(2);

    manager.setMusicMode('boss');
    expect(context.createOscillator).toHaveBeenCalledTimes(3);
    expect(context.oscillators[0].stop).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(250);
    expect(context.createOscillator).toHaveBeenCalledTimes(4);
    manager.destroy();
  });

  it('pauses and resumes the retained mode, mutes through the master path, and keeps WARNING layered', async () => {
    vi.useFakeTimers();
    const manager = createAudioManager(MockAudioContext);
    manager.setMusicMode('gameplay');
    await manager.unlock();
    const context = MockAudioContext.instances[0];

    manager.pauseMusic();
    const pausedCount = context.createOscillator.mock.calls.length;
    vi.advanceTimersByTime(1000);
    expect(context.createOscillator).toHaveBeenCalledTimes(pausedCount);

    manager.resumeMusic();
    expect(context.createOscillator.mock.calls.length).toBeGreaterThan(pausedCount);
    manager.setMuted(true);
    expect(manager.isMuted()).toBe(true);
    const mutedCount = context.createOscillator.mock.calls.length;
    manager.play('warning');
    expect(context.createOscillator).toHaveBeenCalledTimes(mutedCount);

    manager.setMuted(false);
    manager.play('warning');
    expect(context.createOscillator.mock.calls.length).toBe(mutedCount + 2);
    vi.advanceTimersByTime(190);
    expect(context.createOscillator.mock.calls.length).toBeGreaterThan(mutedCount + 2);

    manager.setMusicMode('none');
    const stoppedCount = context.createOscillator.mock.calls.length;
    vi.advanceTimersByTime(1000);
    expect(context.createOscillator).toHaveBeenCalledTimes(stoppedCount);
    manager.destroy();
  });

  it('provides a no-op fallback when Web Audio is unavailable', async () => {
    const manager = createAudioManager(null);

    manager.setMusicMode('menu');
    await manager.unlock();
    manager.pauseMusic();
    manager.resumeMusic();
    manager.play('collision');
    AUDIO_EVENTS.forEach((event) => manager.play(event, { id: `offline-${event}` }));
    manager.setMuted(true);

    expect(manager.isMuted()).toBe(true);
    manager.destroy();
  });

  it('crossfades procedural stage pitch and music modes without stopping the AudioContext', async () => {
    vi.useFakeTimers();
    const manager = createAudioManager(MockAudioContext);
    manager.setMusicMode('gameplay');
    manager.setMusicScene('crystal-gates');
    await manager.unlock();
    const context = MockAudioContext.instances[0];
    const firstVoice = context.oscillators[0];

    manager.setMusicScene('solar-forge');
    vi.advanceTimersByTime(190 * 4);
    expect(context.oscillators.at(-1).frequency.value).toBeGreaterThan(firstVoice.frequency.value);

    manager.setMusicMode('boss');
    expect(context.close).not.toHaveBeenCalled();
    expect(firstVoice.stop).toHaveBeenCalledTimes(1);
    manager.destroy();
    expect(context.close).toHaveBeenCalledOnce();
  });

  it('synthesizes distinct boss and challenge cues, deduplicates IDs, and respects mute', async () => {
    const manager = createAudioManager(MockAudioContext);
    await manager.unlock();
    const context = MockAudioContext.instances[0];
    manager.play('bossCharge', { id: 'attack-1' });
    const afterCharge = context.createOscillator.mock.calls.length;
    manager.play('bossCharge', { id: 'attack-1' });
    expect(context.createOscillator).toHaveBeenCalledTimes(afterCharge);

    manager.play('projectileReflect', { id: 'attack-1' });
    manager.play('bossHit', { id: 'boss-1:2' });
    manager.play('laserTelegraph', { id: 'laser-1' });
    manager.play('challengeSuccess', { id: 'challenge-1' });
    manager.play('challengeFailureInk', { id: 'challenge-2' });
    manager.play('challengeFailureGlitch', { id: 'challenge-3' });
    expect(context.createOscillator.mock.calls.length).toBeGreaterThan(afterCharge + 7);
    expect(context.createBufferSource).toHaveBeenCalledTimes(2);

    manager.setMuted(true);
    const mutedCount = context.createOscillator.mock.calls.length;
    manager.play('bossHit', { id: 'boss-1:1' });
    expect(context.createOscillator).toHaveBeenCalledTimes(mutedCount);
    manager.destroy();
  });
});
