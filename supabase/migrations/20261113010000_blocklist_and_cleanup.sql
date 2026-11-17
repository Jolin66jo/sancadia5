-- 1. Remove the view that let anyone list every player's name.
drop view if exists public.profile_display_names;

-- 2. Remove the old rank function and the internal views only it used.
--    The client does not call it, and it ignored flagged results.
drop function if exists public.my_leaderboard_rank(text, text);
drop view if exists public.lb_all_time_internal;
drop view if exists public.lb_weekly_internal;

-- 3. Blocklist: exact matches (reserved names) and contains matches (offensive words).
alter table public.display_name_blocklist
  add column if not exists match_type text not null default 'exact'
    check (match_type in ('exact', 'contains'));

insert into public.display_name_blocklist (blocked_name, match_type) values
  -- Reserved or impersonation names (exact match after normalising)
  ('admin', 'exact'),
  ('administrator', 'exact'),
  ('moderator', 'exact'),
  ('mod', 'exact'),
  ('support', 'exact'),
  ('staff', 'exact'),
  ('system', 'exact'),
  ('official', 'exact'),
  ('sancadia', 'exact'),
  ('latrunculi', 'exact'),
  ('anonymous', 'exact'),
  ('null', 'exact'),
  ('undefined', 'exact'),
  ('guest', 'exact'),
  -- Starter list of offensive words (substring match). Extend this.
  ('fuck', 'contains'),
  ('shit', 'contains'),
  ('cunt', 'contains'),
  ('nazi', 'contains'),
  ('hitler', 'contains')
on conflict (blocked_name) do nothing;

-- 4. Normalise a name: lower-case, drop underscores, undo common digit substitutions.
create or replace function public.normalise_display_name(p_name text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select translate(replace(lower(btrim(p_name)), '_', ''), '013457', 'oleast');
$$;

-- 5. Stronger check on display-name changes (server-side, cannot be bypassed by the client).
create or replace function public.reject_blocklisted_display_name()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_norm text := public.normalise_display_name(new.display_name);
begin
  if new.display_name is distinct from old.display_name
     and exists (
       select 1
       from public.display_name_blocklist b
       where (b.match_type = 'exact'
              and public.normalise_display_name(b.blocked_name) = v_norm)
          or (b.match_type = 'contains'
              and position(public.normalise_display_name(b.blocked_name) in v_norm) > 0)
     ) then
    raise exception 'display_name_not_allowed' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_blocklisted_display_name()
  from public, anon, authenticated;
revoke all on function public.normalise_display_name(text)
  from public, anon, authenticated;