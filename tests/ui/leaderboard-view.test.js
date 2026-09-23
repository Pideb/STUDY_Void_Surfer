import { describe, expect, it } from 'vitest';
import { renderLeaderboardPanel } from '../../src/ui/leaderboard-view.js';

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
    expect(rows[1].children[2].textContent).toBe('✦ DEFAULT');
    expect(panel.querySelector('img')).toBeNull();
    expect(rows[0].children[1].textContent).toBe('<img src=x>');
  });
});
