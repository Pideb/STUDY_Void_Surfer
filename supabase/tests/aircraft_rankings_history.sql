begin;
insert into auth.users(id,email) values
 ('fb000000-0000-4000-8000-000000000001','craft-a@example.invalid'),
 ('fb000000-0000-4000-8000-000000000002','craft-b@example.invalid');
select set_config('request.jwt.claim.sub','fb000000-0000-4000-8000-000000000001',true);
select public.submit_score(2000000000,'Craft A','velocity',1000);
select public.submit_score(1500000000,'Craft A','aegis',2000);
select public.submit_score(1400000000,'Craft A','aegis',9999);
select public.submit_score(1500000000,'Craft A','aegis',3000);
do $$ begin
 if (select best_score from public.player_scores where user_id=auth.uid())<>2000000000 then raise exception 'Overall lost';end if;
 if not exists(select 1 from public.aircraft_scores where user_id=auth.uid() and aircraft_id='aegis' and best_score=1500000000 and duration_ms=3000) then raise exception 'Independent best/tie failed';end if;
 if (select count(*) from public.get_player_aircraft_record('default'))<>0 then raise exception 'Invented craft record';end if;
 begin perform public.submit_score(-1,'Craft A','aegis',0);raise exception 'Negative allowed';exception when invalid_parameter_value then null;end;
 begin perform public.get_aircraft_leaderboard('invalid');raise exception 'Invalid craft allowed';exception when invalid_parameter_value then null;end;
end $$;
select set_config('request.jwt.claim.sub','fb000000-0000-4000-8000-000000000002',true);
select public.submit_score(1500000000,'Craft B','aegis',4000);
select public.submit_score(3,'Craft B','default');
select public.submit_score(2,'Craft B');
set local role authenticated;
do $$ begin
 if (select rank from public.get_player_aircraft_record('aegis'))<>1 then raise exception 'Personal global rank incorrect';end if;
 begin perform 1 from public.aircraft_scores;raise exception 'Private scores readable';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.get_player_aircraft_record('aegis') r where to_jsonb(r)?'duration_ms') then raise exception 'Personal time leak';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
 if (select display_name from public.get_aircraft_leaderboard('aegis',1,0))<>'Craft B' then raise exception 'Aircraft sort';end if;
 if (select rank from public.get_aircraft_leaderboard('aegis',1,1))<>2 then raise exception 'Page rank';end if;
 if exists(select 1 from public.get_aircraft_leaderboard('aegis') r where to_jsonb(r)?'duration_ms' or to_jsonb(r)?'user_id') then raise exception 'Public leak';end if;
 begin perform public.get_player_aircraft_record('aegis');raise exception 'Anon own record';exception when insufficient_privilege then null;end;
 begin perform public.submit_score(1,'Forbidden','default',0);raise exception 'Anon score write';exception when insufficient_privilege then null;end;
 begin perform 1 from public.play_sessions;raise exception 'History readable';exception when insufficient_privilege then null;end;
 begin perform 1 from public.aircraft_scores;raise exception 'Craft scores readable';exception when insufficient_privilege then null;end;
end $$;
select public.start_play_session('fb000000-0000-4000-8000-000000000010','fb000000-0000-4000-8000-000000000011','fb000000-0000-4000-8000-000000000012','0.2b','aegis',true);
select public.finish_play_session('fb000000-0000-4000-8000-000000000010','fb000000-0000-4000-8000-000000000011',1234,'dead',0);
select public.finish_play_session('fb000000-0000-4000-8000-000000000010','fb000000-0000-4000-8000-000000000011',1234,'dead',0);
do $$ begin
 begin perform public.finish_play_session('fb000000-0000-4000-8000-000000000010','fb000000-0000-4000-8000-000000000011',1234,'dead',1);raise exception 'Final score mutable';exception when insufficient_privilege then null;end;
 begin perform public.finish_play_session('fb000000-0000-4000-8000-000000000010','fb000000-0000-4000-8000-000000000099',1234,'dead',0);raise exception 'Wrong nonce';exception when insufficient_privilege then null;end;
end $$;
select public.start_play_session('fb000000-0000-4000-8000-000000000020','fb000000-0000-4000-8000-000000000021','fb000000-0000-4000-8000-000000000012','0.2b','default',false);
select public.finish_play_session('fb000000-0000-4000-8000-000000000020','fb000000-0000-4000-8000-000000000021',500,'abandoned');
reset role;
do $$ begin
 if not exists(select 1 from public.play_sessions where run_id='fb000000-0000-4000-8000-000000000010' and final_score=0 and is_admin_test and actor_kind='guest') then raise exception 'Private zero/admin history';end if;
 if not exists(select 1 from public.play_sessions where run_id='fb000000-0000-4000-8000-000000000020' and final_score is null) then raise exception 'Legacy unknown became zero';end if;
end $$;
rollback;
