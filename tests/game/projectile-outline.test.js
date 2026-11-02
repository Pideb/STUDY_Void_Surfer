import {describe,it,expect,vi} from 'vitest';
import {createProjectileOutlineCache} from '../../src/game/projectile-outline.js';
function factory() {
 const contexts=[];
 const create=vi.fn((width,height)=>{
   const ctx={drawImage:vi.fn(),fillRect:vi.fn(),getImageData:vi.fn(()=>({data:new Uint8ClampedArray([1,2,3,20,4,5,6,100])})),putImageData:vi.fn()};
   contexts.push(ctx);return {width,height,getContext:()=>ctx};
 });return {create,contexts};
}
const frame={x:10,y:20,width:300,height:200};
describe('cached projectile silhouettes',()=>{
 it('caches small alpha masks and has no repeated pixel reads or allocations per projectile',()=>{const f=factory(),cache=createProjectileOutlineCache({canvasFactory:f.create}),image={src:'shot.png'};const first=cache.get(image,frame,40,24,'#8bd7ff');for(let i=0;i<100;i++)expect(cache.get(image,frame,40,24,'#8bd7ff')).toBe(first);expect(f.create).toHaveBeenCalledTimes(2);expect(first).toMatchObject({x:-24,y:-16,width:48,height:32});expect(f.contexts[0].getImageData).toHaveBeenCalledOnce();expect([...f.contexts[0].putImageData.mock.calls[0][0].data]).toEqual([1,2,3,0,4,5,6,255]);expect(f.contexts[1].drawImage).toHaveBeenCalledTimes(24);expect(f.contexts[0].fillStyle).toBe('#8bd7ff');});
 it('separates colors, parent sizes and source images without modifying geometry',()=>{const f=factory(),cache=createProjectileOutlineCache({canvasFactory:f.create}),image={src:'shot.png'},before=structuredClone(frame);const a=cache.get(image,frame,40,24,'#8bd7ff'),b=cache.get(image,frame,40,24,'#ffb342'),c=cache.get(image,frame,70,42,'#8bd7ff'),d=cache.get({src:'other.png'},frame,40,24,'#8bd7ff');expect(new Set([a,b,c,d]).size).toBe(4);expect(frame).toEqual(before);image.src='updated.png';expect(cache.get(image,frame,40,24,'#8bd7ff')).not.toBe(a);});
 it('preserves source rendering when caching is unsupported and does not retry every frame',()=>{const create=vi.fn(()=>null),cache=createProjectileOutlineCache({canvasFactory:create}),image={};expect(cache.get(image,frame,40,24,'#fff')).toBeNull();expect(cache.get(image,frame,40,24,'#fff')).toBeNull();expect(create).toHaveBeenCalledTimes(2);});
 it('waits for image completion and handles inaccessible alpha safely',()=>{const create=vi.fn(()=>({getContext:()=>({drawImage(){},getImageData(){throw Error('Unavailable');},putImageData(){}})})),cache=createProjectileOutlineCache({canvasFactory:create}),image={complete:false};expect(cache.get(image,frame,40,24,'#fff')).toBeNull();expect(create).not.toHaveBeenCalled();image.complete=true;expect(cache.get(image,frame,40,24,'#fff')).toBeNull();});
});
