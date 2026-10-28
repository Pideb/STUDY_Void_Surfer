import { describe, expect, it } from 'vitest';
import { createSignatureAttack, updateSignatureAttack } from '../../src/game/boss-signatures.js';
import { getBossGeometry } from '../../src/game/boss-geometry.js';
import { STAGE_CATALOG, STAGE_IDS } from '../../src/game/stages.js';

const player = { x: 240, y: 270, width: 36, height: 24 };
const makeAttack = (options = {}) => createSignatureAttack({
  id: 'signature-test', stageId: STAGE_IDS.CRYSTAL_GATES,
  playerX: player.x, playerY: player.y, rng: () => 0,
  ...options,
});

function centerShot(options = {}) {
  const attack = makeAttack(options);
  attack.projectiles = [attack.projectiles[2]];
  return attack;
}

function expectFiniteTree(value) {
  if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
  if (value && typeof value === 'object') Object.values(value).forEach(expectFiniteTree);
}

describe('signature creation and six identities', () => {
  it.each(STAGE_CATALOG.map((stage, index) => [stage.id, [5, 3, 3, 3, 3, 4][index], stage.projectileStyle]))(
    '%s creates %i announced shots with its existing %s style', (stageId, count, styleKey) => {
      const attack = makeAttack({ stageId });
      expect(attack).toMatchObject({
        id: 'signature-test', type: 'volley', stageId, state: 'charging',
        elapsedSeconds: 0, chargeSeconds: 1.1, hitPlayer: false,
      });
      expect(attack.durationSeconds).toBeGreaterThan(1.1);
      expect(attack.projectiles).toHaveLength(count);
      expect(new Set(attack.projectiles.map((shot) => shot.id)).size).toBe(count);
      attack.projectiles.forEach((shot) => {
        expect(shot).toMatchObject({
          type: 'projectile', stageId, styleKey, x: 750, y: 270,
          bossX: 750, bossY: 270, startY: 270, targetX: 240,
          previousX: 750, previousY: 270, elapsedSeconds: 0,
          state: 'charging', chargeRemainingSeconds: 1.1, hitPlayer: false,
        });
        expect(shot.telegraphPoints[0]).toEqual({ x: shot.bossX, y: shot.bossY });
        const end = shot.telegraphPoints.at(-1);
        expect(end.x).toBe(shot.targetX);
        expect(end.y).toBeCloseTo(shot.targetY);
      });
      expectFiniteTree(attack);
    },
  );

  it('fires a symmetric simultaneous five-shard crystal fan', () => {
    const shots = makeAttack().projectiles;
    expect(shots.map((shot) => shot.targetY)).toEqual([126, 198, 270, 342, 414]);
    expect(shots.every((shot) => shot.curveAmplitude === 0 && shot.delaySeconds === 0)).toBe(true);
  });

  it('alternates upper/lower industrial shots and reverses the opening side by boss number', () => {
    const first = makeAttack({ stageId: STAGE_IDS.INDUSTRIAL_VOID, bossNumber: 1 }).projectiles;
    const next = makeAttack({ stageId: STAGE_IDS.INDUSTRIAL_VOID, bossNumber: 2 }).projectiles;
    expect(first.map((shot) => Math.sign(shot.targetY - 270))).toEqual([-1, 1, -1]);
    expect(next.map((shot) => Math.sign(shot.targetY - 270))).toEqual([1, -1, 1]);
    expect(first.map((shot) => shot.delaySeconds)).toEqual([0, 0.28, 0.56]);
  });

  it('announces three separated signal lanes in the same order they fire', () => {
    const attack = makeAttack({ stageId: STAGE_IDS.SIGNAL_MONOLITHS });
    expect(attack.projectiles.map((shot) => shot.targetY)).toEqual([158, 270, 382]);
    expect(attack.projectiles.map((shot) => shot.delaySeconds)).toEqual([0, 0.36, 0.72]);
    const preview = structuredClone(attack.projectiles.map((shot) => shot.telegraphPoints));
    updateSignatureAttack(attack, 1.1);
    expect(attack.projectiles.map((shot) => shot.state)).toEqual(['flying', 'charging', 'charging']);
    updateSignatureAttack(attack, 0.36);
    expect(attack.projectiles.map((shot) => shot.state)).toEqual(['flying', 'flying', 'charging']);
    updateSignatureAttack(attack, 0.36);
    expect(attack.projectiles.map((shot) => shot.state)).toEqual(['flying', 'flying', 'flying']);
    expect(attack.projectiles.map((shot) => shot.telegraphPoints)).toEqual(preview);
  });

  it('curves three gravity orbs on different paths into one announced target', () => {
    const shots = makeAttack({ stageId: STAGE_IDS.GRAVITY_WELL }).projectiles;
    expect(shots.map((shot) => shot.targetY)).toEqual([270, 270, 270]);
    expect(shots.every((shot) => shot.kind === 'parabolic' && shot.curveAmplitude !== 0)).toBe(true);
    expect(new Set(shots.map((shot) => shot.telegraphPoints[16].y)).size).toBe(3);
  });

  it('alternates abyss arcs and launches four charged solar heat lanes', () => {
    const abyss = makeAttack({ stageId: STAGE_IDS.ABYSSAL_BEAST }).projectiles;
    expect(abyss.map((shot) => Math.sign(shot.curveAmplitude))).toEqual([-1, 1, -1]);
    expect(abyss.map((shot) => Math.sign(shot.targetY - 270))).toEqual([-1, 1, -1]);
    const solar = makeAttack({ stageId: STAGE_IDS.SOLAR_FORGE });
    expect(solar.projectiles.map((shot) => shot.targetY)).toEqual([162, 234, 306, 378]);
    updateSignatureAttack(solar, 1.099);
    expect(solar.projectiles.every((shot) => shot.state === 'charging')).toBe(true);
    updateSignatureAttack(solar, 0.001);
    expect(solar.projectiles[0].state).toBe('flying');
    expect(solar.projectiles.slice(1).every((shot) => shot.state === 'charging')).toBe(true);
  });

  it.each(STAGE_CATALOG.map((stage) => [stage.id]))('uses the supplied geometry muzzle exactly for %s', (stageId) => {
    const { x: bossX, y: bossY } = getBossGeometry(stageId).muzzle;
    const attack = makeAttack({ stageId, bossX, bossY });
    attack.projectiles.forEach((shot) => {
      expect(shot).toMatchObject({ bossX, bossY, x: bossX, y: bossY, startY: bossY });
      expect(shot.telegraphPoints[0]).toEqual({ x: bossX, y: bossY });
    });
  });

  it.each([0, 540])('keeps target lanes separated and inside the world near playerY=%i', (playerY) => {
    for (const stage of STAGE_CATALOG) {
      const attack = makeAttack({ stageId: stage.id, playerY });
      const targets = attack.projectiles.map((shot) => shot.targetY);
      expect(Math.min(...targets)).toBeGreaterThanOrEqual(24);
      expect(Math.max(...targets)).toBeLessThanOrEqual(516);
      if (stage.id === STAGE_IDS.CRYSTAL_GATES || stage.id === STAGE_IDS.SIGNAL_MONOLITHS
        || stage.id === STAGE_IDS.SOLAR_FORGE) {
        const sorted = [...targets].sort((a, b) => a - b);
        sorted.slice(1).forEach((y, index) => expect(y - sorted[index]).toBeGreaterThanOrEqual(72));
      }
    }
  });

  it.each([[0, 220], [0.5, 290], [1, 360], [-10, 220], [20, 360]])(
    'clamps RNG %s to speed %s independently of world speed', (roll, speed) => {
      const low = makeAttack({ baseSpeed: 1, rng: () => roll });
      const high = makeAttack({ baseSpeed: 100000, rng: () => roll });
      expect(low).toEqual(high);
      expect(high.projectiles.every((shot) => shot.speed === speed)).toBe(true);
    },
  );

  it('rolls each shot independently and owns its arrays', () => {
    const rolls = [0, 0.25, 0.5, 0.75, 1];
    const attack = makeAttack({ rng: () => rolls.shift() });
    expect(attack.projectiles.map((shot) => shot.speed)).toEqual([220, 255, 290, 325, 360]);
    attack.projectiles[0].telegraphPoints[0].x = 10;
    expect(attack.projectiles[1].telegraphPoints[0].x).toBe(750);
    expect(makeAttack().projectiles[0].telegraphPoints[0].x).toBe(750);
  });
});

