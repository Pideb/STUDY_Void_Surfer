import {describe,it,expect,vi,afterEach} from 'vitest';
import {createMenuNavigation} from '../../src/ui/menu-navigation.js';
let nav,root;
afterEach(()=>{nav?.destroy();root?.remove();});
const key=(code,repeat=false,target=root)=>({code,repeat,target,preventDefault:vi.fn()});
describe('directional menu navigation',()=>{
 it('skips disabled/hidden items, preserves stable IDs across repaint and activates once',()=>{
 root=document.createElement('div');root.dataset.screen='menu';root.innerHTML='<button data-menu-item-id="one">one</button><button disabled>skip</button><button hidden>hidden</button><button data-menu-item-id="two">two</button>';document.body.append(root);const activate=vi.fn();nav=createMenuNavigation(root,{activate});nav.refresh();expect(root.firstChild.classList.contains('is-keyboard-current')).toBe(true);nav.handleKey(key('ArrowDown'));expect(document.activeElement.textContent).toBe('two');root.innerHTML='<button data-menu-item-id="one">one</button><button data-menu-item-id="two">new two</button>';nav.refresh();expect(root.querySelector('.is-keyboard-current').textContent).toBe('new two');nav.handleKey(key('Space'));nav.handleKey(key('Space'));expect(activate).toHaveBeenCalledTimes(1);window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space'}));nav.handleKey(key('Space'));expect(activate).toHaveBeenCalledTimes(2);
 });
 it('uses geometry for grid neighbors and confines navigation to a modal',()=>{
 root=document.createElement('div');root.innerHTML='<button>outside</button><section role="dialog"><button>A</button><button>B</button><input type="checkbox"></section>';document.body.append(root);const buttons=[...root.querySelectorAll('section button')];buttons[0].getBoundingClientRect=()=>({x:0,y:0,width:100,height:50});buttons[1].getBoundingClientRect=()=>({x:110,y:0,width:100,height:50});nav=createMenuNavigation(root);nav.refresh();nav.handleKey(key('ArrowRight'));expect(document.activeElement).toBe(buttons[1]);nav.handleKey(key('ArrowRight'));expect(root.querySelector('.is-keyboard-current')).not.toBe(root.firstChild);
 });
 it('leaves text input and ranking scroll keys native and clears the latch on blur',()=>{
 root=document.createElement('div');root.innerHTML='<input type="text"><div class="pilot-ranking-table-scroll" tabindex="0"></div><button>go</button>';document.body.append(root);nav=createMenuNavigation(root);expect(nav.handleKey(key('ArrowDown',false,root.firstChild))).toBe(false);expect(nav.handleKey(key('ArrowDown',false,root.children[1]))).toBe(false);const click=vi.fn();root.lastChild.addEventListener('click',click);nav.handleKey(key('Space'));window.dispatchEvent(new Event('blur'));nav.handleKey(key('Space'));expect(click).toHaveBeenCalledTimes(2);
 });
});
