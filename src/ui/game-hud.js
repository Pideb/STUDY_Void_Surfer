import { createButton } from './components.js';

export function createGameHud(model, handlers) {
  const hud = document.createElement('div');
  hud.className = 'game-hud';

  const topBar = document.createElement('div');
  topBar.className = 'game-hud-bar';
  const score = document.createElement('p');
  score.className = 'hud-score';
  score.setAttribute('aria-live', 'polite');
  const actions = document.createElement('div');
  actions.className = 'hud-actions';
  const muteButton = createButton(model.muted ? '소리 켜기' : '음소거', handlers.toggleMute);
  const pauseButton = createButton('일시정지', handlers.pause);
  actions.append(muteButton, pauseButton);
  topBar.append(score, actions);

  const banner = document.createElement('p');
  banner.className = 'warning-banner';
  banner.setAttribute('aria-live', 'assertive');
  banner.setAttribute('aria-atomic', 'true');
  const mobileSpace = createButton('SPACE 대시', handlers.space, {
    className: 'mobile-space-button',
    ariaLabel: '특수 벽 대시',
  });
  mobileSpace.addEventListener('pointerdown', (event) => event.preventDefault());
  hud.append(topBar, banner, mobileSpace);

  function update(snapshot) {
    score.textContent = `점수 ${snapshot.score ?? 0}`;
    const difficulty = snapshot.difficulty ?? {};
    banner.textContent = difficulty.isBoss
      ? 'BOSS WARNING'
      : difficulty.isWarning ? 'WARNING' : '';
    banner.hidden = !banner.textContent;
    muteButton.textContent = model.getMuted() ? '소리 켜기' : '음소거';
  }

  return { element: hud, update };
}
