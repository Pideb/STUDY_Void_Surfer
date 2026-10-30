import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
var r=JSON.parse(fs.readFileSync('docs/management/releases.json','utf8')),html=fs.readFileSync('docs/management/void-surfer-management.html','utf8'),embedded=JSON.parse(html.match(/id="release-data"[^>]*>([^<]+)</)[1]);
assert.equal(r.currentVersion,'0.01-b');assert.equal(r.nextVersion,'0.1');assert.equal(r.versionBase,'0.1');assert.deepEqual(embedded,r);
assert.ok(fs.readFileSync('docs/releases/void-surfer-latest.html','utf8').includes('다음 배포 예정: 0.1.'));
assert.deepEqual(fs.readFileSync('docs/management/void-surfer-management.html'),fs.readFileSync(path.join(os.homedir(),'Downloads/void-surfer-management.html')));
for(var [name,hash]of Object.entries(r.snapshots))assert.equal(crypto.createHash('sha256').update(fs.readFileSync('docs/releases/'+name)).digest('hex'),hash);
assert.equal(fs.existsSync('docs/releases/void-surfer-0.1.html'),false);
console.log('Version policy / both HTML / Downloads equality / unchanged archives passed. No future release created.');
