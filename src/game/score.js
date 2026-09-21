export function advanceScore(session, obstacleId) {
  if (!session || obstacleId === undefined || obstacleId === null) {
    return false;
  }

  session.passedObstacleIds ??= new Set();

  if (session.passedObstacleIds.has(obstacleId)) {
    return false;
  }

  session.passedObstacleIds.add(obstacleId);
  session.score = Math.max(0, Math.trunc(session.score ?? 0)) + 1;
  return true;
}
