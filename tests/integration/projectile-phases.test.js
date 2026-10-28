import { describe, it, expect } from 'vitest';
import { createGameEngine } from '../../src/game/game-engine.js';
import { createStageShuffleBag, STAGE_CATALOG } from '../../src/game/stages.js';

const stages = new Map();
const seeded = seed => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
for (let i = 0; i < 100; i++) {
  stages.set(createStageShuffleBag(seeded(Math.imul(i, 2654435761)))[0], Math.imul(i, 2654435761));
}

describe('separate wall and wall-free projectile phases', () => {
  it.each([...stages].flatMap(([stage, stageRoll]) => [0, .4, .99].map(roll => [stage, stageRoll, roll])))(
    '%s stage-roll=%s attack-roll=%s reaches WASD after complete separate volleys', (stage, stageRoll, roll) => {
      let time = 0;
      const engine = createGameEngine({ now: () => time, gravity: 0, rng: () => roll, stageRng: seeded(stageRoll),
        initialScore: 150, initialCompletedWarningCount: 1, guestMode: true, invincibilityEnabled: true });
      engine.start();
      let s = engine.getSnapshot(), wallShots = new Set(), signatures = new Set(), previous = null;
      for (let i = 0; i < 4000 && !s.challenge?.active; i++) {
        time += 50; engine.update(time); s = engine.getSnapshot();
        expect(s.deathEffect).toBeNull();
        const boss = s.boss, attack = boss?.attack;
        if (attack?.type !== 'volley') continue;
        expect(boss.stageId).toBe(stage);
        if (boss.cyclePhase === 'walls') {
          wallShots.add(attack.id); expect(attack.projectiles).toHaveLength(1);
        } else {
          expect(boss.cyclePhase).toBe('signature');
          expect(s.obstacles).toHaveLength(0); expect(boss.wallSpawningPaused).toBe(true);
          expect(attack.projectiles.length).toBeGreaterThanOrEqual(3);
          if (!signatures.has(attack.id)) {
            signatures.add(attack.id);
            expect(attack.elapsedSeconds).toBe(0);
            expect(attack.projectiles.every(shot => shot.chargeRemainingSeconds === 1.1)).toBe(true);
            if (previous) expect(s.elapsedSeconds - previous.started).toBeGreaterThan(1.1);
            previous = { started: s.elapsedSeconds };
          }
        }
      }
      expect(s.challenge?.active).toBe(true);
      expect(wallShots.size).toBeGreaterThan(0);
      expect(signatures.size).toBe(1 + Math.floor(roll * 3));
      expect(s.boss.hp).toBe(3);
    });
  it('covers every existing stage', () => expect(stages.size).toBe(STAGE_CATALOG.length));
});
