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
  const speedIndicator = document.createElement('p');
  speedIndicator.className = 'speed-change-indicator';
  speedIndicator.setAttribute('role', 'status');
  speedIndicator.setAttribute('aria-live', 'polite');
  speedIndicator.setAttribute('aria-atomic', 'true');
  speedIndicator.hidden = true;
  let speedDirection = null;
  topBar.append(score, speedIndicator, actions);

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
  const challengeControls = document.createElement('div');
  challengeControls.className = 'challenge-touch-controls';
  challengeControls.hidden = true;
  challengeControls.setAttribute('role', 'group');
  challengeControls.setAttribute('aria-label', 'WASD 터치 입력');
  const challengeButtons = ['KeyW', 'KeyA', 'KeyS', 'KeyD'].map((code) => {
    const button = createButton(code.slice(-1), () => handlers.challengeKey?.(code), {
      className: 'challenge-key-button', ariaLabel: `${code.slice(-1)} 입력`,
    });
    button.dataset.code = code;
    button.disabled = true;
    challengeControls.append(button);
    return button;
  });
  challengeOverlay.append(challengeSequence, challengeTimer, challengeTimeText, challengeControls, challengeStatus);
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
  const weaponHud = document.createElement('section');
  weaponHud.className = 'weapon-hud';
  weaponHud.hidden = true;
  const weaponLabel = document.createElement('span');
  weaponLabel.className = 'weapon-label sr-only';
  const weaponGauge = document.createElement('div');
  weaponGauge.className = 'weapon-gauge';
  weaponGauge.setAttribute('role', 'progressbar');
  weaponGauge.setAttribute('aria-label', '레이저 충전');
  weaponGauge.setAttribute('aria-valuemin', '0');
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgNode = (name, attributes) => {
    const node = document.createElementNS(svgNS, name);
    for (const [key,value] of Object.entries(attributes)) node.setAttribute(key,String(value));
    return node;
  };
  const reactor = svgNode('svg',{viewBox:'0 0 104 104','aria-hidden':'true',class:'weapon-reactor'});
  const arc = 'M19.64 75.51 A40 40 0 1 1 84.36 75.51';
  reactor.append(svgNode('circle',{cx:52,cy:52,r:37,class:'reactor-backing'}),
    svgNode('path',{d:arc,class:'reactor-track'}));
  const weaponFill = svgNode('path',{d:arc,class:'reactor-progress',pathLength:100,'stroke-dasharray':100,'stroke-dashoffset':100});
  reactor.append(weaponFill);
  for(let k=0;k<=10;k++){
    const angle=Math.PI*.8+Math.PI*1.4*k/10;
    reactor.append(svgNode('path',{d:`M${52+Math.cos(angle)*46} ${52+Math.sin(angle)*46} L${52+Math.cos(angle)*49} ${52+Math.sin(angle)*49}`,class:'reactor-tick'}));
  }
  const weaponState=svgNode('text',{x:52,y:56,class:'reactor-state'});
  const weaponCaption=svgNode('text',{x:52,y:72,class:'reactor-caption'});weaponCaption.textContent='LASER';
  reactor.append(weaponState,weaponCaption);
  weaponGauge.append(reactor);
  const weaponKeys=document.createElement('span');weaponKeys.className='weapon-keys';weaponKeys.textContent='SHIFT / CTRL';
  weaponHud.dataset.diameter='80';
  weaponHud.append(weaponLabel,weaponGauge,weaponKeys);
  const mobileFire = createButton('레이저 발사', () => handlers.fire?.(), { className: 'mobile-fire-button', ariaLabel: '보스 레이저 발사' });
  mobileFire.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); });
  mobileFire.addEventListener('click', event => event.stopPropagation());
  hud.append(topBar, bossHealth, banner, challengeOverlay, failureEffect, weaponHud, mobileSpace, mobileFire);

  function update(snapshot) {
    score.textContent = `점수 ${snapshot.score ?? 0}`;
    const boss = snapshot.boss;
    const weapon = boss?.weapon;
    const ready = Boolean(weapon?.ready);
    weaponHud.hidden = !weapon;
    mobileFire.hidden = !weapon || Boolean(snapshot.challenge?.active || snapshot.deathEffect);
    mobileFire.disabled = !ready || Boolean(weapon?.firing || snapshot.challenge?.active || snapshot.deathEffect || boss?.hp <= 0);
    weaponHud.classList.toggle('is-ready', ready);
    if (weapon) {
      const limit = Math.max(.001, Number(weapon.rechargeSeconds) || 10);
      const charged = Math.min(limit, Math.max(0, Number(weapon.chargeSeconds) || 0));
      weaponGauge.setAttribute('aria-valuemax', String(limit));
      weaponGauge.setAttribute('aria-valuenow', String(charged));
      weaponGauge.setAttribute('aria-valuetext', ready ? '레이저 발사 가능' : `레이저 충전 ${Math.floor(charged / limit * 100)}%`);
      weaponFill.setAttribute('stroke-dashoffset', String(100-charged/limit*100));
      weaponState.textContent = weapon.firing ? 'FIRE' : ready ? 'READY' : `${Math.floor(charged/limit*100)}%`;
      weaponHud.classList.toggle('is-firing', Boolean(weapon.firing));
      weaponLabel.textContent = weapon.firing ? '레이저 발사 중' : ready ? 'LASER READY · SHIFT / CTRL' : `LASER · ${(limit - charged).toFixed(1)}초`;
    }
    bossHealth.hidden = !boss;
    if (boss) {
      const required = Math.max(1, Math.trunc(Number(boss.maxHp) || 3));
      const remaining = Math.max(0, Math.min(required, Math.trunc(Number(boss.hp ?? required) || 0)));
      bossGauge.setAttribute('aria-valuemax', String(required));
      bossGauge.setAttribute('aria-valuenow', String(remaining));
      bossGauge.setAttribute('aria-valuetext', `보스 체력 ${remaining}/${required}`);
      bossText.textContent = `${remaining} / ${required}`;
      if (bossGauge.dataset.required !== String(required)) {
        bossGauge.replaceChildren(...Array.from({ length: required }, () => {
          const segment = document.createElement('span');
          segment.className = 'boss-health-segment';
          segment.setAttribute('aria-hidden', 'true');
          return segment;
        }));
        bossGauge.dataset.required = String(required);
      }
      [...bossGauge.children].forEach((segment, index) => segment.classList.toggle('is-active', index < remaining));
    }

    const nextSpeedDirection = [
      'up', 'down',
    ].includes(snapshot.speedChange?.direction)
      && Number.isFinite(snapshot.speedChange.remainingSeconds)
      && snapshot.speedChange.remainingSeconds > 0
      ? snapshot.speedChange.direction
      : null;
    if (nextSpeedDirection !== speedDirection) {
      speedDirection = nextSpeedDirection;
      speedIndicator.textContent = speedDirection === 'up' ? '>> 가속' : speedDirection === 'down' ? '<< 감속' : '';
      speedIndicator.classList.toggle('is-accelerating', speedDirection === 'up');
      speedIndicator.classList.toggle('is-decelerating', speedDirection === 'down');
    }
    speedIndicator.hidden = speedDirection === null;

    const challenge = snapshot.challenge;
    challengeOverlay.hidden = !challenge?.active;
    challengeControls.hidden = !challenge?.active;
    challengeButtons.forEach((button) => { button.disabled = !challenge?.active; });
    mobileSpace.hidden = Boolean(challenge?.active);
    pauseButton.disabled = Boolean(challenge?.active);
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
    const bossPreview = snapshot.bossPreview;
    const patternName = ({ slow: '저속', fast: '고속', shift: '변속' })[bossPreview?.pattern];
    banner.classList.toggle('is-boss-preview', Boolean(bossPreview));
    banner.textContent = bossPreview && patternName
      ? `BOSS — ${patternName}`
      : elapsedSeconds < bannerUntilSeconds ? (mode === 'boss' ? 'BOSS' : 'WARNING') : '';
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
