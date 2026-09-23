const SOUND_CONFIG = Object.freeze({
  lift: [{ frequency: 420, duration: 0.08, type: 'triangle', volume: 0.65 }],
  dash: [{ frequency: 680, duration: 0.14, type: 'sawtooth', volume: 0.8 }],
  score: [{ frequency: 760, duration: 0.1, type: 'sine', volume: 0.5 }],
  boss: [{ frequency: 90, duration: 0.45, type: 'sawtooth', volume: 0.8 }, { frequency: 110, duration: 0.32, type: 'triangle', volume: 0.55, offset: 0.08 }],
  collision: [{ frequency: 70, duration: 0.3, type: 'sawtooth', volume: 0.8 }],
  pause: [{ frequency: 260, duration: 0.12, type: 'triangle', volume: 0.5 }],
  bossCharge: [
    { frequency: 110, duration: 0.22, type: 'sawtooth', volume: 0.52 },
    { frequency: 164.81, duration: 0.2, type: 'triangle', volume: 0.4, offset: 0.12 },
  ],
  projectileReflect: [
    { frequency: 523.25, duration: 0.1, type: 'triangle', volume: 0.68 },
    { frequency: 783.99, duration: 0.16, type: 'sine', volume: 0.6, offset: 0.07 },
    { frequency: 1046.5, duration: 0.12, type: 'triangle', volume: 0.48, offset: 0.16 },
  ],
  bossHit: [
    { frequency: 82.41, duration: 0.24, type: 'sawtooth', volume: 0.72 },
    { frequency: 246.94, duration: 0.12, type: 'square', volume: 0.44, offset: 0.04 },
  ],
  laserTelegraph: [
    { frequency: 987.77, duration: 0.1, type: 'sine', volume: 0.46 },
    { frequency: 1318.51, duration: 0.18, type: 'triangle', volume: 0.42, offset: 0.13 },
  ],
  challengeSuccess: [
    { frequency: 523.25, duration: 0.14, type: 'triangle', volume: 0.62 },
    { frequency: 659.25, duration: 0.14, type: 'triangle', volume: 0.58, offset: 0.08 },
    { frequency: 783.99, duration: 0.22, type: 'sine', volume: 0.55, offset: 0.16 },
  ],
  challengeFailureInk: [{ frequency: 58.27, duration: 0.32, type: 'sawtooth', volume: 0.72, noise: true }],
  challengeFailureGlitch: [{ frequency: 155.56, duration: 0.28, type: 'square', volume: 0.52, noise: true }],
});

const MUSIC_MODES = Object.freeze({
  menu: Object.freeze({
    intervalMs: 420,
    type: 'triangle',
    volume: 0.5,
    notes: Object.freeze([220, 277.18, 329.63, null, 246.94, 293.66, 369.99, 329.63]),
  }),
  gameplay: Object.freeze({
    intervalMs: 190,
    type: 'square',
    volume: 0.42,
    notes: Object.freeze([164.81, 220, 246.94, 329.63, 246.94, 220, 196, 246.94]),
  }),
  boss: Object.freeze({
    intervalMs: 250,
    type: 'sawtooth',
    volume: 0.46,
    notes: Object.freeze([73.42, 73.42, 98, null, 82.41, 110, 98, null]),
  }),
});

const SCENE_SETTINGS = Object.freeze({
  'crystal-gates': { semitones: 0 },
  'industrial-void': { semitones: -2 },
  'signal-monoliths': { semitones: 3 },
  'gravity-well': { semitones: -4 },
  'abyssal-beast': { semitones: -1 },
  'solar-forge': { semitones: 2 },
});

export const AUDIO_EVENTS = Object.freeze([
  'bossCharge', 'projectileReflect', 'bossHit', 'laserTelegraph',
  'challengeSuccess', 'challengeFailureInk', 'challengeFailureGlitch',
]);

const DEDUPE_LIMIT = 256;
const SCENE_CROSSFADE_STEPS = 4;
const MODE_CROSSFADE_SECONDS = 0.24;

function setGainValue(gainNode, value, currentTime = 0, timeConstant = 0.01) {
  if (!gainNode?.gain) return;
  if (typeof gainNode.gain.setTargetAtTime === 'function') {
    gainNode.gain.setTargetAtTime(value, currentTime, timeConstant);
  } else {
    gainNode.gain.value = value;
  }
}

