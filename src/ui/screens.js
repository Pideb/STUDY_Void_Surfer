import { createButton, createIconButton, createPanel } from './components.js';
import { renderLeaderboardPanel } from './leaderboard-view.js';

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
  const panel = createPanel('VOID SURFER', 'menu-screen');
  panel.append(createMessage(`${model.displayName} 파일럿, 다시 도전할 것을 환영합니다.`));

  const actions = document.createElement('div');
  actions.className = 'screen-actions';
  actions.append(
    createButton('게임 시작', handlers.start, { className: 'primary-button' }),
    createButton('조작법', handlers.controls, { className: 'secondary-button' }),
    createIconButton({
      label: model.muted ? '소리 켜기' : '음소거',
      icon: model.muted ? 'volume-off' : 'volume-on',
      onClick: handlers.toggleMute,
      className: 'secondary-button',
    }),
  );

  const accountActions = document.createElement('div');
  accountActions.className = 'account-actions';
  accountActions.append(createButton('로그아웃', handlers.signOut, { className: 'text-button' }));
  panel.append(actions, accountActions);
  return panel;
}

export function renderTutorialScreen(_model, handlers) {
  const panel = createPanel('출격 전 조작 안내', 'tutorial-screen');
  const list = document.createElement('ul');
  list.className = 'tutorial-list';
  for (const instruction of [
    '클릭/터치: 위로 상승',
    'SPACE: 언제든 대시 잔상이 남습니다',
    '특수 벽은 정확한 타이밍의 SPACE 대시로만 통과합니다',
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
  panel.append(createMessage(`현재 점수 ${model.score} · 일시정지할 때마다 10점 차감`));
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
  score.textContent = `최종 점수 ${model.score}`;
  panel.append(score);

  const actions = document.createElement('div');
  actions.className = 'screen-actions';
  actions.append(
    createButton('재시작', handlers.restart, { className: 'primary-button' }),
    createButton('메인 메뉴', handlers.menu, { className: 'secondary-button' }),
  );
  panel.append(actions);

  if (model.submitError) {
    panel.append(createMessage('점수를 저장하지 못했습니다. 다시 시도해 주세요.', 'screen-message error-message'));
  }
  panel.append(renderLeaderboardPanel(model.leaderboard, handlers.retryLeaderboard));
  return panel;
}
