import { describe, expect, it, vi } from 'vitest';
import { createVisualAssetLoader, VISUAL_ASSET_MANIFEST } from '../../src/game/visual-assets.js';

describe('visual asset loader', () => {
  it('registers the local menu wordmark in the shared asset preloader manifest', () => {
    expect(VISUAL_ASSET_MANIFEST.menuTitle).toBe('/assets/game/menu/void-surfer-wordmark.png');
  });

  it('declares a complete seven-asset pack for every stage', () => {
    const expectedAssets = ['background', 'bossBackground', 'normalWall', 'specialWall', 'boss', 'projectile', 'laser'];
    expect(Object.keys(VISUAL_ASSET_MANIFEST.stages)).toEqual([
      'crystal-gates', 'industrial-void', 'signal-monoliths', 'gravity-well', 'abyssal-beast', 'solar-forge',
    ]);
    for (const stage of Object.values(VISUAL_ASSET_MANIFEST.stages)) {
      expect(Object.keys(stage)).toEqual(expectedAssets);
      for (const path of Object.values(stage)) expect(path).toMatch(/^\/assets\/game\/stages\/.+\.png$/);
    }
  });

  it('loads each unique URL once and resolves assets by key or URL', async () => {
    const images = [];
    const imageFactory = vi.fn(() => {
      const image = {};
      images.push(image);
      return image;
    });
    const loader = createVisualAssetLoader({
      manifest: { menu: '/menu.png', nested: { ship: '/ship.png', duplicate: '/menu.png' } },
      imageFactory,
    });

    const pending = loader.preload();
    expect(imageFactory).toHaveBeenCalledTimes(2);
    expect(images.map(({ src }) => src)).toEqual(['/menu.png', '/ship.png']);
    images[0].onload();
    images[1].onload();

    await expect(pending).resolves.toEqual({ loaded: ['/menu.png', '/ship.png'], failed: [] });
    expect(loader.get('menu')).toBe(images[0]);
    expect(loader.get('nested.ship')).toBe(images[1]);
    expect(loader.get('/ship.png')).toBe(images[1]);
    expect(loader.getFailures()).toEqual([]);
  });

  it('keeps failed paths in manifest order and does not reject on image errors', async () => {
    const images = [];
    const loader = createVisualAssetLoader({
      manifest: { first: '/first.png', second: '/second.png', third: '/third.png' },
      imageFactory: () => {
        const image = {};
        images.push(image);
        return image;
      },
    });

    const pending = loader.preload();
    images[2].onerror();
    images[0].onload();
    images[1].onerror();

    await expect(pending).resolves.toEqual({
      loaded: ['/first.png'],
      failed: ['/second.png', '/third.png'],
    });
    expect(loader.get('first')).toBe(images[0]);
    expect(loader.get('second')).toBeNull();
    expect(loader.getFailures()).toEqual(['/second.png', '/third.png']);
  });

  it('caches the preload operation for repeated callers', async () => {
    const image = {};
    const loader = createVisualAssetLoader({
      manifest: { image: '/image.png' },
      imageFactory: () => image,
    });

    const first = loader.preload();
    expect(loader.preload()).toBe(first);
    image.onload();
    await first;
  });
});
