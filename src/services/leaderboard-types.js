function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeScoreRecord(value) {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== 'object') return null;

  const bestScore = toFiniteNumber(row.best_score ?? row.bestScore);
  const userId = row.user_id ?? row.userId;
  const achievedAt = row.achieved_at ?? row.achievedAt;

  if (!userId || bestScore === null || !achievedAt) return null;

  return {
    userId: String(userId),
    bestScore,
    achievedAt: String(achievedAt),
  };
}

export function normalizeLeaderboardRows(rows, currentUserId = null) {
  if (!Array.isArray(rows)) return [];

  const normalized = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;

    const rank = toFiniteNumber(row.rank);
    const bestScore = toFiniteNumber(row.best_score ?? row.bestScore);
    const userId = row.user_id ?? row.userId;
    const displayName = row.display_name ?? row.displayName;
    const achievedAt = row.achieved_at ?? row.achievedAt;

    if (rank === null || bestScore === null || !userId || typeof displayName !== 'string' || !achievedAt) {
      continue;
    }

    normalized.push({
      rank,
      userId: String(userId),
      displayName: displayName.trim(),
      bestScore,
      achievedAt: String(achievedAt),
      isCurrentUser: currentUserId !== null && String(userId) === String(currentUserId),
    });
  }

  return normalized;
}
