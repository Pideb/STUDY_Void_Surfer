import { describe, expect, it, vi } from 'vitest';
import {
  renderGameOverScreen, renderHangarScreen, renderLoginScreen, renderMenuScreen, renderTutorialScreen,
} from '../../src/ui/screens.js';
import { createGameHud } from '../../src/ui/game-hud.js';

describe('product flow screens', () => {
  it('uses a transparent menu overlay with a bold pilot greeting and separated logout', () => {
    const screen = renderMenuScreen({ displayName: 'Pilot', muted: false }, {
      start: vi.fn(), toggleMute: vi.fn(), signOut: vi.fn(),
    });

    expect(screen.classList.contains('screen-panel')).toBe(false);
    expect(screen.classList.contains('menu-overlay')).toBe(true);
    expect(screen.querySelector('.menu-brand strong')?.textContent).toBe('Pilot');
    expect(screen.querySelector('.menu-greeting')?.textContent)
      .toBe('Pilot파일럿, 다시 도전하는 것을 환영합니다.');
    const labels = [...screen.querySelectorAll('button')].map((button) => button.textContent.trim());
    expect(labels).not.toContain('조작법');
    expect(labels).toContain('게임 시작');
    expect(labels).toContain('기체 선택');
    expect(labels).toContain('로그아웃');
  });

  it('shows hangar unlock states and only allows selecting unlocked aircraft', () => {
    const select = vi.fn();
    const screen = renderHangarScreen({
      bestScore: 50,
      selectedAircraftId: 'aegis',
      aircraft: [
        { id: 'default', name: 'DEFAULT', unlockBestScore: 0, unlocked: true, description: '균형', stats: '표준' },
        { id: 'velocity', name: 'VELOCITY', unlockBestScore: 100, unlocked: false, description: '고속', stats: '속도 ×2' },
        { id: 'aegis', name: 'AEGIS', unlockBestScore: 50, unlocked: true, description: '중량', stats: '중력 ×2' },
      ],
    }, { select, back: vi.fn() });
    const [basic, velocity, aegis] = screen.querySelectorAll('.aircraft-option');
    expect(basic.getAttribute('aria-pressed')).toBe('false');
    expect(velocity.disabled).toBe(true);
    expect(velocity.getAttribute('aria-label')).toContain('100점에서 해금');
    expect(aegis.getAttribute('aria-pressed')).toBe('true');
    velocity.click();
    aegis.click();
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith('aegis');
  });

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
