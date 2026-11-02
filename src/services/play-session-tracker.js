import {createPlayRecordOutbox} from './play-record-outbox.js';
import {createRandomUUID} from '../lib/random-uuid.js';
export const GUEST_ANALYTICS_ID_KEY='void-surfer.analytics.guest-id.v1';
let volatileGuestId=null;
const validUUID=s=>typeof s==='string'&&/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(s);
export function createPlaySessionTracker({now=()=>performance.now(),service,storage=null,wallNow=Date.now,diagnostic=()=>{},randomUUID=createRandomUUID}={}){
  const report=code=>{try{diagnostic(code);}catch{/* Diagnostics must not stop flight. */}};
  const outbox=createPlayRecordOutbox({service,storage,now:wallNow,diagnostic:report}),reasons=new Set(),finished=new Map();let active=null,destroyed=false;
  function guestId(){try{const saved=storage?.getItem(GUEST_ANALYTICS_ID_KEY);if(validUUID(saved))return saved;}catch{}const id=volatileGuestId??=randomUUID();try{storage?.setItem(GUEST_ANALYTICS_ID_KEY,id);}catch{}return id;}
  function accumulated(){return active.elapsedMs+(reasons.size?0:Math.max(0,now()-active.resumedAt));}
  function finish(outcome){if(!active||!['dead','abandoned'].includes(outcome))return null;if(active.end)return active.end;const end=Object.freeze({runId:active.start?.runId??null,writeNonce:active.start?.writeNonce??null,durationMs:Math.max(0,Math.min(604800000,Math.floor(accumulated()))),outcome});active.end=end;if(active.start){finished.set(end.runId,end);while(finished.size>100)finished.delete(finished.keys().next().value);try{outbox.finish(end);}catch{report('PLAY_RECORD_FINISH_UNAVAILABLE');}}return end;}
  return {
    begin(data){
      if(destroyed)return null;
      if(active&&!active.end)finish('abandoned');
      reasons.clear();active={start:null,resumedAt:now(),elapsedMs:0,end:null};
      const account=Boolean(data.ownerUserId);let start;
      try{
        start=Object.freeze({runId:randomUUID(),writeNonce:randomUUID(),ownerUserId:account?data.ownerUserId:null,actorKind:account?'account':'guest',guestId:account?null:guestId(),version:data.version,aircraftId:data.aircraftId,isAdminTest:Boolean(data.isAdminTest)});
        if(!validUUID(start.runId)||!validUUID(start.writeNonce)||(!account&&!validUUID(start.guestId)))throw Error('Invalid random identity');
      }catch{report('PLAY_RECORD_ID_UNAVAILABLE');return null;}
      active.start=start;
      try{outbox.start(start);}catch{report('PLAY_RECORD_START_UNAVAILABLE');}
      return start.runId;
    },
    suspend(reason){if(!active||active.end||reasons.has(reason))return;if(!reasons.size)active.elapsedMs=accumulated();reasons.add(reason);},
    resume(reason){if(!reasons.delete(reason)||reasons.size||!active||active.end)return;active.resumedAt=now();},
    finish,getFinishedRun:runId=>finished.get(runId)??null,flush:outbox.flush,
    destroy(){if(destroyed)return;finish('abandoned');destroyed=true;outbox.destroy();},
  };
}
