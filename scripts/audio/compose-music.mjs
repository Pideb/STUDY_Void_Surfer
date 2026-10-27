// Deterministic original scores and PCM renderer shared by previews and production.
const sampleRate = 24000;
const tau = Math.PI * 2;
const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
export const tracks = [
  {
    id: 'crystal-gates', title: 'Prism Drift', bpm: 112, color: '#8bd7ff',
    description: '맑은 벨과 넓게 퍼지는 패드, 가볍게 달리는 비트',
    character: 'bright', lead: 'bell',
    chords: [[50,57,61,66], [47,54,57,61], [43,50,54,57], [45,52,57,59]],
    melody: [[78,81,85,83,81,78,76,78], [78,73,76,78,81,78,76,73],
      [74,78,81,85,83,81,78,74], [76,81,83,85,88,85,83,81]],
  },
  {
    id: 'industrial-void', title: 'Cold Assembly', bpm: 120, color: '#ffad58',
    description: '낮게 끊기는 베이스와 금속 타격음, 묵직한 기계 리듬',
    character: 'machine', lead: 'pulse',
    chords: [[40,47,50], [40,47,52], [36,43,47], [38,45,48]],
    melody: [[64,null,67,64,null,62,64,null], [64,67,null,71,67,null,64,null],
      [60,null,67,63,null,60,58,null], [62,65,null,69,65,62,null,59]],
  },
  {
    id: 'signal-monoliths', title: 'Echo Protocol', bpm: 126, color: '#df70ff',
    description: '짧은 신스 신호가 교차하는 아르페지오와 선명한 전자 비트',
    character: 'signal', lead: 'pulse',
    chords: [[48,55,58,62], [53,60,63,67], [46,53,57,60], [43,50,55,62]],
    melody: [[72,79,74,82,79,74,77,79], [75,79,84,82,79,75,74,72],
      [74,77,81,84,81,77,74,69], [74,79,86,84,82,79,77,74]],
  },
  {
    id: 'gravity-well', title: 'Event Horizon', bpm: 92, color: '#b992ff',
    description: '공간감 있는 낮은 드론과 하강하는 음형, 느리고 긴장감 있는 박자',
    character: 'gravity', lead: 'soft',
    chords: [[37,44,51,56], [33,40,47,52], [30,37,44,49], [32,39,47,54]],
    melody: [[80,null,75,null,73,null,68,null], [76,null,73,71,null,68,null,64],
      [73,null,68,null,66,null,61,null], [75,71,null,68,null,66,63,null]],
  },
  {
    id: 'abyssal-beast', title: 'Bioluminescence', bpm: 104, color: '#62f1ee',
    description: '물결처럼 흔들리는 음색과 둥근 베이스, 신비롭고 어두운 분위기',
    character: 'abyss', lead: 'water',
    chords: [[38,45,53,57], [34,41,48,53], [31,38,45,50], [33,40,48,55]],
    melody: [[74,77,null,81,79,null,77,72], [77,null,74,72,69,null,65,69],
      [70,74,null,77,76,null,74,69], [72,76,79,null,81,79,null,76]],
  },
  {
    id: 'solar-forge', title: 'Helios Run', bpm: 138, color: '#ffb24f',
    description: '빠른 드럼과 전자 브라스, 앞으로 밀어붙이는 밝고 강한 추진감',
    character: 'solar', lead: 'brass',
    chords: [[45,52,57,60], [41,48,53,57], [48,55,60,64], [43,50,55,59]],
    melody: [[76,76,81,79,76,72,74,76], [77,81,84,81,77,76,72,69],
      [79,79,84,83,79,76,79,81], [83,81,79,76,74,79,83,86]],
  },
];

