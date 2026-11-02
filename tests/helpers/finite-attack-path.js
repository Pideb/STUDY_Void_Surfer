import {createUniqueAttack,updateUniqueAttack} from '../../src/game/boss-unique-attacks.js';
import {createPlayer,applyLift,updatePlayer,isOutOfBounds} from '../../src/game/player.js';
import {GRAVITY,LIFT_VELOCITY,DASH_DURATION_SECONDS,DASH_COOLDOWN_SECONDS} from '../../src/game/constants.js';

// Finite input search, using real gravity/lift/hitboxes and limited dash windows.
// It proves only the sampled attack scene, not arbitrary wall/attack combinations.
export function findFiniteAttackPath({stageId,craft,bossNumber,scrollSpeed,dt=1/60,roll=.6}){
 for(const strategy of ['steady','leave-announced-aim'])for(const lookAhead of [70,120,170,45,95])for(const targetY of [100,180,270,360,450,65,490]){
  const player=createPlayer(),attack=createUniqueAttack({stageId,bossNumber,rng:()=>roll});
  const frames=[];let dash=0,cooldown=0,minMargin=Infinity;
  for(let frame=0;frame<Math.ceil(40/dt)&&!attack.resolved;frame++){
   const locked=attack.sets.at(-1)?.lockedAim;
   const goal=strategy==='leave-announced-aim'&&locked?(locked.y<270?450:100):targetY;
   const lift=player.y>goal&&player.velocityY>=0;
   if(lift)applyLift(player,LIFT_VELOCITY*craft.liftMultiplier);
   const danger=attack.projectiles.some(p=>p.launched&&p.state==='flying'&&p.x>210&&p.x<240+lookAhead&&Math.abs(p.y-player.y)<100);
   const useDash=danger&&cooldown<=0;if(useDash){dash=DASH_DURATION_SECONDS;cooldown=DASH_COOLDOWN_SECONDS;}
   updatePlayer(player,dt,GRAVITY*craft.gravityMultiplier);
   updateUniqueAttack(attack,dt,player,{originAt:()=>({muzzle:{x:750,y:270},core:{x:790,y:270}}),scrollSpeedAt:()=>scrollSpeed,immuneSeconds:dash,rng:()=>roll});
   dash=Math.max(0,dash-dt);cooldown=Math.max(0,cooldown-dt);minMargin=Math.min(minMargin,player.y-8,532-player.y);
   frames.push({lift,dash:useDash,y:player.y});
   if(attack.hitPlayer||isOutOfBounds(player,540))break;
  }
  if(attack.resolved&&!attack.hitPlayer&&!isOutOfBounds(player,540))return {passed:true,strategy,targetY,lookAhead,minBoundaryMargin:minMargin,frames,sets:attack.setsStarted};
 }
 return {passed:false};
}
