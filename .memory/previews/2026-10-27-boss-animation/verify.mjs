import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dir = path.dirname(fileURLToPath(import.meta.url));
const errors = [];
let draws = 0;
const dom = new JSDOM(await readFile(path.join(dir, 'preview.html'), 'utf8'), {
  url: 'http://localhost/preview.html', runScripts: 'outside-only',
});
const { window } = dom;
window.requestAnimationFrame = () => 1;
window.HTMLMediaElement.prototype.pause = function () {};
window.HTMLCanvasElement.prototype.getContext = function () {
  return new Proxy({}, {
    get: (_target, key) => {
      if (key === 'createRadialGradient') return (...args) => {
        assert(args.every(Number.isFinite)); assert(args[5] > 0);
        return { addColorStop() {} };
      };
      return (...args) => {
        if (key === 'drawImage') draws++;
        for (const n of args.filter(n => typeof n === 'number')) assert(Number.isFinite(n), `Nonfinite ${key}`);
      };
    },
    set: () => true,
  });
};
window.Image = class {
  set src(src) {
    this.file = path.resolve(dir, src);
    readFile(this.file).then(buffer => {
      assert.equal(buffer.toString('ascii', 1, 4), 'PNG');
      this.width = buffer.readUInt32BE(16); this.height = buffer.readUInt32BE(20);
      this.onload?.();
    }).catch(error => { errors.push(error); this.onerror?.(error); });
  }
};
window.eval(await readFile(path.join(dir, 'rigs.js'), 'utf8'));
window.eval(await readFile(path.join(dir, 'roar-synthesis.js'), 'utf8'));
window.eval(await readFile(path.join(dir, 'animation.js'), 'utf8'));
const preview = window.BossAnimationPreview;
assert.equal(preview.rigs.length, 6);
for (const [i, rig] of preview.rigs.entries()) {
  assert.equal(rig.src.includes('/public/'), [1, 3].includes(i), 'Approved old/new combination must stay exact');
  await access(path.resolve(dir, rig.src));
  for (const part of rig.parts) {
    for (const point of [...part.poly, part.pivot]) assert(point.every(n => n >= 0 && n <= 1));
  }
  await preview.select(i); assert(preview.state.ready, rig.id);
  assert.match(window.document.querySelector('#audio-preview').src,new RegExp(rig.id+'-roar\\.wav$'));
  await access(path.join(dir,'audio',rig.id+'-roar.wav'));
  assert.equal(window.document.querySelector('#loading').hidden, true);
  for (const mode of ['auto', 'idle', 'attack', 'roar', 'hit']) {
    preview.setMode(mode);
    for (const time of [0, .1, .3, .4, .79, 1.1, 1.4, 2.3, 3.1, 5.4, 7.9]) {
      preview.state.time = time;
      for (const v of Object.values(preview.poseFor(preview.actionAt(time, mode), time))) assert(Number.isFinite(v));
      preview.draw();
    }
  }
  preview.state.actual = true; preview.draw(); preview.state.actual = false;
}
// Rapid selection must not display an earlier request after a later click.
await Promise.all([preview.select(1), preview.select(4), preview.select(5)]);
assert.equal(preview.state.index, 5); assert(preview.state.ready);
assert.match(window.document.querySelector('#name').textContent, /태양/);
assert.equal(window.document.querySelectorAll('#bosses button[aria-pressed=true]').length, 1);
assert.equal(errors.length, 0, errors.map(e => e.message).join('\n'));
assert(draws > 1000);
console.log(`PASS: 6 approved sprites, 18 asset paths, 330 pose samples, game-size rendering, rapid-selection guard (${draws} draw calls).`);
dom.window.close();