export function createSession(track, seed) {
  const beat = 60 / track.bpm;
  const boss = Boolean(track.boss);
  const loop = Boolean(track.loop);
  const bars = boss ? 12 : 8;
  const length = beat * bars * 4 + (loop ? 0 : 0.9);
  const left = new Float32Array(loop ? Math.round(length * sampleRate) : Math.ceil(length * sampleRate));
  const right = new Float32Array(left.length);
  let randomState = seed;
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  let eventCount = 0;

  function add(start, duration, render, level, pan = 0) {
    eventCount += 1;
    const first = Math.round(start * sampleRate);
    const count = loop ? Math.ceil(duration * sampleRate) : Math.min(Math.ceil(duration * sampleRate), left.length - first);
    const gainL = Math.sqrt((1 - pan) / 2) * level;
    const gainR = Math.sqrt((1 + pan) / 2) * level;
    for (let frame = 0; frame < count; frame += 1) {
      const value = render(frame / sampleRate, frame);
      const destination = (first + frame) % left.length;
      left[destination] += value * gainL;
      right[destination] += value * gainR;
    }
  }

  function note(startBeat, midi, beats, kind = 'soft', level = 0.1, pan = 0) {
    if (midi === null) return;
    const f = frequency(midi);
    const sustain = beat * beats;
    const release = kind === 'pad' ? 0.45 : kind === 'bell' ? 0.38 : 0.09;
    const duration = sustain + release;
    add(startBeat * beat, duration, (time) => {
      const phase = tau * f * time;
      const attack = Math.min(1, time / (kind === 'pad' ? 0.16 : 0.006));
      const tail = time < sustain ? 1 : Math.max(0, 1 - (time - sustain) / release);
      let value;
      let decay = 1;
      switch (kind) {
        case 'bell':
          value = Math.sin(phase) + 0.29 * Math.sin(phase * 2.01) * Math.exp(-time * 7)
            + 0.12 * Math.sin(phase * 3.98) * Math.exp(-time * 12);
          decay = Math.exp(-time * 4.2);
          break;
        case 'pulse':
          value = (Math.sin(phase) + 0.28 * Math.sin(phase * 3) + 0.12 * Math.sin(phase * 5)) / 1.4;
          decay = Math.exp(-time * 4);
          break;
        case 'brass':
          value = (Math.sin(phase) + 0.44 * Math.sin(phase * 2) + 0.18 * Math.sin(phase * 3)
            + 0.08 * Math.sin(phase * 4)) / 1.7;
          decay = 0.6 + 0.4 * Math.exp(-time * 10);
          break;
        case 'water':
          value = Math.sin(phase + 1.1 * Math.sin(phase * 2) * Math.exp(-time * 4));
          decay = Math.exp(-time * 2.4);
          break;
        case 'pad':
          value = (Math.sin(phase * 0.997) + Math.sin(phase * 1.003) + 0.2 * Math.sin(phase * 2)) / 2.2;
          value *= 0.88 + 0.12 * Math.sin(time * tau * 0.7);
          break;
        case 'bass':
          value = Math.tanh((Math.sin(phase) + 0.2 * Math.sin(phase * 2)) * 1.4) * 0.8;
          decay = 0.5 + 0.5 * Math.exp(-time * 8);
          break;
        default:
          value = Math.sin(phase) + 0.12 * Math.sin(phase * 2);
          decay = Math.exp(-time * 2.6);
      }
      return value * attack * tail * decay;
    }, level, pan);
  }

  function drum(startBeat, kind, level = 0.13, pan = 0) {
    const duration = kind === 'kick' ? 0.32 : kind === 'snare' ? 0.2 : 0.095;
    let lastNoise = 0;
    add(startBeat * beat, duration, (time) => {
      const noise = random() * 2 - 1;
      const high = noise - lastNoise;
      lastNoise = noise;
      const attack = Math.min(1, time / 0.0015);
      if (kind === 'kick') {
        return Math.sin(tau * (46 * time + 3.2 * (1 - Math.exp(-time * 30)))) * Math.exp(-time * 15) * attack;
      }
      if (kind === 'snare') {
        return (0.65 * high + 0.35 * Math.sin(tau * 182 * time)) * Math.exp(-time * 22) * attack;
      }
      if (kind === 'metal') {
        return (Math.sin(tau * 611 * time) + 0.45 * Math.sin(tau * 971 * time))
          * Math.exp(-time * 48) * attack;
      }
      return high * Math.exp(-time * 65) * attack;
    }, level, pan);
  }

  for (let bar = 0; bar < bars; bar += 1) {
    const start = bar * 4;
    const chord = track.chords[bar % 4];
    chord.forEach((pitch, index) => note(start, pitch + 12, 3.8, 'pad',
      track.character === 'machine' ? 0.023 : 0.038, (index % 2 ? 1 : -1) * 0.55));

    let bassPattern;
    switch (track.character) {
      case 'machine': bassPattern = [0,0.75,1.5,2,2.75,3.5]; break;
      case 'gravity': bassPattern = [0,2.5]; break;
      case 'abyss': bassPattern = [0,1.5,3]; break;
      case 'solar': bassPattern = [0,0.5,1,1.5,2,2.5,3,3.5]; break;
      default: bassPattern = [0,1,2,3];
    }
    if (boss) {
      bassPattern = track.character === 'machine'
        ? [0,0.5,0.75,1.5,2,2.5,2.75,3.5]
        : [0,0.5,1,1.5,2,2.5,3,3.5];
    }
    bassPattern.forEach((offset, index) => note(start + offset,
      chord[0] + (index % 4 === 3 ? 7 : 0), boss ? 0.28 : track.character === 'gravity' ? 1.6 : 0.4,
      'bass', boss ? 0.17 : 0.15));

    const melody = track.melody[bar % 4];
    melody.forEach((pitch, index) => {
      const held = track.character === 'gravity' ? 0.85 : track.character === 'solar' ? 0.36 : 0.42;
      const position = start + index / 2;
      note(position, pitch, held, track.lead, track.character === 'machine' ? 0.073 : 0.105, -0.12);
      if (pitch !== null && track.character !== 'machine') {
        note(position + 0.375, pitch, held * 0.7, track.lead, 0.028, 0.75);
      }
      if (boss && pitch !== null && index % 2 === 0) {
        // Retain the recognizable motif, adding a low octave response instead of a new tune.
        note(position + 0.25, pitch - 12, 0.16, 'brass', 0.048, 0.25);
      }
    });

    if (track.character === 'bright' || track.character === 'signal') {
      for (let step = 0; step < 16; step += 1) {
        const order = track.character === 'signal' ? [0,2,1,3,1,2,3,2] : [0,1,2,3];
        const pitch = chord[order[step % order.length] % chord.length] + 24;
        note(start + step / 4, pitch, 0.16, track.character === 'bright' ? 'bell' : 'pulse',
          0.035, step % 2 ? 0.5 : -0.5);
      }
    }
    if (track.character === 'gravity') {
      [0,0.75,1.5,2.25].forEach((offset, index) => note(start + offset,
        chord[chord.length - 1 - index % chord.length] + 24, 0.6, 'soft', 0.036, index % 2 ? 0.7 : -0.7));
    }
    if (track.character === 'abyss') {
      [0.5,1.75,3.25].forEach((offset, index) => note(start + offset,
        chord[(index + 1) % chord.length] + 24, 0.4, 'water', 0.045, index % 2 ? 0.65 : -0.65));
    }

    if (boss) {
      const order = track.character === 'gravity' ? [3,2,1,0] : [0,2,1,2];
      for (let step = 0; step < 16; step += 1) {
        const pitch = chord[order[step % 4] % chord.length] + 12;
        const kind = track.character === 'abyss' ? 'water' : 'pulse';
        note(start + step / 4, pitch, 0.12, kind, 0.043, step % 2 ? 0.4 : -0.4);
      }
      if (bar === 0 || bar === 8) {
        note(start, chord[0] - 12, 1.4, 'bass', 0.1);
        drum(start, 'metal', 0.045, -0.5);
      }
    }

    const slow = track.character === 'gravity' || track.character === 'abyss';
    const kicks = boss ? [0,0.75,1.5,2,2.75,3.5]
      : slow ? [0,2.75] : track.character === 'machine' ? [0,1.5,2,3.25] : [0,2,2.75];
    const snares = boss ? [1,3] : slow ? [2] : [1,3];
    kicks.forEach((offset) => drum(start + offset, 'kick', boss ? 0.28 : 0.26));
    snares.forEach((offset) => drum(start + offset, 'snare', boss ? 0.16 : slow ? 0.08 : 0.13, 0.08));
    for (let step = 0; step < (boss ? 16 : slow ? 4 : 8); step += 1) {
      drum(start + step / (boss ? 4 : slow ? 1 : 2), 'hat', 0.035 + (step % 2 ? 0 : 0.012), step % 2 ? 0.35 : -0.35);
    }
    if (track.character === 'machine') {
      [0.5,1.75,2.5,3.75].forEach((offset, index) => drum(start + offset, 'metal', 0.08, index % 2 ? 0.65 : -0.65));
    }
    if (track.character === 'solar' && bar % 2 === 1) {
      [3.25,3.5,3.75].forEach((offset) => drum(start + offset, 'snare', 0.06, -0.2));
    }
    if (boss && bar % 4 === 3) {
      [3,3.25,3.5,3.75].forEach((offset, index) => {
        drum(start + offset, 'snare', 0.07 + index * 0.02, index % 2 ? 0.2 : -0.2);
        note(start + offset, chord[0] + 12 + (index % 2 ? 7 : 0), 0.14, 'bass', 0.045);
      });
    }
  }

  // A quiet stereo room / ping-pong tail, rendered from the dry signal only.
  const dryL = left.slice();
  const dryR = right.slice();
  for (let frame = 0; frame < left.length; frame += 1) {
    for (const [seconds, amount] of [[0.19,0.11],[0.33,0.065],[0.47,0.03]]) {
      const delayed = frame - Math.round(seconds * sampleRate);
      const source = loop ? (delayed + left.length) % left.length : delayed;
      if (source >= 0) { left[frame] += dryR[source] * amount; right[frame] += dryL[source] * amount; }
    }
    const fade = loop ? 1 : Math.min(1, frame / (sampleRate * 0.03), (left.length - 1 - frame) / (sampleRate * 0.2));
    left[frame] *= fade;
    right[frame] *= fade;
  }
  if (loop) {
    // Bridge the sample-rounded bar boundary over 5ms without a silent fade-out.
    const bridge = Math.round(sampleRate * 0.005);
    for (const channel of [left, right]) {
      const first = channel[0];
      const last = channel[channel.length - 1];
      const join = (first + last) / 2;
      for (let frame = 0; frame < bridge; frame += 1) {
        const weight = (1 + Math.cos(Math.PI * frame / (bridge - 1))) / 2;
        channel[frame] += (join - first) * weight;
        channel[channel.length - 1 - frame] += (join - last) * weight;
      }
    }
  }
  let peak = 0;
  let energy = 0;
  for (let frame = 0; frame < left.length; frame += 1) {
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]));
    energy += left[frame] ** 2 + right[frame] ** 2;
  }
  const rms = Math.sqrt(energy / (left.length * 2));
  const gain = Math.min(0.84 / Math.max(peak, 0.001), (boss ? 0.15 : 0.14) / Math.max(rms, 0.001));
  const bytes = Buffer.alloc(44 + left.length * 4);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8); bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(2, 22);
  bytes.writeUInt32LE(sampleRate, 24); bytes.writeUInt32LE(sampleRate * 4, 28);
  bytes.writeUInt16LE(4, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(left.length * 4, 40);
  for (let frame = 0; frame < left.length; frame += 1) {
    bytes.writeInt16LE(Math.round(left[frame] * gain * 32767), 44 + frame * 4);
    bytes.writeInt16LE(Math.round(right[frame] * gain * 32767), 46 + frame * 4);
  }
  return { bytes, metadata: {
    ...track, durationSeconds: left.length / sampleRate, sampleRate,
    channels: 2, bitsPerSample: 16, eventCount, peak: peak * gain, rms: rms * gain,
    arrangement: boss ? 'boss' : 'stage', bars,
    file: `${track.id}.wav`, status: boss ? 'preview-awaiting-listening-approval' : 'approved-direction-pending-integration',
  } };
}

