import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const candidates = JSON.parse(await readFile(new URL('candidates.json', root), 'utf8'));
const descriptions = {
  'crystal-gates': ['수정 파편과 코어가 더 크게 구분되는 형태', '코어 셔터 개폐 · 주변 수정 회전 · 파편 발사'],
  'industrial-void': ['건물 같은 구조물을 줄인 공중 포격 플랫폼', '위·아래 포신 조준 · 발사 반동 · 후방 기관 회전'],
  'signal-monoliths': ['서 있는 인물형에서 수평 부유 신호 장치로 변경', '분리된 장갑판 전개 · 순차 점등 · 신호탄 발사'],
  'gravity-well': ['초승달 형태를 유지하고 분절과 위성을 명확하게 정리', '초승달 장갑 회전 · 위성 공전 · 렌즈 충전'],
  'abyssal-beast': ['머리와 턱을 크게 보이게 정리한 우주 심해 생물', '턱 개폐 · 지느러미 움직임 · 촉수와 꼬리의 파동'],
  'solar-forge': ['다리를 제거한 비행형 용광로 전함', '방열판 전개 · 코어 가열 · 포구 개폐와 반동'],
};
const rows = candidates.map((candidate) => {
  const [description, motion] = descriptions[candidate.id];
  return `<section class="comparison" aria-labelledby="${candidate.id}">
    <header><span class="eyebrow">${candidate.id.replaceAll('-', ' ').toUpperCase()}</span><h2 id="${candidate.id}">${candidate.name}</h2><p>${description}</p></header>
    <div class="pair" style="--stage-background:url('${candidate.backgroundFile}')">
      <figure><figcaption><strong>기존 디자인</strong><span>현재 게임에서 사용하는 실제 파일</span></figcaption><div class="viewport"><img src="${candidate.originalFile}" alt="${candidate.name} 기존 보스" loading="lazy"></div></figure>
      <figure><figcaption><strong>새 후보</strong><span>검토용 · 게임 적용 전</span></figcaption><div class="viewport"><img src="${candidate.candidateFile}" alt="${candidate.name} 새 보스 후보" loading="lazy"></div></figure>
    </div>
    <p class="motion"><strong>선택 후 만들 동작 예시</strong> ${motion}</p>
  </section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VOID SURFER · 보스 디자인 비교</title>
<style>
  :root{color-scheme:dark;font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif;color:#e9f0fa;background:#080e18}
  *{box-sizing:border-box}body{margin:0;padding:36px 24px 64px;line-height:1.6}main{max-width:1180px;margin:auto}
  h1{font-size:clamp(28px,4vw,44px);line-height:1.2;letter-spacing:-.04em;margin:8px 0 16px}h2{font-size:26px;margin:3px 0}
  p{color:#acbdd2;margin:0}.eyebrow{font-size:12px;letter-spacing:.12em;color:#98b4d3}
  .intro{max-width:840px}.controls{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0 30px}
  button{border:1px solid #374962;border-radius:7px;background:#172338;color:#e2ecfa;padding:10px 16px;font:inherit;cursor:pointer}
  button[aria-pressed=true]{background:#cee6ff;color:#102238;border-color:#cee6ff}button:focus-visible,a:focus-visible{outline:3px solid #83d8ff;outline-offset:3px}
  .comparison{padding-top:22px;border-top:1px solid #26344a;margin-top:28px}.comparison header{margin-bottom:16px}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{min-width:0;margin:0;border:1px solid #29384d;border-radius:10px;overflow:hidden;background:#0b1321}
  figcaption{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid #29384d}figcaption strong{font-size:16px}figcaption span{font-size:12px;color:#98aec7}
  .viewport{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;height:300px;padding:20px;overflow:hidden;background:#080e18}
  .viewport:before{content:"";position:absolute;inset:0;background-image:var(--stage-background);background-size:cover;background-position:center;opacity:.28;z-index:-1}
  .viewport img{display:block;width:100%;height:100%;object-fit:contain;position:relative}
  body.game-size .viewport img{width:192px;height:128px;object-fit:fill;flex:0 0 auto}
  body.no-background .viewport:before{display:none}.motion{font-size:14px;margin-top:14px}.motion strong{color:#d6e8fa;margin-right:8px}
  .note{margin-top:28px;color:#91a6c1;font-size:13px}a{color:#a4d4ff}.skip{position:absolute;top:-80px}.skip:focus{top:8px}
  @media(max-width:700px){body{padding:24px 14px 40px}.pair{grid-template-columns:1fr}.viewport{height:260px}figcaption{gap:3px}}
  @media print{.controls{display:none}.comparison{break-inside:avoid}.viewport{height:200px}}
</style></head><body><a class="skip" href="#comparisons">비교 이미지로 이동</a><main>
  <header class="intro"><span class="eyebrow">VOID SURFER / BOSS REDESIGN STUDY 01</span><h1>공중전 보스, 기존과 새 후보</h1><p>왼쪽은 실제 기존 이미지, 오른쪽은 새로 생성한 후보입니다. 색과 소재의 정체성을 유지하면서 공중형 실루엣과 움직일 부위를 정리했습니다. 아직 정지 이미지 시안이며, 게임 적용과 애니메이션 제작은 선택 후에 진행합니다.</p></header>
  <div class="controls" role="group" aria-label="표시 방식"><button type="button" id="large" aria-pressed="true">확대 비교</button><button type="button" id="game" aria-pressed="false">게임 표시 크기 · 192×128</button><button type="button" id="background" aria-pressed="true">스테이지 배경 켜짐</button></div>
  <div id="comparisons">${rows}</div>
  <p class="note">게임 표시 크기는 현재 렌더러의 이미지 사각형(192×128)을 따릅니다. 정지 이미지의 외형 선택 단계이며, 위에 적힌 동작은 다음에 제작할 애니메이션 방향입니다. 제작: 내장 imagegen · <a href="candidates.json">후보 목록과 전체 프롬프트</a></p>
</main><script>
  const large=document.querySelector('#large'), game=document.querySelector('#game'), background=document.querySelector('#background');
  function size(small){document.body.classList.toggle('game-size',small);game.setAttribute('aria-pressed',String(small));large.setAttribute('aria-pressed',String(!small));}
  large.addEventListener('click',()=>size(false));game.addEventListener('click',()=>size(true));
  background.addEventListener('click',()=>{const hidden=document.body.classList.toggle('no-background');background.setAttribute('aria-pressed',String(!hidden));background.textContent=hidden?'스테이지 배경 꺼짐':'스테이지 배경 켜짐';});
</script></body></html>`;
await writeFile(new URL('preview.html', root), html);
console.log('Built .memory/previews/2026-10-27-boss-redesign/preview.html');
