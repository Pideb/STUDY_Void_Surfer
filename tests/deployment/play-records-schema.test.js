import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/202611020001_private_play_sessions.sql','utf8').toLowerCase();
describe('private play records static contract (not a live role test)',()=>{
 it('revokes table access and grants only void write RPCs',()=>{expect(sql).toContain('enable row level security');expect(sql).toContain('revoke all on table public.play_sessions from public,anon,authenticated');expect(sql.match(/security definer set search_path = ''/g)).toHaveLength(2);expect(sql.match(/returns void/g)).toHaveLength(2);expect(sql).not.toMatch(/grant select|create policy/);});
 it('binds authenticated actors server-side and serializes idempotent terminal writes',()=>{expect(sql).toContain('auth.uid()');expect(sql).toContain('on conflict(run_id) do nothing');expect(sql.match(/for update/g)).toHaveLength(2);expect(sql).toContain('604800000');expect(sql).toContain('existing.write_nonce is distinct from p_write_nonce');expect(sql).toContain("existing.outcome='started'");expect(sql).not.toContain('player_scores');});
});
