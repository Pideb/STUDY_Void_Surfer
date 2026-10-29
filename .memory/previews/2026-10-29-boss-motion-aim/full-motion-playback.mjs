// Actual playback QA runs only on an explicitly requested local capture page.
if(new URLSearchParams(location.search).has('verify')){
const video=document.querySelector('video');video.loop=false;const samples=[];let frames=0,decoded=false;
const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const c=canvas.getContext('2d',{willReadFrequently:true});
const send=async(id,body)=>{const r=await fetch('/fullmotion/'+id+(new URLSearchParams(location.search).get('range')==='wide'?'-wide':''),{method:'POST',body});if(!r.ok)throw Error('Playback report failed');};
video.onerror=()=>send('error',JSON.stringify({error:video.error?.message||'Video decode error'}));
const ended=new Promise(resolve=>video.addEventListener('ended',resolve,{once:true}));
if(video.readyState<1)await new Promise(resolve=>video.addEventListener('loadedmetadata',resolve,{once:true}));
const metadata={duration:video.duration,width:video.videoWidth,height:video.videoHeight};
function tick(_now,frame){frames++;const time=frame.mediaTime;
if(samples.length<4&&time>=[.5,1.5,4.5,5.8][samples.length]){c.drawImage(video,0,0,960,540);const pixels=c.getImageData(740,30,215,470).data;let hash=2166136261;for(let i=0;i<pixels.length;i+=16)hash=Math.imul(hash^pixels[i],16777619)>>>0;samples.push({time,hash});
if(!decoded&&time>=1.5){decoded=true;canvas.toBlob(blob=>send('decoded',blob),'image/png');}}
if(!video.ended)video.requestVideoFrameCallback(tick);}
video.requestVideoFrameCallback(tick);await video.play();await ended;
await send('playback',JSON.stringify({...metadata,frames,lastTime:video.currentTime,samples,error:null}));document.title='PLAYBACK VERIFIED';
}
