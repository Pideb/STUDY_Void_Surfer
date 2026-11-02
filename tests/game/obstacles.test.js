import { describe, expect, it } from 'vitest';
import { createObstacle, getDashBarrierBounds, isDashObstacle, updateObstacle } from '../../src/game/obstacles.js';

describe('obstacles', () => {
  it('continues oscillating gaps after passage; only timing guides freeze',()=>{
    const wall=createObstacle({id:'moving',x:50,gapCenter:270,gapHeight:180,movingGap:true,gapMotionPhase:0,gapMotionCycleSeconds:4,gapMotionAmplitude:50});
    wall.passed=true;updateObstacle(wall,1,100,1);
    expect(wall.x).toBe(-50);expect(wall.gapCenter).toBe(320);
  });
  it('creates a normal obstacle with a clamped gap', () => {
    const obstacle = createObstacle({
      id: 'wall-1',
      x: 1000,
      gapCenter: 0,
      gapHeight: 180,
      rng: () => 0.25,
    });

    expect(obstacle).toMatchObject({
      id: 'wall-1',
      x: 1000,
      width: 72,
      gapCenter: 90,
      gapHeight: 180,
      kind: 'normal',
      stageId: null,
      movingGap: false,
      visualSeed: 0.25,
      passed: false,
    });
  });

  it('keeps a special wall and warning index in its model', () => {
    const obstacle = createObstacle({
      id: 'special-1',
      x: 900,
      gapCenter: 270,
      gapHeight: 135,
      kind: 'special',
      warningIndex: 5,
    });

    expect(obstacle.kind).toBe('special');
    expect(obstacle.width).toBe(24);
    expect(obstacle.movingGap).toBe(false);
    expect(obstacle.warningIndex).toBe(5);
  });

  it('keeps the hybrid barrier centered inside an ordinary stationary gap wall', () => {
    const wall = createObstacle({ id: 'hybrid', kind: 'hybrid', x: 400, gapCenter: 270, gapHeight: 180, movingGap: true, showTimingGuide: true });
    expect(wall).toMatchObject({ kind: 'hybrid', width: 72, movingGap: false, barrierBroken: false, showTimingGuide: true });
    expect(isDashObstacle(wall)).toBe(true);
    expect(getDashBarrierBounds(wall)).toEqual({ x: 424, width: 24 });
    updateObstacle(wall, 0.5, 240, 10);
    expect(getDashBarrierBounds(wall)).toEqual({ x: 304, width: 24 });
    expect(wall.gapCenter).toBe(270);
  });

  it('moves left according to speed and delta', () => {
    const obstacle = createObstacle({ id: 'wall-1', x: 1000, gapCenter: 270, gapHeight: 180 });

    updateObstacle(obstacle, 0.5, 240);

    expect(obstacle.x).toBe(880);
  });

  it('stores the stage that spawned an obstacle as visual metadata', () => {
    const obstacle = createObstacle({
      id: 'industrial-wall-1',
      x: 1000,
      gapCenter: 270,
      gapHeight: 180,
      stageId: 'industrial-void',
    });

    expect(obstacle.stageId).toBe('industrial-void');
  });

  it('moves a normal gap sinusoidally without leaving its valid bounds', () => {
    const obstacle = createObstacle({
      id: 'moving-1',
      x: 1000,
      gapCenter: 270,
      gapHeight: 180,
      movingGap: true,
      gapMotionPhase: 0,
      gapMotionCycleSeconds: 2.4,
    });

    updateObstacle(obstacle, 0.1, 240, 0.6);

    expect(obstacle).toMatchObject({
      width: 72,
      movingGap: true,
      baseGapCenter: 270,
      gapMotionAmplitude: 90,
      gapMotionCycleSeconds: 2.4,
    });
    expect(obstacle.gapCenter).toBeCloseTo(270+90*Math.sin(Math.PI*2*.1/2.4));
    expect(obstacle.gapCenter).toBeGreaterThanOrEqual(90);
    expect(obstacle.gapCenter).toBeLessThanOrEqual(450);
  });
});

describe("approach motion",()=>{
 it.each([240,460,700,770].flatMap(v=>[1/60,1/30,.7].map(dt=>[v,dt])))("freezes vertically at160px for speed%s dt%s",(speed,dt)=>{
 const wall=createObstacle({id:"move",x:1032,gapCenter:270,gapHeight:180,movingGap:true,gapMotionPhase:.4,gapMotionCycleSeconds:4.8});
 const start=wall.gapCenter; updateObstacle(wall,.001,speed,999,{playerDamageFront:248});expect(Math.abs(wall.gapCenter-start)).toBeLessThan(1);
 while(wall.x>408)updateObstacle(wall,dt,speed,999,{playerDamageFront:248});
 expect(wall.motionFrozen).toBe(true);const center=wall.gapCenter,x=wall.x; wall.passed=true;updateObstacle(wall,1,speed,1000,{playerDamageFront:248});expect(wall.gapCenter).toBe(center);expect(wall.x).toBe(x-speed);
 });
 it("does not flatten against world bounds or share clocks",()=>{const a=createObstacle({id:"a",x:1000,gapCenter:0,gapHeight:180,movingGap:true,gapMotionPhase:0,gapMotionCycleSeconds:4});const b=createObstacle({id:"b",x:1000,gapCenter:0,gapHeight:180,movingGap:true,gapMotionPhase:0,gapMotionCycleSeconds:4});updateObstacle(a,.1,240,99);expect(a.gapCenter).not.toBe(b.gapCenter);expect(a.gapCenter).toBeGreaterThan(90);expect(b.motionAgeSeconds).toBe(0);});
});
