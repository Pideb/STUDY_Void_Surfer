import { AIRCRAFT_CATALOG } from '../game/aircraft.js';

const AIRCRAFT_ICONS = Object.freeze({ default: '✦', velocity: '➤', aegis: '⬟' });
const AIRCRAFT_PRESENTATION = Object.freeze({
  ...Object.fromEntries(AIRCRAFT_CATALOG.map(({ id, name }) => [
    id,
    Object.freeze({ name, icon: AIRCRAFT_ICONS[id] ?? '✦' }),
  ])),
});

function createLeaderboardTable(title, rows, emptyMessage) {
  const section = document.createElement('section');
  section.className = 'leaderboard-section';
  const heading = document.createElement('h2');
  heading.textContent = title;
  section.append(heading);

  if (!rows.length) {
    const message = document.createElement('p');
    message.textContent = emptyMessage;
    section.append(message);
    return section;
  }

  const table = document.createElement('table');
  const caption = document.createElement('caption');
  caption.className = 'sr-only';
  caption.textContent = title;
  table.append(caption);
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const label of ['순위', '파일럿', '기체', '점수']) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = label;
    headerRow.append(cell);
  }
  head.append(headerRow);
  table.append(head);

  const body = document.createElement('tbody');
  for (const row of rows) {
    const tableRow = document.createElement('tr');
    if (row.isCurrentUser) {
      tableRow.className = 'current-player-row';
      tableRow.setAttribute('aria-current', 'true');
    }
    const aircraft = AIRCRAFT_PRESENTATION[row.aircraftId] ?? AIRCRAFT_PRESENTATION.default;
    for (const value of [row.rank, row.displayName, `${aircraft.icon} ${aircraft.name}`, row.bestScore]) {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      tableRow.append(cell);
    }
    body.append(tableRow);
  }
  table.append(body);
  section.append(table);
  return section;
}

export function renderPilotRankingTable(rows = []) {
  const table = document.createElement('table');
  table.className = 'pilot-ranking-table';
  const caption = document.createElement('caption');
  caption.className = 'sr-only';
  caption.textContent = '전체 파일럿 순위';
  table.append(caption);
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const label of ['순위', '파일럿', '기체', '최고 점수']) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = label;
    headerRow.append(cell);
  }
  head.append(headerRow);
  table.append(head);

  const body = document.createElement('tbody');
  for (const row of rows) {
    const tableRow = document.createElement('tr');
    const aircraft = AIRCRAFT_PRESENTATION[row.aircraftId] ?? AIRCRAFT_PRESENTATION.default;
    for (const value of [row.rank, row.displayName, `${aircraft.icon} ${aircraft.name}`, row.bestScore]) {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      tableRow.append(cell);
    }
    body.append(tableRow);
  }
  table.append(body);
  return table;
}

function renderLeaderboardResult(title, result) {
  if (result?.loading) {
    const section = document.createElement('section');
    section.className = 'leaderboard-section';
    section.setAttribute('aria-busy', 'true');
    const heading = document.createElement('h2');
    heading.textContent = title;
    const message = document.createElement('p');
    message.textContent = '불러오는 중…';
    section.append(heading, message);
    return section;
  }
  if (result?.error) {
    const section = document.createElement('section');
    section.className = 'leaderboard-section error-message';
    section.setAttribute('role', 'status');
    const heading = document.createElement('h2');
    heading.textContent = title;
    const message = document.createElement('p');
    message.textContent = '불러오지 못했습니다.';
    section.append(heading, message);
    return section;
  }
  return createLeaderboardTable(title, result?.rows ?? [], '아직 표시할 기록이 없습니다.');
}

export function renderLeaderboardPanel(model = {}, onRetry = () => {}) {
  const panel = document.createElement('div');
  panel.className = 'leaderboard-panel';
  panel.setAttribute('aria-live', 'polite');
  panel.append(
    renderLeaderboardResult('TOP 10', model.top),
    renderLeaderboardResult('내 주변 순위', model.neighborhood),
  );

  if (model.top?.error || model.neighborhood?.error || model.submitError) {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'secondary-button';
    retry.textContent = '다시 시도';
    retry.setAttribute('aria-label', '리더보드 다시 시도');
    retry.addEventListener('click', onRetry);
    panel.append(retry);
  }
  return panel;
}
