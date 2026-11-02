import fs from 'node:fs';import path from 'node:path';
export function validatePreviewCatalog(root,catalog){
  if(catalog.schemaVersion!==1||!Array.isArray(catalog.entries))throw Error('Invalid preview catalog schema');
  const ids=new Set(),base=fs.realpathSync(root)+path.sep;
  const check=file=>{
    if(typeof file!=='string'||!file.startsWith('.memory/validation/')||file.includes('\\')||file.split('/').includes('..'))throw Error('Unsafe preview path');
    const resolved=path.resolve(root,file);if(!fs.existsSync(resolved)||!fs.statSync(resolved).isFile())throw Error('Missing preview dependency: '+file);
    if(!fs.realpathSync(resolved).startsWith(base))throw Error('Preview escapes project');
  };
  for(const entry of catalog.entries){
    if(!entry.id||ids.has(entry.id)||!['approved','superseded','comparison'].includes(entry.status)||typeof entry.requiresServer!=='boolean'||!Array.isArray(entry.dependencies)||!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)||typeof entry.title!=='string'||typeof entry.purpose!=='string')throw Error('Invalid preview entry');
    ids.add(entry.id);check(entry.path);if(!entry.path.endsWith('.html'))throw Error('Preview must be HTML');entry.dependencies.forEach(check);
  }
}
export function readPreviewCatalog(root){const file=path.join(root,'docs/management/preview-catalog.json');if(!fs.existsSync(file))return{schemaVersion:1,entries:[]};const catalog=JSON.parse(fs.readFileSync(file,'utf8'));validatePreviewCatalog(root,catalog);return catalog;}
