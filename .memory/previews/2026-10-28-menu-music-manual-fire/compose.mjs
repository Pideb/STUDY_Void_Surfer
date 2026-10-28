import {writeFile} from 'node:fs/promises';

const SR=22050,TAU=Math.PI*2;
const tracks=[
  {id:'orbit-run',name:'ORBIT RUN',bpm:112,description:'밝은 우주 모험 · 선명한 신스 멜로디와 가벼운 추진감',root:50,chords:[0,9,5,7,0,9,5,7],minor:[false,true,false,false],pan:.16,
    rhythm:[0,.75,1.5,2.5,3.25],hooks:[[74,78,81,78,76],[73,74,78,76,74],[71,74,79,78,76],[73,76,81,79,76],[74,78,81,86,81],[78,81,85,81,78],[79,78,76,74,71],[73,76,79,76,74]]},
  {id:'star-signal',name:'STAR SIGNAL',bpm:122,description:'우주 정거장 출격 · 경쾌한 전자 리듬과 반복되는 훅',root:45,chords:[0,5,8,7,0,5,8,7],minor:[true,true,false,false],pan:-.12,
    rhythm:[0,.5,1.25,2,2.75,3.5],hooks:[[81,84,88,86,84,83],[81,84,86,89,88,86],[84,88,91,88,86,84],[83,86,88,92,88,83],[81,84,88,93,91,88],[89,88,86,84,86,89],[88,91,96,91,88,84],[83,86,88,86,83,81]]},
  {id:'moon-glide',name:'MOON GLIDE',bpm:104,description:'은하 항해 · 반짝이는 벨 선율과 부드러운 바운스',root:52,chords:[0,7,9,5,0,7,9,5],minor:[false,false,true,false],pan:.3,
    rhythm:[0,.8,1.5,2.25,3.2],hooks:[[76,80,83,87,83],[75,78,83,80,78],[73,76,80,83,80],[73,76,81,80,76],[76,80,83,88,87],[83,87,90,87,83],[85,83,80,76,73],[76,80,81,80,76]]},
];
const frequency=midi=>440*2**((midi-69)/12);
function render(track){
  const beat=60/track.bpm,duration=32*beat+1.6,size=Math.ceil(duration*SR),left=new Float64Array(size),right=new Float64Array(size);
  let seed=23455;const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
  function event(start,duration,voice,gain,pan=0){
    const first=Math.floor(start*SR),length=Math.ceil(duration*SR),l=Math.sqrt((1-pan)/2),r=Math.sqrt((1+pan)/2);
    for(let i=0;i<length&&first+i<size;i++){
      if(first+i<0)continue;const t=i/SR,fade=Math.min(1,t/.008,(duration-t)/.035),value=voice(t)*Math.max(0,fade)*gain;
      left[first+i]+=value*l;right[first+i]+=value*r;
    }
  }
  const note=(midi,start,length,voice,gain,pan=0)=>{
    const f=frequency(midi);event(start,length,t=>{
      const p=TAU*f*t;
      if(voice==='pad')return (Math.sin(p)+.25*Math.sin(p*2.001)+.16*Math.sin(p*.998))*Math.min(1,t/.2)*Math.min(1,(length-t)/.24);
      if(voice==='bass')return (Math.sin(p)+.22*Math.sin(2*p)+.1*Math.sin(3*p))*Math.exp(-t*4);
      if(voice==='arp')return Math.sin(p+.4*Math.sin(p*2))*Math.exp(-t*9);
      const sustain=Math.exp(-t*(track.id==='moon-glide'?2.8:1.6));
      return (Math.sin(p+.18*Math.sin(p*2))+.22*Math.sin(2*p)+.08*Math.sin(3*p))*sustain;
    },gain,pan);
  };
  for(let bar=0;bar<8;bar++){
    const start=bar*4*beat,root=track.root+track.chords[bar],third=track.minor[bar%4]?3:4;
    for(const interval of [0,third,7,14])note(root+12+interval,start,4.3*beat,'pad',.055,(interval-7)/12);
    for(let b=0;b<4;b++){
      note(root-(b%2?0:12),start+b*beat,.7*beat,'bass',.28);
      event(start+b*beat,.22,t=>Math.sin(TAU*(44*t+7*(1-Math.exp(-t*25))))*Math.exp(-t*22),.35);
      if(b%2)event(start+b*beat,.15,t=>(noise()*.7+Math.sin(TAU*180*t)*.2)*Math.exp(-t*27),.13,-.15);
      for(let half=0;half<2;half++)event(start+(b+half*.5)*beat,.045,t=>noise()*Math.exp(-t*95),half?.07:.055,half?.45:-.45);
    }
    const arp=[0,7,12,third+12,7,14,12,7];
    for(let step=0;step<8;step++)note(root+24+arp[step],start+step*.5*beat,.32*beat,'arp',.042,Math.sin(step)*.6);
    track.hooks[bar].forEach((pitch,index)=>{
      const at=start+track.rhythm[index]*beat,next=track.rhythm[index+1]??4,length=Math.min(.85,(next-track.rhythm[index])*.86)*beat;
      note(pitch,at,length,'lead',.27,track.pan);
      note(pitch,at+beat*.75,length*.75,'lead',.065,-track.pan-.2);
      note(pitch,at+beat*1.5,length*.6,'lead',.025,track.pan+.2);
    });
  }
  // Quiet stereo ambience; shared fade protects audition start/end from clicks.
  let peak=0,square=0;for(let i=0;i<size;i++){peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));}
  const gain=.86/Math.max(peak,.001),bytes=Buffer.alloc(44+size*4);
  bytes.write('RIFF',0);bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(2,22);bytes.writeUInt32LE(SR,24);bytes.writeUInt32LE(SR*4,28);bytes.writeUInt16LE(4,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(size*4,40);
  for(let i=0;i<size;i++){const t=i/SR,fade=Math.max(0,Math.min(1,t/.04,(duration-t)/.35));for(let ch=0;ch<2;ch++){const value=(ch?right[i]:left[i])*gain*fade;square+=value*value;bytes.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value))*32767),44+(i*2+ch)*2);}}
  return{bytes,metadata:{...track,durationSeconds:duration,peak:.86,rms:Math.sqrt(square/(size*2)),file:track.id+'.wav'}};
}
const metadata=[];
for(const track of tracks){const result=render(track);await writeFile(new URL(result.metadata.file,import.meta.url),result.bytes);metadata.push(result.metadata);console.log(track.id+': '+result.metadata.durationSeconds.toFixed(2)+'s / '+track.bpm+'BPM / RMS '+result.metadata.rms.toFixed(3));}
await writeFile(new URL('samples.json',import.meta.url),JSON.stringify(metadata,null,2)+'\n');
