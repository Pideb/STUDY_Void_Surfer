import {afterEach,describe,it,expect,vi} from 'vitest';
import {createAppController} from '../../src/ui/app-controller.js';
import {createGameEngine} from '../../src/game/game-engine.js';
const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
let h;
async function setup(){
  vi.useFakeTimers();const root=document.createElement('div');document.body.append(root);const audio=deferred(),frames=[];
  const engine=createGameEngine({rng:()=>.6,stageRng:()=>.5});vi.spyOn(engine,'start');vi.spyOn(engine,'beginPreparedRun');
  let authCallback;const authService={getSessionUser:async()=>null,subscribeToAuth:fn=>{authCallback=fn;return ()=>{};}};
  const music={isMuted:()=>false,setMusicMode:vi.fn(),setMusicScene:vi.fn(),resetRun:vi.fn(),unlock:vi.fn(async()=>{}),
    prepareGameplay:vi.fn(()=>audio.promise),startPreparedGameplay:vi.fn(),play:vi.fn(),destroy:vi.fn()};
  vi.spyOn(globalThis,'requestAnimationFrame').mockImplementation(fn=>{frames.push(fn);return frames.length;});
  vi.spyOn(globalThis,'cancelAnimationFrame').mockImplementation(()=>{});
  const controller=createAppController({root,canvas:document.createElement('canvas'),authService,leaderboardService:{},gameEngine:engine,
    renderer:{render:vi.fn(),renderMenuBackground:vi.fn(),destroy:vi.fn()},audioManager:music});
  h={controller,root,engine,music,audio,frames,auth:user=>authCallback(user)};controller.mount();await flush();
  return h;
}
function depart(){h.controller.dispatch('START_GAME_FROM_MENU');h.controller.dispatch('START_PLAYING');}
afterEach(()=>{h?.controller.destroy();h?.root.remove();h=null;vi.useRealTimers();vi.restoreAllMocks();});

describe('music-ready start gate with the real engine',()=>{
  it('shows preparation, freezes the run and starts the selected stage only once when ready',async()=>{
    await setup();depart();const before=h.engine.getSnapshot();
    expect(h.root.textContent).toContain('출격 준비 중');expect(before.state).toBe('preparing');expect(h.frames).toHaveLength(0);
    h.controller.dispatch('START_PLAYING');h.controller.dispatch('PAUSE');h.engine.update(10000);
    expect(h.engine.start).toHaveBeenCalledOnce();expect(h.engine.getSnapshot()).toEqual(before);
    expect(h.music.prepareGameplay).toHaveBeenCalledWith(before.stage.id);
    h.audio.resolve(true);await flush();expect(h.root.textContent).toContain('점수 0');expect(h.frames).toHaveLength(1);
    expect(h.engine.beginPreparedRun).toHaveBeenCalledOnce();expect(h.engine.getSnapshot().stage.id).toBe(before.stage.id);
    expect(h.music.startPreparedGameplay).toHaveBeenCalledWith(before.stage.id);
    vi.advanceTimersByTime(11000);expect(h.frames).toHaveLength(1);
  });
  it('waits9999ms, starts at10000ms and ignores late readiness as a second start',async()=>{
    await setup();depart();vi.advanceTimersByTime(9999);expect(h.frames).toHaveLength(0);
    vi.advanceTimersByTime(1);expect(h.frames).toHaveLength(1);expect(h.engine.getSnapshot().state).toBe('playing');
    h.audio.resolve(true);await flush();expect(h.frames).toHaveLength(1);expect(h.music.startPreparedGameplay).toHaveBeenCalledOnce();
  });
  it.each(['reject','throw','false'])('falls back after10s on%s',async failure=>{
    await setup();if(failure==='throw')h.music.prepareGameplay.mockImplementation(()=>{throw Error('unavailable');});
    depart();if(failure==='reject')h.audio.reject(Error('unavailable'));if(failure==='false')h.audio.resolve(false);
    await flush();expect(h.frames).toHaveLength(0);vi.advanceTimersByTime(10000);expect(h.frames).toHaveLength(1);
  });
  it.each(['menu','escape','logout','identity','destroy'])('cancels preparation on%s and ignores late results',async action=>{
    await setup();depart();
    if(action==='menu')h.controller.dispatch('RETURN_TO_MENU');
    if(action==='escape')window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true}));
    if(action==='logout')h.auth(null);
    if(action==='identity')h.auth({id:'another-pilot',email:'pilot@example.test'});
    if(action==='destroy')h.controller.destroy();
    h.audio.resolve(true);await flush();vi.advanceTimersByTime(11000);
    expect(h.frames).toHaveLength(0);expect(h.music.startPreparedGameplay).not.toHaveBeenCalled();
    expect(h.engine.getSnapshot().state).toBe('menu');expect(h.engine.getSnapshot().deathEffect).toBeNull();
  });
  it('uses the same preparation gate on restart and does not reshuffle again after readiness',async()=>{
    await setup();depart();h.audio.resolve(true);await flush();h.controller.dispatch('GAME_OVER');
    const next=deferred();h.music.prepareGameplay.mockImplementation(()=>next.promise);h.controller.dispatch('RESTART_IMMEDIATE');
    const stage=h.engine.getSnapshot().stage.id;expect(h.root.textContent).toContain('출격 준비 중');
    next.resolve(true);await flush();expect(h.engine.start).toHaveBeenCalledTimes(2);
    expect(h.engine.beginPreparedRun).toHaveBeenCalledTimes(2);expect(h.engine.getSnapshot().stage.id).toBe(stage);
    expect(h.music.startPreparedGameplay).toHaveBeenLastCalledWith(stage);
  });
});
