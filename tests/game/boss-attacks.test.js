import { describe, expect, it } from 'vitest';
import {
  createBossProjectile,
  isProjectileInReflectionWindow,
  reflectProjectile,
  updateBossProjectile,
} from '../../src/game/boss-attacks.js';

describe('boss projectiles', () => {
  it('creates a direct projectile with charge and randomized speed bounds', () => {
    const projectile = createBossProjectile({
      id: 'shot-1', bossX: 840, bossY: 200, playerX: 240, playerY: 270, baseSpeed: 240, rng: () => 0,
    });

    expect(projectile).toMatchObject({
      id: 'shot-1', kind: 'direct', state: 'charging', chargeRemainingSeconds: 0.6,
      reflectionWindowSeconds: 0.18,
    });
    expect(projectile.speed).toBe(168);
    updateBossProjectile(projectile, 0.6);
    expect(projectile.state).toBe('flying');
  });

  it('creates a parabolic dotted trajectory and visibly returns after reflection', () => {
    const values = [0.9, 0.5, 0, 0.5];
    const projectile = createBossProjectile({
      bossX: 840, bossY: 200, playerX: 240, playerY: 270, baseSpeed: 240, rng: () => values.shift() ?? 0.5,
    });
    updateBossProjectile(projectile, 0.6);
    updateBossProjectile(projectile, 2.9);

    expect(projectile.kind).toBe('parabolic');
    expect(projectile.telegraphPoints).toHaveLength(7);
    expect(isProjectileInReflectionWindow(projectile, projectile.x)).toBe(true);
    expect(reflectProjectile(projectile, projectile.x, projectile.y)).toBe(true);
    expect(projectile.state).toBe('returning');
    updateBossProjectile(projectile, 4);
    expect(projectile.state).toBe('resolved');
    expect(projectile.x).toBe(840);
  });
});
