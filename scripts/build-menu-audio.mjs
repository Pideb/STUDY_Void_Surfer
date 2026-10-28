import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { renderMenuMusic } from './audio/compose-menu.mjs';

const root = new URL('../', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const approved = await readFile(new URL('.memory/previews/2026-10-28-menu-music-manual-fire/orbit-run.wav', root));
if (hash(renderMenuMusic().bytes) !== hash(approved)) throw new Error('Menu audition no longer matches approved ORBIT RUN');
const { bytes, metadata } = renderMenuMusic({ loop: true });
await mkdir(new URL('public/assets/audio/menu/', root), { recursive: true });
await writeFile(new URL('public/assets/audio/menu/orbit-run.wav', root), bytes);
const track = { url: '/assets/audio/menu/orbit-run.wav', title: 'ORBIT RUN', bpm: metadata.bpm,
  durationSeconds: metadata.durationSeconds, bars: metadata.bars, sampleRate: metadata.sampleRate, channels: metadata.channels };
const manifestUrl = new URL('src/audio/music-manifest.js', root);
const original = (await readFile(manifestUrl, 'utf8')).replace(/\nexport const MENU_MUSIC_TRACK =[\s\S]*$/, '');
await writeFile(manifestUrl, original.trimEnd() + '\n\nexport const MENU_MUSIC_TRACK = Object.freeze(' + JSON.stringify(track, null, 2) + ');\n');
console.log(`ORBIT RUN: ${metadata.durationSeconds.toFixed(3)}s / ${metadata.bpm}BPM / ${bytes.length} bytes; approved audition hash matched.`);
