import { createButton, createIconButton, createPanel } from './components.js';
import { AIRCRAFT_CATALOG } from '../game/aircraft.js';
import { renderLeaderboardPanel, renderPilotRankingTable } from './leaderboard-view.js';
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

export function renderAdminSettingsDialog(model, handlers) {
  const dialog = document.createElement('section');
  dialog.className = 'admin-settings-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'admin-settings-title');

  const heading = document.createElement('h2');
  heading.id = 'admin-settings-title';
  heading.textContent = '관리자 테스트 설정';
  const disclaimer = createMessage('관리자 모드는 점수 저장을 건너뜁니다. 이 설정은 브라우저 안에서만 적용됩니다.');
  const adminLabel = document.createElement('label');
  const adminToggle = document.createElement('input');
  adminToggle.type = 'checkbox';
  adminToggle.checked = Boolean(model.adminModeEnabled);
  adminToggle.setAttribute('role', 'switch');
  adminToggle.setAttribute('aria-label', '관리자 모드');
  adminToggle.addEventListener('change', () => handlers.toggleAdminMode?.(adminToggle.checked));
  adminLabel.append(adminToggle, document.createTextNode(' 관리자 모드 (리더보드에 기록하지 않음)'));

  const invincibleLabel = document.createElement('label');
  const invincibleToggle = document.createElement('input');
  invincibleToggle.type = 'checkbox';
  invincibleToggle.checked = Boolean(model.invincibilityEnabled);
  invincibleToggle.setAttribute('role', 'switch');
  invincibleToggle.setAttribute('aria-label', '기체 무적');
  invincibleToggle.addEventListener('change', () => handlers.toggleInvincibility?.(invincibleToggle.checked));
  invincibleLabel.append(invincibleToggle, document.createTextNode(' 기체 무적 (화면 경계와 WASD 도전 실패는 유지)'));
  const hitboxLabel = document.createElement('label');
  const hitboxToggle = document.createElement('input');
  hitboxToggle.type = 'checkbox';
  hitboxToggle.checked = Boolean(model.showPlayerHitbox);
  hitboxToggle.setAttribute('role', 'switch');
  hitboxToggle.setAttribute('aria-label', '플레이어 히트박스 표시');
  hitboxToggle.addEventListener('change', () => handlers.togglePlayerHitbox?.(hitboxToggle.checked));
  hitboxLabel.append(hitboxToggle, document.createTextNode(' 플레이어 히트박스 표시 (관리자 모드에서만 적용)'));

  dialog.append(
    heading,
    disclaimer,
    adminLabel,
    invincibleLabel,
    hitboxLabel,
    createButton('닫기', handlers.close, { className: 'secondary-button' }),
  );
  return dialog;
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
    createButton('파일럿 랭킹', handlers.ranking, { className: 'secondary-button' }),
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
  if (model.adminEligible) {
    const adminTrigger = createButton('관리자 설정', handlers.openAdminSettings, { className: 'admin-settings-trigger' });
    adminTrigger.dataset.adminSettingsTrigger = 'true';
    menu.append(adminTrigger);
  }
  menu.append(brand, aircraftPreview, actions, accountActions);
  if (model.adminDialogOpen) {
    menu.append(renderAdminSettingsDialog(model, {
      close: handlers.closeAdminSettings,
      toggleAdminMode: handlers.toggleAdminMode,
      toggleInvincibility: handlers.toggleInvincibility,
      togglePlayerHitbox: handlers.togglePlayerHitbox,
    }));
  }
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
    '보스전에서는 10초마다 레이저가 충전됩니다. Ctrl/Shift 키로 발사하세요',
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
    createButton('파일럿 랭킹', handlers.ranking, { className: 'secondary-button' }),
    createButton('메인 메뉴', handlers.menu, { className: 'secondary-button' }),
  );
  panel.append(actions);

  if (model.submitState === 'saving') {
    panel.append(createMessage('점수를 저장하는 중입니다.'));
  } else if (model.submitState === 'saved') {
    panel.append(createMessage('점수가 계정에 등록되었습니다.'));
  } else if (model.submitState === 'admin-skipped') {
    panel.append(createMessage(model.submitErrorMessage || '관리자 테스트 점수는 리더보드에 저장되지 않습니다.', 'screen-message'));
  } else if (model.submitError) {
    panel.append(createMessage(model.submitErrorMessage || '점수를 저장하지 못했습니다. 다시 시도해 주세요.', 'screen-message error-message'));
  }
  panel.append(renderLeaderboardPanel(model.leaderboard, handlers.retryLeaderboard));
  return panel;
}

