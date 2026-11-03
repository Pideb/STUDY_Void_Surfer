import '/src/styles.css';
import {createApp} from '/src/app/create-app.js';
import {createAppController} from '/src/ui/app-controller.js';
import updates from '/docs/player/updates.json';
const {canvas,uiRoot,liveRegion}=createApp(document.getElementById('app'));
canvas.style.background='url(/assets/game/menu/space-background.png) center/cover';
const snapshot={state:'menu',score:0,aircraft:{id:'default'},player:{x:240,y:270}};
const controller=createAppController({root:uiRoot,canvas,liveRegion,startupUpdateEntry:updates.entries[0],orientationIsMobile:()=>innerWidth<1000,
 authService:{getSessionUser:async()=>null,subscribeToAuth:()=>()=>{}},
 leaderboardService:{fetchPlayerBestScore:async()=>({bestScore:0})},
 gameEngine:{getSnapshot:()=>({...snapshot}),setGuestMode(){},setAccountBestScore(){},setSuspended(){},update(){}},
 renderer:{renderMenuBackground(){},render(){}},audioManager:{isMuted:()=>false,setMusicMode(){},setMusicScene(){},play(){}}
});
controller.mount();
window.startupQA={controller};
