import { describe, expect, it } from 'vitest';
import { createSingleLaser, createQuarterLaser, updateLaser } from '../../src/game/boss-attacks.js';
import { createPlayer } from '../../src/game/player.js';
import { createObstacle } from '../../src/game/obstacles.js';
import {
  advanceDash,
  intersectsPlayerObstacle,
  intersectsSweptPlayerObstacle,
  intersectsPlayerLaser,
  isProjectileReflectionSuccess,
  isSpecialTimingSuccess,
  startDash,
} from '../../src/game/collision.js';

function makeObstacle(overrides = {}) {
  return createObstacle({
    id: 'wall-1',
    x: 220,
    gapCenter: 270,
    gapHeight: 180,
    ...overrides,
  });
}

describe('collision', () => {
  it('catches thin/normal walls crossing the entire small body, with exact dash expiry protection', () => {
    const player=createPlayer();
    for(const kind of ['special','normal','hybrid']){
      const old=makeObstacle({kind,x:280,gapCenter:80}),wall={...old,x:140};
      expect(intersectsPlayerObstacle(player,old)).toBe(false);
      expect(intersectsPlayerObstacle(player,wall)).toBe(false);
      expect(intersectsSweptPlayerObstacle(player,wall,player,old,.1)).toBe(true);
    }
    const old=makeObstacle({kind:'special',x:280}),wall={...old,x:140};
    const protectedPlayer={...player,isDashing:true,dashKind:'special',dashTargetId:wall.id,dashRemainingSeconds:.08};
    expect(intersectsSweptPlayerObstacle(player,wall,protectedPlayer,old,.1)).toBe(false);
    expect(intersectsSweptPlayerObstacle(player,wall,{...protectedPlayer,dashRemainingSeconds:.03},old,.1)).toBe(true);
  });
  it('allows a player inside the gap and rejects a player in the top solid', () => {
    const player = createPlayer();
    const obstacle = makeObstacle();

    expect(intersectsPlayerObstacle(player, obstacle)).toBe(false);
    player.y = 80;
    expect(intersectsPlayerObstacle(player, obstacle)).toBe(true);
  });

  it('requires a dash for a special wall and ignores only the targeted wall', () => {
    const player = createPlayer();
    const specialWall = makeObstacle({ kind: 'special' });
    const normalWall = makeObstacle({ id: 'wall-2' });

    expect(intersectsPlayerObstacle(player, specialWall)).toBe(true);
    startDash(player, 0.6, 'wall-1', 'special');
    expect(intersectsPlayerObstacle(player, specialWall)).toBe(false);
    player.y = 80;
    expect(intersectsPlayerObstacle(player, normalWall)).toBe(true);

    advanceDash(player, 0.6);
    expect(player.isDashing).toBe(false);
    expect(intersectsPlayerObstacle(player, specialWall)).toBe(true);
  });

  it('keeps hybrid upper/lower solids lethal while dashing only through the inner barrier', () => {
    const player = createPlayer();
    const wall = makeObstacle({ x: 220, kind: 'hybrid' });
    expect(intersectsPlayerObstacle(player, wall)).toBe(true);
    startDash(player, 0.6, wall.id, 'special');
    expect(intersectsPlayerObstacle(player, wall)).toBe(false);
    expect(intersectsPlayerObstacle({ ...player, y: 80 }, wall)).toBe(true);
    expect(intersectsPlayerObstacle({ ...player, y: 460 }, wall)).toBe(true);
    expect(intersectsPlayerObstacle(player, { ...wall, id: 'another' })).toBe(true);
    advanceDash(player, 0.6);
    wall.barrierBroken = true;
    expect(intersectsPlayerObstacle(player, wall)).toBe(false);
    expect(intersectsPlayerObstacle({ ...player, y: 80 }, wall)).toBe(true);
    // Touching only the normal frame inside its opening must not hit the recessed barrier.
    expect(intersectsPlayerObstacle(player, makeObstacle({ x: 250, kind: 'hybrid' }))).toBe(false);
  });

  it('keeps normal dashes collidable with every wall', () => {
    const player = createPlayer();
    const specialWall = makeObstacle({ kind: 'special' });
    const normalWall = makeObstacle({ id: 'wall-2' });

    startDash(player, 0.6);

    expect(player).toMatchObject({ isDashing: true, dashKind: 'normal', dashTargetId: null });
    expect(intersectsPlayerObstacle(player, specialWall)).toBe(true);
    player.y = 80;
    expect(intersectsPlayerObstacle(player, normalWall)).toBe(true);
  });

  it('uses only the central16x16 square, preserving visual dimensions and harmless wing/nose grazes', () => {
    const player = createPlayer();
    const noseOnlyWall = makeObstacle({ x: 256, kind: 'special' });
    const hullWall = makeObstacle({ x: 247.99, kind: 'special' });

    expect(intersectsPlayerObstacle(player, noseOnlyWall)).toBe(false);
    expect(intersectsPlayerObstacle(player, hullWall)).toBe(true);
    expect(intersectsPlayerObstacle(player, makeObstacle({ x: 248, kind: 'special' }))).toBe(false);
    expect(intersectsPlayerLaser(player, { kind: 'single', y: 287.01, thickness: 18, telegraphRemainingSeconds: 0, activeRemainingSeconds: 1 })).toBe(false);
    expect(intersectsPlayerLaser(player, { kind: 'single', y: 287, thickness: 18, telegraphRemainingSeconds: 0, activeRemainingSeconds: 1 })).toBe(true);
    expect(player).toMatchObject({ width: 36, height: 24 });
  });

  it('recognizes a short projectile reflection window and safe laser zone', () => {
    const player = { x: 240, y: 270, width: 36, height: 24 };
    const projectile = { state: 'flying', x: 242, y: 270, speed: 240, reflectionWindowSeconds: 0.15 };
    const laser = { kind: 'quarter', safeZone: 2, zoneHeight: 135, telegraphRemainingSeconds: 0, activeRemainingSeconds: 1 };

    expect(isProjectileReflectionSuccess({ player, projectile })).toBe(true);
    expect(intersectsPlayerLaser({ ...player, y: 70 }, laser)).toBe(true);
    expect(intersectsPlayerLaser({ ...player, y: 340 }, laser)).toBe(false);
  });

  it('damages only after the shared light front reaches the trimmed hull, never during warning or fade', () => {
    const player = createPlayer();
    const laser = createSingleLaser({ gapCenter: 70, gapHeight: 100, rng: () => 0.2 });
    laser.y = player.y;
    laser.ys = [player.y];
    expect(intersectsPlayerLaser(player, laser)).toBe(false);
    updateLaser(laser, 0.7 + 0.29);
    expect(intersectsPlayerLaser(player, laser)).toBe(false);
    updateLaser(laser, 0.01);
    expect(intersectsPlayerLaser(player, laser)).toBe(true);
    updateLaser(laser, 0.7);
    expect(laser.fadeRemainingSeconds).toBeGreaterThan(0);
    expect(intersectsPlayerLaser(player, laser)).toBe(false);
  });

  it('keeps the whole hull inside the safe quarter and applies the same moving front', () => {
    const laser = createQuarterLaser({ rng: () => 0.5 });
    const player = { ...createPlayer(), y: 340 };
    updateLaser(laser, 2.2);
    expect(intersectsPlayerLaser({ ...player, y: 100 }, laser)).toBe(false);
    updateLaser(laser, 0.2);
    expect(intersectsPlayerLaser(player, laser)).toBe(false);
    expect(intersectsPlayerLaser({ ...player, y: 275 }, laser)).toBe(true);
    expect(intersectsPlayerLaser({ ...player, y: 100 }, laser)).toBe(true);
  });

  it('accepts the pre-arrival timing boundary and rejects early or passed walls', () => {
    const timing = { playerX: 240, wallX: 328, speed: 400, windowSeconds: .15 };
    expect(isSpecialTimingSuccess(timing)).toBe(true);
    expect(isSpecialTimingSuccess({ ...timing, playerX: 239.999 })).toBe(false);
    // A large front already beyond the wall is safe if the actual body is clear.
    expect(isSpecialTimingSuccess({ ...timing, wallX: 250 })).toBe(true);
    expect(isSpecialTimingSuccess({ ...timing, wallX: 247.999 })).toBe(false);
    expect(isSpecialTimingSuccess({
      playerX: 240,
      wallX: 300,
      speed: 240,
      windowSeconds: 0.25,
    })).toBe(true);
    expect(isSpecialTimingSuccess({
      playerX: 240,
      wallX: 361,
      speed: 240,
      windowSeconds: 0.25,
    })).toBe(false);
    expect(isSpecialTimingSuccess({
      playerX: 240,
      wallX: 239,
      speed: 240,
      windowSeconds: 0.25,
    })).toBe(false);
  });
});
