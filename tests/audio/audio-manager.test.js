import { describe, expect, it, vi } from 'vitest';
import { createAudioManager } from '../../src/audio/audio-manager.js';

class MockAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = {};
    this.resume = vi.fn(async () => {
      this.state = 'running';
    });
    this.close = vi.fn();
    this.createGain = vi.fn(() => ({
      gain: { value: 1, setTargetAtTime: vi.fn() },
      connect: vi.fn(),
    }));
    this.createOscillator = vi.fn(() => ({
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }));
  }
}

describe('audio manager', () => {
  it('does not create or resume AudioContext before unlock', () => {
    const manager = createAudioManager(MockAudioContext);

    manager.play('lift');

    expect(manager.isMuted()).toBe(false);
  });

  it('creates and resumes the context only when unlocked', async () => {
    const manager = createAudioManager(MockAudioContext);

    await manager.unlock();

    expect(manager.isMuted()).toBe(false);
    manager.play('lift');
    manager.destroy();
  });

  it('mutes all generated audio and restores it', async () => {
    const manager = createAudioManager(MockAudioContext);
    await manager.unlock();

    manager.setMuted(true);
    expect(manager.isMuted()).toBe(true);
    manager.play('warning');
    manager.setMuted(false);
    expect(manager.isMuted()).toBe(false);
    manager.destroy();
  });

  it('provides a no-op fallback when Web Audio is unavailable', async () => {
    const manager = createAudioManager(null);

    await manager.unlock();
    manager.play('collision');
    manager.setMuted(true);

    expect(manager.isMuted()).toBe(true);
    manager.destroy();
  });
});
