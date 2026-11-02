// Approved v3 crops and moving-wall atlas slices. Display-size contours are cached.
import { getStageVisualTheme } from './visual-theme.js';
import { projectileOutlines } from './projectile-outline.js';
const CORES=[{"kind":"projectile","stageId":"crystal-gates","width":1536,"height":1024,"transparentFraction":0.9299659729003906,"cropMethod":"alpha-core-plus-padding","core":{"x":440,"y":325,"width":644,"height":383},"frame":{"x":401,"y":302,"right":1123,"bottom":731,"width":722,"height":429}},{"kind":"laser","stageId":"crystal-gates","width":2048,"height":768,"transparentFraction":0.7529252370198568,"cropMethod":"bright-core-plus-glow","core":{"x":0,"y":334,"width":2048,"height":94},"frame":{"x":0,"y":240,"right":2048,"bottom":522,"width":2048,"height":282}},{"kind":"projectile","stageId":"industrial-void","width":1774,"height":887,"transparentFraction":0.7672340928531755,"cropMethod":"alpha-core-plus-padding","core":{"x":177,"y":270,"width":1433,"height":342},"frame":{"x":91,"y":249,"right":1696,"bottom":633,"width":1605,"height":384}},{"kind":"laser","stageId":"industrial-void","width":2172,"height":724,"transparentFraction":0.8320176174923435,"cropMethod":"bright-core-plus-glow","core":{"x":0,"y":311,"width":2172,"height":89},"frame":{"x":0,"y":222,"right":2172,"bottom":489,"width":2172,"height":267}},{"kind":"projectile","stageId":"signal-monoliths","width":1774,"height":887,"transparentFraction":0.7769523201854674,"cropMethod":"alpha-core-plus-padding","core":{"x":161,"y":261,"width":1365,"height":378},"frame":{"x":79,"y":238,"right":1608,"bottom":662,"width":1529,"height":424}},{"kind":"laser","stageId":"signal-monoliths","width":2172,"height":724,"transparentFraction":0,"cropMethod":"bright-core-plus-glow","core":{"x":0,"y":243,"width":2172,"height":209},"frame":{"x":0,"y":34,"right":2172,"bottom":661,"width":2172,"height":627}},{"kind":"projectile","stageId":"gravity-well","width":1774,"height":887,"transparentFraction":0.6979119665365565,"cropMethod":"alpha-core-plus-padding","core":{"x":122,"y":192,"width":1262,"height":505},"frame":{"x":46,"y":161,"right":1460,"bottom":728,"width":1414,"height":567}},{"kind":"laser","stageId":"gravity-well","width":2172,"height":724,"transparentFraction":0.6915781467802163,"cropMethod":"bright-core-plus-glow","core":{"x":0,"y":326,"width":2172,"height":81},"frame":{"x":0,"y":245,"right":2172,"bottom":488,"width":2172,"height":243}},{"kind":"projectile","stageId":"abyssal-beast","width":1774,"height":887,"transparentFraction":0.727547094509316,"cropMethod":"alpha-core-plus-padding","core":{"x":173,"y":169,"width":1514,"height":534},"frame":{"x":82,"y":136,"right":1774,"bottom":736,"width":1692,"height":600}},{"kind":"laser","stageId":"abyssal-beast","width":2172,"height":724,"transparentFraction":0.8343597061546758,"cropMethod":"bright-core-plus-glow","core":{"x":0,"y":292,"width":2172,"height":125},"frame":{"x":0,"y":167,"right":2172,"bottom":542,"width":2172,"height":375}},{"kind":"projectile","stageId":"solar-forge","width":1774,"height":887,"transparentFraction":0.7567182997804947,"cropMethod":"alpha-core-plus-padding","core":{"x":138,"y":224,"width":1522,"height":433},"frame":{"x":46,"y":198,"right":1752,"bottom":683,"width":1706,"height":485}},{"kind":"laser","stageId":"solar-forge","width":2172,"height":724,"transparentFraction":0.8409643580273293,"cropMethod":"bright-core-plus-glow","core":{"x":0,"y":245,"width":2172,"height":224},"frame":{"x":0,"y":21,"right":2172,"bottom":693,"width":2172,"height":672}}];
const STAGE_IDS=["crystal-gates","industrial-void","signal-monoliths","gravity-well","abyssal-beast","solar-forge"];
function material(image,kind,stageId){const data=CORES.find(x=>x.kind===kind&&x.stageId===stageId);return data?{...data,image,color:[1,3,5].map(i=>parseInt(getStageVisualTheme(stageId).laser.slice(i,i+2),16))}:null;}
export function clipWallBreach(ctx,wall,baseHalfHeight=28){
 const effect=wall.breakEffect ?? (wall.barrierBroken ? {centerY:wall.barrierBreakY,remainingSeconds:0,durationSeconds:1} : null);if(!effect)return;
 const progress=Math.max(0,Math.min(1,1-effect.remainingSeconds/Math.max(.001,effect.durationSeconds??.65)));
 const center=Math.max(0,Math.min(540,effect.centerY??0)),half=baseHalfHeight+progress*24;
 const top=Math.max(0,center-half),bottom=Math.min(540,center+half);
 ctx.beginPath();ctx.rect(-960,0,2880,top);ctx.rect(-960,bottom,2880,540-bottom);ctx.clip();
}
export function drawRestoredProjectile(ctx,image,shot,stageId){
 var data=material(image,'projectile',stageId);if(!data)return;var f=data.frame;ctx.save();ctx.translate(shot.x,shot.y);if(shot.state==='returning')ctx.rotate(Math.PI);ctx.shadowBlur=0;ctx.filter='none';ctx.globalAlpha=1;var scale=(shot.role==='parent'?62:36)/Math.max(data.core.width,data.core.height),w=f.width*scale,h=f.height*scale;
 var outline=projectileOutlines.get(image,f,w,h,getStageVisualTheme(stageId).projectile);
 if(outline)ctx.drawImage(outline.canvas,outline.x,outline.y,outline.width,outline.height);
 ctx.drawImage(image,f.x,f.y,f.width,f.height,-w/2,-h/2,w,h);ctx.restore();
}
export function drawRestoredBeam(ctx,y,height,front,time,opacity=1,image=null,stageId=null){
 var data=image&&material(image,'laser',stageId);if(!data)return;var f=data.frame,broad=height>30,rows=1,coreHeight=broad?height*.9:height,drawHeight=coreHeight*f.height/data.core.height,tileWidth=320,shift=(time*160)%tileWidth;
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=opacity*(.97+Math.sin(time*8)*.03);ctx.shadowBlur=0;ctx.filter='none';ctx.beginPath();ctx.rect(Math.max(0,front),y-height*.85,960-Math.max(0,front),height*1.7);ctx.clip();
 for(var row=0;row<rows;row++){var center=y+(row-(rows-1)/2)*height*.33;for(var x=-shift;x<960;x+=tileWidth)ctx.drawImage(image,f.x,f.y,f.width,f.height,x,center-drawHeight/2,tileWidth+1,drawHeight);}
 ctx.restore();
 if(front>0&&front<960){var c=data.color,radius=broad?height*.55:26;ctx.save();var glow=ctx.createRadialGradient(front+8,y,0,front+8,y,radius);glow.addColorStop(0,'rgba(255,255,255,'+opacity+')');glow.addColorStop(.25,'rgba('+c.join(',')+','+opacity*.65+')');glow.addColorStop(1,'rgba('+c.join(',')+',0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(front+8,y,radius,0,Math.PI*2);ctx.fill();ctx.restore();}
}

// Draw the whole material pillar from the generated sprite atlas, never the concept scene.
const slices={a:[[40,200],[294,200],[542,202],[797,200],[1049,198],[1302,198]],b:[[48,220],[302,214],[560,211],[797,218],[1047,216],[1297,210]]};
export function drawMovingWallMaterial(ctx,wall,assets){
 const style=wall.stageId==='abyssal-beast'?'b':'a',atlas=assets?.get('movingWallAtlases.'+style),index=STAGE_IDS.indexOf(wall.stageId),slice=slices[style]?.[Math.max(0,index)];if(!atlas||!slice)return false;
 const scale=atlas.width/1536,sx=slice[0]*scale,sw=slice[1]*scale,sy=32*atlas.height/1024,sh=960*atlas.height/1024;
 const height=sh*wall.width/sw,top=wall.gapCenter-wall.gapHeight/2,bottom=wall.gapCenter+wall.gapHeight/2;
 ctx.save();ctx.shadowBlur=0;ctx.filter='none';ctx.beginPath();ctx.rect(wall.x,0,wall.width,top);ctx.rect(wall.x,bottom,wall.width,540-bottom);ctx.clip();
 ctx.fillStyle='#0b111c';ctx.fillRect(wall.x,0,wall.width,540);
 // Inner edges anchor the texture; y motion translates the material without stretching it.
 for(let y=top-height;y>-height;y-=height)ctx.drawImage(atlas,sx,sy,sw,sh,wall.x,y,wall.width,height);
 for(let y=bottom;y<540;y+=height)ctx.drawImage(atlas,sx,sy,sw,sh,wall.x,y,wall.width,height);
 ctx.restore();return true;
}
