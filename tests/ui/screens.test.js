import { describe, expect, it, vi } from 'vitest';
import {
  renderGameOverScreen, renderHangarScreen, renderLoginScreen, renderMenuScreen, renderPausedScreen, renderTutorialScreen,
} from '../../src/ui/screens.js';
import { createGameHud } from '../../src/ui/game-hud.js';

describe('product flow screens', () => {
  it('uses a transparent menu overlay with a bold pilot greeting and separated logout', () => {
    const screen = renderMenuScreen({ displayName: 'Pilot', signedIn: true, muted: false }, {
      start: vi.fn(), toggleMute: vi.fn(), signIn: vi.fn(), signOut: vi.fn(),
    });

    expect(screen.classList.contains('screen-panel')).toBe(false);
    expect(screen.classList.contains('menu-overlay')).toBe(true);
    expect([...screen.children].map((child) => child.className)).toEqual([
      'menu-brand', 'menu-aircraft-preview menu-aircraft-preview-default', 'menu-actions', 'account-actions',
    ]);
    expect(screen.querySelector('.menu-aircraft-image')?.getAttribute('src')).toContain('/assets/game/aircraft/default.png');
    expect(screen.querySelector('.menu-brand strong')?.textContent).toBe('Pilot');
    const wordmark = screen.querySelector('h1.menu-wordmark');
    expect(wordmark?.textContent).toBe('VOID SURFER');
    expect(wordmark?.querySelector('.menu-wordmark-image')?.getAttribute('src'))
      .toBe('/assets/game/menu/void-surfer-wordmark.png');
    expect(wordmark?.querySelector('.menu-wordmark-image')?.getAttribute('alt')).toBe('');
    expect(wordmark?.querySelector('.menu-wordmark-image')?.getAttribute('aria-hidden')).toBe('true');
    expect(wordmark?.querySelector('.menu-wordmark-fallback')?.classList.contains('sr-only')).toBe(true);
    expect(screen.querySelector('.menu-greeting')?.textContent)
      .toBe('Pilot 파일럿, 다시 도전하는 것을 환영합니다.');
    const labels = [...screen.querySelectorAll('button')].map((button) => button.textContent.trim());
    expect(labels).not.toContain('조작법');
    expect(labels).toContain('게임 시작');
    expect(labels).toContain('기체 선택');
    expect(labels).toContain('로그아웃');
  });

  it('shows readable title text if the menu logo image fails to load', () => {
    const screen = renderMenuScreen({ displayName: 'Pilot', muted: false }, {
      start: vi.fn(), toggleMute: vi.fn(), signIn: vi.fn(), signOut: vi.fn(),
    });
    const wordmark = screen.querySelector('h1.menu-wordmark');
    const image = wordmark.querySelector('.menu-wordmark-image');
    image.dispatchEvent(new Event('error'));

    expect(wordmark.classList.contains('is-logo-unavailable')).toBe(true);
    expect(wordmark.querySelector('.menu-wordmark-fallback').classList.contains('sr-only')).toBe(false);
    expect(wordmark.textContent).toBe('VOID SURFER');
  });

  it('shows the selected aircraft as decorative, accessible title-screen artwork', () => {
    const screen = renderMenuScreen({ displayName: 'Pilot', muted: false, selectedAircraft: 'VELOCITY', selectedAircraftId: 'velocity' }, {
      start: vi.fn(), toggleMute: vi.fn(), signIn: vi.fn(), signOut: vi.fn(),
    });
    const preview = screen.querySelector('.menu-aircraft-preview');

    expect(preview.className).toContain('menu-aircraft-preview-velocity');
    expect(preview.getAttribute('aria-label')).toBe('선택 기체 VELOCITY');
    expect(preview.querySelector('img').getAttribute('src')).toContain('/assets/game/aircraft/velocity.png');
    expect(preview.querySelector('img').getAttribute('alt')).toBe('');
    expect(preview.querySelector('.menu-aircraft-exhaust')).not.toBeNull();
  });

  it('shows GUEST login action and an accessible recoverable authentication error', () => {
    const signIn = vi.fn();
    const screen = renderMenuScreen({
      displayName: 'GUEST', signedIn: false, authError: '로그인 연결을 확인해 주세요.', muted: false,
    }, { start: vi.fn(), toggleMute: vi.fn(), signIn, signOut: vi.fn() });

    expect(screen.querySelector('.menu-greeting strong').textContent).toBe('GUEST');
    expect([...screen.querySelectorAll('.account-actions button')].map((button) => button.textContent))
      .toEqual(['로그인']);
    expect(screen.querySelector('[role="alert"]')?.textContent).toBe('로그인 연결을 확인해 주세요.');
    screen.querySelector('.account-actions button').click();
    expect(signIn).toHaveBeenCalledOnce();
  });

  it('shows hangar unlock states and only allows selecting unlocked aircraft', () => {
    const select = vi.fn();
    const screen = renderHangarScreen({
      bestScore: 50,
      selectedAircraftId: 'aegis',
      aircraft: [
        { id: 'default', name: 'NOVA', unlockBestScore: 0, unlocked: true, description: '균형', stats: '표준' },
        { id: 'aegis', name: 'AEGIS', unlockBestScore: 50, unlocked: true, description: '중량', stats: '중력 ×2' },
        { id: 'velocity', name: 'VELOCITY', unlockBestScore: 100, unlocked: false, description: '고속', stats: '속도 ×2' },
      ],
    }, { select, back: vi.fn() });
    const [basic, aegis, velocity] = screen.querySelectorAll('.aircraft-option');
    expect(basic.querySelector('.aircraft-preview')?.getAttribute('src')).toContain('/assets/game/aircraft/default.png');
    expect(velocity.querySelector('.aircraft-preview')?.getAttribute('src')).toContain('/assets/game/aircraft/velocity.png');
    expect(aegis.querySelector('.aircraft-preview')?.getAttribute('src')).toContain('/assets/game/aircraft/aegis.png');
    expect(basic.getAttribute('aria-pressed')).toBe('false');
    expect(velocity.disabled).toBe(true);
    expect(velocity.getAttribute('aria-label')).toContain('100점에서 해금');
    expect(aegis.getAttribute('aria-pressed')).toBe('true');
    velocity.click();
    aegis.click();
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith('aegis');
  });

  it('labels the guest-local best record distinctly and can render every guest aircraft unlocked', () => {
    const screen = renderHangarScreen({
      bestScore: 27,
      recordLabel: '게스트 최고 기록',
      aircraft: [
        { id: 'default', name: 'NOVA', unlocked: true },
        { id: 'aegis', name: 'AEGIS', unlocked: true },
        { id: 'velocity', name: 'VELOCITY', unlocked: true },
      ],
    }, { select: vi.fn(), back: vi.fn() });

    expect(screen.querySelector('.hangar-best-score').textContent).toBe('게스트 최고 기록 27점');
    expect([...screen.querySelectorAll('.aircraft-option')].every((button) => !button.disabled)).toBe(true);
  });

  it('shows an explicit account-score loading state before unlock decisions settle', () => {
    const screen = renderHangarScreen({
      loading: true,
      bestScore: 0,
      aircraft: [{ id: 'velocity', name: 'VELOCITY', unlockBestScore: 100, unlocked: false, description: 'speed', stats: 'x2' }],
    }, { select: vi.fn(), back: vi.fn() });

    expect(screen.querySelector('.hangar-best-score').textContent).toContain('불러오는 중');
    expect(screen.querySelector('.aircraft-option')?.disabled).toBe(true);
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
    expect(tutorial.textContent).toContain('SPACE: 대시 (회피)');
    expect(tutorial.textContent).not.toContain('SPACE: 언제든 대시 잔상이 남습니다');
    expect(tutorial.textContent).toContain('특수 벽은 정확한 타이밍의 SPACE 대시로만 통과합니다');
    expect(tutorial.textContent).toContain('보스 투사체를 정확한 타이밍에 SPACE 대시로 반사해 BOSS HP를 0으로 만들면 클리어합니다.');
    expect(tutorial.textContent).not.toContain('BOSS 1~4는 3회, 5번째부터는 5회 반사가 필요합니다.');
    expect(tutorial.textContent).not.toContain('WASD 챌린지는 별도 도전이며, 성공해도 BOSS에게 피해를 주지 않습니다.');
    expect(tutorial.textContent).toContain('출격 전 안내');
    expect(tutorial.querySelectorAll('.tutorial-list > li')).toHaveLength(5);
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

  it('shows the VELOCITY base-to-final score equation', () => {
    const screen = renderGameOverScreen({
      score: 50, baseScore: 33, scoreMultiplier: 1.5, aircraftId: 'velocity',
      leaderboard: { top: { rows: [] }, neighborhood: { rows: [] } },
    }, { restart: vi.fn(), menu: vi.fn(), retryLeaderboard: vi.fn() });

    expect(screen.querySelector('.final-score').textContent).toBe('기본 점수 33 × 1.5 = 최종 점수 50');
  });

  it('explains the pause penalty without implying that speed rolls back', () => {
    const resume = vi.fn();
    const menu = vi.fn();
    const screen = renderPausedScreen({ score: 12 }, { resume, menu });

    expect(screen.textContent).toContain('일시정지할 때마다 점수 10점이 차감되며, 이미 오른 속도는 내려가지 않습니다.');
    [...screen.querySelectorAll('button')].find((button) => button.textContent === '계속하기').click();
    expect(resume).toHaveBeenCalledOnce();
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
