import '/src/styles.css';
import {createApp} from '/src/app/create-app.js';
import {createAppController} from '/src/ui/app-controller.js';
const {canvas,uiRoot,liveRegion}=createApp(document.getElementById('app'));
canvas.style.background='linear-gradient(#0007,#0007),url(/assets/game/menu/space-background.png) center/cover';
let guest=false,authChanged=()=>{};
const user={id:'11111111-1111-4111-8111-111111111111',user_metadata:{name:'MY PILOT'}};
const rows=aircraftId=>Array.from({length:75},(_,i)=>({rank:i+1,displayName:i===8?'MY PILOT':['ASTRA','LYRA','ION','ORBIT'][i%4]+' '+(i+1),aircraftId:aircraftId??['default','aegis','velocity'][i%3],bestScore:520-i*4,achievedAt:'2026-11-03T00:00:00Z'}));
const snapshot={state:'menu',score:0,aircraft:{id:'default'},player:{x:240,y:270}};
const controller=createAppController({root:uiRoot,canvas,liveRegion,orientationIsMobile:()=>innerWidth<1000,
 authService:{getSessionUser:async()=>guest?null:user,subscribeToAuth:cb=>{authChanged=cb;return()=>{};}},
 leaderboardService:{fetchPlayerBestScore:async()=>({bestScore:500}),fetchLeaderboardPage:async({aircraftId,offset,limit})=>({rows:rows(aircraftId).slice(offset,offset+limit),error:null}),fetchPlayerAircraftRecord:async id=>({record:{...rows(id)[8],isCurrentUser:true},error:null}),fetchPlayerNeighborhood:async()=>({rows:[{...rows(null)[8],isCurrentUser:true}],error:null}),fetchTopScores:async()=>({rows:rows(null).slice(0,10),error:null}),submitBestScore:async()=>({record:{userId:user.id,bestScore:500,aircraftId:'default',achievedAt:'2026-11-03'},error:null})},
 gameEngine:{getSnapshot:()=>({...snapshot}),setGuestMode(){},setAccountBestScore(){},start(){snapshot.state='playing';},stop(){snapshot.state='game-over';},update(){},setSuspended(){}},
 renderer:{renderMenuBackground(){},render(){}},audioManager:{isMuted:()=>false,setMusicMode(){},play(){}}
});
controller.mount();
window.qa={controller,setGuest(value){guest=value;authChanged(guest?null:user);},ready:false};
for(let i=0;i<20;i++)await Promise.resolve();
controller.dispatch('OPEN_PILOT_RANKING');window.qa.ready=true;
