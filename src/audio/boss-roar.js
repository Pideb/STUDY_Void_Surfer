import { ROAR_PROFILES, synthesizeBossRoar } from './boss-roar-synth.js';

/** Build the approved mono PCM synchronously; never fetch or decode a late cue. */
export function createBossRoarBuffer(context, stageId) {
  if (typeof context?.createBuffer !== 'function') return null;
  const id = ROAR_PROFILES.some((profile) => profile.id === stageId) ? stageId : ROAR_PROFILES[0].id;
  const rate = Number.isInteger(context.sampleRate) && context.sampleRate >= 8000 && context.sampleRate <= 192000
    ? context.sampleRate : 44100;
  const samples = synthesizeBossRoar(id, rate);
  const buffer = context.createBuffer(1, samples.length, rate);
  if (typeof buffer?.getChannelData !== 'function') return null;
  buffer.getChannelData(0).set(samples);
  return buffer;
}
