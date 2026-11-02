import {describe,it,expect,vi} from 'vitest';
import {alphaRectangles,createBossBeamContact} from '../../src/game/boss-hit-mask.js';
import {getBossGeometry} from '../../src/game/boss-geometry.js';

describe('cached boss artwork alpha',()=>{
  it('preserves transparent rows and holes while merging solid rectangles',()=>{
    const data=new Uint8ClampedArray(4*4*4);
    for(const [x,y]of [[1,0],[2,0],[1,1],[2,1],[0,3],[3,3]])data[(y*4+x)*4+3]=255;
    expect(alphaRectangles(data,4,4)).toEqual([[.25,0,.75,.5],[0,.75,.25,1],[.75,.75,1,1]]);
    expect(alphaRectangles(new Uint8ClampedArray(16),2,2)).toEqual([]);
  });
  it('splits beast base at fixed source strips and ignores faint glow',()=>{
    const data=new Uint8ClampedArray(4*4);for(let i=0;i<4;i++)data[i*4+3]=255;
    expect(alphaRectangles(data,4,1,2)).toEqual([[0,0,.5,1],[.5,0,1,1]]);
    data[3]=63;expect(alphaRectangles(data,4,1)[0][0]).toBe(.25);
  });
  it('reads pixels only once per image and preserves the mask during repeated shots',()=>{
    const image={},stageId='crystal-gates',data=new Uint8ClampedArray(192*128*4);
    for(let y=48;y<80;y++)for(let x=80;x<110;x++)data[(y*192+x)*4+3]=255;
    const ctx={clearRect:vi.fn(),drawImage:vi.fn(),getImageData:vi.fn(()=>({data}))};
    const prepare=vi.fn(()=>({base:{},parts:[]})),makeCanvas=vi.fn(()=>({getContext:()=>ctx}));
    const contact=createBossBeamContact({get:()=>image},{prepare,makeCanvas});
    const base={stageId,fromMotionSeconds:0,toMotionSeconds:0},g=getBossGeometry(stageId);
    expect(contact({...base,shot:{fromX:240,fromY:g.box.y+2}})).toBe(false);
    for(let i=0;i<20;i++)expect(contact({...base,shot:{fromX:240,fromY:g.center.y}})).toBe(true);
    expect(ctx.getImageData).toHaveBeenCalledOnce();expect(prepare).toHaveBeenCalledOnce();
  });
});
