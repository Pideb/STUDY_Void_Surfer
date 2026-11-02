-- Execute as the database owner on a migrated test project. No permanent seed.
begin;
insert into auth.users(id,email) values('ac000000-0000-4000-8000-000000000001','schema-play-test@example.invalid');
set local role anon;
do $$ begin
  begin perform 1 from public.play_sessions;raise exception 'SELECT unexpectedly allowed';exception when insufficient_privilege then null;end;
  begin delete from public.play_sessions;raise exception 'DELETE unexpectedly allowed';exception when insufficient_privilege then null;end;
  begin update public.play_sessions set duration_ms=1;raise exception 'UPDATE unexpectedly allowed';exception when insufficient_privilege then null;end;
  begin insert into public.play_sessions(run_id) values(gen_random_uuid());raise exception 'INSERT unexpectedly allowed';exception when insufficient_privilege then null;end;
end $$;
select public.start_play_session('de000000-0000-4000-8000-000000000001','ab000000-0000-4000-8000-000000000001','bc000000-0000-4000-8000-000000000001','schema-test-v0.2','default',true);
select public.start_play_session('de000000-0000-4000-8000-000000000001','ab000000-0000-4000-8000-000000000001','bc000000-0000-4000-8000-000000000001','schema-test-v0.2','default',true);
do $$ begin
  begin perform public.start_play_session('de000000-0000-4000-8000-000000000001','ab000000-0000-4000-8000-000000000002','bc000000-0000-4000-8000-000000000001','schema-test-v0.2','default',true);raise exception 'Nonce collision allowed';exception when insufficient_privilege then null;end;
  begin perform public.start_play_session(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),'schema-test-v0.2','unknown',false);raise exception 'Invalid aircraft allowed';exception when invalid_parameter_value then null;end;
  begin perform public.finish_play_session('de000000-0000-4000-8000-000000000001','ab000000-0000-4000-8000-000000000001',-1,'dead');raise exception 'Invalid duration allowed';exception when invalid_parameter_value then null;end;
end $$;
select public.finish_play_session('de000000-0000-4000-8000-000000000001','ab000000-0000-4000-8000-000000000001',1234,'dead');
select public.finish_play_session('de000000-0000-4000-8000-000000000001','ab000000-0000-4000-8000-000000000001',1234,'dead');
do $$ begin
  begin perform public.finish_play_session('de000000-0000-4000-8000-000000000001','ab000000-0000-4000-8000-000000000001',1235,'dead');raise exception 'Terminal record changed';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','ac000000-0000-4000-8000-000000000001',true);
do $$ begin
  begin perform 1 from public.play_sessions;raise exception 'Authenticated SELECT allowed';exception when insufficient_privilege then null;end;
end $$;
select public.start_play_session('de000000-0000-4000-8000-000000000002','ab000000-0000-4000-8000-000000000002',null,'schema-test-v0.2','aegis',true);
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
-- Ownership may change during a flight; the nonce can finish only its own run.
select public.finish_play_session('de000000-0000-4000-8000-000000000002','ab000000-0000-4000-8000-000000000002',2222,'abandoned');
reset role;
do $$ begin
  if (select count(*) from public.play_sessions where client_version='schema-test-v0.2')<>2 then raise exception 'Idempotency failed';end if;
  if not exists(select 1 from public.play_sessions where actor_kind='account' and user_id='ac000000-0000-4000-8000-000000000001' and guest_id is null) then raise exception 'Account binding failed';end if;
  if has_table_privilege('anon','public.play_sessions','SELECT') or has_table_privilege('authenticated','public.play_sessions','SELECT') then raise exception 'Private read privilege leaked';end if;
end $$;
rollback;
