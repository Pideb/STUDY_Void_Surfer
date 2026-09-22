import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAudioManager } from '../../src/audio/audio-manager.js';

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
    MockAudioContext.instances.push(this);
  }
}

afterEach(() => {
  vi.useRealTimers();
  MockAudioContext.instances = [];
});

describe('audio manager', () => {
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
    expect(context.oscillators[0].stop).toHaveBeenCalledTimes(2);
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
    manager.setMuted(true);

    expect(manager.isMuted()).toBe(true);
    manager.destroy();
  });
});