function createNoopManager() {
  let muted = false;
  return {
    async unlock() {},
    setMuted(value) { muted = Boolean(value); },
    isMuted() { return muted; },
    setMusicMode() {},
    setMusicScene() {},
    pauseMusic() {},
    resumeMusic() {},
    play() {},
    destroy() {},
  };
}

export function createAudioManager(AudioContextCtor = globalThis.AudioContext ?? globalThis.webkitAudioContext) {
  let context = null;
  let masterGain = null;
  let musicGain = null;
  let musicTimer = null;
  let musicMode = 'none';
  let musicStep = 0;
  let musicPaused = false;
  let muted = false;
  let activeMusicVoices = [];
  let musicModeGains = new Map();
  let currentSemitones = 0;
  let targetSemitones = 0;
  let sceneStepsRemaining = 0;
  const playedEventIds = new Set();

  function connect(node, destination) {
    node?.connect?.(destination);
  }

  function ensureGraph() {
    if (!context?.createGain || !context.destination) return false;
    masterGain ??= context.createGain();
    musicGain ??= context.createGain();
    connect(musicGain, masterGain);
    connect(masterGain, context.destination);
    setGainValue(masterGain, muted ? 0 : 0.7, context.currentTime ?? 0);
    setGainValue(musicGain, 0.14, context.currentTime ?? 0);

    for (const mode of Object.keys(MUSIC_MODES)) {
      if (musicModeGains.has(mode)) continue;
      const gain = context.createGain();
      setGainValue(gain, 0, context.currentTime ?? 0);
      connect(gain, musicGain);
      musicModeGains.set(mode, gain);
    }
    return true;
  }

  function playTone(config, destination = masterGain, { offset = 0, trackMusic = false } = {}) {
    if (!context?.createOscillator || !context?.createGain || !destination || !config?.frequency) return null;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const startTime = (context.currentTime ?? 0) + offset;
    oscillator.type = config.type;
    oscillator.frequency.value = config.frequency;
    setGainValue(envelope, 0.0001, startTime);
    setGainValue(envelope, 0.22 * (config.volume ?? 1), startTime + 0.01);
    setGainValue(envelope, 0.0001, startTime + config.duration);
    connect(oscillator, envelope);
    connect(envelope, destination);
    oscillator.start?.(startTime);
    oscillator.stop?.(startTime + config.duration + 0.02);
    if (trackMusic) {
      activeMusicVoices.push(oscillator);
      oscillator.onended = () => {
        activeMusicVoices = activeMusicVoices.filter((voice) => voice !== oscillator);
      };
    }
    return oscillator;
  }

  function playNoiseBurst(config) {
    if (!context?.createBuffer || !context?.createBufferSource || !context?.createGain || !masterGain) {
      playTone({ frequency: config.frequency * 1.7, duration: config.duration, type: config.type, volume: config.volume * 0.5 });
      return;
    }
    try {
      const sampleRate = context.sampleRate || 22050;
      const frameCount = Math.max(1, Math.floor(sampleRate * config.duration));
      const buffer = context.createBuffer(1, frameCount, sampleRate);
      const samples = buffer.getChannelData(0);
      for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      const envelope = context.createGain();
      source.buffer = buffer;
      setGainValue(envelope, 0.0001, context.currentTime ?? 0);
      setGainValue(envelope, 0.16 * config.volume, (context.currentTime ?? 0) + 0.01);
      setGainValue(envelope, 0.0001, (context.currentTime ?? 0) + config.duration);
      connect(source, envelope);
      connect(envelope, masterGain);
      source.start?.();
      source.stop?.((context.currentTime ?? 0) + config.duration + 0.02);
    } catch {
      playTone({ frequency: config.frequency * 1.7, duration: config.duration, type: config.type, volume: config.volume * 0.5 });
    }
  }

  function stopMusicVoices() {
    const now = context?.currentTime ?? 0;
    for (const voice of activeMusicVoices) {
      try {
        voice.stop?.(now);
        voice.disconnect?.();
      } catch {
        // A voice may already have ended; ignore stale scheduled nodes.
      }
    }
    activeMusicVoices = [];
  }

  function stopMusicScheduler() {
    if (musicTimer !== null) {
      globalThis.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function crossfadeMusicMode(nextMode) {
    if (!context || !ensureGraph()) return;
    const now = context.currentTime ?? 0;
    for (const [mode, gain] of musicModeGains) {
      const target = mode === nextMode ? 1 : 0;
      setGainValue(gain, target, now, MODE_CROSSFADE_SECONDS / 3);
    }
  }

  function playMusicStep() {
    const mode = MUSIC_MODES[musicMode];
    if (!mode || !musicGain || musicPaused) return;
    if (sceneStepsRemaining > 0) {
      currentSemitones += (targetSemitones - currentSemitones) / sceneStepsRemaining;
      sceneStepsRemaining -= 1;
      if (sceneStepsRemaining === 0) currentSemitones = targetSemitones;
    }
    const note = mode.notes[musicStep % mode.notes.length];
    musicStep += 1;
    if (note) {
      const pitch = note * (2 ** (currentSemitones / 12));
      playTone({
        frequency: pitch,
        duration: Math.min(mode.intervalMs / 1000 * 0.82, 0.28),
        type: mode.type,
        volume: mode.volume,
      }, musicModeGains.get(musicMode), { trackMusic: true });
    }
  }

  function scheduleMusic() {
    const mode = MUSIC_MODES[musicMode];
    if (!mode || !context || !ensureGraph() || musicPaused || musicTimer !== null) return;
    crossfadeMusicMode(musicMode);
    playMusicStep();
    musicTimer = globalThis.setInterval(playMusicStep, mode.intervalMs);
  }

  if (!AudioContextCtor) return createNoopManager();

  return {
    async unlock() {
      context ??= new AudioContextCtor();
      ensureGraph();
      if (typeof context.resume === 'function' && context.state !== 'running') await context.resume();
      scheduleMusic();
    },
    setMuted(value) {
      muted = Boolean(value);
      setGainValue(masterGain, muted ? 0 : 0.7, context?.currentTime ?? 0);
    },
    isMuted() { return muted; },
    setMusicMode(mode) {
      const nextMode = MUSIC_MODES[mode] ? mode : 'none';
      if (nextMode === musicMode && !(nextMode !== 'none' && musicPaused)) return;
      stopMusicScheduler();
      musicPaused = false;
      musicMode = nextMode;
      musicStep = 0;
      if (nextMode === 'none') {
        stopMusicVoices();
        crossfadeMusicMode('none');
        return;
      }
      scheduleMusic();
    },
    setMusicScene(sceneId) {
      const nextSemitones = SCENE_SETTINGS[sceneId]?.semitones ?? 0;
      if (nextSemitones === targetSemitones) return;
      targetSemitones = nextSemitones;
      sceneStepsRemaining = SCENE_CROSSFADE_STEPS;
    },
    pauseMusic() {
      if (musicPaused) return;
      musicPaused = true;
      stopMusicScheduler();
      stopMusicVoices();
    },
    resumeMusic() {
      if (!musicPaused) return;
      musicPaused = false;
      scheduleMusic();
    },
    play(event, metadata = {}) {
      if (muted || !context || !ensureGraph()) return;
      if (event === 'warning') {
        playTone({ frequency: 196, duration: 0.1, type: 'square', volume: 0.72 });
        playTone({ frequency: 146.83, duration: 0.12, type: 'square', volume: 0.72 }, masterGain, { offset: 0.13 });
        return;
      }
      const config = SOUND_CONFIG[event];
      if (!config) return;
      if (metadata.id !== undefined && metadata.id !== null) {
        const key = `${event}:${metadata.id}`;
        if (playedEventIds.has(key)) return;
        playedEventIds.add(key);
        if (playedEventIds.size > DEDUPE_LIMIT) playedEventIds.delete(playedEventIds.values().next().value);
      }
      for (const tone of config) {
        if (tone.noise) playNoiseBurst(tone);
        playTone(tone, masterGain, { offset: tone.offset ?? 0 });
      }
    },
    destroy() {
      stopMusicScheduler();
      stopMusicVoices();
      for (const gain of musicModeGains.values()) gain?.disconnect?.();
      musicModeGains.clear();
      masterGain?.disconnect?.();
      musicGain?.disconnect?.();
      context?.close?.();
      context = null;
      masterGain = null;
      musicGain = null;
      musicMode = 'none';
      musicStep = 0;
      musicPaused = false;
      currentSemitones = 0;
      targetSemitones = 0;
      sceneStepsRemaining = 0;
      playedEventIds.clear();
    },
  };
}
