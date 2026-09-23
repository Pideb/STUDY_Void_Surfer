import { describe, expect, it } from 'vitest';
import {
  STAGE_CATALOG,
  STAGE_IDS,
  createStageShuffleBag,
  getStageDefinition,
} from '../../src/game/stages.js';

describe('stage catalog', () => {
  it('contains all six approved themes with stage-specific visual keys', () => {
    expect(STAGE_CATALOG).toHaveLength(6);
    expect(STAGE_CATALOG.map((stage) => stage.id)).toEqual([
      STAGE_IDS.CRYSTAL_GATES,
      STAGE_IDS.INDUSTRIAL_VOID,
      STAGE_IDS.SIGNAL_MONOLITHS,
      STAGE_IDS.GRAVITY_WELL,
      STAGE_IDS.ABYSSAL_BEAST,
      STAGE_IDS.SOLAR_FORGE,
    ]);
    expect(getStageDefinition(STAGE_IDS.SOLAR_FORGE)).toMatchObject({
      backgroundKey: 'solar-forge',
      bossBackgroundKey: 'solar-forge-boss',
      bossStyle: 'solar-machine',
      laserStyle: 'heat-beam',
    });
  });

  it('shuffles every stage exactly once and prevents a bag-boundary repeat', () => {
    const first = createStageShuffleBag(() => 0.5);
    const second = createStageShuffleBag(() => 0.5, first.at(-1));

    expect(new Set(first).size).toBe(6);
    expect(new Set(second).size).toBe(6);
    expect(second[0]).not.toBe(first.at(-1));
  });

  it('falls back to the first catalog entry for an unknown id', () => {
    expect(getStageDefinition('unknown').id).toBe(STAGE_IDS.CRYSTAL_GATES);
  });
});
