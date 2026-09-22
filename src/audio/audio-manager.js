const SOUND_CONFIG = Object.freeze({
  lift: { frequency: 420, duration: 0.08, type: 'triangle' },
  dash: { frequency: 680, duration: 0.14, type: 'sawtooth' },
  score: { frequency: 760, duration: 0.1, type: 'sine' },
  boss: { frequency: 90, duration: 0.45, type: 'sawtooth' },
  collision: { frequency: 70, duration: 0.3, type: 'sawtooth' },
  pause: { frequency: 260, duration: 0.12, type: 'triangle' },
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

function setGainValue(gainNode, value, currentTime = 0) {
  if (!gainNode?.gain) return;

  if (typeof gainNode.gain.setTargetAtTime === 'function') {
    gainNode.gain.setTargetAtTime(value, currentTime, 0.01);
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
    return true;
  }

  function playTone(config, destination = masterGain, { volume = 1, offset = 0, trackMusic = false } = {}) {
    if (!context?.createOscillator || !context?.createGain || !destination || !config?.frequency) return null;

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const startTime = (context.currentTime ?? 0) + offset;
    oscillator.type = config.type;
    oscillator.frequency.value = config.frequency;
    setGainValue(envelope, 0.0001, startTime);
    setGainValue(envelope, 0.22 * volume, startTime + 0.01);
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

  function stopMusicVoices() {
    const now = context?.currentTime ?? 0;
    for (const voice of activeMusicVoices) {
      try {
        voice.stop?.(now);
        voice.disconnect?.();
      } catch {
        // A voice may have already ended; it no longer needs management.
      }
    }
    activeMusicVoices = [];
  }

  function stopMusicScheduler() {
    if (musicTimer !== null) {
      globalThis.clearInterval(musicTimer);
      musicTimer = null;
    }
    stopMusicVoices();
  }

  function playMusicStep() {
    const mode = MUSIC_MODES[musicMode];
    if (!mode || !musicGain || musicPaused) return;

    const note = mode.notes[musicStep % mode.notes.length];
    musicStep += 1;
    if (note) {
      playTone({
        frequency: note,
        duration: Math.min(mode.intervalMs / 1000 * 0.82, 0.28),
        type: mode.type,
      }, musicGain, { volume: mode.volume, trackMusic: true });
    }
  }

  function scheduleMusic() {
    const mode = MUSIC_MODES[musicMode];
    if (!mode || !context || !ensureGraph() || musicPaused || musicTimer !== null) return;

    playMusicStep();
    musicTimer = globalThis.setInterval(playMusicStep, mode.intervalMs);
  }

  if (!AudioContextCtor) return createNoopManager();

  return {
    async unlock() {
      context ??= new AudioContextCtor();
      ensureGraph();
      if (typeof context.resume === 'function' && context.state !== 'running') {
        await context.resume();
      }
      scheduleMusic();
    },
    setMuted(value) {
      muted = Boolean(value);
      setGainValue(masterGain, muted ? 0 : 0.7, context?.currentTime ?? 0);
    },
    isMuted() {
      return muted;
    },
    setMusicMode(mode) {
      const nextMode = MUSIC_MODES[mode] ? mode : 'none';
      if (nextMode === musicMode) return;

      stopMusicScheduler();
      musicMode = nextMode;
      musicStep = 0;
      scheduleMusic();
    },
    pauseMusic() {
      if (musicPaused) return;
      musicPaused = true;
      stopMusicScheduler();
    },
    resumeMusic() {
      if (!musicPaused) return;
      musicPaused = false;
      scheduleMusic();
    },
    play(event) {
      if (muted || !context || !ensureGraph()) return;

      if (event === 'warning') {
        playTone({ frequency: 196, duration: 0.1, type: 'square' });
        playTone({ frequency: 146.83, duration: 0.12, type: 'square' }, masterGain, { offset: 0.13 });
        return;
      }

      const config = SOUND_CONFIG[event];
      if (config) playTone(config);
    },
    destroy() {
      stopMusicScheduler();
      masterGain?.disconnect?.();
      musicGain?.disconnect?.();
      context?.close?.();
      context = null;
      masterGain = null;
      musicGain = null;
      musicMode = 'none';
      musicStep = 0;
      musicPaused = false;
    },
  };
}
