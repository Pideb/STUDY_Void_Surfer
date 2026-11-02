export function getDisplayVersion(releaseId,registry) {
  return registry?.releases?.find(r=>r.version===releaseId)?.displayVersion ?? releaseId;
}
