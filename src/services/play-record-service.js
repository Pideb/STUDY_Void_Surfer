const resultFor=error=>{
  if(!error)return {ok:true,retryable:false};
  const code=String(error.code??'NETWORK_ERROR');
  return {ok:false,retryable:!['42501','22023','23514','23502','PGRST202','42883','CONFIG_MISSING'].includes(code),errorCode:code};
};
export function createPlayRecordService(client,{anonymousClient=null,timeoutMs=10000}={}) {
  async function call(target,name,params){
    if(!target?.rpc)return{ok:false,retryable:false,errorCode:'CONFIG_MISSING'};
    const controller=new AbortController();let timer;
    try{
      let request=target.rpc(name,params);if(request?.abortSignal)request=request.abortSignal(controller.signal);
      const response=await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Object.assign(new Error('Timeout'),{code:'TIMEOUT'}));},timeoutMs);})]);
      return resultFor(response?.error);
    }catch(error){return resultFor(error);}finally{clearTimeout(timer);}
  }
  return {
    async start(record){
      let target=client;
      if(record.actorKind==='guest')target=anonymousClient??client;
      try{
        const {data,error}=await target?.auth?.getSession?.()??{};
        if(error)return resultFor(error);
        const owner=data?.session?.user?.id??null;
        if(record.actorKind==='account'?owner!==record.ownerUserId:owner!==null)return{ok:false,retryable:true,errorCode:'OWNER_MISMATCH'};
      }catch(error){return resultFor(error);}
      return call(target,'start_play_session',{p_run_id:record.runId,p_write_nonce:record.writeNonce,p_guest_id:record.guestId,p_client_version:record.version,p_aircraft_id:record.aircraftId,p_is_admin_test:record.isAdminTest});
    },
    finish(record){
      const score=record.finalScore??null;
      if(score!==null&&(!Number.isInteger(score)||score<0||score>2147483647))return Promise.resolve({ok:false,retryable:false,errorCode:'22023'});
      return call(anonymousClient??client,'finish_play_session',{p_run_id:record.runId,p_write_nonce:record.writeNonce,p_duration_ms:record.durationMs,p_outcome:record.outcome,...(score===null?{}:{p_final_score:score})});
    },
  };
}
