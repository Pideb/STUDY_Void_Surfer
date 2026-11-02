export function createMenuNavigation(root,{activate=element=>element.click()}={}) {
  let activeItemId=null,screenKey=null,lastInput='keyboard',spaceDown=false,destroyed=false;
  const items=()=>{
    const scope=root.querySelector('[role="dialog"]')??root;
    return [...scope.querySelectorAll('button,a[href],input[type="checkbox"]')].filter(e=>!e.disabled&&!e.closest('[hidden],[inert]')&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden');
  };
  const idFor=(e,index)=>e.dataset.menuItemId??`${e.tagName}:${e.getAttribute('aria-label')??e.textContent}:${index}`;
  function refresh(){
    if(destroyed)return [];
    const key=root.dataset.screen??'';
    if(screenKey!==key){screenKey=key;activeItemId=null;lastInput='keyboard';}
    const list=items();list.forEach((e,i)=>{e.dataset.menuItemId=idFor(e,i);});
    if(!list.some(e=>e.dataset.menuItemId===activeItemId))activeItemId=list[0]?.dataset.menuItemId??null;
    for(const e of root.querySelectorAll('.is-keyboard-current'))if(lastInput!=='keyboard'||e.dataset.menuItemId!==activeItemId)e.classList.remove('is-keyboard-current');
    if(lastInput==='keyboard')list.find(e=>e.dataset.menuItemId===activeItemId)?.classList.add('is-keyboard-current');
    return list;
  }
  function handleKey(event){
    if(destroyed||event.altKey||event.ctrlKey||event.metaKey)return false;
    if(event.target?.closest?.('textarea,select,input:not([type="checkbox"]),[contenteditable="true"],.pilot-ranking-table-scroll'))return false;
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code))return false;
    const list=refresh();if(!list.length)return false;event.preventDefault();
    if(event.repeat)return true;
    const focused=list.includes(document.activeElement)?document.activeElement:null;
    let current=focused??list.find(e=>e.dataset.menuItemId===activeItemId)??list[0];lastInput='keyboard';
    if(event.code==='Space'){
      if(spaceDown)return true;spaceDown=true;activeItemId=current.dataset.menuItemId;activate(current);return true;
    }
    const horizontal=['ArrowLeft','ArrowRight'].includes(event.code),direction=['ArrowLeft','ArrowUp'].includes(event.code)?-1:1;
    const r=current.getBoundingClientRect(),cx=r.x+r.width/2,cy=r.y+r.height/2;
    const candidates=list.filter(e=>e!==current).map(e=>{const b=e.getBoundingClientRect(),dx=b.x+b.width/2-cx,dy=b.y+b.height/2-cy;return{e,along:(horizontal?dx:dy)*direction,cross:Math.abs(horizontal?dy:dx)};}).filter(v=>v.along>2).sort((a,b)=>(a.along+a.cross*2)-(b.along+b.cross*2));
    if(candidates.length)current=candidates[0].e;
    else current=list[(list.indexOf(current)+direction+list.length)%list.length];
    activeItemId=current.dataset.menuItemId;refresh();current.focus({preventScroll:true});return true;
  }
  const pointer=event=>{const e=event.target?.closest?.('button,a[href],input[type="checkbox"]');if(e&&items().includes(e)){lastInput='pointer';activeItemId=e.dataset.menuItemId??null;refresh();}};
  const up=event=>{if(event.code==='Space'&&spaceDown){event.preventDefault();spaceDown=false;}};
  const blur=()=>{spaceDown=false;};
  root.addEventListener('pointerover',pointer);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
  return {refresh,handleKey,reset(){activeItemId=null;screenKey=null;spaceDown=false;},destroy(){destroyed=true;root.removeEventListener('pointerover',pointer);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);}};
}
