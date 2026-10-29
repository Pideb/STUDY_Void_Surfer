import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUDIO_EVENTS, createAudioManager } from '../../src/audio/audio-manager.js';
import { createBossRoarBuffer } from '../../src/audio/boss-roar.js';
import { ROAR_PROFILES, synthesizeBossRoar } from '../../src/audio/boss-roar-synth.js';

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
        frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      this.oscillators.push(oscillator);
      return oscillator;
    });
    this.sampleRate = 22050;
    this.createBuffer = vi.fn((channels, length, sampleRate) => {
      const samples = Array.from({ length: channels }, () => new Float32Array(length));
      return { length, sampleRate, duration: length / sampleRate, numberOfChannels: channels,
        getChannelData: (channel) => samples[channel] };
    });
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

describe('approved boss roar buffers', () => {
  it.each(ROAR_PROFILES.map((profile) => profile.id))('preserves the exact approved 0.8s PCM for %s', (stageId) => {
    const context = new MockAudioContext();
    const buffer = createBossRoarBuffer(context, stageId);
    expect(buffer).toMatchObject({ duration: .8, sampleRate: 22050, numberOfChannels: 1, length: 17640 });
    expect(buffer.getChannelData(0)).toEqual(synthesizeBossRoar(stageId, 22050));
    expect(Math.abs(buffer.getChannelData(0)[0])).toBe(0);
    expect(Math.abs(buffer.getChannelData(0).at(-1))).toBe(0);
  });

  it('keeps all six material sounds distinct and falls back to the first valid stage', () => {
    const context = new MockAudioContext();
    const signatures = ROAR_PROFILES.map(({ id }) => Array.from(createBossRoarBuffer(context, id).getChannelData(0).slice(10, 110)).join(','));
    expect(new Set(signatures).size).toBe(6);
    const fallback = createBossRoarBuffer(context, 'unknown');
    expect(fallback.getChannelData(0)).toEqual(synthesizeBossRoar(ROAR_PROFILES[0].id, 22050));
    expect(createBossRoarBuffer(context).getChannelData(0)).toEqual(fallback.getChannelData(0));
  });

  it('normalizes unsupported sample rates and returns null without optional buffer APIs', () => {
    const context = new MockAudioContext();
    for (const sampleRate of [undefined, 0, NaN, Infinity, 7999, 192001, 44100.5]) {
      context.sampleRate = sampleRate;
      expect(createBossRoarBuffer(context, 'solar-forge')).toMatchObject({ sampleRate: 44100, duration: .8 });
    }
    expect(createBossRoarBuffer(null, 'solar-forge')).toBeNull();
    expect(createBossRoarBuffer({}, 'solar-forge')).toBeNull();
    expect(createBossRoarBuffer({ createBuffer: () => null }, 'solar-forge')).toBeNull();
  });
});

