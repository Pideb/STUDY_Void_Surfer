import { describe, it, expect } from 'vitest';
import { sampleProjectileSpeed } from '../../src/game/projectile-speed.js';
import { createSignatureAttack, updateSignatureAttack } from '../../src/game/boss-signatures.js';
describe('scroll-linked launch speed',()=>{
  it.each([[240,220,360],[460,297,437],[700,381,521],[770,405.5,545.5]])('samples at scroll%s',(speed,min,max)=>{
    expect(sampleProjectileSpeed(speed,()=>0)).toBe(min);expect(sampleProjectileSpeed(speed,()=>1)).toBe(max);
  });
  it('clamps and handles invalid input',()=>{expect(sampleProjectileSpeed(-1e6,()=>0)).toBe(80);expect(sampleProjectileSpeed(1e6,()=>1)).toBe(800);expect(sampleProjectileSpeed(NaN,()=>NaN)).toBe(290);});
  it('samples delayed shots at different actual launch times and never resamples flying shots',()=>{
    const a=createSignatureAttack({stageId:'industrial-void',projectileCount:3,rng:()=>0});
    updateSignatureAttack(a,1.3,null,{scrollSpeedAt:t=>240+t*100});
    expect(a.projectiles[0].speed).toBeCloseTo(258.5);expect(a.projectiles[1].speed).toBeNull();
    const x=a.projectiles[0].x;
    updateSignatureAttack(a,.2,null,{scrollSpeedAt:t=>700+t*100});
    expect(a.projectiles[0].speed).toBeCloseTo(258.5);expect(x-a.projectiles[0].x).toBeCloseTo(51.7);
    expect(a.projectiles[1].speed).toBeCloseTo(383.8);
    expect(JSON.stringify(a)).not.toContain('function');
  });
});
