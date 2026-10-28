export const VISUAL_ASSET_MANIFEST = Object.freeze({
  menuBackground: '/assets/game/menu/space-background.png',
  menuTitle: '/assets/game/menu/void-surfer-wordmark.png',
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
      boss: '/assets/game/stages/crystal-gates/boss-evolved.png',
      projectile: '/assets/game/stages/crystal-gates/projectile.png',
      laser: '/assets/game/stages/crystal-gates/laser.png',
      portalOrnaments: '/assets/game/stages/crystal-gates/portal-ornaments.png',
    }),
    'industrial-void': Object.freeze({
      background: '/assets/game/stages/industrial-void/background.png',
      bossBackground: '/assets/game/stages/industrial-void/boss-background.png',
      normalWall: '/assets/game/stages/industrial-void/normal-wall.png',
      specialWall: '/assets/game/stages/industrial-void/special-wall.png',
      boss: '/assets/game/stages/industrial-void/boss.png',
      projectile: '/assets/game/stages/industrial-void/projectile.png',
      laser: '/assets/game/stages/industrial-void/laser.png',
      portalOrnaments: '/assets/game/stages/industrial-void/portal-ornaments.png',
    }),
    'signal-monoliths': Object.freeze({
      background: '/assets/game/stages/signal-monoliths/background.png',
      bossBackground: '/assets/game/stages/signal-monoliths/boss-background.png',
      normalWall: '/assets/game/stages/signal-monoliths/normal-wall.png',
      specialWall: '/assets/game/stages/signal-monoliths/special-wall.png',
      boss: '/assets/game/stages/signal-monoliths/boss-evolved.png',
      projectile: '/assets/game/stages/signal-monoliths/projectile.png',
      laser: '/assets/game/stages/signal-monoliths/laser.png',
      portalOrnaments: '/assets/game/stages/signal-monoliths/portal-ornaments.png',
    }),
    'gravity-well': Object.freeze({
      background: '/assets/game/stages/gravity-well/background.png',
      bossBackground: '/assets/game/stages/gravity-well/boss-background.png',
      normalWall: '/assets/game/stages/gravity-well/normal-wall.png',
      specialWall: '/assets/game/stages/gravity-well/special-wall.png',
      boss: '/assets/game/stages/gravity-well/boss.png',
      projectile: '/assets/game/stages/gravity-well/projectile.png',
      laser: '/assets/game/stages/gravity-well/laser.png',
      portalOrnaments: '/assets/game/stages/gravity-well/portal-ornaments.png',
    }),
    'abyssal-beast': Object.freeze({
      background: '/assets/game/stages/abyssal-beast/background.png',
      bossBackground: '/assets/game/stages/abyssal-beast/boss-background.png',
      normalWall: '/assets/game/stages/abyssal-beast/normal-wall.png',
      specialWall: '/assets/game/stages/abyssal-beast/special-wall.png',
      boss: '/assets/game/stages/abyssal-beast/boss-evolved.png',
      projectile: '/assets/game/stages/abyssal-beast/projectile.png',
      laser: '/assets/game/stages/abyssal-beast/laser.png',
      portalOrnaments: '/assets/game/stages/abyssal-beast/portal-ornaments.png',
    }),
    'solar-forge': Object.freeze({
      background: '/assets/game/stages/solar-forge/background.png',
      bossBackground: '/assets/game/stages/solar-forge/boss-background.png',
      normalWall: '/assets/game/stages/solar-forge/normal-wall.png',
      specialWall: '/assets/game/stages/solar-forge/special-wall.png',
      boss: '/assets/game/stages/solar-forge/boss-evolved.png',
      projectile: '/assets/game/stages/solar-forge/projectile.png',
      laser: '/assets/game/stages/solar-forge/laser.png',
      portalOrnaments: '/assets/game/stages/solar-forge/portal-ornaments.png',
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
