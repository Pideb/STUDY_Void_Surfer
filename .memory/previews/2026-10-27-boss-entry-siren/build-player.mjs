import { readFile, writeFile } from 'node:fs/promises';

const directory = new URL('./', import.meta.url);
const samples = JSON.parse(await readFile(new URL('samples.json', directory), 'utf8'));
const base = await readFile(new URL('../2026-10-27-stage-bgm/player.template.html', directory), 'utf8');
const head = base.split('<body>')[0]
  .replace(/<title>.*?<\/title>/, '<title>VOID SURFER · 보스 진입 사이렌 비교</title>')
  .replace('</style>', `
    .tracks { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .content { padding: 22px; }
    h2 { font-size: 23px; min-height: 62px; }
    .description { min-height: 76px; }
    .badge { display: inline-block; color: #b6ffe2; font-size: 12px; margin: 0 0 8px; }
    .listen-row { border-top: 1px solid #2a3649; padding-top: 14px; margin-top: 16px; }
    .listen-label { margin: 0 0 8px; color: #d2deee; font-size: 13px; }
    .is-current .listen-label { color: #aff1ff; }
    .timeline { margin: 26px 0 0; color: #b1c0d5; padding: 16px 20px; border-left: 2px solid #809dbb; background: #101928; }
    @media (max-width: 960px) { .tracks { grid-template-columns: 1fr; } h2, .description { min-height: 0; } }
  </style>`);
const cards = samples.map((sample) => `
  <article><div class="content">
    <span class="badge">${sample.recommended ? '추천 · 아케이드 스타일' : '비교 시안'}</span>
    <h2>${sample.title}</h2>
    <p class="metadata">1.5초 · 3회 반복 · 오리지널 경고음</p>
    <p class="description">${sample.description}</p>
    <div class="listen-row"><p class="listen-label">경고음만 듣기</p>
      <audio controls preload="metadata" src="${sample.file}" data-kind="siren" data-title="${sample.title} · 경고음" aria-label="${sample.title} 경고음만 듣기"></audio>
      <a class="download" href="${sample.file}" download>WAV 다운로드</a>
    </div>
    <div class="listen-row"><p class="listen-label">일반곡 → 경고음 → 보스곡</p>
      <audio controls preload="metadata" src="${sample.contextFile}" data-kind="context" data-title="${sample.title} · BGM 연결 예시" aria-label="${sample.title} BGM 연결 예시"></audio>
      <a class="download" href="${sample.contextFile}" download>연결 예시 다운로드</a>
    </div>
  </div></article>`).join('');

const html = `${head}<body>
  <a class="skip" href="#tracks">사이렌 목록으로 이동</a>
  <main>
    <header>
      <div class="eyebrow">VOID SURFER / SOUND STUDY 03</div>
      <h1>보스가 오기 직전, 세 번의 경고</h1>
      <p>짧게 세 번 울리는 보스 진입 사이렌 시안입니다. 경고음만 듣거나 BGM 사이에 연결한 예시로 비교할 수 있습니다. 특정 게임의 원본 녹음을 사용하지 않은 새 효과음이며, 아직 게임에는 적용되지 않았습니다.</p>
    </header>
    <section aria-label="재생 도구"><div class="toolbar">
      <button id="play-sirens" type="button">경고음 3개 비교 듣기</button>
      <button id="play-contexts" class="secondary" type="button">BGM 연결 예시 이어 듣기</button>
      <button id="stop-all" class="secondary" type="button">전체 정지</button>
    </div><p id="play-status" role="status" aria-live="polite">원하는 시안의 ▶ 버튼을 눌러주세요.</p></section>
    <section id="tracks" class="tracks" aria-label="보스 진입 사이렌 시안">${cards}</section>
    <section class="timeline" aria-label="연결 예시 순서">연결 예시는 <strong>일반곡 3초 → 경고음 1.5초 → 보스곡 3.5초</strong> 순서입니다. 사이렌이 울릴 때 일반곡을 잠깐 낮춰 경고가 또렷이 들리게 했습니다.</section>
    <footer>기본 볼륨은 50%입니다. 한 시안을 재생하면 다른 시안은 멈춥니다. 번호와 의견은 대화창에 남겨주세요.</footer>
  </main>
  <script>
    const players = [...document.querySelectorAll('audio')];
    const status = document.querySelector('#play-status');
    let queue = [];
    let queueIndex = -1;
    let scheduledPlayer = null;
    function cancelQueue() { queue = []; queueIndex = -1; scheduledPlayer = null; }
    players.forEach((audio) => {
      const row = audio.closest('.listen-row');
      const card = audio.closest('article');
      audio.volume = 0.5;
      audio.addEventListener('play', () => {
        if (scheduledPlayer === audio) scheduledPlayer = null;
        else cancelQueue();
        players.forEach((other) => { if (other !== audio) other.pause(); });
        row.classList.add('is-current'); card.classList.add('is-playing');
        status.textContent = audio.dataset.title;
      });
      audio.addEventListener('pause', () => { row.classList.remove('is-current'); card.classList.remove('is-playing'); });
      audio.addEventListener('ended', () => {
        row.classList.remove('is-current'); card.classList.remove('is-playing');
        if (queue[queueIndex] === audio && queueIndex + 1 < queue.length) {
          queueIndex += 1; start(queue[queueIndex]);
        } else { cancelQueue(); status.textContent = '재생이 끝났습니다. 대화창에서 원하는 번호를 알려주세요.'; }
      });
      audio.addEventListener('error', () => {
        cancelQueue(); status.textContent = '오디오를 불러오지 못했습니다. 같은 폴더의 WAV 파일을 확인해주세요.';
      });
    });
    async function start(audio) {
      scheduledPlayer = audio; audio.currentTime = 0;
      try { await audio.play(); }
      catch { cancelQueue(); status.textContent = '시안의 재생 버튼을 직접 눌러주세요.'; }
    }
    function playlist(kind) {
      queue = players.filter((audio) => audio.dataset.kind === kind);
      queueIndex = 0; start(queue[0]);
    }
    document.querySelector('#play-sirens').addEventListener('click', () => playlist('siren'));
    document.querySelector('#play-contexts').addEventListener('click', () => playlist('context'));
    document.querySelector('#stop-all').addEventListener('click', () => {
      cancelQueue(); players.forEach((audio) => { audio.pause(); audio.currentTime = 0; });
      status.textContent = '전체 정지';
    });
  </script>
</body></html>`;
await writeFile(new URL('preview.html', directory), html);
console.log('Built .memory/previews/2026-10-27-boss-entry-siren/preview.html');
