begin;

select plan(10);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'player_scores', 'player_scores table exists');
select has_index('public', 'player_scores', 'player_scores_rank_idx', 'ranking index exists');
select has_function('public', 'sync_profile', array['text'], 'sync_profile RPC exists');
select has_function('public', 'submit_score', array['integer', 'text'], 'submit_score RPC exists');
select has_function('public', 'get_leaderboard', array['integer'], 'get_leaderboard RPC exists');
select has_function('public', 'get_player_neighborhood', array['integer'], 'neighborhood RPC exists');

select has_check('public', 'profiles', 'profiles_display_name_length', 'display name is bounded');
select has_check('public', 'player_scores', 'player_scores_best_score_non_negative', 'score cannot be negative');
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'player_scores'
      and policyname = 'player_scores_authenticated_select'
  ),
  'player score reads use an authenticated RLS policy'
);

select * from finish();
rollback;
