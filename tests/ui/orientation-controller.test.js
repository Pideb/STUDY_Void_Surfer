import {describe,it,expect,vi,afterEach} from 'vitest';
import {createOrientationController} from '../../src/ui/orientation-controller.js';
let controller;
const dimensions=(w,h)=>{vi.stubGlobal('innerWidth',w);vi.stubGlobal('innerHeight',h);window.dispatchEvent(new Event('resize'));};
afterEach(()=>{controller?.destroy();vi.unstubAllGlobals();});
describe('orientation ownership',()=>{
 it('requires manual confirmation only when returning from real flight',()=>{
  dimensions(844,390);let screen='playing';const onChange=vi.fn();controller=createOrientationController({isMobile:()=>true,getScreen:()=>screen,onChange});dimensions(390,844);expect(controller.getState()).toMatchObject({portrait:true,priorScreen:'playing'});dimensions(844,390);expect(controller.getState().resumePending).toBe(true);controller.confirmResume();expect(controller.getState().resumePending).toBe(false);screen='paused';dimensions(390,844);dimensions(844,390);expect(controller.getState().resumePending).toBe(false);
 });
 it('does not gate a narrow portrait desktop window',()=>{dimensions(390,844);controller=createOrientationController({isMobile:()=>false});expect(controller.getState().portrait).toBe(false);});
});
