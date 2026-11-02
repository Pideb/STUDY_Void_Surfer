import {describe,it,expect} from 'vitest';
import {createMenuLayout} from '../../src/ui/menu-layout.js';
describe('reference menu scale',()=>{
 it('keeps desktop geometry on1600x900 and leaves gameplay outside the wrapper',()=>{
  const root=document.createElement('div');root.dataset.screen='menu';root.innerHTML='<section class="menu-screen"></section>';document.body.append(root);const layout=createMenuLayout(root,{isMobile:()=>false});layout.refresh();const design=root.firstChild;expect(design.className).toBe('menu-design-space');expect(design.style.width).toBe('1600px');expect(Number(design.dataset.scale)).toBe(Math.min(innerWidth/1600,innerHeight/900));layout.refresh();expect(root.firstChild).toBe(design);root.dataset.screen='playing';root.innerHTML='<div class="game-hud"></div>';layout.refresh();expect(root.querySelector('.menu-design-space')).toBeNull();layout.destroy();root.remove();
 });
 it('uses real CSS viewport dimensions for touch menus',()=>{const root=document.createElement('div');root.innerHTML='<section></section>';const layout=createMenuLayout(root,{isMobile:()=>true});layout.refresh();expect(root.firstChild.classList.contains('is-mobile-landscape')).toBe(true);expect(root.firstChild.style.width).toBe(innerWidth+'px');expect(root.firstChild.dataset.scale).toBe('1');layout.destroy();});
});
