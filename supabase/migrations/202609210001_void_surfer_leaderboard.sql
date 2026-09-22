create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 80)
);

create table if not exists public.player_scores (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  best_score integer not null default 0,
  achieved_at timestamptz not null default now(),
  constraint player_scores_best_score_non_negative check (best_score >= 0)
);

create index if not exists player_scores_rank_idx
  on public.player_scores (best_score desc, achieved_at asc, user_id asc);

alter table public.profiles enable row level security;
alter table public.player_scores enable row level security;

drop policy if exists profiles_authenticated_select on public.profiles;
create policy profiles_authenticated_select
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists player_scores_authenticated_select on public.player_scores;
create policy player_scores_authenticated_select
  on public.player_scores
  for select
  to authenticated
  using (true);

revoke insert, update, delete on table public.profiles from anon, authenticated;
revoke insert, update, delete on table public.player_scores from anon, authenticated;
grant select on table public.profiles, public.player_scores to authenticated;

create or replace function public.sync_profile(p_display_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  normalized_name text := btrim(coalesce(p_display_name, ''));
  profile_row public.profiles;
begin
  if caller_id is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  if char_length(normalized_name) not between 1 and 80 then
    raise exception 'Display name must contain between 1 and 80 characters'
      using errcode = '22023';
  end if;

  insert into public.profiles (user_id, display_name)
  values (caller_id, normalized_name)
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        updated_at = now()
  returning * into profile_row;

  return profile_row;
end;
$$;

create or replace function public.submit_score(p_score integer, p_display_name text)
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

  perform public.sync_profile(p_display_name);

  insert into public.player_scores (user_id, best_score, achieved_at)
  values (caller_id, p_score, now())
  on conflict (user_id) do update
    set best_score = excluded.best_score,
        achieved_at = excluded.achieved_at
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

create or replace function public.get_leaderboard(p_limit integer default 10)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  best_score integer,
  achieved_at timestamptz
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
    ps.achieved_at
  from public.player_scores ps
  join public.profiles p on p.user_id = ps.user_id
  order by ps.best_score desc, ps.achieved_at asc, ps.user_id asc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

create or replace function public.get_player_neighborhood(p_radius integer default 2)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  best_score integer,
  achieved_at timestamptz
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
      ps.achieved_at
    from public.player_scores ps
    join public.profiles p on p.user_id = ps.user_id
  ), current_player as (
    select r.rank
    from ranked r
    where r.user_id = auth.uid()
  )
  select r.rank, r.user_id, r.display_name, r.best_score, r.achieved_at
  from ranked r
  cross join current_player c
  where r.rank between c.rank - greatest(0, least(coalesce(p_radius, 2), 10))
    and c.rank + greatest(0, least(coalesce(p_radius, 2), 10))
  order by r.rank;
$$;

revoke all on function public.sync_profile(text) from public;
revoke all on function public.submit_score(integer, text) from public;
revoke all on function public.get_leaderboard(integer) from public;
revoke all on function public.get_player_neighborhood(integer) from public;

grant execute on function public.sync_profile(text) to authenticated;
grant execute on function public.submit_score(integer, text) to authenticated;
grant execute on function public.get_leaderboard(integer) to authenticated;
grant execute on function public.get_player_neighborhood(integer) to authenticated;
