create table if not exists public.reunion_votes (
  voter_id uuid primary key,
  status text not null check (status in ('attend', 'absent', 'maybe')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reunion_votes enable row level security;
revoke all on table public.reunion_votes from anon, authenticated;

create or replace function public.get_reunion_vote_results()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'attend', count(*) filter (where status = 'attend'),
    'absent', count(*) filter (where status = 'absent'),
    'maybe', count(*) filter (where status = 'maybe')
  )
  from public.reunion_votes;
$$;

create or replace function public.submit_reunion_vote(p_voter_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('attend', 'absent', 'maybe') then
    raise exception 'invalid vote status';
  end if;

  insert into public.reunion_votes (voter_id, status)
  values (p_voter_id, p_status)
  on conflict (voter_id) do update
    set status = excluded.status,
        updated_at = now();

  return public.get_reunion_vote_results();
end;
$$;

revoke all on function public.get_reunion_vote_results() from public;
revoke all on function public.submit_reunion_vote(uuid, text) from public;
grant execute on function public.get_reunion_vote_results() to anon, authenticated;
grant execute on function public.submit_reunion_vote(uuid, text) to anon, authenticated;