describe('roar and explosion lifecycle', () => {
  it('starts synchronously through the shared master with no fetch/decode and caches each stage', async () => {
    const fetcher = vi.fn();
    const manager = createAudioManager(MockAudioContext, { fetcher });
    await manager.unlock();
    const context = MockAudioContext.instances[0];
    expect(AUDIO_EVENTS).toContain('bossRoar');
    const buffers = [];
    for (const { id: stageId } of ROAR_PROFILES) {
      manager.play('bossRoar', { id: `${stageId}:one`, stageId });
      const voice = context.createBufferSource.mock.results.at(-1).value;
      expect(voice.start).toHaveBeenCalledExactlyOnceWith(0, 0, .8);
      expect(voice.loop).toBe(false);
      expect(voice.connect).toHaveBeenCalledExactlyOnceWith(context.createGain.mock.results[0].value);
      buffers.push(voice.buffer);
      manager.play('bossRoar', { id: `${stageId}:two`, stageId });
      expect(voice.stop).toHaveBeenCalledOnce();
      expect(context.createBufferSource.mock.results.at(-1).value.buffer).toBe(voice.buffer);
    }
    expect(new Set(buffers).size).toBe(6);
    expect(context.createBuffer).toHaveBeenCalledTimes(6);
    expect(context.createBufferSource).toHaveBeenCalledTimes(12);
    expect(fetcher).not.toHaveBeenCalled();
    manager.destroy();
  });

  it('deduplicates each roar ID, preserves event namespaces and resets IDs for a new run', async () => {
    const manager = createAudioManager(MockAudioContext);
    await manager.unlock();
    const context = MockAudioContext.instances[0];
    manager.play('bossRoar', { id: 'run1:roar1', stageId: 'abyssal-beast' });
    manager.play('bossRoar', { id: 'run1:roar1', stageId: 'solar-forge' });
    expect(context.createBufferSource).toHaveBeenCalledOnce();
    manager.play('bossHit', { id: 'run1:roar1' });
    expect(context.createOscillator).toHaveBeenCalledTimes(2);
    manager.resetRun();
    manager.play('bossRoar', { id: 'run1:roar1', stageId: 'abyssal-beast' });
    expect(context.createBufferSource).toHaveBeenCalledTimes(2);
    expect(context.createBuffer).toHaveBeenCalledOnce();
    manager.destroy();
  });

  it('retains offsets across repeated pause/resume and ignores stopped sources ending late', async () => {
    const manager = createAudioManager(MockAudioContext);
    await manager.unlock();
    const context = MockAudioContext.instances[0];
    manager.play('bossRoar', { id: 'roar1', stageId: 'signal-monoliths' });
    const first = context.createBufferSource.mock.results[0].value;
    context.currentTime = .25;
    manager.pauseMusic();
    manager.pauseMusic();
    expect(first.stop).toHaveBeenCalledOnce();
    first.onended(); // stop() completion must not erase the retained position.
    manager.play('bossRoar', { id: 'blocked-while-paused', stageId: 'solar-forge' });
    expect(context.createBufferSource).toHaveBeenCalledOnce();
    context.currentTime = 10;
    manager.resumeMusic();
    const second = context.createBufferSource.mock.results[1].value;
    expect(second.buffer).toBe(first.buffer);
    expect(second.start).toHaveBeenCalledExactlyOnceWith(10, .25, .55);
    first.onended(); // A stale source must not clear the resumed active voice either.
    context.currentTime = 10.125;
    manager.pauseMusic();
    expect(second.stop).toHaveBeenCalledOnce();
    second.onended();
    context.currentTime = 20;
    manager.resumeMusic();
    const third = context.createBufferSource.mock.results[2].value;
    expect(third.start).toHaveBeenCalledExactlyOnceWith(20, .375, .42500000000000004);
    third.onended();
    manager.pauseMusic();
    manager.resumeMusic();
    expect(context.createBufferSource).toHaveBeenCalledTimes(3);
    manager.destroy();
  });

  it('does not consume a paused or muted roar ID and mutes already active/resumed voices at the master', async () => {
    const manager = createAudioManager(MockAudioContext);
    await manager.unlock();
    const context = MockAudioContext.instances[0];
    manager.pauseMusic();
    manager.play('bossRoar', { id: 'roar1', stageId: 'gravity-well' });
    manager.resumeMusic();
    manager.setMuted(true);
    manager.play('bossRoar', { id: 'roar1', stageId: 'gravity-well' });
    expect(context.createBufferSource).not.toHaveBeenCalled();
    manager.setMuted(false);
    manager.play('bossRoar', { id: 'roar1', stageId: 'gravity-well' });
    expect(context.createBufferSource).toHaveBeenCalledOnce();
    manager.setMuted(true);
    const master = context.createGain.mock.results[0].value;
    expect(master.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, .01);
    context.currentTime = .2;
    manager.pauseMusic();
    context.currentTime = 5;
    manager.resumeMusic();
    const voice = context.createBufferSource.mock.results[1].value;
    expect(voice.start.mock.calls[0][1]).toBeCloseTo(.2);
    expect(voice.connect).toHaveBeenCalledWith(master);
    manager.destroy();
  });

  it.each(['menu', 'none', 'resetRun', 'destroy', 'collision', 'muted-collision'])('%s cancels an active or paused roar without reviving it', async (operation) => {
    for (const paused of [false, true]) {
      const manager = createAudioManager(MockAudioContext);
      await manager.unlock();
      const context = MockAudioContext.instances.at(-1);
      manager.play('bossRoar', { id: 'roar1', stageId: 'crystal-gates' });
      const first = context.createBufferSource.mock.results[0].value;
      context.currentTime = .1;
      if (paused) manager.pauseMusic();
      if (operation === 'menu' || operation === 'none') manager.setMusicMode(operation);
      else if (operation === 'collision' || operation === 'muted-collision') {
        if (operation === 'muted-collision') manager.setMuted(true);
        manager.play('collision', { id: 'death1' });
      } else manager[operation]();
      expect(first.stop).toHaveBeenCalledOnce();
      first.onended();
      const count = context.createBufferSource.mock.calls.length;
      manager.resumeMusic();
      await Promise.resolve();
      expect(context.createBufferSource).toHaveBeenCalledTimes(count);
      if (operation === 'destroy') {
        manager.play('bossRoar', { id: 'late', stageId: 'solar-forge' });
        await manager.unlock();
        expect(context.createBufferSource).toHaveBeenCalledTimes(count);
      } else manager.destroy();
    }
  });

  it('keeps a newer voice intact when the replaced roar delivers onended', async () => {
    const manager = createAudioManager(MockAudioContext);
    await manager.unlock();
    const context = MockAudioContext.instances[0];
    manager.play('bossRoar', { id: 'first', stageId: 'industrial-void' });
    const first = context.createBufferSource.mock.results[0].value;
    manager.play('bossRoar', { id: 'second', stageId: 'solar-forge' });
    const second = context.createBufferSource.mock.results[1].value;
    first.onended();
    context.currentTime = .3;
    manager.pauseMusic();
    expect(second.stop).toHaveBeenCalledOnce();
    context.currentTime = 3;
    manager.resumeMusic();
    expect(context.createBufferSource.mock.results[2].value.buffer).toBe(second.buffer);
    expect(context.createBufferSource.mock.results[2].value.start.mock.calls[0][1]).toBeCloseTo(.3);
    manager.destroy();
  });

  it('does not resume a voice that reached its 0.8s end before pause', async () => {
    const manager = createAudioManager(MockAudioContext);
    await manager.unlock();
    const context = MockAudioContext.instances[0];
    manager.play('bossRoar', { id: 'roar1' });
    context.currentTime = 1;
    manager.pauseMusic();
    manager.resumeMusic();
    expect(context.createBufferSource).toHaveBeenCalledOnce();
    manager.destroy();
  });

  it('keeps entrance sirens and roars separate and never overlaps their transient voices', async () => {
    const manager = createAudioManager(MockAudioContext);
    await manager.unlock();
    const context = MockAudioContext.instances[0];
    manager.setMusicDucked(true);
    manager.play('bossEntry', { id: 'entry1' });
    const entry = context.createBufferSource.mock.results[0].value;
    manager.play('bossRoar', { id: 'roar1', stageId: 'abyssal-beast' });
    const roar = context.createBufferSource.mock.results[1].value;
    expect(entry.buffer.duration).toBe(2.4);
    expect(roar.buffer.duration).toBe(.8);
    expect(entry.stop).toHaveBeenCalledOnce();
    manager.play('bossEntry', { id: 'entry2' });
    expect(roar.stop).toHaveBeenCalledOnce();
    manager.destroy();
  });

  it('plays one 0.35s spacecraft explosion with noise and two falling low tones, through shared mute', async () => {
    const manager = createAudioManager(MockAudioContext);
    await manager.unlock();
    const context = MockAudioContext.instances[0];
    context.currentTime = 2;
    manager.play('collision', { id: 'death1' });
    manager.play('collision', { id: 'death1' });
    expect(context.createBufferSource).toHaveBeenCalledOnce();
    expect(context.createOscillator).toHaveBeenCalledTimes(2);
    const noise = context.createBufferSource.mock.results[0].value;
    expect(noise.stop.mock.calls[0][0] - 2).toBeCloseTo(.35);
    expect(noise.buffer.getChannelData(0).some((value) => value !== 0)).toBe(true);
    for (const oscillator of context.oscillators) {
      expect(oscillator.stop.mock.calls[0][0] - 2).toBeCloseTo(.35);
      const [endFrequency, endTime] = oscillator.frequency.exponentialRampToValueAtTime.mock.calls[0];
      expect(endFrequency).toBeLessThan(oscillator.frequency.value);
      expect(endTime - 2).toBeCloseTo(.33);
    }
    const master = context.createGain.mock.results[0].value;
    for (const envelope of context.createGain.mock.results.slice(6)) expect(envelope.value.connect).toHaveBeenCalledWith(master);
    manager.setMuted(true);
    manager.play('collision', { id: 'death2' });
    expect(context.createBufferSource).toHaveBeenCalledOnce();
    expect(master.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 2, .01);
    manager.destroy();
  });

  it('gracefully skips roars on a partial Web Audio implementation', async () => {
    class PartialContext extends MockAudioContext {
      constructor() { super(); this.createBuffer = undefined; this.createBufferSource = undefined; }
    }
    const manager = createAudioManager(PartialContext);
    await manager.unlock();
    expect(() => manager.play('bossRoar', { id: 'roar1', stageId: 'solar-forge' })).not.toThrow();
    manager.pauseMusic();
    manager.resumeMusic();
    manager.destroy();
  });
});

describe('audio manager', () => {
  it('resumes the approved siren inside its third pulse without an old voice resetting the offset',async()=>{
    const manager=createAudioManager(MockAudioContext);await manager.unlock();const ctx=MockAudioContext.instances[0];
    manager.setMusicDucked(true);manager.play('bossEntry',{id:'late-pause'});const first=ctx.createBufferSource.mock.results[0].value;
    ctx.currentTime=1.8;manager.pauseMusic();ctx.currentTime=5;manager.resumeMusic();
    expect(ctx.createBufferSource.mock.results[1].value.start).toHaveBeenCalledWith(5,1.8);
    first.onended();ctx.currentTime=5.2;manager.pauseMusic();ctx.currentTime=9;manager.resumeMusic();
    const third=ctx.createBufferSource.mock.results[2].value;expect(third.start.mock.calls[0][1]).toBeCloseTo(2);
    expect(third.buffer.duration).toBe(2.4);manager.destroy();
  });
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
