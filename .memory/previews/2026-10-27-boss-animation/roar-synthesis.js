/* Original, deterministic preview sounds; no borrowed recordings. */
(() => {
  'use strict';
  const profiles = [
    { id:'crystal-gates', name:'수정', description:'수정판이 떨리며 퍼지는 유리 공명음', seed:113 },
    { id:'industrial-void', name:'산업', description:'기어 회전 · 금속 진동 · 유압 배출', seed:227 },
    { id:'signal-monoliths', name:'신호', description:'순차 전자 펄스 · 무선 신호 간섭음', seed:331 },
    { id:'gravity-well', name:'중력', description:'공간이 안으로 빨려 드는 저음과 회전 공명', seed:449 },
    { id:'abyssal-beast', name:'심해', description:'거친 숨과 목울림이 섞인 생물 포효', seed:557 },
    { id:'solar-forge', name:'태양', description:'과열되는 코어 · 점화 · 고열 분출', seed:661 },
  ];
  const duration = .8;
  const clamp = (x) => Math.max(0, Math.min(1,x));
  function synthesize(id, sampleRate = 44100) {
    const index = profiles.findIndex(p=>p.id===id);
    if(index<0)throw new Error('Unknown boss roar: '+id);
    if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw new Error('Invalid sample rate');
    const data=new Float32Array(Math.round(sampleRate*duration));
    const phases=new Float64Array(16);
    let seed=profiles[index].seed,lo=0,mid=0,hi=0;
    const alpha=(hz)=>1-Math.exp(-2*Math.PI*hz/sampleRate);
    const a80=alpha(80),a650=alpha(650),a2500=alpha(2500);
    const tone=(slot,hz)=>{phases[slot]+=2*Math.PI*hz/sampleRate;return Math.sin(phases[slot]);};
    for(let i=0;i<data.length;i++){
      const t=i/sampleRate,u=t/duration;
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const white=seed/2147483648-1;
      lo+=a80*(white-lo);mid+=a650*(white-mid);hi+=a2500*(white-hi);
      const band=hi-mid, bodyNoise=mid-lo;
      const edge=Math.sin(clamp(t/.012)*Math.PI/2)*Math.sin(clamp((duration-t)/.13)*Math.PI/2);
      let v=0;
      if(index===0){
        // Inharmonic struck-glass modes rather than a low generic growl.
        const base=570-85*u, shimmer=.84+.16*Math.sin(2*Math.PI*17*t);
        const bell=tone(0,base)*.42+tone(1,base*1.414)*.24+tone(2,base*2.09)*.12+tone(3,base*2.71)*.07;
        const strike=Math.exp(-t*27)*(band*.75+tone(4,2310)*.14);
        v=bell*(.25+.75*Math.exp(-t*3.2))*shimmer+strike+tone(5,142)*.09;
      }else if(index===1){
        const gear=68+44*Math.sin(Math.PI*u),rattle=Math.max(0,Math.cos(2*Math.PI*18*t))**8;
        const clank=[.025,.22,.43].reduce((sum,at)=>sum+(t>=at?Math.exp(-(t-at)*48):0),0);
        v=tone(0,gear)*.30+tone(1,gear*2.03)*.19+tone(2,385+70*u)*.12;
        v+=bodyNoise*1.3+band*(.30+rattle*.8)+clank*(tone(3,740)*.28+band*1.1);
      }else if(index===2){
        const step=Math.floor(t/.16),local=t% .16;
        const hz=[980,730,1170,620,440][Math.min(4,step)]*(1-.18*local/.16);
        const pulse=Math.sin(Math.PI*clamp(local/.14))**.7;
        v=(tone(0,hz)*.40+tone(1,hz*1.5)*.13)*pulse;
        v+=tone(2,212)*.09+band*(Math.sin(2*Math.PI*41*t)> .5?.28:.045);
      }else if(index===3){
        const f=98-43*u,rotation=.7+.3*Math.sin(2*Math.PI*(3*t+2*t*t));
        v=tone(0,f)*.40+tone(1,f*2)*.22+tone(2,f*3.01)*.13;
        v+=tone(3,320-140*u+20*Math.sin(2*Math.PI*6*t))*.11+bodyNoise*1.5*rotation;
        v*=.7+.3*Math.sin(Math.PI*u);
      }else if(index===4){
        const throat=101-30*u+7*Math.sin(2*Math.PI*8*t),rough=.65+.35*Math.abs(Math.sin(2*Math.PI*23*t));
        const voiced=tone(0,throat)*.36+tone(1,throat*2.02)*.19+tone(2,throat*3.07)*.15;
        const formants=tone(3,510+55*Math.sin(Math.PI*u))*.12+tone(4,920-170*u)*.06;
        v=(voiced+formants+bodyNoise*1.8+band*.45)*rough*(.4+.6*Math.sin(Math.PI*u)**.5);
      }else{
        const ignition=Math.exp(-Math.max(0,t-.08)*13)*clamp(t/.08);
        const heat=clamp(t/.20)*(1-.35*u);
        const crackle=Math.max(0,white-.70)*7;
        v=tone(0,85+88*clamp(t/.28))*.30+tone(1,195+310*u)*.12;
        v+=bodyNoise*(.7+ignition)+band*(.8*heat+.8*ignition)+crackle*heat*.17;
        v+=tone(2,870+340*u)*.06*heat;
      }
      data[i]=Math.tanh(v*1.3)*edge;
    }
    // Short material-specific reflections remain inside the fixed .8s wind-up.
    const dry=data.slice(), delays=index===0?[.045,.082]:index===2?[.053,.106]:[.032,.068];
    for(let j=0;j<delays.length;j++){
      const shift=Math.round(delays[j]*sampleRate),gain=[.16,.075][j];
      for(let i=shift;i<data.length;i++)data[i]+=dry[i-shift]*gain;
    }
    let peak=0;for(const n of data)peak=Math.max(peak,Math.abs(n));
    for(let i=0;i<data.length;i++){
      // Consistent peak, with silence at both endpoints and no truncated echo.
      const fade=Math.min(1,i/(sampleRate*.004),(data.length-1-i)/(sampleRate*.035));
      data[i]=data[i]/Math.max(peak,.001)*.72*Math.max(0,fade);
    }
    return data;
  }
  function wavBytes(data,sampleRate=44100){
    const bytes=new Uint8Array(44+data.length*2),v=new DataView(bytes.buffer);
    const text=(at,s)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i);};
    text(0,'RIFF');v.setUint32(4,bytes.length-8,true);text(8,'WAVE');text(12,'fmt ');
    v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);
    v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,data.length*2,true);
    for(let i=0;i<data.length;i++)v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,data[i]))*32767),true);
    return bytes;
  }
  globalThis.BossRoarSynth={profiles,duration,synthesize,wavBytes};
})();
