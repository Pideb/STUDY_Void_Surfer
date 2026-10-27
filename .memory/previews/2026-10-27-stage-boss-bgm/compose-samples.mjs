import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tracks, createSession } from '../2026-10-27-stage-bgm/compose-samples.mjs';

const directory = new URL('./', import.meta.url);
const originalDirectory = new URL('../2026-10-27-stage-bgm/', import.meta.url);
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
const arrangements = [
  { title: 'Prism Overdrive', bpm: 136, description: '맑은 벨을 유지하면서 빠른 아르페지오와 강한 드럼을 겹친 전투 버전' },
  { title: 'Assembly Lockdown', bpm: 144, description: '기계적인 저음 리프와 금속음을 유지하고, 끊어 치는 베이스와 연타를 강화' },
  { title: 'Protocol Breach', bpm: 150, description: '신호 같은 선율에 촘촘한 펄스와 주고받는 응답 선율을 더한 전투 버전' },
  { title: 'Horizon Collapse', bpm: 116, description: '어두운 드론과 하강 음형 위로 다가오는 저음 맥동과 날카로운 타격음을 추가' },
  { title: 'Abyss Awakening', bpm: 128, description: '물결 같은 음색과 선율을 남기고, 깊은 박동과 빠른 구절로 긴박감을 강화' },
  { title: 'Helios Meltdown', bpm: 158, description: '밝은 전자 브라스를 유지하고 질주하는 베이스와 연속 드럼 필인으로 열기를 강화' },
];
await mkdir(directory, { recursive: true });
const metadata = [];
for (const [index, base] of tracks.entries()) {
  const original = await readFile(new URL(`${base.id}.wav`, originalDirectory));
  const regenerated = createSession(base, 2700 + index);
  if (hash(original) !== hash(regenerated.bytes)) throw new Error(`Approved normal audio changed: ${base.id}`);
  const boss = {
    ...base, ...arrangements[index], boss: true,
    parentTitle: base.title, parentBpm: base.bpm,
    parentFile: `../2026-10-27-stage-bgm/${base.id}.wav`,
  };
  const { bytes, metadata: entry } = createSession(boss, 3700 + index);
  await writeFile(new URL(entry.file, directory), bytes);
  metadata.push({ ...entry, status: 'approved-direction-pending-integration', parentDurationSeconds: regenerated.metadata.durationSeconds });
  console.log(`${entry.id}: ${entry.parentBpm} -> ${entry.bpm}BPM, ${entry.durationSeconds.toFixed(2)}s, ${entry.eventCount} events; normal WAV unchanged`);
}
await writeFile(new URL('samples.json', directory), JSON.stringify(metadata, null, 2) + '\n');
