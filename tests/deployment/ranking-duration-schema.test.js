import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/202611020002_private_ranking_duration.sql','utf8').toLowerCase();
describe('private ranking duration static contract (live DB gate separate)',()=>{
 it('keeps duration off the publicly selectable score table and RPC return columns',()=>{expect(sql).toContain('create table public.player_score_timing');expect(sql).toContain('revoke all on table public.player_score_timing from public,anon,authenticated');expect(sql).not.toContain('alter table public.player_scores');for(const columns of sql.matchAll(/returns table\(([^)]+)\)/g))expect(columns[1]).not.toContain('duration');expect(sql).toContain('enable row level security');});
 it('serializes best-score and same-score-duration replacement under one row lock',()=>{expect(sql).toContain('for update');expect(sql).toContain('p_score=score_row.best_score and p_duration_ms>previous_duration');expect(sql).toContain('update public.player_score_timing set duration_ms=p_duration_ms');expect(sql.match(/ps.best_score desc,coalesce\(t.duration_ms,0\) desc,ps.achieved_at asc,ps.user_id asc/g)).toHaveLength(4);expect(sql.match(/0::bigint/g)).toHaveLength(2);expect(sql).toContain('using errcode=\'42501\'');});
});
