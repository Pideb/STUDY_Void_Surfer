import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.PGLITE_MODULE??path.join(process.env.TEMP,'void-surfer-pg-validation/node_modules/@electric-sql/pglite/dist/index.js');
const {PGlite}=await import(pathToFileURL(modulePath));
const db=new PGlite(),applied=[],tests=[];
const user='fc000000-0000-4000-8000-000000000001';
try{
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;$$;
 grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 for(const name of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort()){
  if(name==='202611030001_aircraft_rankings_history.sql'){
   await db.exec(`insert into auth.users values('${user}','legacy@example.invalid');select set_config('request.jwt.claim.sub','${user}',false);
    select public.submit_score(123,'Legacy','aegis',4567);
    select public.start_play_session('fc000000-0000-4000-8000-000000000002','fc000000-0000-4000-8000-000000000003',null,'0.2b','aegis',false);
    select public.finish_play_session('fc000000-0000-4000-8000-000000000002','fc000000-0000-4000-8000-000000000003',4567,'dead');`);
   var before=(await db.query('select * from public.player_scores')).rows;
  }
  await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8'));applied.push(name);
 }
 assert.deepEqual((await db.query('select * from public.player_scores')).rows,before);
 assert.deepEqual((await db.query('select best_score,aircraft_id,duration_ms from public.aircraft_scores')).rows,[{best_score:123,aircraft_id:'aegis',duration_ms:4567}]);
 assert.equal((await db.query('select final_score from public.play_sessions')).rows[0].final_score,null);
 for(const name of ['private_play_sessions.sql','private_ranking_duration.sql','aircraft_rankings_history.sql']){
  await db.exec(fs.readFileSync('supabase/tests/'+name,'utf8'));tests.push(name);
 }
 assert.equal((await db.query('select count(*)::integer n from public.player_scores')).rows[0].n,1);
 const report={applied,tests,legacyPreserved:true,rolesAndRollbackPassed:true,remoteApplied:false,concurrencyVerified:false,limitation:'Single-connection PGlite; auth.uid fixture does not verify JWT/PostgREST or independent concurrent connections.'};
 fs.writeFileSync('.memory/validation/2026-11-03-aircraft-rankings/sql.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){console.error({code:error.code,message:error.message,detail:error.detail,applied,tests});process.exitCode=1;}finally{await db.close();}
