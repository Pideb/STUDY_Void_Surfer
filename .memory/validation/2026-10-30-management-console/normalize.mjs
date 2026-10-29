import fs from 'node:fs';
var file='docs/management/browser.js',s=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
s=s.replaceAll('壁 이동 속도','벽 이동 속도').replaceAll("+c.lift+' px/s'","+fmt(c.lift)+' px/s'").replace('c.name,c.gravity,c.lift,c.normalSpawn','c.name,fmt(c.gravity),fmt(c.lift),c.normalSpawn');
fs.writeFileSync(file,s.split('\n').map(line=>line.trimEnd()).join('\n').trimEnd()+'\n');
