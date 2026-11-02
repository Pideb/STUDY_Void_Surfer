import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {collectGameCatalog} from './game-catalog.mjs';
import {portableAssets} from './management-assets.mjs';
import {readPreviewCatalog} from './preview-catalog.mjs';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function read(root,file){return fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');}
function json(value){return JSON.stringify(value).replace(/</g,'\\u003c');}
export function managementOutput(root=ROOT,releaseData){
  var release=releaseData||JSON.parse(read(root,'docs/management/releases.json'));
  var data={...collectGameCatalog(),generatedAt:release.documentationDate||'2026-10-30',gameFingerprint:release.gameFingerprint};
  var skeleton=read(root,'.agents/skills/visualize/references/skeleton.md').split('```html\n')[1].split('\n```')[0];
  skeleton=skeleton.replace('<html lang="en"','<html lang="ko"').replace('YOUR TITLE HERE','VOID SURFER · 게임 관리 레퍼런스 '+release.currentVersion);
  skeleton=skeleton.replace('  <main id="main-content">\n','').replace('  </main>\n  <script>','  <script>');
  skeleton=skeleton.replace('<!-- ADD CDN LIBRARIES HERE (Chart.js, Mermaid, etc.) -->','<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">\n<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>\n<script>if(typeof Chart!=="undefined"){Chart.defaults.animation = false;}</script>');
  skeleton=skeleton.replace('<!-- YOUR CONTENT HERE (use <section>, <header>, <article> for semantics) -->',read(root,'docs/management/content.html'));
  skeleton=skeleton.replace('</head>','<style>\n'+read(root,'docs/management/style.css')+'\n</style>\n</head>');
  skeleton=skeleton.replace("var savedTheme = localStorage.getItem('viz-theme');","var savedTheme; try { savedTheme=localStorage.getItem('viz-theme'); } catch(e) {}");
  skeleton=skeleton.replace("localStorage.setItem('viz-theme', t);","try { localStorage.setItem('viz-theme',t); } catch(e) {}");
  skeleton=skeleton.replace("document.getElementById('themeIcon').textContent = t === 'dark' ? '🌙' : '☀️';","document.getElementById('themeIcon').textContent = t === 'dark' ? '◐' : '◑';");
  skeleton=skeleton.replace('<span id="themeIcon">🌙</span>','<span id="themeIcon">◐</span>').replace('<span>📥</span>','<span aria-hidden="true">↓</span>').replace('<span>🖨️</span>','<span aria-hidden="true">▣</span>');
  skeleton=skeleton.replace('</body>','<script id="game-data" type="application/json">'+json(data)+'</script>\n<script id="release-data" type="application/json">'+json(release)+'</script>\n<script id="asset-data" type="application/json">'+json(portableAssets(root))+'</script>\n<script>\n'+read(root,'docs/management/lab-model.mjs').replace(/export /g,'')+'\n'+read(root,'docs/management/browser.js')+'\n</script>\n</body>');
  skeleton=skeleton.replace('<script id="game-data"','<script id="preview-catalog" type="application/json">'+json(readPreviewCatalog(root))+'</script>\n<script id="game-data"');
  return {html:skeleton.split('\n').map(line=>line.trimEnd()).join('\n').trimEnd()+'\n',data};
}
export function buildManagement(root=ROOT,{downloads=false}={}){var output=managementOutput(root);fs.writeFileSync(path.join(root,'docs/management/void-surfer-management.html'),output.html);fs.writeFileSync(path.join(root,'docs/management/game-data.json'),JSON.stringify(output.data,null,2)+'\n');if(downloads){var file=path.join(os.homedir(),'Downloads/void-surfer-management.html');fs.writeFileSync(file,output.html);}return output;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){var o=buildManagement(ROOT,{downloads:process.argv.includes('--downloads')});console.log('Management HTML generated · '+Buffer.byteLength(o.html)+' bytes');}
