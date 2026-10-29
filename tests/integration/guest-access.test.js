import {describe,it,expect,vi} from 'vitest';
import {createGameEngine} from '../../src/game/game-engine.js';
import {createAppController} from '../../src/ui/app-controller.js';
import {GUEST_RECORD_STORAGE_KEY} from '../../src/services/guest-record-service.js';
const settle=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
describe('real guest aircraft access across auth and new runs',()=>{
  it('starts the selected account craft then resets menu and engine to NOVA after logout',async()=>{
    const root=document.createElement('div'),canvas=document.createElement('canvas');document.body.append(root,canvas);
    const user={id:'test-account',email:'pilot@example.test',user_metadata:{full_name:'Pilot'}};
    let authListener;const authService={getSessionUser:async()=>user,subscribeToAuth:fn=>{authListener=fn;return()=>{};},signOut:async()=>{authListener(null);}};
    const leaderboardService={fetchPlayerBestScore:async()=>({bestScore:100,error:null}),fetchTopScores:vi.fn(async()=>({rows:[],error:null})),fetchPlayerNeighborhood:vi.fn(async()=>({rows:[],error:null})),submitBestScore:vi.fn()};
    const engine=createGameEngine({now:()=>0,gravity:0}),raf=vi.spyOn(globalThis,'requestAnimationFrame').mockReturnValue(1),cancel=vi.spyOn(globalThis,'cancelAnimationFrame').mockImplementation(()=>{});
    localStorage.setItem(GUEST_RECORD_STORAGE_KEY,'old-best');localStorage.setItem('unrelated-setting','keep');
    const controller=createAppController({root,canvas,authService,leaderboardService,gameEngine:engine,renderer:{render(){},renderMenuBackground(){}},audioManager:{play(){},setMusicMode(){},setMusicScene(){},isMuted:()=>false}});
    try{
      controller.mount();await settle();expect(localStorage.getItem(GUEST_RECORD_STORAGE_KEY)).toBeNull();expect(localStorage.getItem('unrelated-setting')).toBe('keep');
      controller.dispatch('OPEN_HANGAR');await settle();controller.dispatch({type:'SELECT_AIRCRAFT',aircraftId:'velocity'});controller.dispatch('RETURN_TO_MENU');controller.dispatch('START_GAME_FROM_MENU');controller.dispatch('START_PLAYING');
      expect(engine.getSnapshot().aircraft.id).toBe('velocity');controller.dispatch('PAUSE');controller.dispatch('RETURN_TO_MENU');
      [...root.querySelectorAll('button')].find(button=>button.textContent==='로그아웃').click();await settle();
      expect(root.querySelector('.menu-aircraft-preview').getAttribute('aria-label')).toContain('NOVA');
      controller.dispatch('OPEN_HANGAR');expect([...root.querySelectorAll('.aircraft-option')].map(b=>b.disabled)).toEqual([false,true,true]);expect(root.querySelector('.hangar-best-score')).toBeNull();
      controller.dispatch({type:'SELECT_AIRCRAFT',aircraftId:'velocity'});controller.dispatch('RETURN_TO_MENU');controller.dispatch('START_GAME_FROM_MENU');controller.dispatch('START_PLAYING');
      expect(engine.getSnapshot().aircraft.id).toBe('default');controller.dispatch('GAME_OVER');await settle();
      expect(leaderboardService.submitBestScore).not.toHaveBeenCalled();expect(leaderboardService.fetchPlayerNeighborhood).not.toHaveBeenCalled();expect(localStorage.getItem(GUEST_RECORD_STORAGE_KEY)).toBeNull();
    }finally{controller.destroy();root.remove();canvas.remove();raf.mockRestore();cancel.mockRestore();localStorage.removeItem('unrelated-setting');}
  });
});
