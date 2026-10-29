import {describe,it,expect} from 'vitest';
import {getBossArtBounds,intersectsBossBeam} from '../../src/game/boss-beam.js';
import {getBossGeometry} from '../../src/game/boss-geometry.js';
import {BOSS_RIGS} from '../../src/game/boss-rigs.js';

describe('horizontal full-art beam contact',()=>{
  it.each(Object.keys(BOSS_RIGS))('%s includes the body edge, not only the core',stageId=>{
    const g=getBossGeometry(stageId,1,0),bounds=getBossArtBounds(stageId,g);
    expect(bounds.top).toBeLessThanOrEqual(g.box.y);
    expect(bounds.bottom).toBeGreaterThanOrEqual(g.box.y+g.box.h);
    expect(intersectsBossBeam({shot:{fromX:240,fromY:g.box.y+2},stageId,fromMotionSeconds:0,toMotionSeconds:0})).toBe(true);
    expect(intersectsBossBeam({shot:{fromX:240,fromY:bounds.top-10},stageId,fromMotionSeconds:0,toMotionSeconds:0})).toBe(false);
  });
  it('detects a crossing between coarse tick endpoints and rejects empty exterior',()=>{
    const base={stageId:'crystal-gates',fromMotionSeconds:0,toMotionSeconds:3};
    expect(intersectsBossBeam({...base,shot:{fromX:240,fromY:470}})).toBe(true);
    expect(intersectsBossBeam({...base,shot:{fromX:240,fromY:539}})).toBe(false);
    expect(intersectsBossBeam({...base,shot:{fromX:970,fromY:270}})).toBe(false);
    expect(intersectsBossBeam({...base,shot:{fromX:240,fromY:NaN}})).toBe(false);
  });
});
