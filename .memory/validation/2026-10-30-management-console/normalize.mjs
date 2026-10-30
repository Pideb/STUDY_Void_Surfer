import fs from 'node:fs';import crypto from 'node:crypto';
var file='docs/management/browser.js',s=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
s=s.replaceAll('壁 이동 속도','벽 이동 속도').replaceAll("+c.lift+' px/s'","+fmt(c.lift)+' px/s'").replace('c.name,c.gravity,c.lift,c.normalSpawn','c.name,fmt(c.gravity),fmt(c.lift),c.normalSpawn');
s=s.replaceAll('+c.lift+','+fmt(c.lift)+').replaceAll('+c.gravity+','+fmt(c.gravity)+');
s=s.replace("['16 × 16','공통 피격 박스']","[C.PLAYER_HITBOX_SIZE+' × '+C.PLAYER_HITBOX_SIZE,'공통 피격 박스']").replace("['0.7초','SPACE 쿨타임']","[C.DASH_COOLDOWN_SECONDS+'초','SPACE 쿨타임']");
s=s.replace("function resetHit(){var c=", "function resetHit(){state.hitPlay=false;byId('hitPlay').textContent='벽 이동 재생';var c=");
fs.writeFileSync(file,s.split('\n').map(line=>line.trimEnd()).join('\n').trimEnd()+'\n');
var p='docs/management/releases.json',r=JSON.parse(fs.readFileSync(p,'utf8'));r.snapshotContentSha256=Object.fromEntries(Object.keys(r.snapshots).map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync('docs/releases/'+name,'utf8').replace(/\r\n/g,'\n')).digest('hex')]));fs.writeFileSync(p,JSON.stringify(r,null,2)+'\n');
