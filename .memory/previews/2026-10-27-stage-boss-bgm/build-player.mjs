import { readFile, writeFile } from 'node:fs/promises';

const directory = new URL('./', import.meta.url);
const [template, metadata] = await Promise.all([
  readFile(new URL('../2026-10-27-stage-bgm/player.template.html', directory), 'utf8'),
  readFile(new URL('samples.json', directory), 'utf8'),
]);
const head = template.split('<body>')[0]
  .replace('<title>VOID SURFER · 스테이지 BGM 시안</title>', '<title>VOID SURFER · 일반곡과 보스곡 비교</title>')
  .replace('</style>', `
    .listen-row { margin-top: 14px; padding-top: 12px; border-top: 1px solid #2a3649; }
    .listen-title { display: flex; gap: 8px; justify-content: space-between; flex-wrap: wrap; margin: 0 0 8px; }
    .listen-title span { color: #a2b5cd; font-size: 12px; }
    .listen-title strong { color: #e8f3ff; font-size: 13px; }
    .listen-row.boss .listen-title strong { color: #ffbd86; }
    .listen-row.is-current { border-top-color: #a7d9ff; }
    .download { margin-top: 5px; }
    .description { min-height: 66px; }
    @media (max-width: 640px) { .description { min-height: 0; } }
  </style>`);

const html = `${head}<body>
  <a class="skip" href="#tracks">음악 목록으로 이동</a>
  <main>
    <header>
      <div class="eyebrow">VOID SURFER / SOUND STUDY 02</div>
      <h1>같은 지역, 전투가 시작될 때</h1>
      <p>확정한 일반곡의 선율과 음색을 유지하면서 보스곡을 새로 편곡했습니다. 각 보스곡은 약 19~26초의 승인된 비교 시안입니다. 게임에는 같은 편곡의 반복 재생 버전이 적용되었습니다.</p>
    </header>
    <section aria-label="재생 도구">
      <div class="toolbar">
        <button id="play-bosses" type="button">보스곡 6곡 이어 듣기</button>
        <button id="play-pairs" class="secondary" type="button">일반 → 보스 비교 듣기</button>
        <button id="stop-all" class="secondary" type="button">전체 정지</button>
      </div>
      <p id="play-status" role="status" aria-live="polite">원하는 곡의 ▶ 버튼을 눌러주세요.</p>
    </section>
    <section id="tracks" class="tracks" aria-label="일반곡과 보스곡 비교"></section>
    <footer>기본 볼륨은 55%입니다. 다른 곡을 재생하면 앞의 곡은 멈춥니다. 보스곡은 원곡의 화성과 주요 선율을 유지하고, 드럼과 베이스의 밀도를 높였습니다.</footer>
  </main>
  <script>
    const samples = ${metadata.trim()};
    const grid = document.querySelector('#tracks');
    const status = document.querySelector('#play-status');
    const players = [];
    let queue = [];
    let queueIndex = -1;
    let scheduledPlayer = null;

    function cancelQueue() { queue = []; queueIndex = -1; scheduledPlayer = null; }

    samples.forEach((sample, index) => {
      const article = document.createElement('article');
      article.innerHTML = '<div class="art"><img alt="" src="../../../public/assets/game/stages/' + sample.id + '/boss-background.png"><span class="number">0' + (index + 1) + '</span><span class="stage">' + sample.id.replaceAll('-', ' ').toUpperCase() + '</span></div><div class="content"><h2>' + sample.title + '</h2><p class="description">' + sample.description + '</p></div>';
      const content = article.querySelector('.content');
      [
        { kind: 'normal', label: '일반곡 · 확정', title: sample.parentTitle, bpm: sample.parentBpm, duration: sample.parentDurationSeconds, file: sample.parentFile },
        { kind: 'boss', label: '보스곡 · 시안', title: sample.title, bpm: sample.bpm, duration: sample.durationSeconds, file: sample.file },
      ].forEach((entry) => {
        const row = document.createElement('div');
        row.className = 'listen-row ' + entry.kind;
        row.innerHTML = '<p class="listen-title"><strong>' + entry.label + '</strong><span>' + entry.bpm + ' BPM · ' + entry.duration.toFixed(1) + '초</span></p><audio controls preload="metadata" src="' + entry.file + '" aria-label="' + entry.title + ' ' + entry.label + '"></audio><a class="download" href="' + entry.file + '" download>WAV 다운로드</a>';
        const audio = row.querySelector('audio');
        audio.volume = 0.55;
        audio.dataset.kind = entry.kind;
        audio.dataset.stage = sample.id;
        const player = { audio, row, article, entry, index };
        players.push(player);
        audio.addEventListener('play', () => {
          if (scheduledPlayer === player) scheduledPlayer = null;
          else cancelQueue();
          players.forEach((other) => { if (other !== player) other.audio.pause(); });
          row.classList.add('is-current');
          article.classList.add('is-playing');
          status.textContent = '0' + (index + 1) + ' ' + entry.title + ' · ' + entry.label;
        });
        audio.addEventListener('pause', () => {
          row.classList.remove('is-current'); article.classList.remove('is-playing');
        });
        audio.addEventListener('ended', () => {
          row.classList.remove('is-current'); article.classList.remove('is-playing');
          if (queue[queueIndex] === player && queueIndex + 1 < queue.length) {
            queueIndex += 1; start(queue[queueIndex]);
          } else { cancelQueue(); status.textContent = '재생이 끝났습니다. 의견은 대화창에 남겨주세요.'; }
        });
        audio.addEventListener('error', () => {
          cancelQueue(); status.textContent = '음악 파일을 불러오지 못했습니다. 미리보기 폴더의 WAV 파일을 확인해주세요.';
        });
        content.append(row);
      });
      grid.append(article);
    });

    async function start(player) {
      scheduledPlayer = player;
      player.audio.currentTime = 0;
      try { await player.audio.play(); }
      catch { cancelQueue(); status.textContent = '곡의 재생 버튼을 직접 눌러주세요. 브라우저가 자동 재생을 제한할 수 있습니다.'; }
    }
    function playlist(list) {
      queue = list; queueIndex = 0; start(queue[0]);
    }
    document.querySelector('#play-bosses').addEventListener('click', () => playlist(players.filter((player) => player.entry.kind === 'boss')));
    document.querySelector('#play-pairs').addEventListener('click', () => playlist([...players]));
    document.querySelector('#stop-all').addEventListener('click', () => {
      cancelQueue();
      players.forEach((player) => { player.audio.pause(); player.audio.currentTime = 0; });
      status.textContent = '전체 정지';
    });
  </script>
</body>
</html>
`;
await writeFile(new URL('preview.html', directory), html);
console.log('Built .memory/previews/2026-10-27-stage-boss-bgm/preview.html');
