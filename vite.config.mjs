import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Deployment evidence belongs in the documents, not in the game's bundle.
export function runtimeRelease(registry) {
  return {
    currentVersion: registry.currentVersion,
    developmentVersion: registry.developmentVersion,
    versionBase: registry.versionBase,
    releases: registry.releases.map(({ version, displayVersion }) => ({ version, displayVersion })),
  };
}

export function runtimeReleasePlugin(file = fileURLToPath(new URL('./docs/management/releases.json', import.meta.url))) {
  const target = path.resolve(file).replaceAll('\\', '/');
  return {
    name: 'void-surfer-runtime-release',
    enforce: 'pre',
    transform(source, id) {
      if (id.split('?')[0].replaceAll('\\', '/') !== target) return null;
      return { code: JSON.stringify(runtimeRelease(JSON.parse(source))), map: null };
    },
  };
}

export default defineConfig({ plugins: [runtimeReleasePlugin()] });
