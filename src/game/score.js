export function advanceScore(session, obstacleId, points = 1) {
  if (!session || obstacleId === undefined || obstacleId === null) {
    return false;
  }

  session.passedObstacleIds ??= new Set();

  if (session.passedObstacleIds.has(obstacleId)) {
    return false;
  }

  session.passedObstacleIds.add(obstacleId);
  const safePoints = Number.isFinite(points) ? Math.max(0, Math.trunc(points)) : 1;
  session.score = Math.max(0, Math.trunc(session.score ?? 0)) + safePoints;
  return true;
}
