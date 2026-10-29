// Deterministic synthesis of the approved broad three-pulse siren.
export const BOSS_ENTRY_DURATION_SECONDS=2.4;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

function synthesizeSiren(variant='broad',duration=1.5,sampleRate=24000){
  const count=Math.round(sampleRate*duration);
  const dry=[new Float64Array(count),new Float64Array(count)],out=[new Float32Array(count),new Float32Array(count)];
  let phase=0,lowPhase=0,seed=5713,air=0;
  for(let i=0;i<count;i++){
    const t=i/sampleRate,p=t/duration;
    const rise=smooth(p/.42),fall=smooth((p-.44)/.56);
    const f=variant==='broad'?178+330*rise-370*fall:214+405*rise-425*fall;
    phase+=Math.PI*2*Math.max(90,f)/sampleRate;lowPhase+=Math.PI*f/sampleRate;
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;air=air*.94+((seed/4294967296)*2-1)*.06;
    const attack=smooth(t/.09),release=smooth((duration-t)/.22),env=attack*release;
    const harmonics=variant==='broad'?[1,.31,.22,.095]:[1,.46,.29,.16];
    for(let channel=0;channel<2;channel++){
      const drift=(channel?1:-1)*.012*Math.sin(Math.PI*p),q=phase+drift*phase*.05;
      const metal=harmonics[0]*Math.sin(q)+harmonics[1]*Math.sin(q*2)+harmonics[2]*Math.sin(q*3)+harmonics[3]*Math.sin(q*5);
      const body=.54*Math.sin(lowPhase+(channel?.08:-.08));
      const saturation=Math.tanh((metal+body)*1.14);
      dry[channel][i]=(saturation*.83+air*.07)*(1+.025*Math.sin(t*2*Math.PI*7))*env;
    }
  }
  let peak=0,energy=0;
  for(let channel=0;channel<2;channel++)for(let i=0;i<count;i++){
    const echo=(delay,gain,c)=>i>=delay?dry[c][i-delay]*gain:0;
    const tail=smooth((count-1-i)/(sampleRate*.12));
    const value=(dry[channel][i]+echo(Math.round(sampleRate*.047),.24,1-channel)+echo(Math.round(sampleRate*.093),.13,channel)+echo(Math.round(sampleRate*.151),.075,1-channel))*tail;
    out[channel][i]=value;peak=Math.max(peak,Math.abs(value));energy+=value*value;
  }
  const rms=Math.sqrt(energy/(count*2)),gain=Math.min(.72/Math.max(peak,.001),.23/Math.max(rms,.001));
  for(const channel of out)for(let i=0;i<count;i++)channel[i]*=gain;
  return {channels:out,sampleRate,durationSeconds:duration,peak:peak*gain,rms:rms*gain};
}

export function synthesizeBossEntrySiren(sampleRate=24000){
  sampleRate=Number.isFinite(sampleRate)&&sampleRate>=8000&&sampleRate<=192000?Math.round(sampleRate):24000;
  const pulseSeconds=.7,gapSeconds=.15,onsets=[0,.85,1.7],durationSeconds=BOSS_ENTRY_DURATION_SECONDS;
  const pulse=synthesizeSiren('broad',pulseSeconds,sampleRate),count=Math.round(sampleRate*durationSeconds);
  const channels=[new Float32Array(count),new Float32Array(count)];
  for(const onset of onsets){const offset=Math.round(sampleRate*onset);
    for(let channel=0;channel<2;channel++)channels[channel].set(pulse.channels[channel].subarray(0,count-offset),offset);
  }
  let peak=0,energy=0;
  for(const channel of channels)for(const sample of channel){peak=Math.max(peak,Math.abs(sample));energy+=sample*sample;}
  return {channels,sampleRate,durationSeconds,pulseSeconds,gapSeconds,onsets,peak,rms:Math.sqrt(energy/(count*2))};
}