export function renderPilotRankingScreen(model = {}, handlers = {}) {
  const screen = createPanel('파일럿 랭킹', 'pilot-ranking-screen');
  const description = createMessage('전체 파일럿의 최고 기록을 순위별로 확인할 수 있습니다.');
  screen.append(description);

  const scrollRegion = document.createElement('div');
  scrollRegion.className = 'pilot-ranking-table-scroll';
  scrollRegion.tabIndex = 0;
  scrollRegion.setAttribute('role', 'region');
  scrollRegion.setAttribute('aria-label', '전체 파일럿 순위 표, 위아래로 스크롤 가능');
  if (model.rows?.length) scrollRegion.append(renderPilotRankingTable(model.rows));

  if (!model.rows?.length && model.loading) {
    scrollRegion.append(createMessage('순위를 불러오는 중…'));
    scrollRegion.setAttribute('aria-busy', 'true');
  } else if (!model.rows?.length && model.error) {
    scrollRegion.append(createMessage('순위를 불러오지 못했습니다.', 'screen-message error-message'));
  } else if (!model.rows?.length) {
    scrollRegion.append(createMessage('아직 등록된 파일럿 기록이 없습니다.'));
  }

  if (model.error && model.rows?.length) {
    const error = createMessage('추가 순위를 불러오지 못했습니다. 다시 시도해 주세요.', 'screen-message error-message');
    error.setAttribute('role', 'status');
    scrollRegion.append(error);
  }
  if (model.hasMore) {
    const loadMore = createButton(
      model.loading ? '불러오는 중…' : model.error ? '다시 시도' : '더 불러오기',
      handlers.loadMore,
      { className: 'secondary-button' },
    );
    loadMore.className = 'ranking-load-more secondary-button';
    loadMore.disabled = Boolean(model.loading);
    scrollRegion.append(loadMore);
  } else if (model.rows?.length) {
    scrollRegion.append(createMessage('모든 순위를 불러왔습니다.'));
  }
  screen.append(scrollRegion);

  const personal = document.createElement('section');
  personal.className = 'ranking-personal-record';
  personal.setAttribute('aria-label', '내 최고 기록');
  const personalHeading = document.createElement('h2');
  personalHeading.textContent = '내 최고 기록';
  personal.append(personalHeading);
  if (model.personalLoading) {
    personal.append(createMessage('개인 기록을 불러오는 중…'));
  } else if (model.personalError) {
    const error = createMessage('개인 기록을 불러오지 못했습니다.', 'screen-message error-message');
    error.setAttribute('role', 'status');
    personal.append(error);
  } else if (model.personalRecord) {
    const { rank, displayName, aircraftId, bestScore, guest } = model.personalRecord;
    const aircraft = AIRCRAFT_CATALOG.find((craft) => craft.id === aircraftId)
      ?? AIRCRAFT_CATALOG.find((craft) => craft.id === 'default');
    const record = createMessage(
      `${rank ? `${rank}위` : guest ? '전역 순위 없음' : '미등록'} · ${displayName} · ${aircraft.name} · ${bestScore}점`,
    );
    if (guest) {
      const localOnly = createMessage('이 기록은 이 브라우저에만 저장됩니다.');
      personal.append(record, localOnly);
    } else {
      personal.append(record);
    }
  }
  screen.append(personal);
  screen.append(createButton('돌아가기', handlers.back, { className: 'secondary-button' }));
  return screen;
}