describe('signature clocks and movement', () => {
  it('updates in place and delta zero preserves charging, then launches at the boundary without moving', () => {
    const attack = makeAttack();
    const before = structuredClone(attack);
    expect(updateSignatureAttack(attack, 0, player)).toBe(attack);
    expect(attack).toEqual(before);
    updateSignatureAttack(attack, 1.1, player);
    expect(attack.state).toBe('flying');
    expect(attack.projectiles.every((shot) => shot.x === 750 && shot.state === 'flying')).toBe(true);
    const launched = structuredClone(attack);
    updateSignatureAttack(attack, 0, player);
    expect(attack).toEqual(launched);
  });

  it('uses only time left after charge and each delay when one update crosses launch', () => {
    const attack = makeAttack({ stageId: STAGE_IDS.SIGNAL_MONOLITHS });
    updateSignatureAttack(attack, 1.6);
    expect(attack.projectiles[0].x).toBeCloseTo(750 - 220 * 0.5);
    expect(attack.projectiles[1].x).toBeCloseTo(750 - 220 * 0.14);
    expect(attack.projectiles[2]).toMatchObject({ state: 'charging', x: 750 });
    updateSignatureAttack(attack, 0.22);
    expect(attack.projectiles[2]).toMatchObject({ state: 'flying', x: 750 });
  });

  it.each([STAGE_IDS.GRAVITY_WELL, STAGE_IDS.ABYSSAL_BEAST])(
    'moves along the exact announced curve for %s', (stageId) => {
      const attack = makeAttack({ stageId });
      const shot = attack.projectiles[0];
      updateSignatureAttack(attack, 1.1 + (750 - 240) * 0.25 / shot.speed);
      expect(shot.x).toBeCloseTo(shot.telegraphPoints[8].x);
      expect(shot.y).toBeCloseTo(shot.telegraphPoints[8].y);
      expect(shot.previousX).toBe(750);
      expect(shot.previousY).toBe(270);
    },
  );

  it.each(STAGE_CATALOG.map((stage) => [stage.id]))(
    'resolves every delayed %s shot with one enormous update and no player', (stageId) => {
      const attack = makeAttack({ stageId });
      updateSignatureAttack(attack, Number.MAX_VALUE);
      expect(attack.state).toBe('resolved');
      expect(attack.hitPlayer).toBe(false);
      expect(attack.projectiles.every((shot) => shot.state === 'resolved' && !shot.hitPlayer)).toBe(true);
      expect(attack.elapsedSeconds).toBe(attack.durationSeconds);
      expectFiniteTree(attack);
    },
  );

  it('produces the same curved contact for large and small updates', () => {
    const large = makeAttack({ stageId: STAGE_IDS.GRAVITY_WELL });
    const small = structuredClone(large);
    updateSignatureAttack(large, 10, player);
    for (let index = 0; index < 1000; index += 1) updateSignatureAttack(small, 0.01, player);
    expect(large.state).toBe(small.state);
    expect(large.hitPlayer).toBe(true);
    large.projectiles.forEach((shot, index) => {
      expect(shot.state).toBe(small.projectiles[index].state);
      expect(shot.hitPlayer).toBe(small.projectiles[index].hitPlayer);
      expect(shot.x).toBeCloseTo(small.projectiles[index].x, 7);
      expect(shot.y).toBeCloseTo(small.projectiles[index].y, 7);
    });
  });
});

