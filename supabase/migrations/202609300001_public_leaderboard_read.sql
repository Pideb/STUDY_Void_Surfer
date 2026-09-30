begin;

create or replace function public.get_public_leaderboard(
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  rank bigint,
  display_name text,
  best_score integer,
  achieved_at timestamptz,
  aircraft_id text
)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select
      pg_catalog.row_number() over (
        order by ps.best_score desc, ps.achieved_at asc, ps.user_id asc
      ) as rank,
      profiles.display_name,
      ps.best_score,
      ps.achieved_at,
      ps.aircraft_id
    from public.player_scores as ps
    join public.profiles as profiles on profiles.user_id = ps.user_id
  )
  select ranked.rank, ranked.display_name, ranked.best_score, ranked.achieved_at, ranked.aircraft_id
  from ranked
  order by ranked.rank
  limit greatest(1, least(coalesce(p_limit, 50), 50))
  offset greatest(0, least(coalesce(p_offset, 0), 2147483647));
$$;

revoke all on function public.get_public_leaderboard(integer, integer) from public, anon, authenticated;
grant execute on function public.get_public_leaderboard(integer, integer) to anon, authenticated;

-- Anonymous users can read only the safe public-ranking RPC, never account or write RPCs.
revoke all on function public.submit_score(integer, text, text) from anon;
revoke all on function public.submit_score(integer, text) from anon;
revoke all on function public.get_player_neighborhood(integer) from anon;
revoke all on function public.get_player_best_score() from anon;

commit;
