begin;

create table public.play_sessions (
  run_id uuid primary key,
  write_nonce uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  guest_id uuid,
  actor_kind text not null check (actor_kind in ('account','guest')),
  client_version text not null check (char_length(client_version) between 1 and 32),
  aircraft_id text not null check (aircraft_id in ('default','aegis','velocity')),
  is_admin_test boolean not null default false,
  started_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  duration_ms bigint check (duration_ms between 0 and 604800000),
  outcome text not null default 'started' check (outcome in ('started','dead','abandoned')),
  check ((actor_kind='account' and guest_id is null)
    or (actor_kind='guest' and user_id is null and guest_id is not null)),
  check ((outcome='started' and finished_at is null and duration_ms is null)
    or (outcome in ('dead','abandoned') and finished_at is not null and duration_ms is not null))
);
create index play_sessions_user_started_idx on public.play_sessions(user_id,started_at desc);
create index play_sessions_guest_started_idx on public.play_sessions(guest_id,started_at desc);
alter table public.play_sessions enable row level security;
revoke all on table public.play_sessions from public,anon,authenticated;

create function public.start_play_session(
  p_run_id uuid,p_write_nonce uuid,p_guest_id uuid,p_client_version text,
  p_aircraft_id text,p_is_admin_test boolean default false
) returns void language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  actor text;
  guest uuid;
  existing public.play_sessions%rowtype;
begin
  actor := case when caller is null then 'guest' else 'account' end;
  guest := case when caller is null then p_guest_id else null end;
  if p_run_id is null or p_write_nonce is null or (caller is null and guest is null)
    or p_client_version is null or pg_catalog.char_length(p_client_version) not between 1 and 32
    or p_aircraft_id is null or p_aircraft_id not in ('default','aegis','velocity')
    or p_is_admin_test is null then
    raise exception 'Invalid play record' using errcode='22023';
  end if;
  insert into public.play_sessions(run_id,write_nonce,user_id,guest_id,actor_kind,client_version,aircraft_id,is_admin_test)
  values(p_run_id,p_write_nonce,caller,guest,actor,p_client_version,p_aircraft_id,p_is_admin_test)
  on conflict(run_id) do nothing;
  select * into existing from public.play_sessions where run_id=p_run_id for update;
  if existing.write_nonce is distinct from p_write_nonce
    or existing.user_id is distinct from caller or existing.guest_id is distinct from guest
    or existing.actor_kind is distinct from actor or existing.client_version is distinct from p_client_version
    or existing.aircraft_id is distinct from p_aircraft_id or existing.is_admin_test is distinct from p_is_admin_test then
    raise exception 'Play record write denied' using errcode='42501';
  end if;
end;
$$;

create function public.finish_play_session(
  p_run_id uuid,p_write_nonce uuid,p_duration_ms bigint,p_outcome text
) returns void language plpgsql security definer set search_path = '' as $$
declare existing public.play_sessions%rowtype;
begin
  if p_run_id is null or p_write_nonce is null or p_duration_ms is null
    or p_duration_ms not between 0 and 604800000 or p_outcome is null
    or p_outcome not in ('dead','abandoned') then
    raise exception 'Invalid play record' using errcode='22023';
  end if;
  select * into existing from public.play_sessions where run_id=p_run_id for update;
  if not found or existing.write_nonce is distinct from p_write_nonce then
    raise exception 'Play record write denied' using errcode='42501';
  end if;
  if existing.outcome='started' then
    update public.play_sessions set duration_ms=p_duration_ms,outcome=p_outcome,finished_at=pg_catalog.clock_timestamp()
    where run_id=p_run_id;
  elsif existing.outcome is distinct from p_outcome or existing.duration_ms is distinct from p_duration_ms then
    raise exception 'Play record write denied' using errcode='42501';
  end if;
end;
$$;
revoke all on function public.start_play_session(uuid,uuid,uuid,text,text,boolean) from public,anon,authenticated;
revoke all on function public.finish_play_session(uuid,uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.start_play_session(uuid,uuid,uuid,text,text,boolean) to anon,authenticated;
grant execute on function public.finish_play_session(uuid,uuid,bigint,text) to anon,authenticated;

commit;
