import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MUSIC_TRACKS } from '../../src/audio/music-manifest.js';
import { createBossEntryBuffer } from '../../src/audio/boss-entry-siren.js';
import { ROAR_PROFILES, synthesizeBossRoar } from '../../src/audio/boss-roar-synth.js';

describe('approved audio assets', () => {
  it('reproduces all six approved .8-second boss roar recordings', () => {
    const hashes = new Set();
    for (const profile of ROAR_PROFILES) {
      const wav = readFileSync(`public/assets/audio/roar/${profile.id}.wav`);
      const samples = synthesizeBossRoar(profile.id, 44100);
      expect(samples.length).toBe(35280);
      expect(wav.length).toBe(44 + samples.length * 2);
      let error = 0;
      for (let i = 0; i < samples.length; i++) error = Math.max(error, Math.abs(samples[i] - wav.readInt16LE(44 + i * 2) / 32767));
      expect(error).toBeLessThan(2 / 32767);
      hashes.add(createHash('sha256').update(wav).digest('hex'));
    }
    expect(hashes.size).toBe(6);
  });
  it('ships twelve distinct exact-bar stereo loops without silent tails or a large seam jump', () => {
    const hashes = new Set();
    expect(Object.keys(MUSIC_TRACKS)).toHaveLength(6);
    for (const scene of Object.values(MUSIC_TRACKS)) {
      for (const [mode, track] of Object.entries(scene)) {
        const wav = readFileSync(path.resolve('public', track.url.slice(1)));
        expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
        expect(wav.readUInt16LE(22)).toBe(2);
        expect(wav.readUInt32LE(24)).toBe(24000);
        expect(wav.readUInt16LE(34)).toBe(16);
        const frames = (wav.length - 44) / 4;
        expect(Math.abs(frames / 24000 - track.bars * 4 * 60 / track.bpm)).toBeLessThan(1 / 24000);
        expect(track.bars).toBe(mode === 'boss' ? 12 : 8);
        for (const channel of [0, 1]) {
          const jump = Math.abs(wav.readInt16LE(44 + channel * 2) - wav.readInt16LE(wav.length - 4 + channel * 2));
          expect(jump / 32768).toBeLessThan(0.04);
        }
        const lastSecond = wav.subarray(wav.length - 24000 * 4);
        let energy = 0;
        for (let index = 0; index < lastSecond.length; index += 2) energy += (lastSecond.readInt16LE(index) / 32768) ** 2;
        expect(Math.sqrt(energy / (lastSecond.length / 2))).toBeGreaterThan(0.025);
        hashes.add(createHash('sha256').update(wav).digest('hex'));
      }
    }
    expect(hashes.size).toBe(12);
  });

  it('reproduces the approved three-pulse entrance siren at runtime', () => {
    const wav = readFileSync(path.resolve('public/assets/audio/boss-entry.wav'));
    const channels = [new Float32Array(36000), new Float32Array(36000)];
    createBossEntryBuffer({ sampleRate: 24000, createBuffer: () => ({ getChannelData: (index) => channels[index] }) });
    expect(wav.length).toBe(44 + 36000 * 4);
    let error = 0;
    for (let frame = 0; frame < 36000; frame += 1) {
      error = Math.max(error, Math.abs(channels[0][frame] - wav.readInt16LE(44 + frame * 4) / 32767));
      expect(channels[0][frame]).toBe(channels[1][frame]);
    }
    expect(error).toBeLessThan(2 / 32767);
  });
});
