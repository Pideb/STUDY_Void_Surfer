import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const GUIDE_FILE='public/guide/index.html';
export function hasPlayerGuide(root=ROOT){
  const count=['guide-content.json','updates.json'].filter(file=>fs.existsSync(path.join(root,'docs/player',file))).length;
  if(count===1)throw Error('Player guide requires both manual source files');
  return count===2;
}
const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function text(value){if(typeof value!=='string'||!value.trim())throw Error('Invalid player guide text');return escape(value);}
export function playerGuideOutput(root=ROOT){
  const read=file=>JSON.parse(fs.readFileSync(path.join(root,'docs/player',file),'utf8'));
  const content=read('guide-content.json'),updates=read('updates.json');
  if(content.schemaVersion!==1||updates.schemaVersion!==1||!Array.isArray(content.controls)||!content.controls.length||!Array.isArray(content.notes)||!Array.isArray(updates.entries))throw Error('Invalid player guide schema');
  const controls=content.controls.map(row=>`<div class="control"><dt>${text(row.input)}</dt><dd>${text(row.description)}</dd></div>`).join('');
  const entries=updates.entries.map(entry=>{
    if(!Array.isArray(entry.body)||!entry.body.length||!/^\d{4}-\d{2}-\d{2}$/.test(entry.date))throw Error('Invalid player update schema');
    return `<article class="update"><h3 class="update-version">${text(entry.version)}</h3><p class="eyebrow">${text(entry.date)}</p>${entry.title===entry.version?'':`<p class="update-title">${text(entry.title)}</p>`}<ul>${entry.body.map(line=>`<li>${text(line)}</li>`).join('')}</ul></article>`;
  }).join('');
  let html=fs.readFileSync(path.join(ROOT,'.agents/skills/visualize/references/skeleton.md'),'utf8').replace(/\r\n/g,'\n').split('```html\n')[1].split('\n```')[0];
  // Keep the complete visualization skeleton, correcting its duplicate main wrapper.
  html=html.replace('<main id="main-content">','<div class="guide-shell">').replace('  </main>\n  <script>','  </div>\n  <script>');
  html=html.replace('lang="en"','lang="ko"').replace('YOUR TITLE HERE','VOID SURFER · 플레이 가이드');
  html=html.replace('<!-- ADD CDN LIBRARIES HERE (Chart.js, Mermaid, etc.) -->','<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">');
  html=html.replace('<!-- YOUR CONTENT HERE (use <section>, <header>, <article> for semantics) -->',`
    <header class="animate"><p class="eyebrow">VOID SURFER / FLIGHT MANUAL</p><h1>플레이 가이드</h1><p class="lead">틈을 읽고, 타이밍을 잡고,<br>다음 우주로 나아가세요.</p><nav aria-label="가이드 목차"><a href="#controls">기본 조작</a><a href="#notes">플레이 전 확인</a><a href="#updates">업데이트</a><a href="/">게임으로 돌아가기 ↗</a></nav></header>
    <section id="controls" class="animate delay-1"><p class="eyebrow">01 / CONTROLS</p><h2>기본 조작</h2><dl>${controls}</dl></section>
    <section id="notes" class="animate delay-2"><p class="eyebrow">02 / BEFORE FLIGHT</p><h2>플레이 전 확인</h2><ul class="notes">${content.notes.map(note=>`<li>${text(note)}</li>`).join('')}</ul></section>
    <section id="updates" class="animate delay-3"><p class="eyebrow">03 / FLIGHT LOG</p><h2>업데이트 내역</h2>${entries||'<p class="empty">업데이트 내역은 준비 중입니다.</p>'}</section>
    <footer>VOID SURFER · 안전한 비행을 기원합니다.</footer>`);
  html=html.replace('/* ===== ADD YOUR STYLES BELOW ===== */',`
    html.theme-dark{--bg:#080f1c;--surface:#101c2d;--surface-hover:#192d41;--border:#283e54;--text:#edf5fc;--text-secondary:#abc0d2;--accent:#83e6fb;--accent-secondary:#c8bbf7;}
    html.theme-light{--bg:#f5f8fc;--border:#cedbe8;--accent:#136174;}
    body{font-family:Inter,'Noto Sans KR',sans-serif;font-size:1rem;background:radial-gradient(ellipse at 100% 0%,var(--surface) 0,transparent 65%),var(--bg);}
    #main-content{max-width:1000px;margin:auto;padding:88px 36px 32px;}header{padding:24px 0 48px;border-bottom:1px solid var(--border);}h1{font-size:3.5rem;margin:16px 0 24px;}h2{font-size:2rem;margin:12px 0 28px;}h3{font-size:1.5rem;font-weight:600;margin:12px 0 20px;}.eyebrow{font-size:.75rem;font-weight:600;letter-spacing:.14em;color:var(--accent);}.lead{font-size:1.2rem;line-height:1.8;color:var(--text-secondary);}nav{display:flex;gap:12px 24px;flex-wrap:wrap;margin-top:28px;}a{color:var(--accent);text-underline-offset:5px;}a:hover{color:var(--text);}a:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:5px;}section{margin-top:64px;scroll-margin-top:30px;}.control{display:grid;grid-template-columns:190px 1fr;gap:24px;padding:24px 0;border-bottom:1px solid var(--border);}dt{font-weight:600;color:var(--accent);}dd{color:var(--text-secondary);line-height:1.8;}.notes{padding-left:22px;}.notes li,.update li{padding:8px 0;color:var(--text-secondary);}.empty{padding:28px;border:1px dashed var(--border);color:var(--text-secondary);}.update{padding:24px 0;}.update ul{padding-left:22px;}footer{margin-top:72px;padding:24px 0;color:var(--text-secondary);font-size:.8rem;border-top:1px solid var(--border);}
    .update-version{font-family:Inter,'Noto Sans KR',sans-serif;font-size:2.25rem;font-weight:800;letter-spacing:-.04em;margin:0 0 12px;}.update-title{font-weight:600;margin-top:16px;}
    @media(max-width:600px){#main-content{padding:80px 24px 24px;}h1{font-size:2.6rem;}.control{grid-template-columns:1fr;gap:12px;}nav{gap:16px;}section{margin-top:48px;}.update-version{font-size:2rem;}}
    @media(max-width:375px){body{overflow-x:hidden;}}
    @media print{.viz-menu,nav,.skip-link,.skip-to-content{display:none!important;}#main-content{padding:0;max-width:none;}*{color:#111!important;}section{break-inside:avoid;}header{padding-top:0;}}
  `);
  // Documents also work when browser storage is unavailable (private/file mode).
  html=html.replace("var savedTheme = localStorage.getItem('viz-theme');","var savedTheme; try { savedTheme = localStorage.getItem('viz-theme'); } catch(e) {}")
    .replace("localStorage.setItem('viz-theme', t);","try { localStorage.setItem('viz-theme', t); } catch(e) {}");
  return html+'\n';
}
export function buildPlayerGuide(root=ROOT,{check=false}={}){
  const output=playerGuideOutput(root),file=path.join(root,GUIDE_FILE);
  if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')!==output)throw Error('Player guide is stale; run npm run guide:build');}
  else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,output);}
  return {file:GUIDE_FILE,checked:check};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log(buildPlayerGuide(ROOT,{check:process.argv.includes('--check')}));}catch(error){console.error(error.message);process.exitCode=1;}
}
