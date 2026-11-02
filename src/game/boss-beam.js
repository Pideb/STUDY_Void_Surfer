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

function polygonTouchesBeam(points, left, right, top, bottom) {
  // SAT for a transformed source rectangle against the horizontal beam rectangle.
  const axes=[[1,0],[0,1],...[0,1].map(i=>{
    const a=points[i],b=points[i+1];return [a[1]-b[1],b[0]-a[0]];
  })];
  const beam=[[left,top],[right,top],[right,bottom],[left,bottom]];
  return axes.every(([x,y])=>{
    const a=points.map(p=>p[0]*x+p[1]*y),b=beam.map(p=>p[0]*x+p[1]*y);
    return Math.max(...a)>=Math.min(...b)&&Math.max(...b)>=Math.min(...a);
  });
}

function touchesSilhouette(silhouette,stageId,geometry,pose,shot,reducedMotion) {
  const {box}=geometry,rig=BOSS_RIGS[stageId]??BOSS_RIGS['crystal-gates'];
  const touches=(rect,part,index)=>{
    const transform=part?getBossPartTransform(part,index,pose,reducedMotion):{angle:0,dx:0,dy:0};
    const [px,py]=part?.pivot??[0,0],cos=Math.cos(transform.angle),sin=Math.sin(transform.angle);
    const u=(Math.floor((rect[0]+rect[2])/2*64)+.5)/64;
    const tail=!part&&stageId==='abyssal-beast'&&!reducedMotion
      ?Math.sin((pose.time??0)*2.5-u*7)*box.h*.075*Math.pow(Math.max(0,Math.min(1,(u-.56)/.44)),2):0;
    const points=[[rect[0],rect[1]],[rect[2],rect[1]],[rect[2],rect[3]],[rect[0],rect[3]]].map(([x,y])=>{
      const dx=(x-px)*box.w,dy=(y-py)*box.h;
      return [box.x+(px+transform.dx)*box.w+dx*cos-dy*sin,box.y+(py+transform.dy)*box.h+dx*sin+dy*cos+tail];
    });
    return polygonTouchesBeam(points,shot.fromX+28,WORLD_WIDTH,shot.fromY-4,shot.fromY+4);
  };
  return silhouette.base.some(rect=>touches(rect))
    ||silhouette.parts.some((rects,index)=>rects.some(rect=>touches(rect,rig.parts[index],index)));
}

export function intersectsBossBeam({shot,stageId,fromMotionSeconds,toMotionSeconds,poseAt=()=>({}),silhouette=null,reducedMotion=false}={}) {
  if(!shot||![shot.fromX,shot.fromY,fromMotionSeconds,toMotionSeconds].every(Number.isFinite)
    ||toMotionSeconds<fromMotionSeconds||shot.fromX+28>WORLD_WIDTH)return false;
  const times=[fromMotionSeconds,toMotionSeconds],span=toMotionSeconds-fromMotionSeconds;
  // Exact sine turnarounds plus small pose intervals cover crossing between ticks.
  for(let k=Math.ceil((fromMotionSeconds-1.5)/3);1.5+3*k<toMotionSeconds;k++){
    times.push(1.5+3*k);if(times.length>1024)break;
  }
  const steps=Math.min(1024,Math.ceil(span*240));
  for(let i=1;i<steps;i++)times.push(fromMotionSeconds+span*i/steps);
  for(const time of times){const pose=poseAt(time),g=getBossGeometry(stageId,1,time,getBossRecoil(pose));
    if(silhouette){if(touchesSilhouette(silhouette,stageId,g,pose,shot,reducedMotion))return true;}
    else {
      // The renderer uses a radius68 circle when the boss image/raster is unavailable.
      const dx=Math.max(shot.fromX+28-g.center.x,0,g.center.x-WORLD_WIDTH);
      const dy=Math.max(Math.abs(shot.fromY-g.center.y)-4,0);
      if(dx*dx+dy*dy<=68*68)return true;
    }
  }
  return false;
}
