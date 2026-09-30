begin;

select plan(37);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'player_scores', 'player scores table exists');
select has_index('public', 'player_scores', 'player_scores_rank_idx', 'ranking index exists');
select has_function('public', 'sync_profile', array['text'], 'sync_profile RPC exists');
select has_function('public', 'submit_score', array['integer', 'text', 'text'], 'aircraft-aware submit_score RPC exists');
select has_function('public', 'submit_score', array['integer', 'text'], 'legacy submit_score RPC remains available');
select has_function('public', 'get_leaderboard', array['integer'], 'get_leaderboard RPC exists');
select has_function('public', 'get_player_neighborhood', array['integer'], 'neighborhood RPC exists');
select has_function('public', 'get_player_best_score', array[]::text[], 'account best-score RPC exists');
select has_function('public', 'get_public_leaderboard', array['integer', 'integer'], 'public paged leaderboard RPC exists');
select ok(
  has_function_privilege('anon', 'public.get_public_leaderboard(integer, integer)', 'EXECUTE'),
  'anonymous role can execute the read-only public ranking RPC'
);
select ok(
  not has_function_privilege('anon', 'public.submit_score(integer, text, text)', 'EXECUTE'),
  'anonymous role cannot submit aircraft-aware scores'
);
select ok(
  not has_function_privilege('anon', 'public.get_player_best_score()', 'EXECUTE'),
  'anonymous role cannot query account best-score RPC'
);
select ok(
  not has_function_privilege('anon', 'public.get_player_neighborhood(integer)', 'EXECUTE'),
  'anonymous role cannot query account neighborhood RPC'
);
select is(
  (select count(*)::integer from information_schema.parameters
   where specific_schema = 'public'
     and specific_name like 'get_public_leaderboard_%'
     and parameter_mode = 'OUT'),
  5,
  'public ranking exposes exactly five output fields'
);
select ok(
  not exists (
    select 1 from information_schema.parameters
    where specific_schema = 'public'
      and specific_name like 'get_public_leaderboard_%'
      and parameter_mode = 'OUT'
      and parameter_name in ('user_id', 'email')
  ),
  'public ranking output contains no account identifier or email'
);

select has_column('public', 'player_scores', 'aircraft_id', 'aircraft identity is stored with score');
select col_not_null('public', 'player_scores', 'aircraft_id', 'aircraft ID is required');
select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'player_scores'
      and column_name = 'aircraft_id'
      and column_default like '%default%'
  ),
  'legacy rows and old clients default to DEFAULT'
);
select has_check('public', 'profiles', 'profiles_display_name_length', 'display name is bounded');
select has_check('public', 'player_scores', 'player_scores_best_score_non_negative', 'score cannot be negative');
select has_check('public', 'player_scores', 'player_scores_aircraft_id_check', 'aircraft ID is allow-listed');
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'player_scores'
      and policyname = 'player_scores_authenticated_select'
  ),
  'score reads retain the authenticated RLS policy'
);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000101', 't07-one@example.test'),
  ('00000000-0000-0000-0000-000000000102', 't07-two@example.test');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
set local role authenticated;

select lives_ok(
  $$select public.submit_score(20, 'Pilot One', 'velocity')$$,
  'authenticated caller can submit their own aircraft-tagged score'
);
select throws_ok(
  $$select public.submit_score(25, 'Pilot One', 'root')$$,
  '22023',
  'Aircraft ID is not supported',
  'unknown aircraft IDs are rejected'
);
select is(public.get_player_best_score(), 20, 'account best score is returned for aircraft unlocks');
select is(
  (select aircraft_id from public.submit_score(12, 'Pilot One', 'aegis')),
  'velocity'::text,
  'a lower score cannot replace the best-score aircraft'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
select lives_ok(
  $$select public.submit_score(99, 'Pilot Two', 'aegis')$$,
  'second authenticated caller can submit their own score'
);
select is(public.get_player_best_score(), 99, 'best score RPC returns the current account only');
select is(
  (select aircraft_id from public.get_player_neighborhood(2) where user_id = '00000000-0000-0000-0000-000000000102'),
  'aegis'::text,
  'neighborhood RPC includes aircraft identity'
);
select is(
  (select aircraft_id from public.get_leaderboard(10) where user_id = '00000000-0000-0000-0000-000000000101'),
  'velocity'::text,
  'global leaderboard includes the saved best-score aircraft'
);
select throws_ok(
  $$update public.player_scores set best_score = 999 where user_id = '00000000-0000-0000-0000-000000000101'$$,
  '42501',
  'permission denied for table player_scores',
  'authenticated clients cannot overwrite another account through table writes'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select is(public.get_player_best_score(), 20, 'one user cannot change the other account best score via the RPC');

reset role;
set local role anon;
select is(
  (select count(*)::integer from public.get_public_leaderboard(50, 0)),
  2,
  'anonymous role can read safe public ranking rows'
);
select is(
  (select rank from public.get_public_leaderboard(1, 1)),
  2::bigint,
  'public ranking offset preserves deterministic global order'
);
select ok(
  (select count(*) <= 50 from public.get_public_leaderboard(500, 0)),
  'public ranking clamps oversized page requests to 50 rows'
);
select throws_ok(
  $$select public.submit_score(1, 'Guest', 'default')$$,
  '42501',
  'permission denied for function submit_score',
  'anonymous role cannot write scores'
);
reset role;
select * from finish();
rollback;
