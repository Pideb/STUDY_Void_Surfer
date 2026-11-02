// Shapes ported from the user-approved penalty editor; DOM/editor controls excluded.
const rng=seed=>{let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
export const PENALTY_SETTINGS = Object.freeze({
  "crack": {
    "variant": "web",
    "tint": "steel",
    "opacity": 0.7,
    "size": 1.12,
    "count": 19,
    "width": 3.7,
    "glow": 0.5,
    "pulse": 1.05,
    "x": 74,
    "y": 48
  },
  "fog": {
    "variant": "clouds",
    "tint": "steel",
    "opacity": 0.9,
    "size": 210,
    "count": 12,
    "speed": 60,
    "spread": 85
  }
});
function editorPalette(kind){return {cyan:kind==='fog'?[87,145,169]:[131,216,237],steel:kind==='fog'?[119,133,149]:[195,210,219],violet:kind==='fog'?[137,112,166]:[196,163,237]}[PENALTY_SETTINGS[kind].tint];}
function rgba(rgb,a){return 'rgba('+rgb.join(',')+','+a+')';}
function polygon(c,points){c.beginPath();points.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.closePath();}
function borderTip(origin,angle){var dx=Math.cos(angle),dy=Math.sin(angle),tx=dx>0?(960-origin[0])/dx:dx<0?-origin[0]/dx:Infinity,ty=dy>0?(540-origin[1])/dy:dy<0?-origin[1]/dy:Infinity,d=Math.min(tx,ty);return [origin[0]+dx*d,origin[1]+dy*d];}
function drawEditorCrack(c,p,t,seed=0){
 var col=editorPalette('crack'),origin=[960*p.x/100,540*p.y/100],roll=rng(15237 + seed),size=p.size;
 c.fillStyle='rgba(1,6,14,'+p.opacity+')';
 var pieces=[[[960,0],[610,0],[785,136],[690,236],[960,188]],[[960,540],[660,540],[725,409],[852,306],[960,344]],[[0,366],[76,321],[141,463],[115,540],[0,540]]];
 if(p.variant==='edge')pieces.push([[0,0],[290,0],[161,95],[118,215],[0,110]]);
 pieces.forEach(function(points,index){var anchor=index===0?[960,0]:index===1?[960,540]:index===2?[0,540]:[0,0];polygon(c,points.map(function(q){return [anchor[0]+(q[0]-anchor[0])*size+(p.variant==='edge'?0:(origin[0]-700)*.18),anchor[1]+(q[1]-anchor[1])*size+(p.variant==='edge'?0:(origin[1]-240)*.18)];}));c.fill();});
 if(p.variant==='web')for(var k=0;k<5;k++){var x=110+roll()*760,y=55+roll()*430,w=(28+roll()*85)*size;polygon(c,[[x-w,y-15],[x+w*.3,y-w*.5],[x+w,y+25],[x-w*.2,y+w*.6]]);c.fill();}
 var origins=p.variant==='web'?[origin,[Math.max(90,origin[0]-280),Math.min(470,origin[1]+160)],[Math.min(890,origin[0]+140),Math.max(65,origin[1]-140)]]:p.variant==='edge'?[[0,0],[960,0],[960,540],[0,540]]:[origin];
 c.lineCap='round';c.shadowColor=rgba(col,.65);c.shadowBlur=p.glow*8;
 for(var i=0;i<p.count;i++){
  var o=origins[i%origins.length],angle=p.variant==='edge'?Math.atan2(origin[1]-o[1],origin[0]-o[0])+(roll()-.5)*.9:(i/p.count)*Math.PI*2+(roll()-.5)*.22,tip=borderTip(o,angle);
  if(p.variant==='edge')tip=[o[0]+(tip[0]-o[0])*Math.min(.85,.42*size),o[1]+(tip[1]-o[1])*Math.min(.85,.42*size)];
  var dx=tip[0]-o[0],dy=tip[1]-o[1],length=Math.hypot(dx,dy)||1,jitter=(roll()-.5)*48,m=[o[0]+dx*.43-dy/length*jitter,o[1]+dy*.43+dx/length*jitter],n=[o[0]+dx*.7+dy/length*jitter*.4,o[1]+dy*.7-dx/length*jitter*.4];
  c.strokeStyle=rgba(col,(.24+p.glow*.64)*(1+Math.sin(t*p.pulse*3+i)*.12));c.lineWidth=p.width;c.beginPath();c.moveTo(o[0],o[1]);c.lineTo(m[0],m[1]);c.lineTo(n[0],n[1]);c.lineTo(tip[0],tip[1]);c.stroke();
  c.shadowBlur=0;c.strokeStyle=rgba([226,239,246],.23+p.glow*.21);c.lineWidth=Math.max(.5,p.width*.38);c.beginPath();c.moveTo(m[0],m[1]);c.lineTo(m[0]+dx*.2+12,m[1]+dy*.2-15);c.stroke();c.shadowBlur=p.glow*8;
 }
 c.shadowBlur=0;
}
function drawEditorFog(c,p,t){
 var col=editorPalette('fog'),roll=rng(9147),motion=t*p.speed;
 c.fillStyle=rgba(col,p.opacity*.12);c.fillRect(0,0,960,540);
 for(var i=0;i<p.count;i++){
  var seedX=roll(),seedY=roll(),x,y,sx=1,sy=1,r=p.size*(.8+roll()*.35),spread=p.spread/100;
  if(p.variant==='vortex'){var a=i/p.count*Math.PI*2+motion*.007,ring=(.35+(i%3)*.43)*r;x=540+Math.cos(a)*ring*1.6;y=270+Math.sin(a)*ring*.72*spread;}
  else {x=((seedX*1300+motion*(i%2?1:-.7)+1300)%1300)-170;y=270+(seedY-.5)*540*spread+Math.sin(motion*.025+i)*32*spread;}
  if(p.variant==='ribbons'){sx=2.9;sy=.26+(i%3)*.06;y=270+((i%4)-1.5)*90*spread+Math.sin(motion*.02+i)*38;}
  c.save();c.translate(x,y);c.scale(sx,sy);var g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,rgba(col,p.opacity));g.addColorStop(.48,rgba(col,p.opacity*.72));g.addColorStop(1,rgba(col,0));c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore();
 }
}

export {drawEditorCrack,drawEditorFog};
