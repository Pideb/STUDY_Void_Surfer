import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
export function gameFingerprint(root){
  var files=[];function walk(dir){if(!fs.existsSync(path.join(root,dir)))return;for(var item of fs.readdirSync(path.join(root,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))){var name=dir+'/'+item.name;if(item.isDirectory())walk(name);else files.push(name);}}
  walk('src');walk('public');for(var name of ['index.html','package-lock.json','vite.config.js','vite.config.mjs'])if(fs.existsSync(path.join(root,name)))files.push(name);
  var hash=crypto.createHash('sha256');for(var file of files.sort()){var bytes=fs.readFileSync(path.join(root,file));if(/\.(?:js|mjs|json|css|html|svg|sql|txt)$/.test(file))bytes=Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n'));hash.update(file+'\n');hash.update(bytes);}
  var pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));hash.update(JSON.stringify({dependencies:pkg.dependencies,devDependencies:pkg.devDependencies,engines:pkg.engines}));return hash.digest('hex');
}
export function nextVersion(version){
  var match=/^(\d+)\.(\d+)(?:-([a-z]))?$/.exec(version);if(!match)throw Error('지원하지 않는 버전: '+version);
  if(!match[3])return match[1]+'.'+match[2]+'-a';if(match[3]!=='z')return match[1]+'.'+match[2]+'-'+String.fromCharCode(match[3].charCodeAt(0)+1);
  return match[1]+'.'+String(Number(match[2])+1).padStart(match[2].length,'0')+'-a';
}
