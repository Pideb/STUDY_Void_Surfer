import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { renderMenuMusic } from '../../scripts/audio/compose-menu.mjs';
import { MENU_MUSIC_TRACK } from '../../src/audio/music-manifest.js';

describe('selected ORBIT RUN composition', () => {
  it('exactly reproduces the approved audition and a non-silent seamless production loop', () => {
    const hash = bytes => createHash('sha256').update(bytes).digest('hex');
    expect(hash(renderMenuMusic().bytes)).toBe(hash(readFileSync('.memory/previews/2026-10-28-menu-music-manual-fire/orbit-run.wav')));
    const wav = readFileSync('public' + MENU_MUSIC_TRACK.url);
    expect(hash(wav)).toBe(hash(renderMenuMusic({ loop: true }).bytes));
    expect(wav.readUInt32LE(24)).toBe(22050); expect(wav.readUInt16LE(22)).toBe(2);
    expect((wav.length - 44) / 4 / 22050).toBeCloseTo(32 * 60 / 112, 5);
    for (const channel of [0, 1]) {
      expect(Math.abs(wav.readInt16LE(44 + channel * 2) - wav.readInt16LE(wav.length - 4 + channel * 2)) / 32768).toBeLessThan(.04);
    }
    let tail = 0, peak = 0;
    for (let i = 44; i < wav.length; i += 2) { const value = wav.readInt16LE(i) / 32768; peak = Math.max(peak, Math.abs(value)); if (i >= wav.length - 22050 * 4) tail += value * value; }
    expect(peak).toBeLessThan(.87); expect(Math.sqrt(tail / (22050 * 2))).toBeGreaterThan(.025);
  });
});
