import { MUSIC_TRACKS, MENU_MUSIC_TRACK } from './music-manifest.js';

// Async loading never owns game state. Only the latest, unpaused selection may start.
export function createStageMusicPlayer(context, { destination, fetcher = globalThis.fetch, onPlaying = () => {} } = {}) {
  if (!context?.decodeAudioData || !context?.createBufferSource || !fetcher) return null;
  const decoded = new Map();
  const pending = new Map();
  const outgoing = new Set();
  let desired = null;
  let current = null;
  let paused = false;
  let destroyed = false;
  let generation = 0;
  let offset = 0;

  function load(url) {
    if (decoded.has(url)) return Promise.resolve(decoded.get(url));
    if (pending.has(url)) return pending.get(url);
    const request = Promise.resolve().then(() => fetcher(url))
      .then((response) => {
        if (!response.ok) throw new Error('Music asset unavailable');
        return response.arrayBuffer();
      })
      .then((bytes) => context.decodeAudioData(bytes))
      .then((buffer) => {
        if (!destroyed) decoded.set(url, buffer);
        return buffer;
      }).catch(() => null).finally(() => pending.delete(url));
    pending.set(url, request);
    return request;
  }

  function clean(voice) {
    voice.source.disconnect?.();
    voice.gain.disconnect?.();
    outgoing.delete(voice);
  }

  function stopVoice(voice, fade = false) {
    if (!voice) return;
    if (fade) {
      outgoing.add(voice);
      voice.gain.gain.setTargetAtTime?.(0, context.currentTime, 0.06);
    }
    try { voice.source.stop(context.currentTime + (fade ? 0.24 : 0)); } catch { /* Already ended. */ }
    if (!fade) clean(voice);
  }

  function silence() {
    const voice = current;
    current = null;
    stopVoice(voice);
    for (const old of [...outgoing]) stopVoice(old);
  }

  function start(buffer, ticket) {
    if (!buffer || destroyed || paused || ticket !== generation || !desired) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = buffer.duration;
    source.connect(gain); gain.connect(destination);
    if (gain.gain.setTargetAtTime) {
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(1, context.currentTime, 0.06);
    } else gain.gain.value = 1;
    const voice = { source, gain, startedAt: context.currentTime, offset: offset % buffer.duration, buffer };
    source.onended = () => clean(voice);
    source.start(context.currentTime, voice.offset);
    current = voice;
    onPlaying(true);
  }

  function prepare() {
    if (!desired || destroyed || paused) return;
    const ticket = generation;
    if (decoded.has(desired.url)) start(decoded.get(desired.url), ticket);
    else load(desired.url).then((buffer) => start(buffer, ticket));
  }

  return {
    async prepareTrack(sceneId, mode = 'gameplay') {
      const track = MUSIC_TRACKS[sceneId]?.[mode];
      if (destroyed || !track) return false;
      const buffer = await load(track.url);
      return Boolean(buffer) && !destroyed;
    },
    preloadScene(sceneId) {
      if (destroyed) return;
      const scene = MUSIC_TRACKS[sceneId];
      if (scene) for (const track of Object.values(scene)) void load(track.url);
    },
    select(sceneId, mode) {
      if (destroyed) return;
      const track = mode === 'menu' ? MENU_MUSIC_TRACK : MUSIC_TRACKS[sceneId]?.[mode];
      const nextKey = track ? (mode === 'menu' ? 'menu' : `${sceneId}:${mode}`) : null;
      if (nextKey === desired?.key) return;
      generation += 1;
      offset = 0;
      for (const voice of [...outgoing]) stopVoice(voice);
      const previous = current;
      current = null;
      // Departure must not leave a fading menu voice behind gameplay. Ordinary
      // stage/boss transitions retain their existing crossfade.
      stopVoice(previous, desired?.key !== 'menu');
      desired = track ? { key: nextKey, url: track.url } : null;
      onPlaying(false);
      prepare();
    },
    isPlaying() { return Boolean(current) && !paused; },
    pause() {
      if (paused) return;
      paused = true; generation += 1;
      if (current) offset = (current.offset + context.currentTime - current.startedAt) % current.buffer.duration;
      silence();
    },
    resume() {
      if (!paused || destroyed) return;
      paused = false; generation += 1; prepare();
    },
    stop() {
      generation += 1; desired = null; offset = 0; paused = false;
      silence();
    },
    destroy() {
      destroyed = true; generation += 1; desired = null;
      silence(); decoded.clear(); pending.clear();
    },
  };
}
