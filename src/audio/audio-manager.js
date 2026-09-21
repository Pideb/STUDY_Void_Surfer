const SOUND_CONFIG = Object.freeze({
  lift: { frequency: 420, duration: 0.08, type: 'triangle' },
  dash: { frequency: 680, duration: 0.14, type: 'sawtooth' },
  score: { frequency: 760, duration: 0.1, type: 'sine' },
  warning: { frequency: 180, duration: 0.24, type: 'square' },
  boss: { frequency: 90, duration: 0.45, type: 'sawtooth' },
  collision: { frequency: 70, duration: 0.3, type: 'sawtooth' },
  pause: { frequency: 260, duration: 0.12, type: 'triangle' },
});

function setGainValue(gainNode, value, currentTime = 0) {
  if (!gainNode?.gain) {
    return;
  }

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
    setMuted(value) {
      muted = Boolean(value);
    },
    isMuted() {
      return muted;
    },
    play() {},
    destroy() {},
  };
}

export function createAudioManager(AudioContextCtor = globalThis.AudioContext ?? globalThis.webkitAudioContext) {
  let context = null;
  let masterGain = null;
  let bgmGain = null;
  let bgmTimer = null;
  let muted = false;

  function connectGain(node, destination) {
    if (typeof node?.connect === 'function') {
      node.connect(destination);
    }
  }

  function ensureGraph() {
    if (!context?.createGain || !context.destination) {
      return false;
    }

    masterGain ??= context.createGain();
    bgmGain ??= context.createGain();
    connectGain(bgmGain, masterGain);
    connectGain(masterGain, context.destination);
    setGainValue(masterGain, muted ? 0 : 0.7, context.currentTime ?? 0);
    setGainValue(bgmGain, muted ? 0 : 0.12, context.currentTime ?? 0);
    return true;
  }

  function playTone(config, destination = masterGain) {
    if (!context?.createOscillator || !context?.createGain || !destination) {
      return;
    }

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const startTime = context.currentTime ?? 0;
    oscillator.type = config.type;
    oscillator.frequency.value = config.frequency;
    setGainValue(envelope, 0.0001, startTime);
    setGainValue(envelope, 0.22, startTime + 0.01);
    setGainValue(envelope, 0.0001, startTime + config.duration);
    connectGain(oscillator, envelope);
    connectGain(envelope, destination);
    oscillator.start?.(startTime);
    oscillator.stop?.(startTime + config.duration + 0.02);
  }

  function scheduleBgm() {
    if (bgmTimer || !bgmGain) {
      return;
    }

    bgmTimer = globalThis.setInterval(() => {
      if (!muted) {
        playTone({ frequency: 110, duration: 0.22, type: 'sine' }, bgmGain);
      }
    }, 1200);
  }

  if (!AudioContextCtor) {
    return createNoopManager();
  }

  return {
    async unlock() {
      context ??= new AudioContextCtor();
      ensureGraph();
      if (typeof context.resume === 'function' && context.state !== 'running') {
        await context.resume();
      }
      scheduleBgm();
    },
    setMuted(value) {
      muted = Boolean(value);
      setGainValue(masterGain, muted ? 0 : 0.7, context?.currentTime ?? 0);
      setGainValue(bgmGain, muted ? 0 : 0.12, context?.currentTime ?? 0);
    },
    isMuted() {
      return muted;
    },
    play(event) {
      if (muted || !context || !ensureGraph()) {
        return;
      }

      const config = SOUND_CONFIG[event];
      if (config) {
        playTone(config);
      }
    },
    destroy() {
      if (bgmTimer) {
        globalThis.clearInterval(bgmTimer);
        bgmTimer = null;
      }
      context?.close?.();
      context = null;
      masterGain = null;
      bgmGain = null;
    },
  };
}
