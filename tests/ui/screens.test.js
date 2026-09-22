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

  it('documents click, special-wall space, normal-wall, and pause controls', () => {
    const tutorial = renderTutorialScreen({}, { start: vi.fn() });
    expect(tutorial.textContent).toContain('클릭/터치: 위로 상승');
    expect(tutorial.textContent).toContain('SPACE: 특수 벽 앞 정확한 타이밍에 대시');
    expect(tutorial.textContent).toContain('일반 벽에서는 SPACE가 작동하지 않습니다');
    expect(tutorial.textContent).toContain('일시정지 (-10점)');
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
    expect(screen.textContent).toContain('바로 재시작');
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
