import {afterEach,describe,it,expect,vi} from 'vitest';
import {createAudioManager} from '../../src/audio/audio-manager.js';
import {createStageMusicPlayer} from '../../src/audio/stage-music-player.js';
const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve();};
const response=key=>({ok:true,arrayBuffer:async()=>({key})});
class Context {
  static instances=[];
  constructor(){this.state='running';this.currentTime=3;this.destination={};this.sources=[];this.oscillators=[];
    this.resume=vi.fn(async()=>{this.state='running';});this.close=vi.fn();Context.instances.push(this);}
  createGain(){return {gain:{value:1,setTargetAtTime:vi.fn()},connect:vi.fn(),disconnect:vi.fn()};}
  createBufferSource(){const s={start:vi.fn(),stop:vi.fn(),connect:vi.fn(),disconnect:vi.fn()};this.sources.push(s);return s;}
  createOscillator(){const s={frequency:{value:0},start:vi.fn(),stop:vi.fn(),connect:vi.fn(),disconnect:vi.fn()};this.oscillators.push(s);return s;}
  async decodeAudioData(bytes){return {key:bytes.key,duration:10};}
}
const managers=[];afterEach(()=>{for(const m of managers)m.destroy();managers.length=0;Context.instances=[];vi.useRealTimers();});
const manager=fetcher=>{const m=createAudioManager(Context,{fetcher});managers.push(m);return m;};

describe('stage preparation contract',()=>{
  it('prepares only the chosen track without starting it, then reuses its decoded buffer',async()=>{
    const ctx=new Context(),fetcher=vi.fn(async url=>response(url));
    const p=createStageMusicPlayer(ctx,{fetcher,destination:{}});
    expect(await p.prepareTrack('solar-forge')).toBe(true);expect(ctx.sources).toHaveLength(0);
    expect(fetcher).toHaveBeenCalledExactlyOnceWith('/assets/audio/gameplay/solar-forge.wav');
    p.select('solar-forge','gameplay');expect(ctx.sources).toHaveLength(1);p.destroy();
  });
  it('stops a cached menu voice immediately while retaining stage-to-boss crossfade',async()=>{
    const ctx=new Context(),p=createStageMusicPlayer(ctx,{destination:{},fetcher:async url=>response(url)});
    p.select('solar-forge','menu');await flush();const menu=ctx.sources[0];
    p.select('solar-forge','gameplay');expect(menu.stop).toHaveBeenCalledWith(3);await flush();
    const game=ctx.sources.at(-1);p.select('solar-forge','boss');expect(game.stop).toHaveBeenCalledWith(3.24);p.destroy();
  });
});

describe('music-ready departure',()=>{
  it('cuts menu audio, stays silent while preparing, then starts exact game music without synth fallback',async()=>{
    vi.useFakeTimers();const fetcher=vi.fn(async url=>response(url)),m=manager(fetcher);
    m.setMusicMode('menu');await m.unlock();await flush();const ctx=Context.instances[0],menu=ctx.sources[0];
    const oscillators=ctx.oscillators.length;
    expect(await m.prepareGameplay('solar-forge')).toBe(true);
    expect(menu.stop).toHaveBeenCalledWith(3);expect(ctx.sources).toHaveLength(1);
    vi.advanceTimersByTime(2000);expect(ctx.oscillators).toHaveLength(oscillators);
    m.startPreparedGameplay('solar-forge');await flush();
    expect(ctx.sources).toHaveLength(2);expect(ctx.sources[1].buffer.key).toBe('/assets/audio/gameplay/solar-forge.wav');
    expect(fetcher.mock.calls.map(([url])=>url)).toEqual(['/assets/audio/menu/orbit-run.wav','/assets/audio/gameplay/solar-forge.wav']);
    expect(ctx.oscillators).toHaveLength(oscillators);m.setMuted(true);expect(m.isMuted()).toBe(true);
  });
  it('can start silently at the gate timeout and join the same late track once',async()=>{
    vi.useFakeTimers();let complete;const m=manager(()=>new Promise(r=>{complete=r;}));
    const ready=m.prepareGameplay('solar-forge');await flush();const ctx=Context.instances[0];
    m.startPreparedGameplay('solar-forge');vi.advanceTimersByTime(10000);expect(ctx.sources).toHaveLength(0);expect(ctx.oscillators).toHaveLength(0);
    complete(response('late-stage'));expect(await ready).toBe(true);await flush();
    expect(ctx.sources).toHaveLength(1);expect(ctx.sources[0].buffer.key).toBe('late-stage');
  });
  it('does not resurrect a cancelled game track when the menu has become current',async()=>{
    vi.useFakeTimers();let complete;
    const m=manager(url=>url.includes('/menu/')?Promise.resolve(response('menu')):new Promise(r=>{complete=r;}));
    const ready=m.prepareGameplay('solar-forge');await flush();m.resetRun();m.setMusicMode('menu');await flush();
    complete(response('cancelled-game'));expect(await ready).toBe(false);await flush();
    expect(Context.instances[0].sources.map(s=>s.buffer.key)).toEqual(['menu']);
  });
  it('allows decode to proceed during a blocked context resume, without duplicate voices later',async()=>{
    vi.useFakeTimers();const m=manager(async()=>response('ready'));await m.unlock();const ctx=Context.instances[0];
    ctx.state='suspended';let resume;ctx.resume.mockImplementation(()=>new Promise(r=>{resume=()=>{ctx.state='running';r();};}));
    const ready=m.prepareGameplay('solar-forge');await flush();m.startPreparedGameplay('solar-forge');
    expect(ctx.sources).toHaveLength(1);resume();expect(await ready).toBe(true);await flush();expect(ctx.sources).toHaveLength(1);
  });
  it('fails silently without retry loops and preserves effect sounds',async()=>{
    vi.useFakeTimers();const fetcher=vi.fn(async()=>({ok:false})),m=manager(fetcher);
    expect(await m.prepareGameplay('solar-forge')).toBe(false);m.startPreparedGameplay('solar-forge');await flush();
    vi.advanceTimersByTime(20000);const ctx=Context.instances[0];expect(ctx.sources).toHaveLength(0);expect(ctx.oscillators).toHaveLength(0);
    expect(fetcher.mock.calls.length).toBeLessThanOrEqual(2);m.play('lift');expect(ctx.oscillators.length).toBeGreaterThan(0);
  });
  it('ignores a destroyed preparation completion',async()=>{
    let complete;const m=manager(()=>new Promise(r=>{complete=r;})),ready=m.prepareGameplay('solar-forge');
    await flush();m.destroy();complete(response('late'));expect(await ready).toBe(false);expect(Context.instances[0].sources).toHaveLength(0);
  });
});
