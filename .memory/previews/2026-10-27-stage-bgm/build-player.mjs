import { readFile, writeFile } from 'node:fs/promises';

const directory = new URL('./', import.meta.url);
const [template, metadata] = await Promise.all([
  readFile(new URL('player.template.html', directory), 'utf8'),
  readFile(new URL('samples.json', directory), 'utf8'),
]);
await writeFile(new URL('preview.html', directory), template.replace('__SAMPLES__', metadata.trim()));
console.log('Built .memory/previews/2026-10-27-stage-bgm/preview.html');
