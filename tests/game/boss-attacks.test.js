import { describe, expect, it } from 'vitest';
import {
  createBossProjectile,
  getBossProjectileBodyBounds,
  getBossProjectilePoint,
  intersectsBossProjectilePlayer,
  isProjectileInReflectionWindow,
  reflectProjectile,
  updateBossProjectile,
  createQuarterLaser,
} from '../../src/game/boss-attacks.js';

describe('consecutive global laser warnings', () => {
  it('excludes the previous quarter for every RNG endpoint and restarts a full warning', () => {
    for (const previous of [0, 1, 2, 3]) for (const value of [0, .5, 1]) {
      const laser = createQuarterLaser({ excludeSafeZone: previous, rng: () => value });
      expect(laser.safeZone).not.toBe(previous);
      expect(laser.telegraphRemainingSeconds).toBeGreaterThanOrEqual(2);
      expect(laser.activeRemainingSeconds).toBe(1);
    }
  });
  it('extends a difficult AEGIS crossing without reducing the baseline', () => {
    const laser = createQuarterLaser({ rng: () => 0, playerY: 510, liftSpeed: 252 });
    expect(laser.safeZone).toBe(0);
    expect(laser.telegraphDurationSeconds).toBeGreaterThan(2);
    expect(laser.telegraphRemainingSeconds).toBe(laser.telegraphDurationSeconds);
  });
});

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
    updateBossProjectile(projectile, 2);

    expect(projectile.kind).toBe('parabolic');
    expect(projectile.telegraphPoints).toHaveLength(9);
    expect(isProjectileInReflectionWindow(projectile, projectile.x)).toBe(true);
    expect(reflectProjectile(projectile, projectile.x, projectile.y)).toBe(true);
    expect(projectile.state).toBe('returning');
    updateBossProjectile(projectile, 4);
    expect(projectile.state).toBe('resolved');
    expect(projectile.x).toBe(840);
  });

  it('uses a centered 16x11 projectile body and inclusive player-box overlap', () => {
    const projectile = { x: 230, y: 200 };
    const player = { x: 240, y: 200, width: 36, height: 24 };
    expect(getBossProjectileBodyBounds(projectile)).toEqual({
      left: 222, right: 238, top: 194.5, bottom: 205.5,
    });
    expect(intersectsBossProjectilePlayer(projectile, player)).toBe(true);
    expect(intersectsBossProjectilePlayer({ x: 230, y: 182.5 }, player)).toBe(true);
    expect(intersectsBossProjectilePlayer({ x: 230, y: 182.49 }, player)).toBe(false);
  });

  it('marks only an actual body overlap as a hit and resolves vertical near-misses', () => {
    const makeProjectile = (bossY, targetY) => {
      const projectile = createBossProjectile({
        id: 'shot-collision', bossX: 840, bossY, playerX: 240, playerY: targetY,
        baseSpeed: 600, rng: () => 0,
      });
      updateBossProjectile(projectile, 0.6);
      return projectile;
    };
    const player = { x: 240, y: 200, width: 36, height: 24 };
    const hit = makeProjectile(200, 200);
    updateBossProjectile(hit, 1.5, player);
    expect(hit.state).toBe('missed');
    expect(hit.hitPlayer).toBe(true);

    const miss = makeProjectile(400, 400);
    updateBossProjectile(miss, 1.6, player);
    expect(miss.state).toBe('missed');
    expect(miss.hitPlayer).toBe(false);
  });

  it.each([
    ['direct', [0, 0, 0, 0.5]],
    ['parabolic-up', [0.9, 0, 0, 0.5]],
    ['parabolic-down', [0.9, 0, 0.9, 0.5]],
  ])('shares actual and preview coordinates for %s projectiles', (_label, values) => {
    const projectile = createBossProjectile({
      bossX: 840, bossY: 200, playerX: 240, playerY: 270, baseSpeed: 600,
      rng: () => values.shift() ?? 0.5,
    });
    expect(projectile.telegraphPoints).toHaveLength(9);
    projectile.telegraphPoints.forEach((point, index) => {
      expect(point).toEqual(getBossProjectilePoint(projectile, index / 8));
    });

    updateBossProjectile(projectile, 0.6);
    const flightDelta = 225 / projectile.speed;
    updateBossProjectile(projectile, flightDelta);
    expect(projectile.x).toBeCloseTo(615);
    expect(projectile.y).toBeCloseTo(getBossProjectilePoint(projectile, 0.375).y);
  });
});
