import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadEnv} from 'vite';
const dir='.memory/validation/2026-11-03-startup-update-dialog';
const env=loadEnv('development',process.cwd(),'VITE_');
const url=env.VITE_SUPABASE_URL,key=env.VITE_SUPABASE_ANON_KEY;
if(!url||!key)throw Error('Public Supabase environment configuration is missing.');
const queries=[
 ['overall','rpc/get_public_leaderboard',{p_limit:50,p_offset:0},false],
 ...['default','aegis','velocity'].map(id=>[id,'rpc/get_aircraft_leaderboard',{p_aircraft_id:id,p_limit:50,p_offset:0},false]),
 ['own-record-denied','rpc/get_player_aircraft_record',{p_aircraft_id:'default'},true],
 ['private-craft-denied','aircraft_scores',{select:'duration_ms',limit:1},true],
 ['private-history-denied','play_sessions',{select:'final_score',limit:1},true],
];
const results=await Promise.allSettled(queries.map(async([name,route,params,denied])=>{
 const target=new URL('/rest/v1/'+route,url);for(const[k,v]of Object.entries(params))target.searchParams.set(k,String(v));
 const response=await fetch(target,{method:'GET',headers:{apikey:key,Accept:'application/json'},signal:AbortSignal.timeout(15000)});
 const data=await response.json();return{name,status:response.status,data,denied};
}));
const report={checkedAt:new Date().toISOString(),readOnly:true,authPrincipal:'anonymous public client',checks:[],publicRpcVerified:false,authenticatedWritesVerified:false,privateScoreColumnVerified:false,remoteMutation:false,limitations:['No user token/admin connection: authenticated best-score updates, private final_score storage and exact legacy preservation were not inspected.','Public record matching is observational, without private user IDs.']};
try{
 for(let i=0;i<results.length;i++){
  const r=results[i];if(r.status==='rejected'){report.checks.push({name:queries[i][0],networkFailure:true});continue;}
  const{name,status,data,denied}=r.value;
  report.checks.push({name,status,...(denied?{errorCode:data?.code??null}:{rowCount:Array.isArray(data)?data.length:null})});
 }
 for(const r of results){
  assert.equal(r.status,'fulfilled','Remote read failed');
  const{name,status,data,denied}=r.value;
  if(denied){assert.ok([401,403].includes(status),name+' unexpectedly accessible');assert.equal(data?.code,'42501',name+' was not an explicit permission denial');continue;}
  assert.equal(status,200,name+' did not return200');assert.ok(Array.isArray(data));
  for(const row of data){assert.ok(Number(row.rank)>0);assert.ok(Number.isInteger(row.best_score)&&row.best_score>=0);assert.ok(typeof row.display_name==='string');assert.ok(typeof row.achieved_at==='string');assert.ok(!('duration_ms'in row));assert.ok(!('user_id'in row));if(name!=='overall')assert.equal(row.aircraft_id,name);}
 }
 const byName=Object.fromEntries(results.map(r=>[r.value.name,r.value.data]));
 const overall=byName.overall;
 report.observedOverallRows=overall.length;
 report.observedBestMatches=overall.filter(row=>byName[row.aircraft_id]?.some(craft=>craft.display_name===row.display_name&&craft.best_score===row.best_score&&craft.achieved_at===row.achieved_at)).length;
 report.publicRpcVerified=true;
}catch(error){report.validationError=String(error.message);process.exitCode=1;}
fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/remote-sql.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
