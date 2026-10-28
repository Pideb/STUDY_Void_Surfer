// Approved ink-v3 and glitch-v5 visuals. Cached noise never alters game geometry.
function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}

const clamp=x=>Math.max(0,Math.min(1,x));
function inkBlob(c,x,y,rx,ry,seed,t){
  const g=c.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));g.addColorStop(0,'#010208');g.addColorStop(.8,'#010208');g.addColorStop(1,'#03040a');c.fillStyle=g;
  c.beginPath();for(let k=0;k<=48;k++){const a=k/48*Math.PI*2,w=1+.075*Math.sin(a*5+seed)+.04*Math.sin(a*11+seed*.7+t*.45);const px=x+Math.cos(a)*rx*w,py=y+Math.sin(a)*ry*w;if(k===0)c.moveTo(px,py);else c.lineTo(px,py);}c.closePath();c.fill();
}
const textures=new WeakMap();
function staticTexture(c,t){
  let cache=textures.get(c);
  if(!cache){
    const canvas=c.canvas?.ownerDocument?.createElement('canvas')??(typeof OffscreenCanvas==='function'?new OffscreenCanvas(240,135):null);
    if(!canvas)return null;
    canvas.width=240;canvas.height=135;
    const context=canvas.getContext('2d');if(!context?.createImageData)return null;
    cache={canvas,context,image:context.createImageData(240,135),frame:-1};textures.set(c,cache);
  }
  const frame=Math.floor(t*22);if(cache.frame===frame)return cache.canvas;cache.frame=frame;
  const roll=rng(9001+frame*101),data=cache.image.data;
  for(let i=0;i<data.length;i+=4){const n=roll(),v=n<.55?8:n<.88?22+roll()*36:n<.987?62+roll()*70:170+roll()*65;
    data[i]=v*.68;data[i+1]=v*.9;data[i+2]=v;data[i+3]=255;}
  cache.context.putImageData(cache.image,0,0);return cache.canvas;
}
export function drawChallengeFailure(c,effect,player,{reducedMotion=false}={}){
  if(!effect||!player||!(effect.remainingSeconds>0))return;
  const duration=effect.durationSeconds||5,elapsed=Math.max(0,duration-effect.remainingSeconds);
  const age=reducedMotion?1:elapsed,kind=effect.kind;
  const strength=clamp(elapsed/.11)*clamp(effect.remainingSeconds/1.2);c.save();
  // Keep a readable near-ship corridor; obstruction occupies part of the scene.
  c.beginPath();c.rect(0,0,960,540);c.ellipse(player.x,player.y,74,52,0,0,Math.PI*2);c.clip('evenodd');
  if(kind==='ink'){
    c.globalAlpha=strength*.88;
    const spread=.93+.07*clamp(age/.3);
    for(const[x,y,rx,ry,s]of[[650,72,260,120,1],[145,480,205,108,8],[880,380,155,170,11],[455,35,155,72,15]])inkBlob(c,x,y,rx*spread,ry*spread,s,age);
    c.fillStyle='#010208';c.globalAlpha=strength*.84;
    for(let i=0;i<5;i++){const x=520+i*58,y=88+(i%3)*12,len=20+clamp(age/1.1)*(30+(i%3)*10);c.beginPath();c.ellipse(x,y+len/2,4+(i%2)*2,len/2,0,0,Math.PI*2);c.fill();}
  }else{
    const noiseCanvas=staticTexture(c,age);const step=Math.floor(age*19),roll=rng(step*491+321);
    c.globalAlpha=strength*.14;c.fillStyle='#020711';c.fillRect(0,0,960,540);
    c.imageSmoothingEnabled=false;c.globalAlpha=strength*.30;if(noiseCanvas)c.drawImage(noiseCanvas,0,0,960,540);
    // Retain fast crackling without replacing the underlying wall silhouettes.
    for(let i=0;i<8;i++){
      const y=roll()*540,h=3+roll()*11,x=roll()*520;
      c.globalAlpha=strength*(.28+roll()*.28);c.fillStyle=i%4===0?'#96bccb':i%3===0?'#29435b':'#01040b';
      c.fillRect(x,y,150+roll()*360,h);
      c.globalAlpha=strength*.34;c.fillStyle='#8ca5ae';c.fillRect(x+roll()*60,y+h+2,100+roll()*280,1+roll()*2);
    }
    const tear=(age*180)%650-90;c.globalAlpha=strength*.48;c.fillStyle='#03060c';c.fillRect(0,tear,960,14);
    c.globalAlpha=strength*.20;c.fillStyle='#7393a2';
    for(let y=0;y<540;y+=8)c.fillRect(0,y+(step%3),960,1);
    for(let i=0;i<24;i++){const x=roll()*960,y=roll()*540;c.globalAlpha=strength*(.18+roll()*.25);c.fillStyle=roll()<.3?'#9ba4bd':'#091422';c.fillRect(x,y,6+roll()*28,2+roll()*5);}
  }
  c.restore();
}
