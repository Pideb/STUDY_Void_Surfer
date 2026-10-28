import { describe, expect, it, vi } from 'vitest';
import { createGameHud } from '../../src/ui/game-hud.js';

function makeHud() {
  return createGameHud({ muted: false, getMuted: () => false }, {
    pause: vi.fn(), toggleMute: vi.fn(), space: vi.fn(),
  });
}

describe('game HUD', () => {
  it('shows charge and ready state and uses a separate mobile fire button', () => {
    const fire = vi.fn();
    const hud = createGameHud({ getMuted: () => false }, { fire });
    const boss = { hp: 3, weapon: { chargeSeconds: 4, rechargeSeconds: 10, ready: false, firing: null } };
    hud.update({ boss });
    const gauge = hud.element.querySelector('[aria-label="레이저 충전"]');
    const button = hud.element.querySelector('.mobile-fire-button');
    expect(gauge.getAttribute('aria-valuenow')).toBe('4');
    expect(button.disabled).toBe(true);
    boss.weapon = { ...boss.weapon, chargeSeconds: 10, ready: true };
    hud.update({ boss });
    expect(hud.element.querySelector('.weapon-hud').classList.contains('is-ready')).toBe(true);
    button.click(); expect(fire).toHaveBeenCalledOnce();
    hud.update({ boss, challenge: { active: true, sequence: [] } });
    expect(button.disabled).toBe(true); expect(button.hidden).toBe(true);
    hud.update({}); expect(hud.element.querySelector('.weapon-hud').hidden).toBe(true);
  });
  it('hides stage and aircraft identity while retaining score and an accessible segmented boss gauge', () => {
    const hud = makeHud();
    hud.update({
      score: 75,
      stage: { name: 'SOLAR FORGE' },
      aircraft: { name: 'VELOCITY' },
      boss: { hp: 2, maxHp: 3, successfulChallenges: 1, requiredChallenges: 3 },
    });
    const gauge = hud.element.querySelector('[role="progressbar"][aria-label="보스 체력"]');
    expect(hud.element.querySelector('.hud-identity')).toBeNull();
    expect(hud.element.textContent).not.toContain('SOLAR FORGE');
    expect(hud.element.textContent).not.toContain('VELOCITY');
    expect(hud.element.textContent).toContain('점수 75');
    expect(gauge.getAttribute('aria-valuenow')).toBe('2');
    expect(gauge.getAttribute('aria-valuemax')).toBe('3');
    expect(gauge.getAttribute('aria-valuetext')).toBe('보스 체력 2/3');
    expect(gauge.querySelectorAll('.boss-health-segment')).toHaveLength(3);
    expect(gauge.querySelectorAll('.is-active')).toHaveLength(2);
    expect(hud.element.querySelector('.boss-health-label').textContent).toBe('BOSS HP');
    for (const hp of [3, 2, 1, 0]) {
      hud.update({ boss: { hp, maxHp: 3 } });
      expect(gauge.getAttribute('aria-valuenow')).toBe(String(hp));
      expect(gauge.querySelectorAll('.is-active')).toHaveLength(hp);
    }
  });

  it('shows laser cues and the WASD sequence and hides controls after the challenge', () => {
    const hud = makeHud();
    hud.update({
      score: 42,
      boss: { hp: 2, maxHp: 3, attack: { type: 'laser', kind: 'quarter', safeZone: 2 } },
      challenge: {
        active: true,
        sequence: ['KeyW', 'KeyA', 'KeyD'],
        cursor: 1,
        remainingSeconds: 3.1,
        timeLimitSeconds: 5,
      },
      feedbackEffect: { kind: 'glitch', remainingSeconds: 0.5, durationSeconds: 0.75 },
    });
    expect(hud.element.querySelector('.hud-combat-status').textContent).toContain('3번 구역');
    expect(hud.element.querySelector('.wasd-challenge-overlay').hidden).toBe(false);
    expect([...hud.element.querySelectorAll('.challenge-sequence li')].map((item) => item.textContent))
      .toEqual(['W', 'A', 'D']);
    expect(hud.element.querySelector('.challenge-sequence .is-complete')?.textContent).toBe('W');
    expect(hud.element.querySelector('.challenge-timer').getAttribute('aria-valuetext')).toBe('3.1초 남음');
    expect(hud.element.querySelector('.challenge-failure-effect').classList.contains('is-glitch')).toBe(true);
    expect(hud.element.querySelector('.mobile-space-button')).not.toBeNull();
    expect(hud.element.querySelector('.mobile-space-button').hidden).toBe(true);
    expect(hud.element.querySelector('.challenge-touch-controls').hidden).toBe(false);
    expect([...hud.element.querySelectorAll('.challenge-key-button')].every((button) => !button.disabled)).toBe(true);

    hud.update({ score: 42, boss: null, challenge: null, feedbackEffect: null });
    expect(hud.element.querySelector('.boss-health').hidden).toBe(true);
    expect(hud.element.querySelector('.wasd-challenge-overlay').hidden).toBe(true);
    expect(hud.element.querySelector('.challenge-failure-effect').hidden).toBe(true);
    expect(hud.element.querySelector('.challenge-touch-controls').hidden).toBe(true);
    expect([...hud.element.querySelectorAll('.challenge-key-button')].every((button) => button.disabled)).toBe(true);
  });

  it('announces the selected BOSS pattern during the pre-entry preview', () => {
    const hud = makeHud();
    hud.update({
      score: 60,
      elapsedSeconds: 2,
      difficulty: { isWarning: false, isBoss: false },
      bossPreview: { warningIndex: 2, pattern: 'shift', remainingSeconds: 1.2 },
    });

    const banner = hud.element.querySelector('.warning-banner');
    expect(banner.hidden).toBe(false);
    expect(banner.textContent).toBe('BOSS — 변속');
    expect(banner.getAttribute('aria-live')).toBe('assertive');
    expect(banner.classList.contains('is-boss-preview')).toBe(true);
  });

  it('shows acceleration and deceleration cues only during active speed transitions', () => {
    const hud = makeHud();
    hud.update({ score: 10, speedChange: { direction: 'up', remainingSeconds: 0.8 } });
    const indicator = hud.element.querySelector('.speed-change-indicator');
    expect(indicator.hidden).toBe(false);
    expect(indicator.textContent).toBe('>> 가속');
    expect(indicator.getAttribute('role')).toBe('status');

    hud.update({ score: 10, speedChange: { direction: 'down', remainingSeconds: 0.5 } });
    expect(indicator.hidden).toBe(false);
    expect(indicator.textContent).toBe('<< 감속');

    hud.update({ score: 10, speedChange: null });
    expect(indicator.hidden).toBe(true);
    expect(indicator.textContent).toBe('');

    hud.update({ score: 10, speedChange: { direction: 'unknown', remainingSeconds: 0.5 } });
    expect(indicator.hidden).toBe(true);
  });
});
