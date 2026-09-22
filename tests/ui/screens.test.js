import { describe, expect, it, vi } from 'vitest';
import { renderGameOverScreen, renderLoginScreen, renderTutorialScreen } from '../../src/ui/screens.js';
import { createGameHud } from '../../src/ui/game-hud.js';

describe('product flow screens', () => {
  it('shows login configuration and connection errors with retry', () => {
    const screen = renderLoginScreen({
      error: 'Supabase 설정이 없습니다.', connectionError: true, busy: false,
    }, { signIn: vi.fn(), retry: vi.fn() });

    expect(screen.textContent).toContain('Microsoft 계정으로 로그인');
    expect(screen.textContent).toContain('게임을 시작할 수 없습니다');
    expect(screen.textContent).toContain('다시 연결');
    expect(screen.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('documents always-available dash, special timing, pause, and tutorial exit controls', () => {
    const menu = vi.fn();
    const tutorial = renderTutorialScreen({}, { start: vi.fn(), menu });
    expect(tutorial.textContent).toContain('클릭/터치: 위로 상승');
    expect(tutorial.textContent).toContain('SPACE: 언제든 대시 잔상이 남습니다');
    expect(tutorial.textContent).toContain('특수 벽은 정확한 타이밍의 SPACE 대시로만 통과합니다');
    expect(tutorial.textContent).toContain('일시정지 (-10점)');
    [...tutorial.querySelectorAll('button')].find((button) => button.textContent === '메인 메뉴').click();
    expect(menu).toHaveBeenCalledOnce();
  });

  it('shows actions immediately and keeps user-provided names as text', () => {
    const screen = renderGameOverScreen({
      score: 17,
      leaderboard: {
        top: { rows: [{ rank: 1, displayName: '<script>alert(1)</script>', bestScore: 20 }] },
        neighborhood: { rows: [{ rank: 5, displayName: '나', bestScore: 17, isCurrentUser: true }] },
      },
    }, { restart: vi.fn(), menu: vi.fn(), retryLeaderboard: vi.fn() });

    expect(screen.textContent).toContain('최종 점수 17');
    expect(screen.textContent).toContain('재시작');
    expect(screen.textContent).toContain('메인 메뉴');
    expect(screen.querySelector('script')).toBeNull();
    expect(screen.querySelector('[aria-current="true"]')).not.toBeNull();
  });

  it('provides a touch-friendly space action and accessible warning banner', () => {
    const hud = createGameHud({ muted: false, getMuted: () => false }, {
      pause: vi.fn(), toggleMute: vi.fn(), space: vi.fn(),
    });
    hud.update({ score: 21, difficulty: { isWarning: true, isBoss: false } });

    expect(hud.element.textContent).toContain('SPACE 대시');
    expect(hud.element.querySelector('[aria-live="assertive"]').textContent).toBe('WARNING');
    expect(hud.element.querySelector('.mobile-space-button').getAttribute('aria-label')).toBe('특수 벽 대시');
  });
});
