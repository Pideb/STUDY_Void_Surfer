import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from '../../src/app/create-app.js';
import { announce } from '../../src/ui/components.js';
import { createGameHud } from '../../src/ui/game-hud.js';
import { renderGameOverScreen, renderMenuScreen } from '../../src/ui/screens.js';

const styles = readFileSync(resolve(process.cwd(), 'src', 'styles.css'), 'utf8');

describe('accessibility and responsive UI contract', () => {
  it('keeps a persistent polite live region outside the UI render tree', () => {
    const app = document.createElement('main');
    document.body.append(app);
    const { uiRoot, liveRegion } = createApp(app);

    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    announce(liveRegion, '게임 종료. 최종 점수 20.');
    uiRoot.replaceChildren(document.createElement('div'));
    expect(liveRegion.textContent).toContain('게임 종료. 최종 점수 20.');
    app.remove();
  });

  it('gives every interactive action a visible name or aria-label', () => {
    const menu = renderMenuScreen({ displayName: 'Pilot', muted: false }, {
      start: vi.fn(), controls: vi.fn(), toggleMute: vi.fn(), signOut: vi.fn(),
    });
    const hud = createGameHud({ muted: false, getMuted: () => false }, {
      pause: vi.fn(), toggleMute: vi.fn(), space: vi.fn(),
    });
    for (const button of [...menu.querySelectorAll('button'), ...hud.element.querySelectorAll('button')]) {
      expect(button.textContent.trim() || button.getAttribute('aria-label')).toBeTruthy();
    }
    for (const button of [...menu.querySelectorAll('.icon-button'), ...hud.element.querySelectorAll('.icon-button')]) {
      expect(button.textContent).toBe('');
      expect(button.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
      expect(button.getAttribute('aria-label')).toBeTruthy();
    }
    expect(menu.querySelector('.account-actions')).not.toBeNull();
    expect(menu.querySelector('.screen-actions .text-button')).toBeNull();
    expect(hud.element.querySelector('[aria-live="assertive"]')).not.toBeNull();
  });

  it('renders untrusted leaderboard names as text and marks the current player', () => {
    const screen = renderGameOverScreen({
      score: 4,
      leaderboard: {
        top: { rows: [{ rank: 1, displayName: '<button>fake</button>', bestScore: 8 }] },
        neighborhood: { rows: [{ rank: 6, displayName: 'Pilot', bestScore: 4, isCurrentUser: true }] },
      },
    }, { restart: vi.fn(), menu: vi.fn(), retryLeaderboard: vi.fn() });

    expect(screen.querySelector('.leaderboard-section button')).toBeNull();
    expect(screen.textContent).toContain('<button>fake</button>');
    expect(screen.querySelector('[aria-current="true"]')).not.toBeNull();
  });

  it('preserves narrow viewport, virtual SPACE, safe-area, and reduced-motion rules', () => {
    expect(styles).toContain('@media (max-width: 700px)');
    expect(styles).toContain('.mobile-space-button');
    expect(styles).toContain('.game-hud button');
    expect(styles).toContain('display: none');
    expect(styles).toContain('display: inline-flex');
    expect(styles).toContain('.account-actions');
    expect(styles).toContain('safe-area-inset-left');
    expect(styles).toContain('prefers-reduced-motion: reduce');
  });
});
