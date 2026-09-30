import { createButton, createIconButton, createPanel } from './components.js';
import { renderLeaderboardPanel } from './leaderboard-view.js';
import { VISUAL_ASSET_MANIFEST } from '../game/visual-assets.js';

function createMessage(text, className = 'screen-message') {
  const message = document.createElement('p');
  message.className = className;
  message.textContent = text;
  return message;
}

export function renderLoginScreen(model, handlers) {
  const panel = createPanel('VOID SURFER', 'login-screen');
  panel.append(createMessage('Microsoft 계정으로 로그인하고 최고 기록을 안전하게 보존하세요.'));

  if (model.error) {
    const error = createMessage(model.error, 'screen-message error-message');
    error.setAttribute('role', 'alert');
    panel.append(error);
  }
  if (model.connectionError) {
    const connection = createMessage('Supabase에 연결할 수 없어 게임을 시작할 수 없습니다.', 'screen-message error-message');
    connection.setAttribute('role', 'status');
    panel.append(connection);
  }

  panel.append(createButton(model.busy ? '로그인 중…' : 'Microsoft 계정으로 로그인', handlers.signIn, {
    className: 'primary-button',
    ariaLabel: 'Microsoft 계정으로 로그인',
  }));
  panel.lastElementChild.disabled = Boolean(model.busy);

  if (model.connectionError) {
    panel.append(createButton('다시 연결', handlers.retry, { className: 'secondary-button' }));
  }
  return panel;
}

export function renderMenuScreen(model, handlers) {
  const menu = document.createElement('section');
  menu.className = 'menu-overlay menu-screen';
  menu.setAttribute('aria-label', 'VOID SURFER 메뉴');

  const brand = document.createElement('div');
  brand.className = 'menu-brand';
  const title = document.createElement('h1');
  title.className = 'menu-wordmark';
  const titleImage = document.createElement('img');
  titleImage.className = 'menu-wordmark-image';
  titleImage.src = VISUAL_ASSET_MANIFEST.menuTitle;
  titleImage.alt = '';
  titleImage.setAttribute('aria-hidden', 'true');
  const titleFallback = document.createElement('span');
  titleFallback.className = 'sr-only menu-wordmark-fallback';
  titleFallback.textContent = 'VOID SURFER';
  titleImage.addEventListener('error', () => {
    title.classList.add('is-logo-unavailable');
    titleFallback.classList.remove('sr-only');
  }, { once: true });
  title.append(titleImage, titleFallback);
  const greeting = document.createElement('p');
  greeting.className = 'menu-greeting';
  const pilotName = document.createElement('strong');
  pilotName.textContent = model.displayName;
  greeting.append(pilotName, document.createTextNode(' 파일럿, 다시 도전하는 것을 환영합니다.'));
  const aircraft = document.createElement('p');
  aircraft.className = 'menu-aircraft-status';
  aircraft.textContent = `출격 기체 · ${model.selectedAircraft ?? 'DEFAULT'}`;
  brand.append(title, greeting, aircraft);

  const aircraftPreview = document.createElement('div');
  const aircraftId = VISUAL_ASSET_MANIFEST.aircraft[model.selectedAircraftId]
    ? model.selectedAircraftId
    : 'default';
  aircraftPreview.className = `menu-aircraft-preview menu-aircraft-preview-${aircraftId}`;
  aircraftPreview.setAttribute('role', 'img');
  aircraftPreview.setAttribute('aria-label', `선택 기체 ${model.selectedAircraft ?? 'DEFAULT'}`);
  const exhaust = document.createElement('span');
  exhaust.className = 'menu-aircraft-exhaust';
  exhaust.setAttribute('aria-hidden', 'true');
  const aircraftImage = document.createElement('img');
  aircraftImage.className = 'menu-aircraft-image';
  aircraftImage.src = VISUAL_ASSET_MANIFEST.aircraft[aircraftId];
  aircraftImage.alt = '';
  aircraftImage.setAttribute('aria-hidden', 'true');
  aircraftPreview.append(exhaust, aircraftImage);

  const actions = document.createElement('div');
  actions.className = 'menu-actions';
  actions.append(
    createButton('게임 시작', handlers.start, { className: 'primary-button' }),
    createButton('기체 선택', handlers.hangar, { className: 'secondary-button' }),
    createIconButton({
      label: model.muted ? '소리 켜기' : '음소거',
      icon: model.muted ? 'volume-off' : 'volume-on',
      onClick: handlers.toggleMute,
      className: 'secondary-button',
    }),
  );

  const accountActions = document.createElement('div');
  accountActions.className = 'account-actions';
  if (model.authError) {
    const error = createMessage(model.authError, 'screen-message error-message');
    error.setAttribute('role', 'alert');
    accountActions.append(error);
  }
  const accountButton = createButton(
    model.busy ? '로그인 중…' : model.signedIn === false ? '로그인' : '로그아웃',
    model.signedIn === false ? handlers.signIn : handlers.signOut,
    { className: 'text-button' },
  );
  accountButton.disabled = Boolean(model.busy);
  accountActions.append(accountButton);
  menu.append(brand, aircraftPreview, actions, accountActions);
  return menu;
}

