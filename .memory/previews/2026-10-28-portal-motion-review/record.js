/* Optional local-only review-video export, never enabled in the normal preview. */
(() => {
  const params=new URLSearchParams(location.search);
  if(params.get('record')!=='1'&&params.get('poster')!=='1')return;
  const api=window.PortalPreview;
  const send=async(path,body)=>{
    const r=await fetch(path,{method:'POST',body});if(!r.ok)throw new Error('Local recording save failed: '+r.status);
  };
  async function capture(index){
    api.state.paused=true;api.state.to=index;api.state.from=index===0?1:0;
    document.getElementById('from').value=String(api.state.from);document.getElementById('to').value=String(index);
    await api.prepare();if(!api.state.ready)throw new Error('Assets not ready');
    const canvas=document.getElementById('scene'),stream=canvas.captureStream(30);
    const type=['video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
    if(!type)throw new Error('WebM recording unsupported');
    const chunks=[],recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:1600000});
    const stopped=new Promise((resolve,reject)=>{
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onerror=e=>reject(e.error||new Error('Recorder error'));
      recorder.onstop=()=>resolve(new Blob(chunks,{type:'video/webm'}));
    });
    api.state.speed=480;api.state.detail=false;api.state.time=0;api.state.loop=false;api.state.paused=false;api.draw();
    recorder.start(500);
    try{
      await new Promise((resolve,reject)=>{
        const began=performance.now();
        function check(){
          if(api.state.time>=api.timing().total){resolve();return;}
          if(performance.now()-began>20000){reject(new Error('Recording timed out'));return;}
          requestAnimationFrame(check);
        }requestAnimationFrame(check);
      });
      recorder.stop();const blob=await stopped;
      if(blob.size<2000)throw new Error('Empty capture');
      await send('/capture/'+api.stages[index][0],blob);
    }finally{
      if(recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(t=>t.stop());
    }
  }
  api.ready.then(async()=>{
    if(params.get('poster')==='1'){
      api.state.paused=true;
      for(let i=0;i<6;i++){
        api.state.to=i;api.state.from=i===0?1:0;await api.prepare();api.state.time=1.8;api.draw();
        const png=await new Promise(resolve=>document.getElementById('scene').toBlob(resolve,'image/png'));
        await send('/poster/'+api.stages[i][0],png);
      }
      document.title='Portal posters complete';return;
    }
    for(let i=0;i<6;i++)await capture(i);
    api.state.paused=true;
    for(let i=0;i<6;i++){
      api.state.to=i;api.state.from=i===0?1:0;await api.prepare();api.state.time=1.8;api.draw();
      const png=await new Promise(resolve=>document.getElementById('scene').toBlob(resolve,'image/png'));
      await send('/poster/'+api.stages[i][0],png);
    }
    await send('/capture-complete',JSON.stringify({status:'done',count:6,posters:6}));
    document.title='Portal recordings complete';
  }).catch(async(error)=>{
    document.getElementById('loading').hidden=false;document.getElementById('loading').textContent=error.message;
    try{await send('/capture-error',JSON.stringify({error:error.message}));}catch{}
  });
})();