describe('swept contact, harmless misses and engine-owned immunity', () => {
  it('detects contact when a single update passes completely through the player', () => {
    const attack = centerShot();
    updateSignatureAttack(attack, 100, player);
    expect(attack).toMatchObject({ state: 'resolved', hitPlayer: true });
    expect(attack.projectiles[0]).toMatchObject({ state: 'resolved', hitPlayer: true });
    expect(attack.projectiles[0].x).toBeCloseTo(263);
  });

  it('honors the front trim instead of hitting the untrimmed aircraft nose', () => {
    const attack = centerShot();
    updateSignatureAttack(attack, 1.1 + (750 - 264) / 220, player);
    expect(attack.projectiles[0].x).toBeCloseTo(264);
    expect(attack.hitPlayer).toBe(false);
    updateSignatureAttack(attack, 1.5 / 220, player);
    expect(attack.hitPlayer).toBe(true);
    expect(attack.projectiles[0].x).toBeCloseTo(263);
  });

  it.each([[287.5, true], [287.51, false], [400, false]])(
    'uses actual vertical body contact at playerY=%s (hit=%s)', (y, hitPlayer) => {
      const attack = centerShot();
      updateSignatureAttack(attack, 100, { ...player, y });
      expect(attack).toMatchObject({ state: 'resolved', hitPlayer });
      expect(attack.projectiles[0].hitPlayer).toBe(hitPlayer);
    },
  );

  it('resolves after passing the player; later movement cannot turn a miss into a hit', () => {
    const attack = centerShot();
    updateSignatureAttack(attack, 100, { ...player, y: 400 });
    expect(attack).toMatchObject({ state: 'resolved', hitPlayer: false });
    expect(attack.projectiles[0].x).toBeCloseTo(214);
    const before = structuredClone(attack);
    updateSignatureAttack(attack, 100, player);
    expect(attack).toEqual(before);
  });

  it('stops at the world edge even when the player is beyond the left edge', () => {
    const attack = centerShot();
    updateSignatureAttack(attack, 100, { ...player, x: -200 });
    expect(attack).toMatchObject({ state: 'resolved', hitPlayer: false });
    expect(attack.projectiles[0].x).toBeCloseTo(-8);
  });

  it('stops a curve at its first vertical world exit before any later apparent contact', () => {
    const attack = makeAttack({ stageId: STAGE_IDS.GRAVITY_WELL, bossY: 5.5, playerY: 168 });
    attack.projectiles = [attack.projectiles[0]];
    updateSignatureAttack(attack, 100, { ...player, y: 168 });
    expect(attack).toMatchObject({ state: 'resolved', hitPlayer: false });
    expect(attack.projectiles[0].y).toBeCloseTo(-5.5);
    expect(attack.projectiles[0].x).toBeGreaterThan(player.x);
  });

  it('records contact for the engine to apply admin immunity and never reflects on SPACE/dash', () => {
    const attack = centerShot();
    const admin = { ...player, invincibilityEnabled: true, isDashing: true, dashKind: 'special', space: true };
    const before = structuredClone(admin);
    updateSignatureAttack(attack, 100, admin);
    expect(attack.hitPlayer).toBe(true);
    expect(attack.projectiles[0]).toMatchObject({ state: 'resolved', hitPlayer: true });
    expect(attack.projectiles[0]).not.toHaveProperty('reflectionWindowSeconds');
    expect(admin).toEqual(before);
    const after = structuredClone(attack);
    updateSignatureAttack(attack, 100);
    expect(attack).toEqual(after);
  });

  it('keeps hitPlayer sticky while the remaining volley finishes', () => {
    const attack = makeAttack();
    updateSignatureAttack(attack, 3.4, player);
    expect(attack.hitPlayer).toBe(true);
    expect(attack.state).toBe('flying');
    updateSignatureAttack(attack, 100, { ...player, y: 500 });
    expect(attack).toMatchObject({ state: 'resolved', hitPlayer: true });
  });
});

