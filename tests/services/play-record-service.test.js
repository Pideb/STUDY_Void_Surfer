import {describe,it,expect,vi,afterEach} from 'vitest';
import {createPlayRecordService} from '../../src/services/play-record-service.js';
const id='11111111-1111-4111-8111-111111111111';
const record={runId:id,writeNonce:id,guestId:id,ownerUserId:null,actorKind:'guest',version:'0.01-b',aircraftId:'aegis',isAdminTest:false};
afterEach(()=>vi.useRealTimers());
describe('private records transport',()=>{
 it('uses a separate anonymous principal for guest records even after sign-in',async()=>{const client={rpc:vi.fn(),auth:{getSession:async()=>({data:{session:{user:{id}}}})}},anonymousClient={rpc:vi.fn(async()=>({error:null}))};const s=createPlayRecordService(client,{anonymousClient});expect((await s.start(record)).ok).toBe(true);expect(client.rpc).not.toHaveBeenCalled();expect(anonymousClient.rpc).toHaveBeenCalledWith('start_play_session',{p_run_id:id,p_write_nonce:id,p_guest_id:id,p_client_version:'0.01-b',p_aircraft_id:'aegis',p_is_admin_test:false});});
 it('does not resend account starts under a different signed-in owner',async()=>{const client={rpc:vi.fn(),auth:{getSession:async()=>({data:{session:{user:{id:'other'}}}})}};expect(await createPlayRecordService(client).start({...record,actorKind:'account',ownerUserId:id,guestId:null})).toMatchObject({ok:false,errorCode:'OWNER_MISMATCH'});expect(client.rpc).not.toHaveBeenCalled();});
 it('sends only the nonce-bound end payload, with schema errors non-retryable',async()=>{const client={rpc:vi.fn(async()=>({error:{code:'PGRST202'}}))};const result=await createPlayRecordService(client).finish({runId:id,writeNonce:id,durationMs:123,outcome:'dead',email:'never-send'});expect(result).toEqual({ok:false,retryable:false,errorCode:'PGRST202'});expect(client.rpc.mock.calls[0][1]).not.toHaveProperty('email');});
 it('bounds hung writes with a retryable timeout',async()=>{vi.useFakeTimers();const pending=createPlayRecordService({rpc:()=>new Promise(()=>{})},{timeoutMs:1000}).finish({runId:id,writeNonce:id,durationMs:1,outcome:'dead'});await vi.advanceTimersByTimeAsync(1000);expect(await pending).toMatchObject({ok:false,retryable:true,errorCode:'TIMEOUT'});});
});
