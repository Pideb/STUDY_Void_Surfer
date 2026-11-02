import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.PGLITE_MODULE??path.join(process.env.TEMP,'void-surfer-pg-validation/node_modules/@electric-sql/pglite/dist/index.js');
const {PGlite}=await import(pathToFileURL(modulePath));
const db=new PGlite(),applied=[],tests=[];
try{
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;$$;
 grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 for(const name of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort()){
   await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8'));applied.push(name);
 }
 for(const name of ['private_play_sessions.sql','private_ranking_duration.sql']){
   await db.exec(fs.readFileSync('supabase/tests/'+name,'utf8'));tests.push(name);
 }
 const result={engine:(await db.query('select version()')).rows[0].version,applied,tests,localRoleAssertionsPassed:true,remoteApplied:false,concurrencyVerified:false,limitations:['Supabase auth.uid fixture replaces JWT verification.','PGlite has one connection; independent concurrent requests and PostgREST embedding require remote verification.']};
 fs.writeFileSync('.memory/validation/2026-11-02-v02-feedback-release/sql-local.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({migrations:applied.length,roleTestFiles:tests.length,remoteApplied:false}));
}catch(error){console.error(JSON.stringify({code:error.code,message:error.message,detail:error.detail,applied,tests}));process.exitCode=1;}finally{await db.close();}
