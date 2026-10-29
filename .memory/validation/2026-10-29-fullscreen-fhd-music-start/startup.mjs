import {createApp} from '/src/app/create-app.js';
import {createAppController} from '/src/ui/app-controller.js';
import {createGameEngine} from '/src/game/game-engine.js';
import {createRenderer} from '/src/game/renderer.js';
import {createVisualAssetLoader} from '/src/game/visual-assets.js';
import {createAudioManager} from '/src/audio/audio-manager.js';
const mode=new URLSearchParams(location.search).get('mode')??'ready';
const assets=createVisualAssetLoader();await assets.preload();
const {canvas,uiRoot,liveRegion}=createApp(document.querySelector('#app'));
const engine=createGameEngine({gravity:0,rng:()=>.6,stageRng:()=>.5,invincibilityEnabled:true});
const loops=[],notes=[],stops=[],requests=[],events=[],names=new WeakMap(),buffers=new WeakMap();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
class ObservedContext extends AudioContext{
  async decodeAudioData(bytes){const name=names.get(bytes);const buffer=await super.decodeAudioData(bytes);buffers.set(buffer,name);return buffer;}
  createBufferSource(){const s=super.createBufferSource(),start=s.start.bind(s),stop=s.stop.bind(s);
    s.start=(...args)=>{loops.push({url:buffers.get(s.buffer),loop:s.loop,at:performance.now(),state:engine.getSnapshot().state});return start(...args);};
    s.stop=(...args)=>{stops.push({url:buffers.get(s.buffer),scheduled:args[0],now:this.currentTime,at:performance.now()});return stop(...args);};return s;}
  createOscillator(){const s=super.createOscillator(),start=s.start.bind(s);s.start=(...args)=>{notes.push(performance.now());return start(...args);};return s;}
}
const audio=createAudioManager(ObservedContext,{fetcher:async url=>{
  requests.push(url);events.push({kind:'fetch',url,at:performance.now()});const game=url.includes('/gameplay/');
  if(game&&mode==='failure')return {ok:false};
  await delay(game?(mode==='timeout'?11200:mode==='late-menu'?200:1000):(mode==='late-menu'?2000:0));
  const response=await fetch(url);return {ok:response.ok,arrayBuffer:async()=>{const bytes=await response.arrayBuffer();names.set(bytes,url);return bytes;}};
}});
const prepare=audio.prepareGameplay.bind(audio);
audio.prepareGameplay=scene=>{events.push({kind:'prepare',scene,at:performance.now()});return prepare(scene).then(ready=>{
  events.push({kind:'prepared',ready,at:performance.now()});return ready;
},error=>{events.push({kind:'error',message:String(error),at:performance.now()});throw error;});};
const renderer=createRenderer(canvas,{visualAssets:assets});
const controller=createAppController({root:uiRoot,canvas,liveRegion,gameEngine:engine,renderer,audioManager:audio,
  authService:{getSessionUser:async()=>null,subscribeToAuth:()=>()=>{}},leaderboardService:{}});
controller.mount();
window.startup={controller,mode,loops,notes,stops,requests,events,snapshot:()=>engine.getSnapshot(),buffer:()=>({width:canvas.width,height:canvas.height}),
  fixture:'Production engine/audio/controller/render/assets; native AudioContext, delayed game requests, gravity0/invincible, guest auth stub. No remote account/DB writes.'};
