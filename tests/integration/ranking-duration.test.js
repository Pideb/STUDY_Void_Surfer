import {describe,it,expect,vi} from 'vitest';
import {createPlaySessionTracker} from '../../src/services/play-session-tracker.js';
import {createAppController} from '../../src/ui/app-controller.js';
import {normalizeScoreRecord,normalizeLeaderboardRows} from '../../src/services/leaderboard-types.js';
const settle=async()=>{for(let n=0;n<20;n++)await Promise.resolve();};
describe('same-run private ranking duration',()=>{
 it('freezes score and survival time per run without waiting for statistics delivery',async()=>{
  let t=0;const user={id:'11111111-1111-4111-8111-111111111111',user_metadata:{name:'Pilot'}},submissions=[];
  const tracker=createPlaySessionTracker({now:()=>t,service:{start:async()=>({ok:false,retryable:false,errorCode:'PGRST202'}),finish:vi.fn()}});
  const finish=vi.spyOn(tracker,'finish');
  const root=document.createElement('div');document.body.append(root);const snapshot={score:0,state:'menu',aircraft:{id:'default'},player:{x:240,y:270}},engine={start(){snapshot.state='playing';snapshot.score=0;},update(){},getSnapshot:()=>({...snapshot}),pause:()=>({score:snapshot.score}),resume(){},stop(){snapshot.state='game-over';}};
  const raf=vi.spyOn(globalThis,'requestAnimationFrame').mockReturnValue(1),cancel=vi.spyOn(globalThis,'cancelAnimationFrame').mockImplementation(()=>{});
  const controller=createAppController({root,canvas:document.createElement('canvas'),gameEngine:engine,playSessionTracker:tracker,authService:{getSessionUser:async()=>user,subscribeToAuth:()=>()=>{}},leaderboardService:{submitBestScore:async(u,p)=>{submissions.push({...p});return{updated:true,record:{userId:u.id,bestScore:p.score,aircraftId:p.aircraftId,achievedAt:'2026-11-02T00:00:00Z'},error:null};},fetchTopScores:async()=>({rows:[]}),fetchPlayerNeighborhood:async()=>({rows:[]})},renderer:{render(){},renderMenuBackground(){}},audioManager:{isMuted:()=>false,play(){}}});
  try{controller.mount();await settle();controller.dispatch('START_GAME_FROM_MENU');controller.dispatch('START_PLAYING');t=2000;controller.dispatch('PAUSE');t=7000;controller.dispatch('RESUME');t=8000;snapshot.score=10;controller.dispatch('GAME_OVER');controller.dispatch('RESTART_IMMEDIATE');t=8050;snapshot.score=20;snapshot.finalScore=30;controller.dispatch('GAME_OVER');await settle();expect(submissions.map(p=>[p.score,p.durationMs])).toEqual([[10,3000],[30,50]]);expect(finish.mock.calls.filter(([outcome])=>outcome==='dead')).toEqual([['dead',10],['dead',30]]);expect(root.innerHTML).not.toMatch(/duration_ms|durationMs|3000/);}finally{controller.destroy();root.remove();raf.mockRestore();cancel.mockRestore();}
 });
 it('drops private fields and keeps server ranking order instead of sorting by timestamps',()=>{
  const rows=[{rank:1,user_id:'longer',display_name:'Longer',best_score:100,achieved_at:'2026-11-02',duration_ms:300000},{rank:2,user_id:'shorter',display_name:'Shorter',best_score:100,achieved_at:'2025-01-01',duration_ms:200000}];const normalized=normalizeLeaderboardRows(rows);expect(normalized.map(r=>r.userId)).toEqual(['longer','shorter']);expect(JSON.stringify(normalized)).not.toContain('duration');expect(normalizeScoreRecord(rows[0])).not.toHaveProperty('duration_ms');
 });
});
