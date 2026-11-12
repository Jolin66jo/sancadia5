create table if not exists public.display_name_blocklist (
  blocked_name text primary key,
  constraint display_name_blocklist_not_empty check (length(btrim(blocked_name)) > 0)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_display_name text not null check (length(btrim(reported_display_name)) between 3 and 16),
  reason text not null check (length(btrim(reason)) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.imported_stats
  add column if not exists imported boolean not null default true;

insert into public.game_catalog (game_id, kind, active)
select id, case when type = 'puzzle' then 'puzzle' else 'versus' end, active
from public.games
on conflict (game_id) do nothing;

do $$
declare
  table_name text;
  policy_name text;
begin
  for table_name in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;

  for policy_name in
    select policyname from pg_policies where schemaname = 'public'
  loop
    for table_name in
      select tablename
      from pg_policies
      where schemaname = 'public' and policyname = policy_name
    loop
      execute format('drop policy %I on public.%I', policy_name, table_name);
    end loop;
  end loop;
end;
$$;

revoke all on all tables in schema public from anon, authenticated;

create policy "Games are readable" on public.games
  for select to anon, authenticated using (true);

create policy "Own profile readable" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Own profile display name editable" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Own stats readable" on public.game_stats
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own results readable" on public.game_results
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own imported stats readable" on public.imported_stats
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Published content is readable" on public.admin_content
  for select to anon, authenticated using (status = 'published');

create policy "Authenticated users can submit reports" on public.reports
  for insert to authenticated with check ((select auth.uid()) = reporter_id);

grant select on public.games to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select on public.game_stats, public.game_results, public.imported_stats
  to authenticated;
grant select on public.admin_content to anon, authenticated;
grant insert (reporter_id, reported_display_name, reason) on public.reports
  to authenticated;

create or replace view public.profile_display_names
with (security_invoker = false)
as
select display_name
from public.profiles;

create or replace view public.leaderboard_all_time
with (security_invoker = false)
as
with results as (
  select r.user_id, r.game_id, r.outcome, r.points_awarded, p.display_name
  from public.game_results r
  join public.profiles p on p.id = r.user_id
  where r.flagged = false and r.imported = false
), scores as (
  select user_id, game_id, display_name,
         sum(points_awarded)::bigint as points,
         count(*) filter (where outcome = 'win')::bigint as wins
  from results
  group by user_id, game_id, display_name
  union all
  select user_id, 'overall'::text, display_name,
         sum(points_awarded)::bigint,
         count(*) filter (where outcome = 'win')::bigint
  from results
  group by user_id, display_name
), ranked as (
  select game_id, display_name, points, wins,
         rank() over (partition by game_id order by points desc, wins desc) as rank
  from scores
)
select game_id, display_name, points, wins, rank from ranked;

comment on view public.leaderboard_all_time is
  'security_invoker=false is deliberate so the view can aggregate across owner-only rows; only display names and aggregate scores are exposed.';

create or replace view public.leaderboard_weekly
with (security_invoker = false)
as
with results as (
  select r.user_id, r.game_id, r.outcome, r.points_awarded, p.display_name
  from public.game_results r
  join public.profiles p on p.id = r.user_id
  where r.flagged = false
    and r.imported = false
    and r.created_at >= date_trunc('week', now())
), scores as (
  select user_id, game_id, display_name,
         sum(points_awarded)::bigint as points,
         count(*) filter (where outcome = 'win')::bigint as wins
  from results
  group by user_id, game_id, display_name
  union all
  select user_id, 'overall'::text, display_name,
         sum(points_awarded)::bigint,
         count(*) filter (where outcome = 'win')::bigint
  from results
  group by user_id, display_name
), ranked as (
  select game_id, display_name, points, wins,
         rank() over (partition by game_id order by points desc, wins desc) as rank
  from scores
)
select game_id, display_name, points, wins, rank from ranked;

comment on view public.leaderboard_weekly is
  'security_invoker=false is deliberate so the view can aggregate across owner-only rows; only display names and aggregate scores are exposed.';

revoke all on public.profile_display_names, public.leaderboard_all_time,
  public.leaderboard_weekly from anon, authenticated;
grant select on public.profile_display_names, public.leaderboard_all_time,
  public.leaderboard_weekly to anon, authenticated;

create or replace function public.reject_blocklisted_display_name()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.display_name is distinct from old.display_name
     and exists (
       select 1
       from public.display_name_blocklist b
       where lower(btrim(b.blocked_name)) = lower(btrim(new.display_name))
     ) then
    raise exception 'display_name_not_allowed' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_blocklisted_display_name() from public, anon, authenticated;

drop trigger if exists profiles_reject_blocklisted_display_name on public.profiles;
create trigger profiles_reject_blocklisted_display_name
before update of display_name on public.profiles
for each row execute function public.reject_blocklisted_display_name();

-- Keep this formula in sync with calculatePoints/calculatePuzzlePoints in src/lib/points.ts.
create or replace function public.compute_points(
  p_kind text,
  p_difficulty text,
  p_outcome text,
  p_streak integer,
  p_attempts integer,
  p_max_attempts integer,
  p_hints integer
) returns integer
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_base integer := case p_difficulty
    when 'beginner' then 10
    when 'professional' then 20
    else 40
  end;
  v_efficiency integer := 0;
  v_streak integer := 0;
  v_hint_cost integer := 0;
begin
  if p_kind = 'puzzle' then
    if p_outcome <> 'win' then
      return 1;
    end if;
    if p_max_attempts > 1 then
      v_efficiency := round(
        10::numeric * (p_max_attempts - p_attempts) / (p_max_attempts - 1)
      )::integer;
    end if;
    v_streak := least(p_streak * 5, 25);
    v_hint_cost := p_hints * 5;
    return greatest(1, v_base + v_efficiency + v_streak - v_hint_cost);
  end if;

  if p_outcome = 'draw' then return 5; end if;
  if p_outcome = 'loss' then return 1; end if;
  return v_base + least(p_streak * 5, 25);
end;
$$;

revoke all on function public.compute_points(text, text, text, integer, integer, integer, integer)
  from public, anon, authenticated;

create or replace function public.submit_result(
  p_client_result_id uuid,
  p_game_id text,
  p_difficulty text,
  p_outcome text,
  p_attempts integer default null,
  p_hints_used integer default 0
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_kind text;
  v_outcome text := p_outcome;
  v_max_attempts integer;
  v_attempts integer := p_attempts;
  v_hints integer := coalesce(p_hints_used, 0);
  v_stats public.game_stats%rowtype;
  v_existing public.game_results%rowtype;
  v_streak integer;
  v_points integer;
  v_recent integer;
begin
  if v_user is null then raise exception 'auth_required'; end if;
  if p_client_result_id is null then raise exception 'invalid_client_result_id'; end if;

  perform pg_advisory_xact_lock(0, hashtext(v_user::text));
  select * into v_existing
  from public.game_results
  where user_id = v_user and client_result_id = p_client_result_id;
  if found then
    return jsonb_build_object(
      'points_awarded', v_existing.points_awarded,
      'duplicate', true,
      'new_totals', public._result_totals(v_user, v_existing.game_id, v_existing.difficulty)
    );
  end if;

  select type into v_kind
  from public.games
  where id = p_game_id and active = true;
  if v_kind is null then raise exception 'invalid_game'; end if;

  if p_difficulty is null
     or p_difficulty not in ('beginner', 'professional', 'expert') then
    raise exception 'invalid_difficulty';
  end if;
  if v_outcome is null or v_outcome not in ('win', 'loss', 'draw') then
    raise exception 'invalid_outcome';
  end if;
  if v_hints < 0 or v_hints > 100 then raise exception 'invalid_hints'; end if;
  if v_attempts is not null and (v_attempts < 1 or v_attempts > 1000) then
    raise exception 'invalid_attempts';
  end if;

  if v_kind = 'puzzle' then
    if v_outcome = 'draw' then raise exception 'invalid_outcome'; end if;
    if v_attempts is null then raise exception 'invalid_attempts'; end if;
    select max_attempts into v_max_attempts
    from public.puzzle_limits
    where game_id = p_game_id and difficulty = p_difficulty;
    v_max_attempts := coalesce(v_max_attempts, v_attempts);
    if v_attempts > v_max_attempts then raise exception 'invalid_attempts'; end if;
  else
    v_attempts := null;
    v_hints := 0;
    v_max_attempts := null;
  end if;

  select count(*) into v_recent
  from public.game_results
  where user_id = v_user and created_at > now() - interval '1 minute';
  if v_recent >= 30 then raise exception 'rate_limited'; end if;

  insert into public.game_stats (user_id, game_id, difficulty)
  values (v_user, p_game_id, p_difficulty)
  on conflict (user_id, game_id, difficulty) do nothing;

  select * into v_stats
  from public.game_stats
  where user_id = v_user and game_id = p_game_id and difficulty = p_difficulty
  for update;

  v_streak := case
    when v_outcome = 'win' then v_stats.current_streak + 1
    else 0
  end;
  v_points := public.compute_points(
    v_kind, p_difficulty, v_outcome, v_streak, v_attempts, v_max_attempts, v_hints
  );

  insert into public.game_results (
    user_id, client_result_id, game_id, difficulty, outcome, attempts,
    hints_used, points_awarded, match_mode, flagged, imported
  ) values (
    v_user, p_client_result_id, p_game_id, p_difficulty, v_outcome, v_attempts,
    v_hints, v_points, case when v_kind = 'puzzle' then 'puzzle' else 'computer' end,
    false, false
  );

  update public.game_stats set
    played = played + 1,
    wins = wins + (v_outcome = 'win')::integer,
    losses = losses + (v_outcome = 'loss')::integer,
    draws = draws + (v_outcome = 'draw')::integer,
    current_streak = v_streak,
    best_streak = greatest(best_streak, v_streak),
    best_attempts = case
      when v_kind = 'puzzle' and v_outcome = 'win'
        then least(coalesce(best_attempts, v_attempts), v_attempts)
      else best_attempts
    end,
    total_attempts_in_wins = total_attempts_in_wins
      + case when v_kind = 'puzzle' and v_outcome = 'win' then v_attempts else 0 end,
    points = points + v_points,
    updated_at = now()
  where user_id = v_user and game_id = p_game_id and difficulty = p_difficulty;

  return jsonb_build_object(
    'points_awarded', v_points,
    'duplicate', false,
    'new_totals', public._result_totals(v_user, p_game_id, p_difficulty)
  );
end;
$$;

revoke all on function public.submit_result(uuid, text, text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.submit_result(uuid, text, text, text, integer, integer)
  to authenticated;

-- Preserve the existing app RPC's match-mode parameter while routing scored
-- results through the secured six-argument function above.
drop function if exists public.submit_result(uuid, text, text, text, text, integer, integer);
create function public.submit_result(
  p_client_result_id uuid,
  p_game_id text,
  p_difficulty text,
  p_outcome text,
  p_match_mode text,
  p_attempts integer,
  p_hints_used integer
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_kind text;
  v_outcome text := case when p_outcome = 'lose' then 'loss' else p_outcome end;
  v_existing public.game_results%rowtype;
  v_recent integer;
begin
  if v_user is null then raise exception 'auth_required'; end if;
  if p_client_result_id is null then raise exception 'invalid_client_result_id'; end if;

  if p_match_mode is null or p_match_mode not in ('computer', 'two-player', 'puzzle') then
    raise exception 'invalid_match_mode';
  end if;

  if p_match_mode <> 'two-player' then
    select type into v_kind
    from public.games
    where id = p_game_id and active = true;
    if v_kind is null then raise exception 'invalid_game'; end if;
    if (v_kind = 'puzzle' and p_match_mode <> 'puzzle')
       or (v_kind <> 'puzzle' and p_match_mode <> 'computer') then
      raise exception 'invalid_match_mode';
    end if;

    return public.submit_result(
      p_client_result_id, p_game_id, p_difficulty, v_outcome, p_attempts, p_hints_used
    );
  end if;

  perform pg_advisory_xact_lock(0, hashtext(v_user::text));
  select * into v_existing
  from public.game_results
  where user_id = v_user and client_result_id = p_client_result_id;
  if found then
    return jsonb_build_object(
      'points_awarded', v_existing.points_awarded,
      'duplicate', true,
      'new_totals', public._result_totals(v_user, v_existing.game_id, v_existing.difficulty)
    );
  end if;

  select type into v_kind
  from public.games
  where id = p_game_id and active = true;
  if v_kind is null then raise exception 'invalid_game'; end if;
  if p_difficulty is null
     or p_difficulty not in ('beginner', 'professional', 'expert') then
    raise exception 'invalid_difficulty';
  end if;
  if v_outcome is null or v_outcome not in ('win', 'loss', 'draw') then
    raise exception 'invalid_outcome';
  end if;
  if coalesce(p_hints_used, 0) < 0 or coalesce(p_hints_used, 0) > 100 then
    raise exception 'invalid_hints';
  end if;
  if p_attempts is not null and (p_attempts < 1 or p_attempts > 1000) then
    raise exception 'invalid_attempts';
  end if;

  select count(*) into v_recent
  from public.game_results
  where user_id = v_user and created_at > now() - interval '1 minute';
  if v_recent >= 30 then raise exception 'rate_limited'; end if;

  insert into public.game_results (
    user_id, client_result_id, game_id, difficulty, outcome, attempts,
    hints_used, points_awarded, match_mode, flagged, imported
  ) values (
    v_user, p_client_result_id, p_game_id, p_difficulty, v_outcome, p_attempts,
    0, 0, p_match_mode, false, false
  );

  return jsonb_build_object(
    'points_awarded', 0,
    'duplicate', false,
    'new_totals', public._result_totals(v_user, p_game_id, p_difficulty)
  );
end;
$$;

revoke all on function public.submit_result(uuid, text, text, text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.submit_result(uuid, text, text, text, text, integer, integer)
  to authenticated;

create or replace function public.import_local_stats(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_item jsonb;
  v_game_id text;
  v_difficulty text;
  v_played integer;
  v_wins integer;
  v_losses integer;
  v_draws integer;
  v_best_streak integer;
  v_best_attempts integer;
  v_total_attempts integer;
  v_points integer;
  v_imported integer := 0;
  v_rows integer;
begin
  if v_user is null then raise exception 'auth_required'; end if;
  if jsonb_typeof(p_payload -> 'games') is distinct from 'array' then
    raise exception 'invalid_payload';
  end if;
  if jsonb_array_length(p_payload -> 'games') > 100 then
    raise exception 'payload_too_large';
  end if;

  update public.profiles
  set imported_local_stats = true, stats_imported = true
  where id = v_user and imported_local_stats = false;
  if not found then raise exception 'already_imported'; end if;

  for v_item in select value from jsonb_array_elements(p_payload -> 'games')
  loop
    v_game_id := v_item ->> 'game_id';
    v_difficulty := v_item ->> 'difficulty';
    if v_game_id is null or v_difficulty is null
       or v_difficulty not in ('beginner', 'professional', 'expert')
       or not exists (
         select 1 from public.games where id = v_game_id and active = true
       ) then
      continue;
    end if;

    v_played := least(greatest(coalesce((v_item ->> 'played')::integer, 0), 0), 2000);
    v_wins := least(greatest(coalesce((v_item ->> 'wins')::integer, 0), 0), v_played);
    v_losses := least(greatest(coalesce((v_item ->> 'losses')::integer, 0), 0), v_played);
    v_draws := least(greatest(coalesce((v_item ->> 'draws')::integer, 0), 0), v_played);
    v_best_streak := least(
      greatest(coalesce((v_item ->> 'best_streak')::integer, 0), 0),
      v_played
    );
    v_best_attempts := case
      when v_item ->> 'best_attempts' is null then null
      else least(greatest((v_item ->> 'best_attempts')::integer, 1), 1000)
    end;
    v_total_attempts := least(
      greatest(coalesce((v_item ->> 'total_attempts_in_wins')::integer, 0), 0),
      v_wins * 1000
    );
    v_points := least(
      greatest(coalesce((v_item ->> 'points')::integer, 0), 0),
      v_played * 75
    );

    insert into public.imported_stats (
      user_id, game_id, difficulty, played, wins, losses, draws, best_streak,
      best_attempts, total_attempts_in_wins, points, imported
    ) values (
      v_user, v_game_id, v_difficulty, v_played, v_wins, v_losses, v_draws,
      v_best_streak, v_best_attempts, v_total_attempts, v_points, true
    )
    on conflict (user_id, game_id, difficulty) do nothing;
    get diagnostics v_rows = row_count;
    v_imported := v_imported + v_rows;
  end loop;

  return jsonb_build_object('imported', v_imported);
end;
$$;

revoke all on function public.import_local_stats(jsonb) from public, anon, authenticated;
grant execute on function public.import_local_stats(jsonb) to authenticated;

create or replace function public.delete_my_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'auth_required'; end if;

  delete from public.game_stats where user_id = v_user;
  delete from public.game_results where user_id = v_user;
  delete from public.imported_stats where user_id = v_user;
  update public.profiles
  set imported_local_stats = false, stats_imported = false
  where id = v_user;

  return jsonb_build_object('deleted', true);
end;
$$;

revoke all on function public.delete_my_data() from public, anon, authenticated;
grant execute on function public.delete_my_data() to authenticated;

create or replace function public.my_rank(p_game_id text, p_period text)
returns table (points bigint, wins bigint, rank bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'auth_required'; end if;
  if p_game_id is null
     or (p_game_id <> 'overall' and not exists (
       select 1 from public.games where id = p_game_id and active = true
     )) then
    raise exception 'invalid_game';
  end if;
  if p_period is null or p_period not in ('all_time', 'weekly') then
    raise exception 'invalid_period';
  end if;

  return query
  with filtered as (
    select r.user_id, r.game_id, r.outcome, r.points_awarded, p.display_name
    from public.game_results r
    join public.profiles p on p.id = r.user_id
    where r.flagged = false
      and r.imported = false
      and (p_period <> 'weekly' or r.created_at >= date_trunc('week', now()))
  ), scores as (
    select f.user_id, f.game_id, f.display_name,
           sum(f.points_awarded)::bigint as total_points,
           count(*) filter (where f.outcome = 'win')::bigint as total_wins
    from filtered f
    group by f.user_id, f.game_id, f.display_name
    union all
    select f.user_id, 'overall'::text, f.display_name,
           sum(f.points_awarded)::bigint,
           count(*) filter (where f.outcome = 'win')::bigint
    from filtered f
    group by f.user_id, f.display_name
  ), ranked as (
    select s.user_id, s.game_id, s.total_points, s.total_wins,
           rank() over (
             partition by s.game_id order by s.total_points desc, s.total_wins desc
           ) as position
    from scores s
  )
  select r.total_points, r.total_wins, r.position
  from ranked r
  where r.user_id = v_user and r.game_id = p_game_id;
end;
$$;

revoke all on function public.my_rank(text, text) from public, anon, authenticated;
grant execute on function public.my_rank(text, text) to authenticated;
