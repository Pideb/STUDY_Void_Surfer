import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from '../../src/app/create-app.js';
import { announce } from '../../src/ui/components.js';
import { createGameHud } from '../../src/ui/game-hud.js';
import { renderGameOverScreen, renderMenuScreen, renderPausedScreen, renderTutorialScreen } from '../../src/ui/screens.js';

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
      start: vi.fn(), toggleMute: vi.fn(), signOut: vi.fn(),
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
    expect(menu.querySelector('.menu-actions .text-button')).toBeNull();
    expect([...menu.querySelectorAll('button')].map((button) => button.textContent.trim()))
      .not.toContain('조작법');
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
    expect(styles).toMatch(/\.ui-root\s*\{[^}]*display:\s*grid;[^}]*place-items:\s*center;/s);
    expect(styles).toContain('@media (max-width: 700px)');
    expect(styles).toContain('.mobile-space-button');
    expect(styles).toContain('.game-hud button');
    expect(styles).toContain('display: none');
    expect(styles).toContain('display: inline-flex');
    expect(styles).toContain('.account-actions');
    expect(styles).toContain('safe-area-inset-left');
    expect(styles).toContain('.menu-screen .menu-actions > button:not(.icon-button)');
    expect(styles).toContain('grid-template-columns: 1fr');
    expect(styles).toContain('grid-row: 3');
    expect(styles).toMatch(/\.menu-brand\s*\{[^}]*grid-column:\s*2;/s);
    expect(styles).toMatch(/\.menu-actions\s*\{[^}]*grid-column:\s*2;/s);
    expect(styles).toContain('.menu-brand .menu-wordmark');
    expect(styles).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.menu-brand \.menu-wordmark\s*\{[^}]*font-size:[^}]*letter-spacing:/);
    expect(styles).not.toContain('.hud-identity');
    expect(styles).toContain('prefers-reduced-motion: reduce');
  });

  it('fills the browser viewport and stretches canvas with the UI without a framed 16:9 cap', () => {
    expect(styles).toMatch(/html,[\s\S]*?body\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;/);
    expect(styles).toMatch(/#app\s*\{[^}]*width:\s*100vw;[^}]*height:\s*100vh;[^}]*height:\s*100dvh;[^}]*max-width:\s*none;[^}]*aspect-ratio:\s*auto;/s);
    expect(styles).toMatch(/\.game-canvas,\s*\.ui-root\s*\{[^}]*grid-area:\s*1\s*\/\s*1;[^}]*width:\s*100%;[^}]*height:\s*100%;/s);
    expect(styles).toMatch(/\.game-canvas\s*\{[^}]*aspect-ratio:\s*auto;/s);
    expect(styles).not.toMatch(/#app\s*\{[^}]*max-width:\s*960px/);
    expect(styles).not.toMatch(/#app\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/);
    expect(styles).toContain('safe-area-inset-left');
  });

  it('keeps the title semantic and pause guidance visible in DOM text', () => {
    const menu = renderMenuScreen({ displayName: 'Pilot', muted: false }, {
      start: vi.fn(), toggleMute: vi.fn(), signOut: vi.fn(),
    });
    const pause = renderPausedScreen({ score: 4 }, { resume: vi.fn(), menu: vi.fn() });

    expect(menu.querySelector('h1')?.textContent).toBe('VOID SURFER');
    expect(pause.textContent).toContain('이미 오른 속도는 내려가지 않습니다.');
  });

  it('keeps BOSS clear guidance in the semantic tutorial list', () => {
    const tutorial = renderTutorialScreen({}, { start: vi.fn(), menu: vi.fn() });

    expect(tutorial.querySelector('ul.tutorial-list')).not.toBeNull();
    expect(tutorial.querySelectorAll('ul.tutorial-list > li')).toHaveLength(7);
    expect(tutorial.querySelector('[role="alert"]')).toBeNull();
  });
});