describe('finite input safety', () => {
  it.each([NaN, Infinity, -Infinity, null, undefined])('normalizes malformed creation inputs (%s)', (value) => {
    const attack = makeAttack({
      stageId: 'missing-stage', bossNumber: value, bossX: value, bossY: value,
      playerX: value, playerY: value, baseSpeed: value, rng: () => value,
    });
    expect(attack.stageId).toBe(STAGE_IDS.CRYSTAL_GATES);
    expectFiniteTree(attack);
    updateSignatureAttack(attack, Number.MAX_VALUE);
    expect(attack.state).toBe('resolved');
    expectFiniteTree(attack);
  });

  it('supports omitted options and a nonfunction RNG', () => {
    expectFiniteTree(createSignatureAttack());
    expect(makeAttack({ rng: null }).projectiles.every((shot) => shot.speed === 290)).toBe(true);
  });

  it.each([NaN, Infinity, -Infinity, -1, undefined, null])('ignores invalid delta %s', (delta) => {
    const attack = makeAttack();
    const before = structuredClone(attack);
    expect(updateSignatureAttack(attack, delta, player)).toBe(attack);
    expect(attack).toEqual(before);
  });

  it.each([
    { ...player, x: NaN }, { ...player, y: Infinity }, { ...player, width: -1 },
    { ...player, height: NaN }, {},
  ])('does not create false contact for a malformed player %j', (malformed) => {
    const attack = makeAttack();
    updateSignatureAttack(attack, 100, malformed);
    expect(attack).toMatchObject({ state: 'resolved', hitPlayer: false });
    expectFiniteTree(attack);
  });

  it('handles missing attack safely', () => {
    expect(updateSignatureAttack(null, 1, player)).toBeNull();
    expect(updateSignatureAttack(undefined, 1, player)).toBeUndefined();
  });
});
