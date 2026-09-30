import { describe, expect, it } from 'vitest';
import { renderLeaderboardPanel, renderPilotRankingTable } from '../../src/ui/leaderboard-view.js';
import { renderPilotRankingScreen } from '../../src/ui/screens.js';

describe('leaderboard aircraft identity', () => {
  it('shows a safe ship icon and label without creating markup from pilot names', () => {
    const panel = renderLeaderboardPanel({
      top: { rows: [
        { rank: 1, displayName: '<img src=x>', bestScore: 120, aircraftId: 'velocity' },
        { rank: 2, displayName: 'Pilot', bestScore: 50, aircraftId: 'unknown' },
      ] },
      neighborhood: { rows: [] },
    });
    const table = panel.querySelector('.leaderboard-section table');
    const rows = [...table.querySelectorAll('tbody tr')];

    expect([...table.querySelectorAll('thead th')].map((cell) => cell.textContent))
      .toEqual(['순위', '파일럿', '기체', '점수']);
    expect(rows[0].children[2].textContent).toBe('➤ VELOCITY');
    expect(rows[1].children[2].textContent).toBe('✦ NOVA');
    expect(panel.querySelector('img')).toBeNull();
    expect(rows[0].children[1].textContent).toBe('<img src=x>');
  });

  it('renders the full ranking as safe table text with a keyboard-scrollable region', () => {
    const screen = renderPilotRankingScreen({
      rows: [{ rank: 7, displayName: '<img src=x>', aircraftId: 'velocity', bestScore: 91 }],
      hasMore: true,
      personalRecord: { rank: null, displayName: 'GUEST', aircraftId: 'aegis', bestScore: 23, guest: true },
    }, { loadMore: () => {}, back: () => {} });
    const table = screen.querySelector('.pilot-ranking-table');
    const row = table.querySelector('tbody tr');

    expect(screen.getAttribute('aria-label')).toBe('파일럿 랭킹');
    expect(screen.querySelector('.pilot-ranking-table-scroll').tabIndex).toBe(0);
    expect([...table.querySelectorAll('thead th')].map((cell) => cell.textContent))
      .toEqual(['순위', '파일럿', '기체', '최고 점수']);
    expect(row.children[1].textContent).toBe('<img src=x>');
    expect(screen.querySelector('img')).toBeNull();
    expect(screen.querySelector('.ranking-load-more').textContent).toBe('더 불러오기');
    expect(screen.querySelector('.ranking-personal-record').textContent).toContain('전역 순위 없음');
    expect(screen.querySelector('.ranking-personal-record').textContent).toContain('이 브라우저에만 저장');
  });

  it('shows ranking loading, failure, and completion states', () => {
    const loading = renderPilotRankingScreen({ loading: true, hasMore: true }, { loadMore: () => {} });
    expect(loading.querySelector('.pilot-ranking-table-scroll').getAttribute('aria-busy')).toBe('true');
    expect(loading.textContent).toContain('순위를 불러오는 중');

    const failed = renderPilotRankingScreen({ error: new Error('offline'), hasMore: true }, { loadMore: () => {} });
    expect(failed.textContent).toContain('순위를 불러오지 못했습니다.');
    expect(failed.querySelector('.ranking-load-more').textContent).toBe('다시 시도');

    const complete = renderPilotRankingScreen({ rows: [{ rank: 1, displayName: 'P', aircraftId: 'default', bestScore: 1 }] });
    expect(complete.textContent).toContain('모든 순위를 불러왔습니다.');
  });
});
