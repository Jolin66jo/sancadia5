-- Run against the local Supabase database after `supabase db reset`, for example:
-- psql "$LOCAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security_functions.sql
begin;

do $$
declare
  v_user_a uuid := gen_random_uuid();
  v_user_b uuid := gen_random_uuid();
  v_result_id uuid := gen_random_uuid();
  v_import jsonb;
  v_result jsonb;
  v_count integer;
  v_points integer;
  v_case record;
  v_profile_name text;
begin
  insert into auth.users (id, aud, role, email) values
    (v_user_a, 'authenticated', 'authenticated', v_user_a::text || '@test.invalid'),
    (v_user_b, 'authenticated', 'authenticated', v_user_b::text || '@test.invalid');

  insert into public.game_stats (user_id, game_id, difficulty, played, wins, points)
  values (v_user_b, 'noughts-and-crosses', 'beginner', 1, 1, 777);
  insert into public.game_results (
    user_id, client_result_id, game_id, difficulty, outcome, points_awarded
  ) values (
    v_user_b, gen_random_uuid(), 'noughts-and-crosses', 'beginner', 'win', 777
  );
  insert into public.display_name_blocklist (blocked_name) values ('Blocked_1');

  for v_case in
    select * from (values
      ('versus', 'beginner', 'win', 1, null::integer, null::integer, 0, 15),
      ('versus', 'expert', 'win', 10, null::integer, null::integer, 0, 65),
      ('versus', 'expert', 'draw', 8, null::integer, null::integer, 0, 5),
      ('versus', 'expert', 'loss', 8, null::integer, null::integer, 0, 1),
      ('puzzle', 'beginner', 'win', 1, 1, 10, 1, 20),
      ('puzzle', 'beginner', 'win', 0, 10, 10, 5, 1),
      ('puzzle', 'expert', 'loss', 0, 5, 5, 0, 1),
      ('puzzle', 'professional', 'win', 2, 4, 8, 0, 36)
    ) as cases(kind, difficulty, outcome, streak, attempts, max_attempts, hints, expected)
  loop
    v_points := public.compute_points(
      v_case.kind, v_case.difficulty, v_case.outcome, v_case.streak,
      v_case.attempts, v_case.max_attempts, v_case.hints
    );
    if v_points <> v_case.expected then
      raise exception 'FAIL: SQL points case %, expected %, got %',
        row_to_json(v_case), v_case.expected, v_points;
    end if;
  end loop;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';

  select display_name into v_profile_name
  from public.profiles
  where id = v_user_a;
  if v_profile_name is null then raise exception 'FAIL: auth profile was not created'; end if;

  select count(*) into v_count from public.game_stats where user_id = v_user_b;
  if v_count <> 0 then raise exception 'FAIL: user A can read user B game_stats'; end if;
  select count(*) into v_count from public.game_results where user_id = v_user_b;
  if v_count <> 0 then raise exception 'FAIL: user A can read user B game_results'; end if;
  select count(*) into v_count from public.profiles where id = v_user_b;
  if v_count <> 0 then raise exception 'FAIL: user A can read user B profile'; end if;

  begin
    update public.game_stats set points = 999999 where user_id = v_user_b;
    raise exception 'FAIL: user A can write user B game_stats';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.game_stats (user_id, game_id, difficulty, points)
    values (v_user_a, 'noughts-and-crosses', 'beginner', 999999);
    raise exception 'FAIL: authenticated user can directly insert game_stats';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.game_results (
      user_id, client_result_id, game_id, difficulty, outcome, points_awarded
    ) values (
      v_user_a, gen_random_uuid(), 'noughts-and-crosses', 'beginner', 'win', 999999
    );
    raise exception 'FAIL: authenticated user can directly insert game_results';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.profiles set imported_local_stats = true where id = v_user_a;
    raise exception 'FAIL: profile imported_local_stats is client writable';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set display_name = 'Blocked_1' where id = v_user_a;
    raise exception 'FAIL: blocklisted display name was accepted';
  exception when check_violation then null;
  end;

  v_result := public.submit_result(
    v_result_id, 'noughts-and-crosses', 'beginner', 'win', null, 0
  );
  if (v_result ->> 'points_awarded')::integer <> 15 then
    raise exception 'FAIL: first submission did not award expected points';
  end if;
  v_result := public.submit_result(
    v_result_id, 'noughts-and-crosses', 'beginner', 'win', null, 0
  );
  if (v_result ->> 'points_awarded')::integer <> 15
     or not (v_result ->> 'duplicate')::boolean
     or (v_result -> 'new_totals' ->> 'points')::integer <> 15
     or (v_result -> 'new_totals' ->> 'played')::integer <> 1 then
    raise exception 'FAIL: duplicate result was paid or counted more than once';
  end if;

  begin
    perform public.submit_result(
      gen_random_uuid(), 'unknown-game', 'beginner', 'win', null, 0
    );
    raise exception 'FAIL: unknown game was accepted';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  select count(*) into v_count
  from information_schema.columns
  where table_schema = 'public'
    and table_name in ('leaderboard_all_time', 'leaderboard_weekly')
    and column_name in ('user_id', 'id', 'email');
  if v_count <> 0 then raise exception 'FAIL: leaderboard exposes an ID or email'; end if;

  select count(*) into v_count
  from public.leaderboard_all_time
  where game_id = 'overall' and display_name = v_profile_name and points = 15;
  if v_count <> 1 then raise exception 'FAIL: leaderboard score is missing'; end if;

  insert into public.reports (reporter_id, reported_display_name, reason)
  values (v_user_a, 'Other_01', 'test report');

  execute 'reset role';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_b, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  v_import := public.import_local_stats(
    '{"games":[{"game_id":"gomoku","difficulty":"expert","played":9999,"wins":9999,"points":9999999}]}'
    ::jsonb
  );
  if (v_import ->> 'imported')::integer <> 1 then
    raise exception 'FAIL: imported stats row was not created';
  end if;
  select count(*) into v_count
  from public.imported_stats
  where user_id = v_user_b and imported = true and played = 2000
    and wins = 2000 and points = 150000;
  if v_count <> 1 then raise exception 'FAIL: imported stats were not safely capped'; end if;

  execute 'reset role';
  for v_case in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
      and c.relrowsecurity = false
  loop
    raise exception 'FAIL: public table % does not have RLS enabled', v_case.relname;
  end loop;
end;
$$;

rollback;

do $$ begin raise notice 'All security function SQL tests passed.'; end $$;
