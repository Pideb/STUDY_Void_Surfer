import { sampleProjectileSpeed } from './projectile-speed.js';
import { moveProjectile } from './boss-signatures.js';
import { getPlayerBounds } from './player-geometry.js';
import { getStageDefinition } from './stages.js';

const randomSources = new WeakMap();
const roll = rng => Math.max(0, Math.min(.999999, Number(rng?.()) || 0));
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const point = p => ({x:p.x,y:p.y});
const geometry = (options,offset) => {
  const g=options.originAt?.(offset) ?? {muzzle:{x:750,y:270},core:{x:790,y:270}};
  return g.muzzle ? g : {muzzle:g,core:g};
};

export function createUniqueAttack({id='unique',stageId,bossNumber=2,rng=Math.random}={}) {
  const attack={id,type:'unique',stageId:getStageDefinition(stageId).id,bossNumber,
    setsPlanned:1+Math.floor(roll(rng)*3),setsStarted:0,elapsedSeconds:0,
    sets:[],projectiles:[],resolved:false,state:'charging',hitPlayer:false};
  randomSources.set(attack,rng);
  return attack;
}

function addShot(attack,set,{delay=0,parentId=null,origin=null,target=null,curve=0,role='normal',index=0}={}) {
  const shot={id:`${set.id}-${set.projectiles.length}`,parentId,type:'projectile',stageId:attack.stageId,
    styleKey:getStageDefinition(attack.stageId).projectileStyle,state:'waiting',delaySeconds:delay,
    launchOrigin:origin?point(origin):null,target:target?point(target):null,
    previous:{x:0,y:0},speed:null,speedSampled:false,flightElapsedSeconds:0,hitPlayer:false,
    launched:false,role,index,curveAmplitude:curve,telegraphPoints:[],x:0,y:0};
  set.projectiles.push(shot);return shot;
}

function startSet(attack) {
  const warning=attack.bossNumber===2?2:1.5;
  const set={id:`${attack.id}-set-${attack.setsStarted+1}`,phase:'warning',elapsedSeconds:0,
    warningSeconds:warning,warningRemainingSeconds:warning,lockedAim:null,lastLaunchAt:null,
    projectiles:[],allLaunched:false};
  attack.sets.push(set);attack.setsStarted++;
  const stage=attack.stageId;
  if(stage==='crystal-gates')addShot(attack,set,{role:'parent',target:{x:625,y:270}});
  else if(stage==='industrial-void')for(let i=0;i<3;i++)addShot(attack,set,{delay:i*.3,index:i});
  else if(stage==='signal-monoliths')for(let i=0;i<12;i++)addShot(attack,set,{delay:i<6?0:1.15,index:i,role:'signal'});
  else if(stage==='gravity-well')for(let i=0;i<5;i++)addShot(attack,set,{delay:i*.3,index:i,role:'orbit'});
  else if(stage==='abyssal-beast')for(let i=0;i<6;i++)addShot(attack,set,{delay:i*.18,index:i,role:'wave'});
  else for(let i=0;i<6;i++)addShot(attack,set,{index:i,role:'ring'});
  return set;
}

function setPath(attack,set,shot,g,aim) {
  let origin=shot.launchOrigin ?? g.muzzle;
  const i=shot.index;
  if(shot.role==='orbit'){
    const angle=Math.min(set.elapsedSeconds,set.warningSeconds+shot.delaySeconds)*2+i*Math.PI*2/5;
    origin={x:g.core.x+Math.cos(angle)*69,y:g.core.y+Math.sin(angle)*55};
  }
  let target=shot.target;
  if(!target){
    if(attack.stageId==='industrial-void')target=set.lockedAim??aim;
    else if(shot.role==='orbit')target={x:240,y:145+i*60};
    else if(shot.role==='ring'){
      const a=Math.atan2(270-g.core.y,240-g.core.x)+[-.75,-.5,-.28,.28,.5,.75][i];
      origin=g.core;target={x:origin.x+Math.cos(a)*1150,y:origin.y+Math.sin(a)*1150};
    } else target={x:240,y:270};
  }
  shot.bossX=origin.x;shot.bossY=shot.startY=origin.y;
  shot.targetX=Math.min(origin.x-1,target.x);shot.targetY=target.y;
  // The same polyline is used by the telegraph and swept collision.
  const pathY=x=>{
    const d=origin.x-x;
    if(shot.role==='signal'){
      const ys=i<6?[55,120,185,355,420,485]:[42,80,102,300,385,470];
      return origin.y+(ys[i%6]-origin.y)*clamp(d/180,0,1);
    }
    if(shot.role==='wave')return origin.y+(270+80*Math.sin(d/145)-origin.y)*clamp(d/180,0,1);
    return origin.y+(target.y-origin.y)*d/Math.max(1,origin.x-shot.targetX);
  };
  // Signature movement expects32 segments ending at targetX, and extrapolates
  // beyond that last segment. Wave paths extend to the screen edge explicitly.
  if(['signal','wave'].includes(shot.role))shot.targetX=-60;
  shot.telegraphPoints=Array.from({length:33},(_,k)=>{const x=origin.x+(shot.targetX-origin.x)*k/32;return{x,y:pathY(x)};});
  shot.x=shot.previousX=origin.x;shot.y=shot.previousY=origin.y;
  shot.previous=point(origin);
  return origin;
}

