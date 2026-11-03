begin;

-- Keep the legacy seed and RPC replacement atomic with respect to score writes.
lock table public.player_scores, public.player_score_timing in share row exclusive mode;

create table public.aircraft_scores (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  aircraft_id text not null check (aircraft_id in ('default','aegis','velocity')),
  best_score integer not null check (best_score >= 0),
  achieved_at timestamptz not null,
  duration_ms bigint not null default 0 check (duration_ms between 0 and 604800000),
  primary key (user_id, aircraft_id)
);
create index aircraft_scores_rank_idx on public.aircraft_scores
  (aircraft_id, best_score desc, duration_ms desc, achieved_at, user_id);
alter table public.aircraft_scores enable row level security;
revoke all on table public.aircraft_scores from public, anon, authenticated;

insert into public.aircraft_scores(user_id,aircraft_id,best_score,achieved_at,duration_ms)
select ps.user_id,ps.aircraft_id,ps.best_score,ps.achieved_at,coalesce(t.duration_ms,0)
from public.player_scores ps left join public.player_score_timing t on t.user_id=ps.user_id;

create or replace function public.submit_score(
  p_score integer,p_display_name text,p_aircraft_id text,p_duration_ms bigint
) returns public.player_scores language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); score_row public.player_scores; previous_duration bigint;
begin
  if caller is null then raise exception 'Authentication is required' using errcode='42501'; end if;
  if p_score is null or p_score<0 or p_duration_ms is null or p_duration_ms not between 0 and 604800000
    or p_aircraft_id is null or p_aircraft_id not in ('default','aegis','velocity')
    or p_display_name is null or pg_catalog.btrim(p_display_name)='' then
    raise exception 'Invalid score submission' using errcode='22023';
  end if;
  perform public.sync_profile(p_display_name);
  insert into public.player_scores(user_id,best_score,achieved_at,aircraft_id)
  values(caller,p_score,pg_catalog.now(),p_aircraft_id) on conflict(user_id) do nothing;
  -- All submissions for one account serialize before touching either timing or aircraft rows.
  select * into score_row from public.player_scores where user_id=caller for update;
  insert into public.player_score_timing(user_id,duration_ms) values(caller,0) on conflict(user_id) do nothing;
  select t.duration_ms into previous_duration from public.player_score_timing t where t.user_id=caller;
  if p_score>score_row.best_score or (p_score=score_row.best_score and p_duration_ms>previous_duration) then
    update public.player_scores set best_score=p_score,achieved_at=pg_catalog.now(),aircraft_id=p_aircraft_id
      where user_id=caller returning * into score_row;
    update public.player_score_timing set duration_ms=p_duration_ms where user_id=caller;
  end if;
  insert into public.aircraft_scores as previous(user_id,aircraft_id,best_score,achieved_at,duration_ms)
  values(caller,p_aircraft_id,p_score,pg_catalog.now(),p_duration_ms)
  on conflict(user_id,aircraft_id) do update set
    best_score=excluded.best_score,achieved_at=excluded.achieved_at,duration_ms=excluded.duration_ms
  where excluded.best_score>previous.best_score
    or (excluded.best_score=previous.best_score and excluded.duration_ms>previous.duration_ms);
  return score_row;
end;
$$;

create function public.get_aircraft_leaderboard(
  p_aircraft_id text,p_limit integer default 50,p_offset integer default 0
) returns table(rank bigint,display_name text,best_score integer,achieved_at timestamptz,aircraft_id text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_aircraft_id is null or p_aircraft_id not in ('default','aegis','velocity') then
    raise exception 'Invalid aircraft' using errcode='22023';
  end if;
  return query
  select pg_catalog.row_number() over(order by a.best_score desc,a.duration_ms desc,a.achieved_at,a.user_id),
    p.display_name,a.best_score,a.achieved_at,a.aircraft_id
  from public.aircraft_scores a join public.profiles p on p.user_id=a.user_id
  where a.aircraft_id=p_aircraft_id
  order by a.best_score desc,a.duration_ms desc,a.achieved_at,a.user_id
  limit greatest(1,least(coalesce(p_limit,50),50)) offset greatest(0,least(coalesce(p_offset,0),2147483647));
end;
$$;

create function public.get_player_aircraft_record(p_aircraft_id text)
returns table(rank bigint,user_id uuid,display_name text,best_score integer,achieved_at timestamptz,aircraft_id text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication is required' using errcode='42501'; end if;
  if p_aircraft_id is null or p_aircraft_id not in ('default','aegis','velocity') then
    raise exception 'Invalid aircraft' using errcode='22023';
  end if;
  return query with ranked as (
    select pg_catalog.row_number() over(order by a.best_score desc,a.duration_ms desc,a.achieved_at,a.user_id) as rank,
      a.user_id,p.display_name,a.best_score,a.achieved_at,a.aircraft_id
    from public.aircraft_scores a join public.profiles p on p.user_id=a.user_id
    where a.aircraft_id=p_aircraft_id
  ) select r.rank,r.user_id,r.display_name,r.best_score,r.achieved_at,r.aircraft_id
    from ranked r where r.user_id=auth.uid();
end;
$$;

alter table public.play_sessions add column final_score integer check (final_score>=0);
create function public.finish_play_session(
  p_run_id uuid,p_write_nonce uuid,p_duration_ms bigint,p_outcome text,p_final_score integer
) returns void language plpgsql security definer set search_path = '' as $$
declare existing public.play_sessions%rowtype;
begin
  if p_run_id is null or p_write_nonce is null or p_duration_ms is null
    or p_duration_ms not between 0 and 604800000 or p_outcome is null
    or p_outcome not in ('dead','abandoned') or p_final_score<0 then
    raise exception 'Invalid play record' using errcode='22023';
  end if;
  select * into existing from public.play_sessions where run_id=p_run_id for update;
  if not found or existing.write_nonce is distinct from p_write_nonce then
    raise exception 'Play record write denied' using errcode='42501';
  end if;
  if existing.outcome='started' then
    update public.play_sessions set duration_ms=p_duration_ms,outcome=p_outcome,
      final_score=p_final_score,finished_at=pg_catalog.clock_timestamp() where run_id=p_run_id;
  elsif existing.outcome is distinct from p_outcome or existing.duration_ms is distinct from p_duration_ms
    or existing.final_score is distinct from p_final_score then
    raise exception 'Play record write denied' using errcode='42501';
  end if;
end;
$$;
create or replace function public.finish_play_session(
  p_run_id uuid,p_write_nonce uuid,p_duration_ms bigint,p_outcome text
) returns void language sql security definer set search_path = '' as $$
  select public.finish_play_session(p_run_id,p_write_nonce,p_duration_ms,p_outcome,null::integer);
$$;

revoke all on function public.get_aircraft_leaderboard(text,integer,integer) from public,anon,authenticated;
revoke all on function public.get_player_aircraft_record(text) from public,anon,authenticated;
revoke all on function public.finish_play_session(uuid,uuid,bigint,text,integer) from public,anon,authenticated;
revoke all on function public.finish_play_session(uuid,uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.get_aircraft_leaderboard(text,integer,integer) to anon,authenticated;
grant execute on function public.get_player_aircraft_record(text) to authenticated;
grant execute on function public.finish_play_session(uuid,uuid,bigint,text,integer) to anon,authenticated;
grant execute on function public.finish_play_session(uuid,uuid,bigint,text) to anon,authenticated;
commit;
