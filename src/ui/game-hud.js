function setText(node,value){if(node.textContent!==String(value))node.textContent=value;}
function setAttribute(node,key,value){if(node.getAttribute(key)!==String(value))node.setAttribute(key,value);}
function setFlag(node,key,value){if(node[key]!==Boolean(value))node[key]=Boolean(value);}
function toggleClass(node,key,value){if(node.classList.contains(key)!==Boolean(value))node.classList.toggle(key,Boolean(value));}
function setStyle(node,key,value){if(node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value);}

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
  setAttribute(score, 'aria-live', 'polite');
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
  setAttribute(speedIndicator, 'role', 'status');
  setAttribute(speedIndicator, 'aria-live', 'polite');
  setAttribute(speedIndicator, 'aria-atomic', 'true');
  setFlag(speedIndicator, 'hidden', true);
  let speedDirection = null;
  topBar.append(score, speedIndicator, actions);

  const bossHealth = document.createElement('section');
  bossHealth.className = 'boss-health';
  setFlag(bossHealth, 'hidden', true);
  const bossLabel = document.createElement('span');
  bossLabel.className = 'boss-health-label';
  setText(bossLabel, 'BOSS HP');
  const bossText = document.createElement('span');
  bossText.className = 'boss-health-text';
  const bossGauge = document.createElement('div');
  bossGauge.className = 'boss-health-gauge';
  setAttribute(bossGauge, 'role', 'progressbar');
  setAttribute(bossGauge, 'aria-label', '보스 체력');
  setAttribute(bossGauge, 'aria-valuemin', '0');
  bossHealth.append(bossLabel, bossGauge, bossText);

  const challengeOverlay = document.createElement('section');
  challengeOverlay.className = 'wasd-challenge-overlay';
  setFlag(challengeOverlay, 'hidden', true);
  setAttribute(challengeOverlay, 'role', 'group');
  setAttribute(challengeOverlay, 'aria-label', '보스 키보드 챌린지');
  const challengeSequence = document.createElement('ol');
  challengeSequence.className = 'challenge-sequence';
  const challengeTimer = document.createElement('div');
  challengeTimer.className = 'challenge-timer';
  setAttribute(challengeTimer, 'role', 'progressbar');
  setAttribute(challengeTimer, 'aria-label', '챌린지 남은 시간');
  setAttribute(challengeTimer, 'aria-valuemin', '0');
  const challengeTimeText = document.createElement('span');
  challengeTimeText.className = 'challenge-time-text';
  const challengeStatus = document.createElement('span');
  challengeStatus.className = 'sr-only';
  setAttribute(challengeStatus, 'role', 'status');
  setAttribute(challengeStatus, 'aria-live', 'polite');
  setAttribute(challengeStatus, 'aria-atomic', 'true');
  const challengeControls = document.createElement('div');
  challengeControls.className = 'challenge-touch-controls';
  setFlag(challengeControls, 'hidden', true);
  setAttribute(challengeControls, 'role', 'group');
  setAttribute(challengeControls, 'aria-label', 'WASD 터치 입력');
  const challengeButtons = ['KeyW', 'KeyA', 'KeyS', 'KeyD'].map((code) => {
    const button = createButton(code.slice(-1), () => handlers.challengeKey?.(code), {
      className: 'challenge-key-button', ariaLabel: `${code.slice(-1)} 입력`,
    });
    button.dataset.code = code;
    setFlag(button, 'disabled', true);
    challengeControls.append(button);
    return button;
  });
  challengeOverlay.append(challengeSequence, challengeTimer, challengeTimeText, challengeControls, challengeStatus);
  const failureEffect = document.createElement('div');
  failureEffect.className = 'challenge-failure-effect';
  setFlag(failureEffect, 'hidden', true);
  setAttribute(failureEffect, 'aria-hidden', 'true');

  const banner = document.createElement('p');
  banner.className = 'warning-banner';
  setAttribute(banner, 'aria-live', 'assertive');
  setAttribute(banner, 'aria-atomic', 'true');
  const mobileSpace = createButton('SPACE 대시', handlers.space, {
    className: 'mobile-space-button',
    ariaLabel: '특수 벽 대시',
  });
  mobileSpace.addEventListener('pointerdown', (event) => {event.preventDefault();event.stopPropagation();});
  const weaponHud = document.createElement('section');
  weaponHud.className = 'weapon-hud';
  setFlag(weaponHud, 'hidden', true);
  const weaponLabel = document.createElement('span');
  weaponLabel.className = 'weapon-label sr-only';
  const weaponGauge = document.createElement('div');
  weaponGauge.className = 'weapon-gauge';
  setAttribute(weaponGauge, 'role', 'progressbar');
  setAttribute(weaponGauge, 'aria-label', '레이저 충전');
  setAttribute(weaponGauge, 'aria-valuemin', '0');
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgNode = (name, attributes) => {
    const node = document.createElementNS(svgNS, name);
    for (const [key,value] of Object.entries(attributes)) setAttribute(node, key,String(value));
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

  let challengeSequenceKey = null;
  function update(snapshot) {
    setText(score, `점수 ${snapshot.score ?? 0}`);
    const boss = snapshot.boss;
    const weapon = boss?.weapon;
    const ready = Boolean(weapon?.ready);
    setFlag(weaponHud, 'hidden', !weapon || snapshot.challenge?.active);
    setFlag(mobileFire, 'hidden', !weapon || Boolean(snapshot.challenge?.active || snapshot.deathEffect));
    setFlag(mobileFire, 'disabled', !ready || Boolean(weapon?.firing || snapshot.challenge?.active || snapshot.deathEffect || boss?.hp <= 0));
    toggleClass(weaponHud, 'is-ready', ready);
    if (weapon) {
      const limit = Math.max(.001, Number(weapon.rechargeSeconds) || 10);
      const charged = Math.min(limit, Math.max(0, Number(weapon.chargeSeconds) || 0));
      setAttribute(weaponGauge, 'aria-valuemax', String(limit));
      setAttribute(weaponGauge, 'aria-valuenow', String(charged));
      setAttribute(weaponGauge, 'aria-valuetext', ready ? '레이저 발사 가능' : `레이저 충전 ${Math.floor(charged / limit * 100)}%`);
      setAttribute(weaponFill, 'stroke-dashoffset', String(100-charged/limit*100));
      setText(weaponState, weapon.firing ? 'FIRE' : ready ? 'READY' : `${Math.floor(charged/limit*100)}%`);
      toggleClass(weaponHud, 'is-firing', Boolean(weapon.firing));
      setText(weaponLabel, weapon.firing ? '레이저 발사 중' : ready ? 'LASER READY · SHIFT / CTRL' : `LASER · ${(limit - charged).toFixed(1)}초`);
    }
    setFlag(bossHealth, 'hidden', !boss);
    if (boss) {
      const required = Math.max(1, Math.trunc(Number(boss.maxHp) || 3));
      const remaining = Math.max(0, Math.min(required, Math.trunc(Number(boss.hp ?? required) || 0)));
      setAttribute(bossGauge, 'aria-valuemax', String(required));
      setAttribute(bossGauge, 'aria-valuenow', String(remaining));
      setAttribute(bossGauge, 'aria-valuetext', `보스 체력 ${remaining}/${required}`);
      setText(bossText, `${remaining} / ${required}`);
      if (bossGauge.dataset.required !== String(required)) {
        bossGauge.replaceChildren(...Array.from({ length: required }, () => {
          const segment = document.createElement('span');
          segment.className = 'boss-health-segment';
          setAttribute(segment, 'aria-hidden', 'true');
          return segment;
        }));
        bossGauge.dataset.required = String(required);
      }
      [...bossGauge.children].forEach((segment, index) => toggleClass(segment, 'is-active', index < remaining));
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
      setText(speedIndicator, speedDirection === 'up' ? '>> 가속' : speedDirection === 'down' ? '<< 감속' : '');
      toggleClass(speedIndicator, 'is-accelerating', speedDirection === 'up');
      toggleClass(speedIndicator, 'is-decelerating', speedDirection === 'down');
    }
    setFlag(speedIndicator, 'hidden', speedDirection === null);

    const challenge = snapshot.challenge;
    setFlag(challengeOverlay, 'hidden', !challenge?.active);
    setFlag(challengeControls, 'hidden', !challenge?.active);
    challengeButtons.forEach((button) => { setFlag(button, 'disabled', !challenge?.active); });
    setFlag(mobileSpace, 'hidden', Boolean(challenge?.active));
    setFlag(pauseButton, 'disabled', Boolean(challenge?.active));
    if (challenge?.active) {
      const sequence = challenge.sequence ?? [];
      const cursor = Math.max(0, Math.trunc(Number(challenge.cursor) || 0));
      const key=sequence.join(',');
      if(key!==challengeSequenceKey){challengeSequenceKey=key;challengeSequence.replaceChildren(...sequence.map(code=>{const item=document.createElement('li');item.textContent=code.slice(-1).toUpperCase();return item;}));}
      [...challengeSequence.children].forEach((item,index)=>{
        toggleClass(item,'is-complete',index<cursor);toggleClass(item,'is-current',index===cursor);
        toggleClass(item,'is-wrong',index===cursor&&challenge.wrongKeyIndex===cursor&&challenge.wrongKeyFlashRemaining>0);
        setAttribute(item,'aria-label',String(index+1)+': '+sequence[index].slice(-1).toUpperCase()+(index<cursor?', 입력 완료':''));
      });
      const limit = Math.max(0.1, Number(challenge.timeLimitSeconds) || 1);
      const remaining = Math.max(0, Number(challenge.remainingSeconds) || 0);
      setAttribute(challengeTimer, 'aria-valuemax', String(limit));
      setAttribute(challengeTimer, 'aria-valuenow', String(Math.ceil(remaining)));
      setAttribute(challengeTimer, 'aria-valuetext', `${remaining.toFixed(1)}초 남음`);
      setStyle(challengeTimer, '--challenge-time-progress', `${Math.max(0, Math.min(1, remaining / limit)) * 100}%`);
      setText(challengeTimeText, `${remaining.toFixed(1)}초`);
      setText(challengeStatus, `키보드 챌린지 ${cursor + 1} / ${sequence.length}. ${sequence[cursor]?.slice(-1).toUpperCase() ?? '완료'} 키를 입력하세요.`);
    }

    const effect = snapshot.feedbackEffect;
    const effectActive = Boolean(effect && effect.remainingSeconds > 0);
    setFlag(failureEffect, 'hidden', !effectActive);
    toggleClass(failureEffect, 'is-ink', effectActive && effect.kind === 'ink');
    toggleClass(failureEffect, 'is-glitch', effectActive && effect.kind === 'glitch');
    toggleClass(hud, 'has-challenge-failure', effectActive);
    const difficulty = snapshot.difficulty ?? {};
    const mode = difficulty.isBoss ? 'boss' : difficulty.isWarning ? 'warning' : 'normal';
    const elapsedSeconds = Number.isFinite(snapshot.elapsedSeconds) ? snapshot.elapsedSeconds : 0;
    if (mode !== previousMode && mode !== 'normal') bannerUntilSeconds = elapsedSeconds + 1;
    if (mode === 'normal') bannerUntilSeconds = 0;
    previousMode = mode;
    const bossPreview = snapshot.bossPreview;
    const patternName = ({ slow: '저속', fast: '고속', shift: '변속' })[bossPreview?.pattern];
    toggleClass(banner, 'is-boss-preview', Boolean(bossPreview));
    setText(banner, bossPreview && patternName
      ? `BOSS — ${patternName}`
      : elapsedSeconds < bannerUntilSeconds ? (mode === 'boss' ? 'BOSS' : 'WARNING') : '');
    setFlag(banner, 'hidden', !banner.textContent);

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
