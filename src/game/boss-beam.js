import {WORLD_WIDTH} from './constants.js';
import {BOSS_RIGS} from './boss-rigs.js';
import {getBossGeometry} from './boss-geometry.js';
import {getBossPartTransform,getBossRecoil} from './boss-motion.js';

// Full-art envelope, not the core. Includes every articulated wing/protrusion.
export function getBossArtBounds(stageId,geometry,pose={}) {
  pose={time:0,charge:0,roar:0,fire:0,hit:0,...pose};
  const {box}=geometry,rig=BOSS_RIGS[stageId]??BOSS_RIGS['crystal-gates'];
  const bounds={left:box.x,right:box.x+box.w,top:box.y,bottom:box.y+box.h};
  rig.parts.forEach((part,index)=>{
    const {angle,dx,dy}=getBossPartTransform(part,index,pose),cos=Math.cos(angle),sin=Math.sin(angle);
    for(const [x,y] of part.poly){const px=(x-part.pivot[0])*box.w,py=(y-part.pivot[1])*box.h;
      const worldX=box.x+(part.pivot[0]+dx)*box.w+px*cos-py*sin;
      const worldY=box.y+(part.pivot[1]+dy)*box.h+px*sin+py*cos;
      bounds.left=Math.min(bounds.left,worldX);bounds.right=Math.max(bounds.right,worldX);
      bounds.top=Math.min(bounds.top,worldY);bounds.bottom=Math.max(bounds.bottom,worldY);
    }
  });
  if(stageId==='abyssal-beast'){bounds.top-=box.h*.075;bounds.bottom+=box.h*.075;}
  return bounds;
}

export function intersectsBossBeam({shot,stageId,fromMotionSeconds,toMotionSeconds,poseAt=()=>({})}={}) {
  if(!shot||![shot.fromX,shot.fromY,fromMotionSeconds,toMotionSeconds].every(Number.isFinite)
    ||toMotionSeconds<fromMotionSeconds||shot.fromX+28>WORLD_WIDTH)return false;
  const times=[fromMotionSeconds,toMotionSeconds],span=toMotionSeconds-fromMotionSeconds;
  // Exact sine turnarounds plus small pose intervals cover crossing between ticks.
  for(let k=Math.ceil((fromMotionSeconds-1.5)/3);1.5+3*k<toMotionSeconds;k++){
    times.push(1.5+3*k);if(times.length>1024)break;
  }
  const steps=Math.min(1024,Math.ceil(span*240));
  for(let i=1;i<steps;i++)times.push(fromMotionSeconds+span*i/steps);
  const swept={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
  for(const time of times){const pose=poseAt(time),g=getBossGeometry(stageId,1,time,getBossRecoil(pose));
    const b=getBossArtBounds(stageId,g,pose);swept.left=Math.min(swept.left,b.left);swept.right=Math.max(swept.right,b.right);
    swept.top=Math.min(swept.top,b.top);swept.bottom=Math.max(swept.bottom,b.bottom);
  }
  return swept.right>=shot.fromX+28&&swept.left<=WORLD_WIDTH&&shot.fromY+4>=swept.top&&shot.fromY-4<=swept.bottom;
}
