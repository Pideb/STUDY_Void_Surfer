export function getDisplayVersion(releaseId,registry) {
  return registry?.releases?.find(r=>r.version===releaseId)?.displayVersion ?? releaseId;
}
export function getGameVersion(registry,{development=false}={}) {
  return development && registry?.developmentVersion
    ? registry.developmentVersion
    : getDisplayVersion(registry?.currentVersion,registry);
}
