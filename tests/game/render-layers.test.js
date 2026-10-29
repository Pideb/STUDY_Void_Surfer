import {describe,it,expect,vi} from 'vitest';
import {createRenderLayers} from '../../src/game/render-layers.js';
const context=()=>Object.fromEntries(['save','restore','setTransform','clearRect','drawImage'].map(k=>[k,vi.fn()]));
describe('reusable raster layers',()=>{
  it('uses exact density dimensions, reuses surfaces and releases owned buffers',()=>{
    const primary=context(),made=[];const factory=vi.fn(()=>{const c={width:0,height:0,ctx:context(),getContext(){return this.ctx;}};made.push(c);return c;});
    const layers=createRenderLayers({canvasFactory:factory});layers.resize({width:1920,height:1080});
    for(const name of ['background','walls','projectiles','lasers'])layers.paint(primary,name,ctx=>{expect(ctx).not.toBe(primary);});
    expect(layers.getStats()).toMatchObject({background:{width:960,height:540},walls:{width:1440,height:810},projectiles:{width:960,height:540},lasers:{width:672,height:378}});
    layers.paint(primary,'walls',()=>{});expect(factory).toHaveBeenCalledTimes(4);
    layers.resize({width:1001,height:777});layers.paint(primary,'walls',()=>{});expect(layers.getStats().walls).toMatchObject({width:750,height:582});expect(factory).toHaveBeenCalledTimes(4);
    expect(primary.drawImage).toHaveBeenCalledWith(made[0],0,0,960,540);
    expect(made[0].ctx.setTransform).toHaveBeenCalledWith(1,0,0,1,0,0);
    layers.destroy();expect(made.every(c=>c.width===1&&c.height===1)).toBe(true);expect(layers.getStats()).toEqual({});
  });
  it.each([()=>null,()=>{throw Error('unavailable');},()=>({getContext:()=>({})})])('falls back to direct draw when a raster surface is unavailable',factory=>{
    const primary=context(),draw=vi.fn(),layers=createRenderLayers({canvasFactory:factory});layers.paint(primary,'lasers',draw);expect(draw).toHaveBeenCalledWith(primary);expect(primary.drawImage).not.toHaveBeenCalled();
  });
  it('restores the layer state even when drawing throws and does not composite partial content',()=>{
    const primary=context(),ctx=context(),layers=createRenderLayers({canvasFactory:()=>({getContext:()=>ctx})});
    expect(()=>layers.paint(primary,'walls',()=>{throw Error('draw');})).toThrow('draw');expect(ctx.restore).toHaveBeenCalledOnce();expect(primary.drawImage).not.toHaveBeenCalled();
  });
  it('normalizes invalid densities and extents without changing world dimensions',()=>{
    const layers=createRenderLayers({canvasFactory:()=>null,densities:{walls:Infinity,lasers:0}}),primary=context();layers.resize({width:NaN,height:-1});layers.paint(primary,'walls',()=>{});layers.paint(primary,'lasers',()=>{});
    expect(layers.getStats()).toMatchObject({walls:{width:720,height:405},lasers:{width:336,height:189}});
  });
});
