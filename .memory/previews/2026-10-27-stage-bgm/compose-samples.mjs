import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { tracks, createSession } from '../../../scripts/audio/compose-music.mjs';
export { tracks, createSession };
const directory = path.dirname(fileURLToPath(import.meta.url));

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await mkdir(directory, { recursive: true });
  const metadata = [];
  for (const [index, track] of tracks.entries()) {
    const { bytes, metadata: entry } = createSession(track, 2700 + index);
    await writeFile(path.join(directory, entry.file), bytes);
    metadata.push(entry);
    console.log(`${entry.file}: ${entry.durationSeconds.toFixed(2)}s, ${entry.bpm}BPM, peak ${entry.peak.toFixed(3)}, RMS ${entry.rms.toFixed(3)}`);
  }
  await writeFile(path.join(directory, 'samples.json'), JSON.stringify(metadata, null, 2) + '\n');
}
