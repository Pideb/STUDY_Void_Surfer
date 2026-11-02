import {describe,it,expect,vi,afterEach} from 'vitest';
import {createAppController} from '../../src/ui/app-controller.js';
let fixture;
const settle=async()=>{for(let n=0;n<20;n++)await Promise.resolve();};
const deferred=()=>{let resolve;return{promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)};};
const saved=score=>({updated:true,record:{userId:'pilot',bestScore:score,aircraftId:'default',achievedAt:'2026-11-02T00:00:00Z'},error:null});
function setup(submitBestScore=async(_u,p)=>saved(p.score)){
 const root=document.createElement('div');document.body.append(root);const snapshot={score:0,state:'menu',player:{x:240,y:270},aircraft:{id:'default'}};
 const engine={start:vi.fn(()=>{snapshot.state='playing';snapshot.score=0;}),getSnapshot:()=>({...snapshot}),update(){},lift(){},dash(){},stop(){},setAircraft(){},setGuestMode(){}};
 const controller=createAppController({root,canvas:document.createElement('canvas'),gameEngine:engine,renderer:{render(){},renderMenuBackground(){},destroy(){}},authService:{getSessionUser:async()=>({id:'pilot',user_metadata:{name:'Pilot'}}),subscribeToAuth:()=>()=>{}},leaderboardService:{submitBestScore:vi.fn(submitBestScore),fetchTopScores:async()=>({rows:[]}),fetchPlayerNeighborhood:async()=>({rows:[]})},audioManager:{isMuted:()=>false,play(){},setMusicMode(){}}});
 vi.spyOn(globalThis,'requestAnimationFrame').mockReturnValue(1);vi.spyOn(globalThis,'cancelAnimationFrame').mockImplementation(()=>{});controller.mount();fixture={root,engine,snapshot,controller};return fixture;
}
afterEach(()=>{fixture?.controller.destroy();fixture?.root.remove();vi.restoreAllMocks();});
const key=(type,code,repeat=false)=>window.dispatchEvent(new KeyboardEvent(type,{code,repeat,bubbles:true,cancelable:true}));
describe('immediate gameover restart',()=>{
 it('keeps inside-panel clicks inert, restarts outside, and uses ESC for menu',async()=>{
 const f=setup();await settle();f.controller.dispatch('START_GAME_FROM_MENU');f.controller.dispatch('START_PLAYING');f.controller.dispatch('GAME_OVER');
 expect([...f.root.querySelectorAll('button')].some(b=>b.textContent==='재시작')).toBe(false);
 f.root.querySelector('.game-over-screen').click();expect(f.engine.start).toHaveBeenCalledTimes(1);f.root.querySelector('.game-over-restart-hint').click();expect(f.engine.start).toHaveBeenCalledTimes(2);
 key('keydown','Space');f.controller.dispatch('GAME_OVER');key('keydown','Space');key('keydown','Space',true);expect(f.engine.start).toHaveBeenCalledTimes(2);key('keyup','Space');key('keydown','ArrowRight');expect(f.engine.start).toHaveBeenCalledTimes(3);key('keyup','ArrowRight');f.controller.dispatch('GAME_OVER');key('keydown','Escape');expect(f.root.querySelector('.menu-screen')).not.toBeNull();
 });
 it('saves two overlapping runs independently and ignores the older late response',async()=>{
 const a=deferred(),b=deferred(),calls=[];const f=setup((user,payload)=>{calls.push({user,payload});return calls.length===1?a.promise:b.promise;});await settle();f.controller.dispatch('START_GAME_FROM_MENU');f.controller.dispatch('START_PLAYING');f.snapshot.score=10;f.controller.dispatch('GAME_OVER');f.root.querySelector('.game-over-overlay').click();f.snapshot.score=20;f.controller.dispatch('GAME_OVER');expect(calls.map(c=>c.payload.score)).toEqual([10,20]);b.resolve(saved(20));await settle();expect(f.root.textContent).toContain('최종 점수 20');expect(f.root.textContent).toContain('점수가 계정에 등록되었습니다');a.resolve(saved(10));await settle();expect(f.root.textContent).toContain('최종 점수 20');expect(f.root.textContent).not.toContain('최종 점수 10');expect(calls).toHaveLength(2);
 });
});
