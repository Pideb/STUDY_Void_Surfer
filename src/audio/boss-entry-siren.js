// Same original sweep, envelope and level normalization as approved preview 01.
export function createBossEntryBuffer(context) {
  const rate = context.sampleRate || 24000;
  const samples = new Float32Array(Math.round(rate * 1.5));
  for (const start of [0, 0.46, 0.92]) {
    let phase = 0;
    const begin = Math.round(start * rate);
    for (let frame = 0; frame < Math.round(0.4 * rate); frame += 1) {
      const time = frame / rate;
      const progress = time / 0.4;
      phase += 2 * Math.PI * (260 + 510 * Math.sin(Math.PI * progress)) / rate;
      const envelope = Math.min(1, time / 0.014) * Math.min(1, (0.4 - time) / 0.06)
        * (0.75 + 0.25 * Math.sin(Math.PI * progress));
      samples[begin + frame] += (Math.sin(phase) + 0.25 * Math.sin(3 * phase) + 0.08 * Math.sin(5 * phase)) * envelope * 0.65;
    }
  }
  let energy = 0;
  let peak = 0;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] *= Math.max(0, Math.min(1, index / (rate * 0.012), (samples.length - 1 - index) / (rate * 0.025)));
    peak = Math.max(peak, Math.abs(samples[index]));
    energy += samples[index] ** 2;
  }
  const gain = Math.min(0.72 / Math.max(peak, 0.001), 0.23 / Math.max(Math.sqrt(energy / samples.length), 0.001));
  const buffer = context.createBuffer(2, samples.length, rate);
  for (let channel = 0; channel < 2; channel += 1) {
    const output = buffer.getChannelData(channel);
    for (let frame = 0; frame < samples.length; frame += 1) output[frame] = samples[frame] * gain;
  }
  return buffer;
}