export function updateUniqueAttack(attack,dt,player,options={}) {
  if(!attack||attack.resolved||!Number.isFinite(dt)||dt<0)return attack;
  if(!attack.sets.length)startSet(attack);
  const rng=options.rng??randomSources.get(attack)??Math.random;
  attack.elapsedSeconds+=dt;
  for(const set of attack.sets){
    if(set.phase==='resolved')continue;
    const before=set.elapsedSeconds;set.elapsedSeconds+=dt;
    set.warningRemainingSeconds=Math.max(0,set.warningSeconds-set.elapsedSeconds);
    const lockAt=set.warningSeconds/2;
    if(!set.lockedAim&&set.elapsedSeconds>=lockAt)set.lockedAim={x:player?.x??240,y:player?.y??270};
    const aim=set.lockedAim??{x:player?.x??240,y:player?.y??270};
    for(let n=0;n<set.projectiles.length;n++){
      const shot=set.projectiles[n];if(shot.state==='resolved')continue;
      const launchAt=set.warningSeconds+shot.delaySeconds;
      const offset=clamp(launchAt-before,0,dt);
      if(!shot.launched){
        const g=geometry(options,set.elapsedSeconds>=launchAt?offset:dt);
        const origin=setPath(attack,set,shot,g,aim);
        shot.chargeRemainingSeconds=Math.max(0,launchAt-set.elapsedSeconds);
        shot.state='charging';
        if(set.elapsedSeconds+1e-9<launchAt)continue;
        shot.launchOrigin=point(origin);shot.target=point({x:shot.targetX,y:shot.targetY});
        shot.speed=sampleProjectileSpeed(options.scrollSpeedAt?.(offset),rng);shot.speedSampled=true;
        shot.launched=true;shot.state='flying';set.lastLaunchAt=launchAt;
      }
      const flight=Math.max(0,set.elapsedSeconds-launchAt);
      let endFlight=flight;
      const splitFlight=shot.role==='parent'?Math.max(0,(shot.bossX-625)/shot.speed):null;
      if(splitFlight!==null)endFlight=Math.min(endFlight,splitFlight);
      shot.previous={x:shot.x,y:shot.y};
      const immunityEnd=before+Math.max(0,options.immuneSeconds??0)-launchAt;
      if(immunityEnd>shot.flightElapsedSeconds)moveProjectile(shot,Math.min(endFlight,immunityEnd),null);
      if(shot.state!=='resolved')moveProjectile(shot,endFlight,options.projectileImmune||endFlight<=immunityEnd?null:getPlayerBounds(player));
      shot.flightElapsedSeconds=endFlight;attack.hitPlayer ||=shot.hitPlayer;
      if(splitFlight!==null&&flight+1e-9>=splitFlight&&!shot.split){
        shot.split=true;shot.state='resolved';
        const splitAt=launchAt+splitFlight;
        for(const y of [140,270,400])addShot(attack,set,{parentId:shot.id,origin:{x:625,y:270},target:{x:240,y},delay:splitAt-set.warningSeconds});
      }
    }
    const pendingSplit=set.projectiles.some(p=>p.role==='parent'&&!p.split);
    set.allLaunched=!pendingSplit&&set.projectiles.every(p=>p.launched);
    set.phase=set.warningRemainingSeconds>0?'warning':!set.allLaunched?'firing':set.projectiles.every(p=>p.state==='resolved')?'resolved':'clearing';
  }
  const last=attack.sets.at(-1);
  if(attack.setsStarted<attack.setsPlanned&&(attack.bossNumber<=3?last.phase==='resolved':last.allLaunched))startSet(attack);
  attack.projectiles=attack.sets.flatMap(s=>s.projectiles);
  attack.resolved=attack.setsStarted===attack.setsPlanned&&attack.sets.every(s=>s.phase==='resolved');
  attack.state=attack.resolved?'resolved':attack.projectiles.some(p=>p.state==='flying')?'flying':'charging';
  return attack;
}
export const isUniqueAttackResolved = attack => Boolean(attack?.resolved);