export function renderHangarScreen({ aircraft = [], selectedAircraftId = 'default', bestScore = 0, recordLabel = '계정 최고 기록', loading = false, error = false } = {}, handlers = {}) {
  const screen = document.createElement('section');
  screen.className = 'hangar-screen';
  screen.setAttribute('aria-labelledby', 'hangar-title');
  const heading = document.createElement('h1');
  heading.id = 'hangar-title';
  heading.textContent = '기체 선택';
  const score = document.createElement('p');
  score.className = 'hangar-best-score';
  score.textContent = loading && !error && bestScore === 0
    ? `${recordLabel} 불러오는 중…`
    : `${recordLabel} ${bestScore}점`;
  score.setAttribute('aria-live', 'polite');
  screen.append(heading, score);
  if (error) {
    const status = createMessage('최고 기록을 불러오지 못해 기본 기체만 사용할 수 있습니다.', 'screen-message');
    status.setAttribute('role', 'status');
    screen.append(status);
  }

  const list = document.createElement('div');
  list.className = 'hangar-aircraft-list';
  for (const craft of aircraft) {
    const unlocked = Boolean(craft.unlocked);
    const selected = craft.id === selectedAircraftId;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `aircraft-option${unlocked ? '' : ' is-locked'}${selected ? ' is-selected' : ''}`;
    button.disabled = !unlocked;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${craft.name}${selected ? ', 선택됨' : ''}${unlocked ? '' : `, 최고 점수 ${craft.unlockBestScore}점에서 해금`}`);
    button.addEventListener('click', () => handlers.select?.(craft.id));

    const preview = document.createElement('img');
    preview.className = `aircraft-preview aircraft-preview-${craft.id}`;
    preview.src = craft.imageSrc ?? VISUAL_ASSET_MANIFEST.aircraft[craft.id] ?? VISUAL_ASSET_MANIFEST.aircraft.default;
    preview.alt = '';
    preview.setAttribute('aria-hidden', 'true');
    const title = document.createElement('strong');
    title.textContent = craft.name;
    const description = document.createElement('span');
    description.className = 'aircraft-description';
    description.textContent = craft.description;
    const performance = document.createElement('span');
    performance.className = 'aircraft-performance';
    performance.textContent = craft.stats;
    const lock = document.createElement('span');
    lock.className = 'aircraft-lock-reason';
    lock.textContent = loading && !craft.unlocked
      ? '계정 기록 확인 중'
      : unlocked ? (selected ? '현재 선택' : '선택 가능') : `최고 점수 ${craft.unlockBestScore}점에서 해금`;
    button.append(preview, title, description, performance, lock);
    list.append(button);
  }
  screen.append(list);
  screen.append(createButton('뒤로가기', handlers.back, { className: 'secondary-button' }));
  return screen;
}

export function renderTutorialScreen(_model, handlers) {
  const panel = createPanel('출격 전 안내', 'tutorial-screen');
  const list = document.createElement('ul');
  list.className = 'tutorial-list';
  for (const instruction of [
    '클릭/터치: 위로 상승',
    'SPACE: 대시 (회피)',
    '특수 벽은 정확한 타이밍의 SPACE 대시로만 통과합니다',
    '보스 투사체를 정확한 타이밍에 SPACE 대시로 반사해 BOSS HP를 0으로 만들면 클리어합니다.',
    'P/Esc 또는 일시정지 버튼: 일시정지 (-10점)',
  ]) {
    const item = document.createElement('li');
    item.textContent = instruction;
    list.append(item);
  }
  const actions = document.createElement('div');
  actions.className = 'screen-actions';
  actions.append(
    createButton('출격하기', handlers.start, { className: 'primary-button' }),
    createButton('메인 메뉴', handlers.menu, { className: 'secondary-button' }),
  );
  panel.append(list, actions);
  return panel;
}

export function renderPausedScreen(model, handlers) {
  const panel = createPanel('일시정지', 'pause-screen');
  panel.append(
    createMessage(`현재 점수 ${model.score}`),
    createMessage('일시정지할 때마다 점수 10점이 차감되며, 이미 오른 속도는 내려가지 않습니다.'),
  );
  panel.append(
    createButton('계속하기', handlers.resume, { className: 'primary-button' }),
    createButton('메인 메뉴', handlers.menu, { className: 'secondary-button' }),
  );
  return panel;
}

export function renderGameOverScreen(model, handlers) {
  const panel = createPanel('비행 종료', 'game-over-screen');
  const score = document.createElement('p');
  score.className = 'final-score';
  score.textContent = model.aircraftId === 'velocity'
    ? `기본 점수 ${model.baseScore} × 1.5 = 최종 점수 ${model.score}`
    : `최종 점수 ${model.score}`;
  panel.append(score);

  const actions = document.createElement('div');
  actions.className = 'screen-actions';
  actions.append(
    createButton('재시작', handlers.restart, { className: 'primary-button' }),
    createButton('메인 메뉴', handlers.menu, { className: 'secondary-button' }),
  );
  panel.append(actions);

  if (model.submitState === 'saving') {
    panel.append(createMessage('점수를 저장하는 중입니다.'));
  } else if (model.submitState === 'saved') {
    panel.append(createMessage('점수가 계정에 등록되었습니다.'));
  } else if (model.submitError) {
    panel.append(createMessage(model.submitErrorMessage || '점수를 저장하지 못했습니다. 다시 시도해 주세요.', 'screen-message error-message'));
  }
  panel.append(renderLeaderboardPanel(model.leaderboard, handlers.retryLeaderboard));
  return panel;
}
