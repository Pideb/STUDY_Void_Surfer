begin;
create table public.player_score_timing (
  user_id uuid primary key references public.player_scores(user_id) on delete cascade,
  duration_ms bigint not null default 0 check (duration_ms between 0 and 604800000)
);
alter table public.player_score_timing enable row level security;
revoke all on table public.player_score_timing from public,anon,authenticated;

create function public.submit_score(p_score integer,p_display_name text,p_aircraft_id text,p_duration_ms bigint)
returns public.player_scores language plpgsql security definer set search_path = '' as $$
declare caller uuid:=auth.uid(); score_row public.player_scores; previous_duration bigint;
begin
  if caller is null then raise exception 'Authentication is required' using errcode='42501';end if;
  if p_score is null or p_score<0 or p_duration_ms is null or p_duration_ms not between 0 and 604800000
    or p_aircraft_id is null or p_aircraft_id not in ('default','aegis','velocity')
    or p_display_name is null or pg_catalog.btrim(p_display_name)='' then
    raise exception 'Invalid score submission' using errcode='22023';
  end if;
  perform public.sync_profile(p_display_name);
  insert into public.player_scores(user_id,best_score,achieved_at,aircraft_id)
  values(caller,p_score,pg_catalog.now(),p_aircraft_id) on conflict(user_id) do nothing;
  select * into score_row from public.player_scores where user_id=caller for update;
  insert into public.player_score_timing(user_id,duration_ms) values(caller,0) on conflict(user_id) do nothing;
  select t.duration_ms into previous_duration from public.player_score_timing t where t.user_id=caller;
  if p_score>score_row.best_score or (p_score=score_row.best_score and p_duration_ms>previous_duration) then
    update public.player_scores set best_score=p_score,achieved_at=pg_catalog.now(),aircraft_id=p_aircraft_id where user_id=caller returning * into score_row;
    update public.player_score_timing set duration_ms=p_duration_ms where user_id=caller;
  end if;
  return score_row;
end;
$$;
create or replace function public.submit_score(p_score integer,p_display_name text,p_aircraft_id text)
returns public.player_scores language sql security definer set search_path = '' as $$
  select public.submit_score(p_score,p_display_name,p_aircraft_id,0::bigint);
$$;
create or replace function public.submit_score(p_score integer,p_display_name text)
returns public.player_scores language sql security definer set search_path = '' as $$
  select public.submit_score(p_score,p_display_name,'default',0::bigint);
$$;

create or replace function public.get_leaderboard(p_limit integer default 10)
returns table(rank bigint,user_id uuid,display_name text,best_score integer,achieved_at timestamptz,aircraft_id text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication is required' using errcode='42501';end if;
  return query
  select pg_catalog.row_number() over(order by ps.best_score desc,coalesce(t.duration_ms,0) desc,ps.achieved_at asc,ps.user_id asc),
    ps.user_id,p.display_name,ps.best_score,ps.achieved_at,ps.aircraft_id
  from public.player_scores ps join public.profiles p on p.user_id=ps.user_id
  left join public.player_score_timing t on t.user_id=ps.user_id
  order by ps.best_score desc,coalesce(t.duration_ms,0) desc,ps.achieved_at asc,ps.user_id asc
  limit greatest(1,least(coalesce(p_limit,10),50));
end;
$$;
create or replace function public.get_player_neighborhood(p_radius integer default 2)
returns table(rank bigint,user_id uuid,display_name text,best_score integer,achieved_at timestamptz,aircraft_id text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication is required' using errcode='42501';end if;
  return query with ranked as (
    select pg_catalog.row_number() over(order by ps.best_score desc,coalesce(t.duration_ms,0) desc,ps.achieved_at asc,ps.user_id asc) as rank,
      ps.user_id,p.display_name,ps.best_score,ps.achieved_at,ps.aircraft_id
    from public.player_scores ps join public.profiles p on p.user_id=ps.user_id
    left join public.player_score_timing t on t.user_id=ps.user_id
  ), current_player as(select r.rank from ranked r where r.user_id=auth.uid())
  select r.rank,r.user_id,r.display_name,r.best_score,r.achieved_at,r.aircraft_id
  from ranked r cross join current_player c
  where r.rank between c.rank-greatest(0,least(coalesce(p_radius,2),10)) and c.rank+greatest(0,least(coalesce(p_radius,2),10))
  order by r.rank;
end;
$$;
create or replace function public.get_public_leaderboard(p_limit integer default 50,p_offset integer default 0)
returns table(rank bigint,display_name text,best_score integer,achieved_at timestamptz,aircraft_id text)
language sql stable security definer set search_path = '' as $$
  with ranked as (
    select pg_catalog.row_number() over(order by ps.best_score desc,coalesce(t.duration_ms,0) desc,ps.achieved_at asc,ps.user_id asc) as rank,
      p.display_name,ps.best_score,ps.achieved_at,ps.aircraft_id
    from public.player_scores ps join public.profiles p on p.user_id=ps.user_id
    left join public.player_score_timing t on t.user_id=ps.user_id
  ) select r.rank,r.display_name,r.best_score,r.achieved_at,r.aircraft_id from ranked r order by r.rank
  limit greatest(1,least(coalesce(p_limit,50),50)) offset greatest(0,least(coalesce(p_offset,0),2147483647));
$$;
revoke all on function public.submit_score(integer,text,text,bigint) from public,anon,authenticated;
revoke all on function public.submit_score(integer,text,text) from public,anon,authenticated;
revoke all on function public.submit_score(integer,text) from public,anon,authenticated;
revoke all on function public.get_leaderboard(integer) from public,anon,authenticated;
revoke all on function public.get_player_neighborhood(integer) from public,anon,authenticated;
revoke all on function public.get_public_leaderboard(integer,integer) from public,anon,authenticated;
grant execute on function public.submit_score(integer,text,text,bigint) to authenticated;
grant execute on function public.submit_score(integer,text,text) to authenticated;
grant execute on function public.submit_score(integer,text) to authenticated;
grant execute on function public.get_leaderboard(integer) to authenticated;
grant execute on function public.get_player_neighborhood(integer) to authenticated;
grant execute on function public.get_public_leaderboard(integer,integer) to anon,authenticated;
commit;
