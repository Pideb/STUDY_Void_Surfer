begin;

alter table public.player_scores
  add column if not exists aircraft_id text not null default 'default';

update public.player_scores
set aircraft_id = 'default'
where aircraft_id is null or aircraft_id not in ('default', 'velocity', 'aegis');

alter table public.player_scores
  alter column aircraft_id set default 'default',
  alter column aircraft_id set not null;

alter table public.player_scores
  drop constraint if exists player_scores_aircraft_id_check;
alter table public.player_scores
  add constraint player_scores_aircraft_id_check
  check (aircraft_id in ('default', 'velocity', 'aegis'));

drop function if exists public.submit_score(integer, text, text);
create function public.submit_score(
  p_score integer,
  p_display_name text,
  p_aircraft_id text
)
returns public.player_scores
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  score_row public.player_scores;
begin
  if caller_id is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  if p_score is null or p_score < 0 then
    raise exception 'Score must be a non-negative integer'
      using errcode = '22023';
  end if;

  if p_aircraft_id is null or p_aircraft_id not in ('default', 'velocity', 'aegis') then
    raise exception 'Aircraft ID is not supported'
      using errcode = '22023';
  end if;

  perform public.sync_profile(p_display_name);

  insert into public.player_scores (user_id, best_score, achieved_at, aircraft_id)
  values (caller_id, p_score, now(), p_aircraft_id)
  on conflict (user_id) do update
    set best_score = excluded.best_score,
        achieved_at = excluded.achieved_at,
        aircraft_id = excluded.aircraft_id
    where excluded.best_score > public.player_scores.best_score
  returning * into score_row;

  if score_row.user_id is null then
    select * into score_row
    from public.player_scores
    where user_id = caller_id;
  end if;

  return score_row;
end;
$$;

-- Keep already-open clients on the previous RPC shape working during deployment.
create or replace function public.submit_score(p_score integer, p_display_name text)
returns public.player_scores
language sql
security definer
set search_path = public
as $$
  select public.submit_score(p_score, p_display_name, 'default');
$$;

drop function if exists public.get_leaderboard(integer);
create function public.get_leaderboard(p_limit integer default 10)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  best_score integer,
  achieved_at timestamptz,
  aircraft_id text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    row_number() over (
      order by ps.best_score desc, ps.achieved_at asc, ps.user_id asc
    ) as rank,
    ps.user_id,
    p.display_name,
    ps.best_score,
    ps.achieved_at,
    ps.aircraft_id
  from public.player_scores ps
  join public.profiles p on p.user_id = ps.user_id
  order by ps.best_score desc, ps.achieved_at asc, ps.user_id asc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

drop function if exists public.get_player_neighborhood(integer);
create function public.get_player_neighborhood(p_radius integer default 2)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  best_score integer,
  achieved_at timestamptz,
  aircraft_id text
)
language sql
stable
security invoker
set search_path = public
as $$
  with ranked as (
    select
      row_number() over (
        order by ps.best_score desc, ps.achieved_at asc, ps.user_id asc
      ) as rank,
      ps.user_id,
      p.display_name,
      ps.best_score,
      ps.achieved_at,
      ps.aircraft_id
    from public.player_scores ps
    join public.profiles p on p.user_id = ps.user_id
  ), current_player as (
    select r.rank
    from ranked r
    where r.user_id = auth.uid()
  )
  select r.rank, r.user_id, r.display_name, r.best_score, r.achieved_at, r.aircraft_id
  from ranked r
  cross join current_player c
  where r.rank between c.rank - greatest(0, least(coalesce(p_radius, 2), 10))
    and c.rank + greatest(0, least(coalesce(p_radius, 2), 10))
  order by r.rank;
$$;

create or replace function public.get_player_best_score()
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((
    select ps.best_score
    from public.player_scores ps
    where ps.user_id = auth.uid()
  ), 0)::integer;
$$;

revoke all on function public.submit_score(integer, text, text) from public;
revoke all on function public.submit_score(integer, text) from public;
revoke all on function public.get_leaderboard(integer) from public;
revoke all on function public.get_player_neighborhood(integer) from public;
revoke all on function public.get_player_best_score() from public;
grant execute on function public.submit_score(integer, text, text) to authenticated;
grant execute on function public.submit_score(integer, text) to authenticated;
grant execute on function public.get_leaderboard(integer) to authenticated;
grant execute on function public.get_player_neighborhood(integer) to authenticated;
grant execute on function public.get_player_best_score() to authenticated;

commit;
