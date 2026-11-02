export function detectMobile() {
  return Boolean(navigator.userAgentData?.mobile||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||((navigator.maxTouchPoints??0)>0&&matchMedia('(pointer:coarse)').matches));
}
export function createOrientationController({onChange=()=>{},isMobile=detectMobile,getScreen=()=>null}={}) {
  let state={mobile:false,portrait:false,resumePending:false,priorScreen:null},destroyed=false;
  function refresh(){
    if(destroyed)return;
    const mobile=Boolean(isMobile()),portrait=mobile&&innerHeight>innerWidth;
    if(portrait&&!state.portrait)state={mobile,portrait,resumePending:false,priorScreen:getScreen()};
    else if(!portrait&&state.portrait)state={...state,mobile,portrait,resumePending:state.priorScreen==='playing'};
    else state={...state,mobile,portrait};
    onChange({...state});
  }
  window.addEventListener('resize',refresh);window.addEventListener('orientationchange',refresh);window.visualViewport?.addEventListener('resize',refresh);refresh();
  return {getState:()=>({...state}),confirmResume(){if(state.portrait||!state.resumePending)return;state={...state,resumePending:false,priorScreen:null};onChange({...state});},destroy(){destroyed=true;window.removeEventListener('resize',refresh);window.removeEventListener('orientationchange',refresh);window.visualViewport?.removeEventListener('resize',refresh);}};
}
