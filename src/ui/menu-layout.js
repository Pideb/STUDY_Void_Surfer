import {detectMobile} from './orientation-controller.js';
import './menu-layout.css';
export function createMenuLayout(root,{isMobile=detectMobile}={}) {
  let destroyed=false;
  function refresh(){
    if(destroyed)return;
    const screen=root.dataset.screen;
    if(['playing','preparing'].includes(screen)){return;}
    let design=root.querySelector(':scope > .menu-design-space');
    if(!design&&root.firstElementChild){design=document.createElement('div');design.className='menu-design-space';design.append(...root.children);root.append(design);}
    if(!design)return;
    const mobile=isMobile(),w=mobile?innerWidth:1600,h=mobile?innerHeight:900,scale=mobile?1:Math.min(innerWidth/1600,innerHeight/900);
    design.classList.toggle('is-mobile-landscape',mobile);design.dataset.scale=String(scale);
    Object.assign(design.style,{width:`${w}px`,height:`${h}px`,transform:`translate(-50%,-50%) scale(${scale})`});
  }
  window.addEventListener('resize',refresh);window.visualViewport?.addEventListener('resize',refresh);
  return {refresh,destroy(){destroyed=true;window.removeEventListener('resize',refresh);window.visualViewport?.removeEventListener('resize',refresh);}};
}
