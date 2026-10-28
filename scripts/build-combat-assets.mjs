import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const ids = ['crystal-gates', 'industrial-void', 'signal-monoliths', 'gravity-well', 'abyssal-beast', 'solar-forge'];
const replacements = new Set(['crystal-gates', 'signal-monoliths', 'abyssal-beast', 'solar-forge']);
const hashes = [];
async function approvedCopy(from, to) {
  await copyFile(new URL(from, root), new URL(to, root));
  const hash = async (file) => createHash('sha256').update(await readFile(new URL(file, root))).digest('hex');
  const sourceHash = await hash(from);
  assert.equal(await hash(to), sourceHash, `Approved bytes changed: ${to}`);
  hashes.push({ source: from, file: to, sha256: sourceHash });
}
await mkdir(new URL('public/assets/audio/roar/', root), { recursive: true });
for (const id of ids) {
  if (replacements.has(id)) await approvedCopy(
    `.memory/previews/2026-10-27-boss-redesign/${id}-candidate.png`,
    `public/assets/game/stages/${id}/boss-evolved.png`,
  );
  await approvedCopy(`.memory/previews/2026-10-28-portal-destination-ornaments/${id}-ornaments.png`,
    `public/assets/game/stages/${id}/portal-ornaments.png`);
  await approvedCopy(`.memory/previews/2026-10-27-boss-animation/audio/${id}-roar.wav`,
    `public/assets/audio/roar/${id}.wav`);
}
const scope = { window: {} };
vm.runInNewContext(await readFile(new URL('.memory/previews/2026-10-27-boss-animation/rigs.js', root), 'utf8'), scope);
const rigs = Object.fromEntries(scope.window.BOSS_ANIMATION_RIGS.map(({ src, detail, version, ...rig }) => [rig.id, rig]));
assert.deepEqual(Object.keys(rigs), ids);
await writeFile(new URL('src/game/boss-rigs.js', root),
  `// Generated from approved review rigs by node scripts/build-combat-assets.mjs.\nexport const BOSS_RIGS = Object.freeze(${JSON.stringify(rigs, null, 2)});\n`);
const synth = await readFile(new URL('.memory/previews/2026-10-27-boss-animation/roar-synthesis.js', root), 'utf8');
const start = synth.indexOf('  const profiles =');
const end = synth.lastIndexOf('  globalThis.BossRoarSynth=');
assert(start >= 0 && end > start);
await writeFile(new URL('src/audio/boss-roar-synth.js', root),
  '// Generated from the exact approved roar sound source; no runtime review dependency.\n'
  + synth.slice(start, end)
  + '\nexport { profiles as ROAR_PROFILES, duration as ROAR_DURATION_SECONDS, synthesize as synthesizeBossRoar, wavBytes as encodeRoarWav };\n');
await writeFile(new URL('public/assets/game/combat-assets.json', root), JSON.stringify({ approved: '2026-10-28', assets: hashes }, null, 2) + '\n');
console.log(`Packaged ${hashes.length} exact approved assets, six normalized rigs and original roar synthesis.`);
