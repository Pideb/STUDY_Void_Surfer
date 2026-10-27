import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Original warning designs, not samples from an existing game's recording.
const directory = new URL('./', import.meta.url);
const sampleRate = 24000;
const duration = 1.5;
const starts = [0, 0.46, 0.92];
const burstDuration = 0.4;
const tau = 2 * Math.PI;
const variants = [
  {
    id: '01-sweep', title: '01 · 상승·하강 사이렌', recommended: true,
    description: '우웅— 우웅— 우웅— · 음이 올라갔다 내려오는 아케이드 경고음',
    character: 'sweep',
  },
  {
    id: '02-two-tone', title: '02 · 교대 경보', recommended: false,
    description: '삐뽀— 삐뽀— 삐뽀— · 두 음이 번갈아 울리는 선명한 경보',
    character: 'two-tone',
  },
  {
    id: '03-low-alert', title: '03 · 저음 비상 경보', recommended: false,
    description: '워엉— 워엉— 워엉— · 낮은 울림이 겹치는 묵직한 우주선 경보',
    character: 'low-alert',
  },
];

function normalize(samples, targetPeak, targetRms) {
  let peak = 0;
  let energy = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const frame = Math.floor(index / 2);
    const fade = Math.min(1, frame / (sampleRate * 0.012), (samples.length / 2 - 1 - frame) / (sampleRate * 0.025));
    samples[index] *= Math.max(0, fade);
    peak = Math.max(peak, Math.abs(samples[index]));
    energy += samples[index] ** 2;
  }
  const rms = Math.sqrt(energy / samples.length);
  const gain = Math.min(targetPeak / Math.max(peak, 0.001), targetRms / Math.max(rms, 0.001));
  for (let index = 0; index < samples.length; index += 1) samples[index] *= gain;
  return { peak: peak * gain, rms: rms * gain };
}

function encode(samples) {
  const bytes = Buffer.alloc(44 + samples.length * 2);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8); bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(2, 22);
  bytes.writeUInt32LE(sampleRate, 24); bytes.writeUInt32LE(sampleRate * 4, 28);
  bytes.writeUInt16LE(4, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(samples.length * 2, 40);
  for (let index = 0; index < samples.length; index += 1) {
    bytes.writeInt16LE(Math.round(samples[index] * 32767), 44 + index * 2);
  }
  return bytes;
}

async function readPcm(file) {
  const bytes = await readFile(new URL(file, directory));
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.readUInt32LE(24) !== sampleRate
    || bytes.readUInt16LE(20) !== 1 || bytes.readUInt16LE(22) !== 2 || bytes.readUInt16LE(34) !== 16
    || bytes.toString('ascii', 36, 40) !== 'data') throw new Error(`Unexpected preview PCM format: ${file}`);
  const pcm = new Float32Array((bytes.length - 44) / 2);
  for (let index = 0; index < pcm.length; index += 1) pcm[index] = bytes.readInt16LE(44 + index * 2) / 32768;
  return pcm;
}

function createSiren(character) {
  const samples = new Float32Array(Math.round(sampleRate * duration) * 2);
  for (const start of starts) {
    let phase = 0;
    const begin = Math.round(start * sampleRate);
    for (let frame = 0; frame < Math.round(burstDuration * sampleRate); frame += 1) {
      const time = frame / sampleRate;
      const progress = time / burstDuration;
      let pitch;
      if (character === 'sweep') pitch = 260 + 510 * Math.sin(Math.PI * progress);
      else if (character === 'two-tone') {
        const change = Math.max(0, Math.min(1, (progress - 0.46) / 0.08));
        pitch = 390 + 270 * change;
      } else pitch = 190 + 250 * Math.sin(Math.PI * progress) ** 0.7;
      phase += tau * pitch / sampleRate;
      const attack = Math.min(1, time / 0.014);
      const release = Math.min(1, (burstDuration - time) / 0.06);
      const envelope = attack * release * (0.75 + 0.25 * Math.sin(Math.PI * progress));
      let value = Math.sin(phase) + 0.25 * Math.sin(3 * phase) + 0.08 * Math.sin(5 * phase);
      if (character === 'low-alert') value = value * 0.72 + 0.46 * Math.sin(phase / 2);
      const offset = (begin + frame) * 2;
      samples[offset] += value * envelope * 0.65;
      samples[offset + 1] += value * envelope * 0.65;
    }
  }
  const levels = normalize(samples, 0.72, 0.23);
  return { samples, levels };
}

const normal = await readPcm('../2026-10-27-stage-bgm/crystal-gates.wav');
const boss = await readPcm('../2026-10-27-stage-boss-bgm/crystal-gates.wav');

function createContext(siren) {
  const samples = new Float32Array(sampleRate * 8 * 2);
  for (let frame = 0; frame < sampleRate * 8; frame += 1) {
    const time = frame / sampleRate;
    for (let channel = 0; channel < 2; channel += 1) {
      const index = frame * 2 + channel;
      let value = 0;
      if (time < 4.5) {
        let gain = time < 2.88 ? 0.85 : time < 3 ? 0.85 + (0.18 - 0.85) * (time - 2.88) / 0.12 : 0.18;
        if (time > 4.38) gain *= Math.max(0, (4.5 - time) / 0.12);
        value += (normal[index] ?? 0) * gain;
      }
      if (time >= 3 && time < 4.5) {
        const source = (frame - sampleRate * 3) * 2 + channel;
        value += (siren[source] ?? 0) * 0.9;
      }
      if (time >= 4.5) {
        const source = (frame - sampleRate * 4.5) * 2 + channel;
        value += (boss[source] ?? 0) * Math.min(1, (time - 4.5) / 0.18);
      }
      samples[index] = value;
    }
  }
  const levels = normalize(samples, 0.82, 0.18);
  return { samples, levels };
}

await mkdir(directory, { recursive: true });
const metadata = [];
for (const variant of variants) {
  const { samples, levels } = createSiren(variant.character);
  const context = createContext(samples);
  const file = `${variant.id}.wav`;
  const contextFile = `${variant.id}-with-bgm.wav`;
  await writeFile(new URL(file, directory), encode(samples));
  await writeFile(new URL(contextFile, directory), encode(context.samples));
  metadata.push({ ...variant, file, contextFile, durationSeconds: duration, pulses: starts.length,
    pulseStarts: starts, burstDurationSeconds: burstDuration, sampleRate, channels: 2,
    levels, contextDurationSeconds: 8, contextLevels: context.levels,
    contextSequence: { normal: [0,3], warning: [3,4.5], boss: [4.5,8] },
    status: 'preview-awaiting-listening-approval' });
  console.log(`${variant.id}: ${duration}s / ${starts.length} pulses; context 8s; peak ${levels.peak.toFixed(3)}`);
}
await writeFile(new URL('samples.json', directory), JSON.stringify(metadata, null, 2) + '\n');
