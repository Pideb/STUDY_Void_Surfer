import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {VISUAL_ASSET_MANIFEST as manifest} from '../src/game/visual-assets.js';
export function assetEntries(){var out=[];for(var [id,url] of Object.entries(manifest.aircraft))out.push({id:'craft-'+id,url,cache:'craft-'+id+'.png'});
  var keys={background:'bg',boss:'boss',normalWall:'normal',specialWall:'special',projectile:'projectile',laser:'laser',portalOrnaments:'portal'};
  for(var [id,stage]of Object.entries(manifest.stages))for(var [key,suffix]of Object.entries(keys))out.push({id:id+'-'+suffix,url:stage[key],cache:id+'-'+suffix+(suffix==='bg'?'.jpg':'.png')});return out;}
export function portableAssets(root){
  var file=path.join(root,'docs/management/assets-cache.json'),cache=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
  return Object.fromEntries(assetEntries().map(item=>{var bytes=fs.readFileSync(path.join(root,'public',item.url)),sha=crypto.createHash('sha256').update(bytes).digest('hex'),old=cache[item.url];
    return [item.url,old?.sourceSha256===sha?old.dataUri:'data:image/png;base64,'+bytes.toString('base64')];}));
}
export function seedAssetCache(root){
  var cache={};for(var item of assetEntries()){var bytes=fs.readFileSync(path.join(root,'public',item.url));var thumb=path.join(process.env.LOCALAPPDATA??'', 'Temp/void-surfer-release-001-assets',item.cache);
    var optimized=fs.existsSync(thumb)?fs.readFileSync(thumb):bytes,mime=item.cache.endsWith('.jpg')&&fs.existsSync(thumb)?'image/jpeg':'image/png';
    cache[item.url]={sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),dataUri:'data:'+mime+';base64,'+optimized.toString('base64')};}
  fs.writeFileSync(path.join(root,'docs/management/assets-cache.json'),JSON.stringify(cache)+'\n');
}
