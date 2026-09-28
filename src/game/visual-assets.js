export const VISUAL_ASSET_MANIFEST = Object.freeze({
  menuBackground: '/assets/game/menu/space-background.png',
  aircraft: Object.freeze({
    default: '/assets/game/aircraft/default.png',
    velocity: '/assets/game/aircraft/velocity.png',
    aegis: '/assets/game/aircraft/aegis.png',
  }),
  stages: Object.freeze({
    'crystal-gates': Object.freeze({
      background: '/assets/game/stages/crystal-gates/background.png',
      bossBackground: '/assets/game/stages/crystal-gates/boss-background.png',
      normalWall: '/assets/game/stages/crystal-gates/normal-wall.png',
      specialWall: '/assets/game/stages/crystal-gates/special-wall.png',
      boss: '/assets/game/stages/crystal-gates/boss.png',
      projectile: '/assets/game/stages/crystal-gates/projectile.png',
      laser: '/assets/game/stages/crystal-gates/laser.png',
    }),
  }),
});

function collectManifestEntries(value, prefix = '', entries = []) {
  if (typeof value === 'string') {
    entries.push([prefix, value]);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      collectManifestEntries(child, prefix ? `${prefix}.${key}` : key, entries);
    }
  }
  return entries;
}

export function createVisualAssetLoader({
  manifest = VISUAL_ASSET_MANIFEST,
  imageFactory = () => new Image(),
} = {}) {
  const entries = collectManifestEntries(manifest);
  const urlByKey = new Map(entries);
  const urls = [...new Set(entries.map(([, url]) => url))];
  const imagesByUrl = new Map();
  let preloadPromise = null;
  let failures = [];

  function preload() {
    if (preloadPromise) return preloadPromise;

    preloadPromise = Promise.all(urls.map((url) => new Promise((resolve) => {
      let image;
      try {
        image = imageFactory();
        imagesByUrl.set(url, image);
        image.onload = () => resolve({ url, ok: true });
        image.onerror = () => resolve({ url, ok: false });
        image.src = url;
      } catch {
        resolve({ url, ok: false });
      }
    }))).then((results) => {
      const loaded = results.filter(({ ok }) => ok).map(({ url }) => url);
      failures = results.filter(({ ok }) => !ok).map(({ url }) => url);
      for (const url of failures) imagesByUrl.delete(url);
      return { loaded, failed: [...failures] };
    });

    return preloadPromise;
  }

  function get(path) {
    const url = urlByKey.get(path) ?? path;
    return imagesByUrl.get(url) ?? null;
  }

  return {
    preload,
    get,
    getFailures: () => [...failures],
  };
}
