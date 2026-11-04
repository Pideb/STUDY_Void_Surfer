import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
export function gameFingerprint(root){
  var files=[];function walk(dir){if(!fs.existsSync(path.join(root,dir)))return;for(var item of fs.readdirSync(path.join(root,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))){var name=dir+'/'+item.name;if(item.isDirectory())walk(name);else files.push(name);}}
  walk('src');walk('public');for(var name of ['index.html','package-lock.json','vite.config.js','vite.config.mjs'])if(fs.existsSync(path.join(root,name)))files.push(name);
  var hash=crypto.createHash('sha256');for(var file of files.sort()){var bytes=fs.readFileSync(path.join(root,file));if(/\.(?:js|mjs|json|css|html|svg|sql|txt)$/.test(file))bytes=Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n'));hash.update(file+'\n');hash.update(bytes);}
  var pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));hash.update(JSON.stringify({dependencies:pkg.dependencies,devDependencies:pkg.devDependencies,engines:pkg.engines}));return hash.digest('hex');
}
export function nextVersion(version,baseVersion='0.1'){
  if(!/^(?:0|[1-9]\d*)\.\d$/.test(baseVersion))throw Error('지원하지 않는 기준 버전: '+baseVersion);
  if(version===baseVersion)return baseVersion+'b';
  if(typeof version==='string'&&version.startsWith(baseVersion)){
    var sequence=version.slice(baseVersion.length);
    if(/^[a-z]+$/.test(sequence)){
      const letters=sequence.split('');let index=letters.length-1;
      while(index>=0&&letters[index]==='z'){letters[index]='a';index--;}
      if(index<0)letters.unshift('a');else letters[index]=String.fromCharCode(letters[index].charCodeAt(0)+1);
      return baseVersion+letters.join('');
    }
  }
  if(/^0\.01(?:v|-[a-z])?$/.test(version))return baseVersion;
  throw Error('지원하지 않는 버전: '+version+' · 기준 버전 변경은 사용자 요청이 필요합니다.');
}
