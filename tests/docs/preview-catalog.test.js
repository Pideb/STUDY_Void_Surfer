import fs from 'node:fs';import path from 'node:path';import {describe,it,expect} from 'vitest';
import {ROOT,managementOutput} from '../../scripts/build-management.mjs';
import {readPreviewCatalog,validatePreviewCatalog} from '../../scripts/preview-catalog.mjs';
const browser=fs.readFileSync(path.join(ROOT,'docs/management/browser.js'),'utf8');
const guard=browser.slice(browser.indexOf('function localArchiveAllowed'),browser.indexOf('function renderPreviewArchive'));
const renderer=browser.slice(browser.indexOf('function renderPreviewArchive'),browser.indexOf('\nfunction craft'));
describe('local preview archive',()=>{
 it('validates real paths and rejects duplicates, escape and missing dependencies',()=>{
 const catalog=readPreviewCatalog(ROOT);expect(catalog.entries.length).toBeGreaterThan(8);expect(()=>validatePreviewCatalog(ROOT,catalog)).not.toThrow();
 const altered=entry=>({...catalog,entries:[entry]});const entry=catalog.entries[0];expect(()=>validatePreviewCatalog(ROOT,{...catalog,entries:[entry,entry]})).toThrow('entry');expect(()=>validatePreviewCatalog(ROOT,altered({...entry,path:'.memory/validation/../../package.json'}))).toThrow('Unsafe');expect(()=>validatePreviewCatalog(ROOT,altered({...entry,dependencies:['.memory/validation/missing.js']}))).toThrow('Missing');expect(()=>validatePreviewCatalog(ROOT,altered({...entry,path:'C:/Users/name/Downloads/test.html'}))).toThrow('Unsafe');
 });
 it('permits only original local document paths, not public copies or Downloads',()=>{
 const allowed=new Function(guard+'return localArchiveAllowed;')();
 expect(allowed(new URL('file:///C:/project/docs/management/void-surfer-management.html'))).toBe(true);expect(allowed(new URL('http://127.0.0.1:5173/docs/management/dev-review.html'))).toBe(true);expect(allowed(new URL('https://public.example/docs/management/a.html'))).toBe(false);expect(allowed(new URL('file:///C:/Users/name/Downloads/void-surfer-management.html'))).toBe(false);
 });
 it('filters status/search and strips all link DOM in remote mode',()=>{
 document.body.innerHTML='<p id="archiveNotice"></p><div id="archiveControls"></div><input id="archiveSearch"><select id="archiveStatus"><option value="all">all</option><option value="superseded">old</option></select><div id="previewArchive"></div><script id="preview-catalog" type="application/json"></script>';
 document.getElementById('preview-catalog').textContent=JSON.stringify(readPreviewCatalog(ROOT));
 const render=new Function('allowLocal','byId','escapeHtml',renderer.replace('var allowed=localArchiveAllowed(location)','var allowed=allowLocal')+'return renderPreviewArchive;');
 const byId=id=>document.getElementById(id),escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const show=render(true,byId,escapeHtml);show();expect(document.querySelectorAll('#previewArchive a').length).toBeGreaterThan(8);byId('archiveStatus').value='superseded';show();expect(document.querySelectorAll('#previewArchive a')).toHaveLength(1);byId('archiveSearch').value='no such example';show();expect(byId('previewArchive').textContent).toContain('없습니다');render(false,byId,escapeHtml)();expect(byId('archiveControls').hidden).toBe(true);expect(document.querySelectorAll('#previewArchive a')).toHaveLength(0);
 });
 it('injects only the small catalog and keeps it out of the public game guide',()=>{
 const html=managementOutput(ROOT).html;expect(html).toContain('id="preview-catalog"');expect(html).toContain('panel-archive');expect(html).toContain('Downloads');expect(fs.readFileSync(path.join(ROOT,'public/guide/index.html'),'utf8')).not.toMatch(/preview-catalog|\.memory\/validation/);expect(fs.existsSync(path.join(ROOT,'dist/.memory'))).toBe(false);expect(fs.existsSync(path.join(ROOT,'dist/docs/management/preview-catalog.json'))).toBe(false);
 });
});
