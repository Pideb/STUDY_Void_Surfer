import { describe, it, expect } from 'vitest';
import { createBossWeapon, advanceBossWeapon, startBossWeapon } from '../../src/game/boss-weapon.js';

describe('independent boss weapon', () => {
  it('stores one shot after ten seconds, never banks a second shot', () => {
    const w = createBossWeapon();
    advanceBossWeapon(w, 9.99); expect(w.ready).toBe(false);
    advanceBossWeapon(w, .01); expect(w.ready).toBe(true);
    advanceBossWeapon(w, 100); expect(w.chargeSeconds).toBe(10);
    expect(startBossWeapon(w, { id: 'a', fromX: 240, fromY: 270, toX: 800, toY: 200 })).toBe(true);
    expect(startBossWeapon(w, {})).toBe(false);
    expect(w.chargeSeconds).toBe(0);
    expect(advanceBossWeapon(w, .499)).toBe(false);
    expect(advanceBossWeapon(w, .001, () => true)).toBe(true);
    expect(advanceBossWeapon(w, .199)).toBe(false);
    expect(w.firing).not.toBeNull();
    expect(advanceBossWeapon(w, .001)).toBe(false); expect(w.firing).toBeNull();
    expect(w.chargeSeconds).toBeCloseTo(.7);
  });
  it('emits only one hit even when a tick spans charge and recovery', () => {
    const w=createBossWeapon();advanceBossWeapon(w,10);
    startBossWeapon(w,{fromX:240,fromY:270,toX:800,toY:200});
    expect(advanceBossWeapon(w,1,()=>true)).toBe(true);expect(w.firing).toBeNull();
    expect(advanceBossWeapon(w,1)).toBe(false);
  });
  it('keeps a miss eligible for later contact and never auto-hits',()=>{
    const w=createBossWeapon();advanceBossWeapon(w,10);
    startBossWeapon(w,{fromX:240,fromY:270,toX:960,toY:270});
    expect(advanceBossWeapon(w,.5)).toBe(false);
    expect(w.firing.impacted).toBe(false);
    expect(advanceBossWeapon(w,.1,()=>true)).toBe(true);
    expect(advanceBossWeapon(w,.1,()=>true)).toBe(false);
    expect(w.firing).toBeNull();expect(w.ready).toBe(false);
  });
  it('rejects invalid deltas and invalid shots without spending ammunition', () => {
    const w = createBossWeapon();
    for (const dt of [NaN, Infinity, -1]) advanceBossWeapon(w, dt);
    expect(w.chargeSeconds).toBe(0);
    advanceBossWeapon(w, 10);
    expect(startBossWeapon(w, { fromX: NaN })).toBe(false);
    expect(w.ready).toBe(true);
    expect(createBossWeapon().ready).toBe(false);
  });
});
