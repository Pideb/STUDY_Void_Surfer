import {describe,it,expect,vi,afterEach} from 'vitest';
import {createPlaySessionTracker} from '../../src/services/play-session-tracker.js';
let tracker;afterEach(()=>{tracker?.destroy();vi.unstubAllGlobals();});
describe('monotonic private survival clock',()=>{
 it('freezes a known final score including zero per run and keeps legacy unknown distinct',async()=>{
  let t=0;const service={start:vi.fn(async()=>({ok:true})),finish:vi.fn(async()=>({ok:true}))};tracker=createPlaySessionTracker({now:()=>t,service});
  const id=tracker.begin({aircraftId:'velocity',version:'0.2b'});t=500;
  const first=tracker.finish('dead',44);expect(tracker.finish('abandoned',99)).toBe(first);expect(tracker.getFinishedRun(id).finalScore).toBe(44);
  tracker.begin({aircraftId:'default',version:'0.2b'});t=600;expect(tracker.finish('dead',0).finalScore).toBe(0);
  tracker.begin({aircraftId:'default',version:'0.2b'});expect(tracker.finish('dead',-1)).toBeNull();expect(tracker.finish('abandoned').finalScore).toBeNull();
  await tracker.flush();expect(service.finish.mock.calls.map(([r])=>r.finalScore)).toEqual([44,0,null]);
 });
 it('records a run and nonce over HTTP where only getRandomValues is available',async()=>{
  const original=globalThis.crypto;vi.stubGlobal('crypto',{getRandomValues:bytes=>original.getRandomValues(bytes)});const service={start:vi.fn(async()=>({ok:true})),finish:vi.fn(async()=>({ok:true}))};tracker=createPlaySessionTracker({service});const id=tracker.begin({aircraftId:'default',version:'0.2'});expect(id).toMatch(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/);tracker.finish('dead');await tracker.flush();expect(service.start).toHaveBeenCalledOnce();expect(service.finish).toHaveBeenCalledOnce();expect(service.start.mock.calls[0][0].writeNonce).not.toBe(id);
 });
 it('preserves the death clock and pause exclusion without sending weak IDs when secure randomness fails',async()=>{
  let t=0;const service={start:vi.fn(),finish:vi.fn()};tracker=createPlaySessionTracker({now:()=>t,service,randomUUID(){throw Error('No crypto');},diagnostic(){throw Error('Logger unavailable');}});expect(tracker.begin({aircraftId:'aegis',version:'0.2'})).toBeNull();t=1000;tracker.suspend('orientation');t=5000;tracker.resume('orientation');t=6000;expect(tracker.finish('dead')).toMatchObject({runId:null,writeNonce:null,durationMs:2000,outcome:'dead'});await tracker.flush();expect(service.start).not.toHaveBeenCalled();expect(service.finish).not.toHaveBeenCalled();
 });
 it('includes challenge time but excludes overlapping pause/rotation and freezes death timing',async()=>{let t=0;const service={start:vi.fn(async()=>({ok:true})),finish:vi.fn(async()=>({ok:true}))};tracker=createPlaySessionTracker({now:()=>t,service});const id=tracker.begin({aircraftId:'default',version:'0.01-b'});t=2000;tracker.suspend('manual');t=2500;tracker.suspend('orientation');t=5000;tracker.resume('manual');t=10000;tracker.resume('orientation');t=12000;const dead=tracker.finish('dead');expect(dead.durationMs).toBe(4000);expect(Object.isFrozen(dead)).toBe(true);t=13000;expect(tracker.finish('abandoned')).toBe(dead);expect(tracker.getFinishedRun(id)).toBe(dead);await tracker.flush();expect(service.start).toHaveBeenCalledOnce();expect(service.finish).toHaveBeenCalledOnce();});
 it('starts the next identity independently and marks an unfinished run abandoned',async()=>{let t=0;const service={start:vi.fn(async()=>({ok:true})),finish:vi.fn(async()=>({ok:true}))};tracker=createPlaySessionTracker({now:()=>t,service,storage:{getItem(){throw Error();},setItem(){throw Error();}}});const a=tracker.begin({aircraftId:'velocity',version:'0.01-b'});t=300;const b=tracker.begin({aircraftId:'aegis',version:'0.01-b',ownerUserId:'11111111-1111-4111-8111-111111111111'});expect(a).not.toBe(b);expect(tracker.getFinishedRun(a)).toMatchObject({durationMs:300,outcome:'abandoned'});t=700;expect(tracker.finish('dead').durationMs).toBe(400);await tracker.flush();expect(service.start).toHaveBeenCalledTimes(2);expect(service.start.mock.calls[0][0].actorKind).toBe('guest');expect(service.start.mock.calls[1][0].actorKind).toBe('account');});
});
