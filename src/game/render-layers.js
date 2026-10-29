export const RENDER_DENSITIES=Object.freeze({background:.5,walls:.75,projectiles:.5,lasers:.35});
function defaultFactory(width,height){
  if(typeof OffscreenCanvas==='function')return new OffscreenCanvas(width,height);
  if(typeof CanvasRenderingContext2D==='undefined'||typeof document==='undefined')return null;
  return document.createElement('canvas');
}
export function createRenderLayers({canvasFactory=defaultFactory,densities={}}={}){
  let resolution={width:960,height:540},destroyed=false;const layers=new Map();
  function dimensions(name){const input=densities[name],density=Number.isFinite(input)&&input>0&&input<=1?input:RENDER_DENSITIES[name]??1;
    return {width:Math.max(1,Math.floor(resolution.width*density)),height:Math.max(1,Math.floor(resolution.height*density)),density};}
  function resize(next){if(destroyed)return;resolution={width:Number.isFinite(next?.width)&&next.width>0?next.width:960,height:Number.isFinite(next?.height)&&next.height>0?next.height:540};}
  function paint(primary,name,draw){
    if(destroyed)return;const size=dimensions(name);let layer=layers.get(name);
    if(!layer){let canvas=null,ctx=null;try{canvas=canvasFactory(size.width,size.height);ctx=canvas?.getContext?.('2d');
      if(!['save','restore','setTransform','clearRect','drawImage'].every(key=>typeof ctx?.[key]==='function')||ctx===primary){canvas=null;ctx=null;}
    }catch{canvas=null;ctx=null;}layer={canvas,ctx,...size};layers.set(name,layer);}
    Object.assign(layer,size);
    if(!layer.ctx){draw(primary);return;}
    const {canvas,ctx}=layer;if(canvas.width!==size.width)canvas.width=size.width;if(canvas.height!==size.height)canvas.height=size.height;
    ctx.save();try{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,size.width,size.height);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.shadowBlur=0;
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='low';ctx.setTransform(size.width/960,0,0,size.height/540,0,0);draw(ctx);
    }finally{ctx.restore();}
    // Bilinear upsampling keeps the reduced raster cheap. Restoring the primary
    // state leaves ship/boss texture sampling at its original high quality.
    primary.save();try{primary.filter='none';primary.shadowBlur=0;primary.globalAlpha=1;primary.globalCompositeOperation='source-over';primary.imageSmoothingEnabled=true;primary.imageSmoothingQuality='low';primary.drawImage(canvas,0,0,960,540);}finally{primary.restore();}
  }
  return {resize,paint,getStats:()=>Object.fromEntries([...layers].map(([name,l])=>[name,{width:l.width,height:l.height,density:l.density,available:Boolean(l.ctx)}])),destroy(){destroyed=true;for(const layer of layers.values())if(layer.canvas){layer.canvas.width=1;layer.canvas.height=1;}layers.clear();}};
}
