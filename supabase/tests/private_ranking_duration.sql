-- Owner connection on a migrated test project. Sequential tests do not prove concurrency.
begin;
insert into auth.users(id,email) values
 ('fa000000-0000-4000-8000-000000000001','ranking-a@example.invalid'),
 ('fa000000-0000-4000-8000-000000000002','ranking-b@example.invalid'),
 ('fa000000-0000-4000-8000-000000000003','ranking-c@example.invalid');
select set_config('request.jwt.claim.sub','fa000000-0000-4000-8000-000000000001',true);
select public.submit_score(2000000000,'Ranking A','default',200000);
select set_config('request.jwt.claim.sub','fa000000-0000-4000-8000-000000000002',true);
select public.submit_score(2000000000,'Ranking B','velocity',300000);
select set_config('request.jwt.claim.sub','fa000000-0000-4000-8000-000000000003',true);
select public.submit_score(2000000001,'Ranking C','aegis',1000);
do $$ declare names text[]; begin
 select array_agg(r.display_name order by r.rank) into names from public.get_public_leaderboard(50,0) r where r.display_name in ('Ranking A','Ranking B','Ranking C');
 if names is distinct from array['Ranking C','Ranking B','Ranking A'] then raise exception 'Private tie ordering failed';end if;
end $$;
select set_config('request.jwt.claim.sub','fa000000-0000-4000-8000-000000000001',true);
select public.submit_score(2000000000,'Ranking A','aegis',400000);
select public.submit_score(1999999999,'Ranking A','velocity',600000);
select public.submit_score(2000000000,'Ranking A','default');
do $$ begin
 if not exists(select 1 from public.player_score_timing where user_id=auth.uid() and duration_ms=400000) then raise exception 'Tie/legacy duration changed';end if;
 if not exists(select 1 from public.player_scores where user_id=auth.uid() and aircraft_id='aegis') then raise exception 'Lower score replaced aircraft';end if;
 if to_jsonb(public.submit_score(2000000000,'Ranking A','aegis',400000)) ? 'duration_ms' then raise exception 'Private time leaked in score response';end if;
end $$;
select public.submit_score(2000000002,'Ranking A');
do $$ begin
 if not exists(select 1 from public.player_score_timing where user_id=auth.uid() and duration_ms=0) then raise exception 'Legacy higher score retained old duration';end if;
end $$;
set local role authenticated;
do $$ begin
 begin perform 1 from public.player_score_timing;raise exception 'Private time SELECT allowed';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.get_leaderboard(50) r where to_jsonb(r) ? 'duration_ms') then raise exception 'Top time leaked';end if;
 if exists(select 1 from public.get_player_neighborhood(10) r where to_jsonb(r) ? 'duration_ms') then raise exception 'Neighborhood time leaked';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
 begin perform 1 from public.player_score_timing;raise exception 'Anon private SELECT allowed';exception when insufficient_privilege then null;end;
 begin perform public.submit_score(1,'Forbidden','default',0);raise exception 'Anon score write allowed';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.get_public_leaderboard(50,0) r where to_jsonb(r) ? 'duration_ms') then raise exception 'Public time leaked';end if;
end $$;
reset role;
rollback;
