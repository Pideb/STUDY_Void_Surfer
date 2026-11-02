import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(line=>line.includes('=')&&!line.startsWith('#')).map(line=>{const at=line.indexOf('=');return [line.slice(0,at).trim(),line.slice(at+1).trim().replace(/^['"]|['"]$/g,'')];}));
const probes=[
 ['start_play_session',{p_run_id:null,p_write_nonce:null,p_guest_id:null,p_client_version:'release-preflight',p_aircraft_id:'default',p_is_admin_test:false}],
 ['finish_play_session',{p_run_id:null,p_write_nonce:null,p_duration_ms:null,p_outcome:null}],
 ['submit_score',{p_score:0,p_display_name:'release-preflight',p_aircraft_id:'default',p_duration_ms:0}],
];
const results=[];
for(const [rpc,args]of probes){
 const response=await fetch(env.VITE_SUPABASE_URL+'/rest/v1/rpc/'+rpc,{method:'POST',headers:{apikey:env.VITE_SUPABASE_ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify(args)});
 const body=await response.json();results.push({rpc,status:response.status,code:body.code,message:body.message});
}
const report={checkedAtUtc:new Date().toISOString(),writesPerformed:false,ready:results[0].code==='22023'&&results[1].code==='22023'&&results[2].code==='42501',results};
fs.writeFileSync('.memory/validation/2026-11-02-v02-production-release/db-preflight.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
