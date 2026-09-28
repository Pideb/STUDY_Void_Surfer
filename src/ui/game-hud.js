import { createButton, createIconButton } from './components.js';

function createMuteButton(muted, onClick) {
  return createIconButton({
    label: muted ? '소리 켜기' : '음소거',
    icon: muted ? 'volume-off' : 'volume-on',
    onClick,
  });
}

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
  let muted = Boolean(model.muted);
  let previousMode = 'normal';
  let bannerUntilSeconds = 0;
  let muteButton = createMuteButton(muted, handlers.toggleMute);
  const pauseButton = createButton('일시정지', handlers.pause);
  actions.append(muteButton, pauseButton);
  const status = document.createElement('p');
  status.className = 'hud-combat-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  topBar.append(score, status, actions);

  const bossHealth = document.createElement('section');
  bossHealth.className = 'boss-health';
  bossHealth.hidden = true;
  const bossLabel = document.createElement('span');
  bossLabel.className = 'boss-health-label';
  bossLabel.textContent = 'BOSS HP';
  const bossText = document.createElement('span');
  bossText.className = 'boss-health-text';
  const bossGauge = document.createElement('div');
  bossGauge.className = 'boss-health-gauge';
  bossGauge.setAttribute('role', 'progressbar');
  bossGauge.setAttribute('aria-label', '보스 체력');
  bossGauge.setAttribute('aria-valuemin', '0');
  bossHealth.append(bossLabel, bossGauge, bossText);

  const challengeOverlay = document.createElement('section');
  challengeOverlay.className = 'wasd-challenge-overlay';
  challengeOverlay.hidden = true;
  challengeOverlay.setAttribute('role', 'group');
  challengeOverlay.setAttribute('aria-label', '보스 키보드 챌린지');
  const challengeTitle = document.createElement('h2');
  challengeTitle.textContent = '순서대로 입력';
  const challengeSequence = document.createElement('ol');
  challengeSequence.className = 'challenge-sequence';
  const challengeTimer = document.createElement('div');
  challengeTimer.className = 'challenge-timer';
  challengeTimer.setAttribute('role', 'progressbar');
  challengeTimer.setAttribute('aria-label', '챌린지 남은 시간');
  challengeTimer.setAttribute('aria-valuemin', '0');
  const challengeTimeText = document.createElement('span');
  challengeTimeText.className = 'challenge-time-text';
  const challengeStatus = document.createElement('span');
  challengeStatus.className = 'sr-only';
  challengeStatus.setAttribute('role', 'status');
  challengeStatus.setAttribute('aria-live', 'polite');
  challengeStatus.setAttribute('aria-atomic', 'true');
  challengeOverlay.append(challengeTitle, challengeSequence, challengeTimer, challengeTimeText, challengeStatus);
  const failureEffect = document.createElement('div');
  failureEffect.className = 'challenge-failure-effect';
  failureEffect.hidden = true;
  failureEffect.setAttribute('aria-hidden', 'true');

  const banner = document.createElement('p');
  banner.className = 'warning-banner';
  banner.setAttribute('aria-live', 'assertive');
  banner.setAttribute('aria-atomic', 'true');
  const mobileSpace = createButton('SPACE 대시', handlers.space, {
    className: 'mobile-space-button',
    ariaLabel: '특수 벽 대시',
  });
  mobileSpace.addEventListener('pointerdown', (event) => event.preventDefault());
  hud.append(topBar, bossHealth, banner, challengeOverlay, failureEffect, mobileSpace);

  function update(snapshot) {
    score.textContent = `점수 ${snapshot.score ?? 0}`;
    const boss = snapshot.boss;
    bossHealth.hidden = !boss;
    if (boss) {
      const maxHp = Math.max(1, Math.trunc(Number(boss.maxHp) || 1));
      const hp = Math.max(0, Math.min(maxHp, Math.trunc(Number(boss.hp) || 0)));
      bossGauge.setAttribute('aria-valuemax', String(maxHp));
      bossGauge.setAttribute('aria-valuenow', String(hp));
      bossGauge.setAttribute('aria-valuetext', `${hp}/${maxHp}`);
      bossText.textContent = `${hp} / ${maxHp}`;
      if (bossGauge.dataset.maxHp !== String(maxHp)) {
        bossGauge.replaceChildren(...Array.from({ length: maxHp }, () => {
          const segment = document.createElement('span');
          segment.className = 'boss-health-segment';
          segment.setAttribute('aria-hidden', 'true');
          return segment;
        }));
        bossGauge.dataset.maxHp = String(maxHp);
      }
      [...bossGauge.children].forEach((segment, index) => segment.classList.toggle('is-active', index < hp));
    }

    const attack = boss?.attack;
    let combatMessage = '';
    if (attack?.type === 'projectile') {
      combatMessage = attack.state === 'charging' ? '투사체 조준 중 · 예고 궤적 확인'
        : attack.state === 'returning' ? '반사 성공 · 보스에게 되돌아가는 중'
          : '투사체 접근 중 · 타이밍 대시로 반사';
    } else if (attack?.type === 'laser') {
      if (attack.kind === 'quarter') combatMessage = `레이저 안전 구역: ${attack.safeZone + 1}번 구역`;
      else combatMessage = attack.telegraphRemainingSeconds > 0 ? '레이저 조준 중 · 세로 위치 확인' : '레이저 발사 중';
    }
    status.textContent = combatMessage;
    status.hidden = !combatMessage;

    const challenge = snapshot.challenge;
    challengeOverlay.hidden = !challenge?.active;
    if (challenge?.active) {
      const sequence = challenge.sequence ?? [];
      const cursor = Math.max(0, Math.trunc(Number(challenge.cursor) || 0));
      challengeSequence.replaceChildren(...sequence.map((code, index) => {
        const item = document.createElement('li');
        item.textContent = code.slice(-1).toUpperCase();
        item.className = index < cursor ? 'is-complete' : index === cursor ? 'is-current' : '';
        item.setAttribute('aria-label', `${index + 1}: ${code.slice(-1).toUpperCase()}${index < cursor ? ', 입력 완료' : ''}`);
        return item;
      }));
      const limit = Math.max(0.1, Number(challenge.timeLimitSeconds) || 1);
      const remaining = Math.max(0, Number(challenge.remainingSeconds) || 0);
      challengeTimer.setAttribute('aria-valuemax', String(limit));
      challengeTimer.setAttribute('aria-valuenow', String(Math.ceil(remaining)));
      challengeTimer.setAttribute('aria-valuetext', `${remaining.toFixed(1)}초 남음`);
      challengeTimer.style.setProperty('--challenge-time-progress', `${Math.max(0, Math.min(1, remaining / limit)) * 100}%`);
      challengeTimeText.textContent = `${remaining.toFixed(1)}초`;
      challengeStatus.textContent = `키보드 챌린지 ${cursor + 1} / ${sequence.length}. ${sequence[cursor]?.slice(-1).toUpperCase() ?? '완료'} 키를 입력하세요.`;
    }

    const effect = snapshot.feedbackEffect;
    const effectActive = Boolean(effect && effect.remainingSeconds > 0);
    failureEffect.hidden = !effectActive;
    failureEffect.classList.toggle('is-ink', effectActive && effect.kind === 'ink');
    failureEffect.classList.toggle('is-glitch', effectActive && effect.kind === 'glitch');
    hud.classList.toggle('has-challenge-failure', effectActive);
    const difficulty = snapshot.difficulty ?? {};
    const mode = difficulty.isBoss ? 'boss' : difficulty.isWarning ? 'warning' : 'normal';
    const elapsedSeconds = Number.isFinite(snapshot.elapsedSeconds) ? snapshot.elapsedSeconds : 0;
    if (mode !== previousMode && mode !== 'normal') bannerUntilSeconds = elapsedSeconds + 1;
    if (mode === 'normal') bannerUntilSeconds = 0;
    previousMode = mode;
    banner.textContent = elapsedSeconds < bannerUntilSeconds ? (mode === 'boss' ? 'BOSS' : 'WARNING') : '';
    banner.hidden = !banner.textContent;

    const nextMuted = Boolean(model.getMuted());
    if (nextMuted !== muted) {
      muted = nextMuted;
      const nextMuteButton = createMuteButton(muted, handlers.toggleMute);
      muteButton.replaceWith(nextMuteButton);
      muteButton = nextMuteButton;
    }
  }

  return { element: hud, update };
}
