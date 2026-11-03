export const PLAY_OUTBOX_KEY='void-surfer.analytics.outbox.v1';
const MAX_AGE=30*24*60*60*1000,MAX_RUNS=100;
const uuid=value=>typeof value==='string'&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value);
function startData(r){
  if(!r||!uuid(r.runId)||!uuid(r.writeNonce)||!['account','guest'].includes(r.actorKind)||!['default','aegis','velocity'].includes(r.aircraftId)||typeof r.version!=='string'||r.version.length>32)return null;
  if(r.actorKind==='account'?!uuid(r.ownerUserId):!uuid(r.guestId))return null;
  return {runId:r.runId,writeNonce:r.writeNonce,ownerUserId:r.actorKind==='account'?r.ownerUserId:null,actorKind:r.actorKind,guestId:r.actorKind==='guest'?r.guestId:null,version:r.version,aircraftId:r.aircraftId,isAdminTest:Boolean(r.isAdminTest)};
}
function endData(r){
  const finalScore=r?.finalScore??null;
  if(finalScore!==null&&(!Number.isInteger(finalScore)||finalScore<0||finalScore>2147483647))return null;
  return r&&uuid(r.runId)&&uuid(r.writeNonce)&&Number.isInteger(r.durationMs)&&r.durationMs>=0&&r.durationMs<=604800000&&['dead','abandoned'].includes(r.outcome)?{runId:r.runId,writeNonce:r.writeNonce,durationMs:r.durationMs,outcome:r.outcome,finalScore}:null;
}
export function createPlayRecordOutbox({service,storage=null,now=Date.now,diagnostic=()=>{}}={}) {
  const entries=new Map();let destroyed=false,flushing=null,timer=null;
  function persist(){try{storage?.setItem(PLAY_OUTBOX_KEY,JSON.stringify({schemaVersion:1,entries:[...entries.values()]}));}catch{diagnostic('STORAGE_UNAVAILABLE');}}
  function prune(){for(const [id,e]of entries)if(now()-e.createdAt>MAX_AGE||e.createdAt>now()+60000){entries.delete(id);diagnostic('OUTBOX_EXPIRED');}while(entries.size>MAX_RUNS){entries.delete(entries.keys().next().value);diagnostic('OUTBOX_CAP');}}
  try{const saved=JSON.parse(storage?.getItem(PLAY_OUTBOX_KEY)??'null');if(saved?.schemaVersion===1&&Array.isArray(saved.entries))for(const e of saved.entries){const start=startData(e.start),end=endData(e.end);if(start&&Number.isFinite(e.createdAt))entries.set(start.runId,{start,end:end?.runId===start.runId&&end?.writeNonce===start.writeNonce?end:null,createdAt:e.createdAt,startAck:e.startAck===true,attempts:Math.max(0,Math.min(4,Number(e.attempts)||0)),nextAt:Number(e.nextAt)||0,blocked:e.blocked===true});}}catch{diagnostic('OUTBOX_INVALID');}
  prune();
  function schedule(){clearTimeout(timer);if(destroyed)return;const next=[...entries.values()].filter(e=>!e.blocked&&e.attempts>0&&e.attempts<=3).map(e=>e.nextAt);if(next.length)timer=setTimeout(()=>void flush(false),Math.max(0,Math.min(...next)-now()));}
  function flush(force=true){
    if(destroyed)return Promise.resolve();if(flushing)return flushing;
    flushing=(async()=>{prune();for(const [id,e]of entries){
      if(destroyed)break;if(e.blocked||(!force&&e.nextAt>now()))continue;
      let result;
      try{
        if(!e.startAck){result=await service.start(e.start);if(result?.ok){e.startAck=true;e.attempts=0;persist();}}
        if(e.startAck&&e.end){result=await service.finish(e.end);if(result?.ok){entries.delete(id);persist();continue;}}
      }catch{result={ok:false,retryable:true,errorCode:'NETWORK_ERROR'};}
      if(result&&!result.ok){e.attempts++;e.blocked=!result.retryable;e.nextAt=now()+[1000,5000,30000][Math.min(2,e.attempts-1)];diagnostic(result.errorCode??'DELIVERY_FAILED');persist();}
    }})().finally(()=>{flushing=null;schedule();});return flushing;
  }
  const online=()=>void flush(true);globalThis.addEventListener?.('online',online);
  return {
    start(record){const start=startData(record);if(!start){diagnostic('INVALID_RECORD');return;}if(!entries.has(start.runId))entries.set(start.runId,{start,end:null,startAck:false,createdAt:now(),attempts:0,nextAt:0,blocked:false});prune();persist();void flush();},
    finish(record){const end=endData(record),e=end&&entries.get(end.runId);if(!e||e.start.writeNonce!==end.writeNonce)return;if(!e.end)e.end=end;persist();void flush();},
    flush,getPendingCount:()=>entries.size,
    destroy(){destroyed=true;clearTimeout(timer);globalThis.removeEventListener?.('online',online);persist();},
  };
}
