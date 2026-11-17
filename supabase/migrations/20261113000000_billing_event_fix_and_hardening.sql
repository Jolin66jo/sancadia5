-- 1. Event claiming, separate from entitlement changes (service_role only).
alter table public.stripe_events
  add column if not exists claimed_at timestamptz not null default now();

create or replace function public.claim_stripe_event(p_event_id text, p_type text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
  v_claimed timestamptz;
begin
  if p_event_id is null or length(btrim(p_event_id)) = 0 then
    raise exception 'invalid_event_id';
  end if;

  insert into public.stripe_events (event_id, type, status)
  values (p_event_id, coalesce(p_type, 'unknown'), 'processing')
  on conflict (event_id) do nothing;
  if found then return 'claimed'; end if;

  select status, claimed_at into v_status, v_claimed
  from public.stripe_events where event_id = p_event_id for update;

  if v_status = 'processed' then return 'duplicate'; end if;
  if v_status = 'failed' or v_claimed < now() - interval '2 minutes' then
    update public.stripe_events
    set status = 'processing', claimed_at = now(), error = null
    where event_id = p_event_id;
    return 'claimed';
  end if;
  return 'duplicate';
end;
$$;

create or replace function public.complete_stripe_event(
  p_event_id text, p_ok boolean, p_error text default null
) returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.stripe_events
  set status = case when p_ok then 'processed' else 'failed' end,
      processed_at = case when p_ok then now() else null end,
      error = case when p_ok then null else left(p_error, 500) end
  where event_id = p_event_id;
$$;

-- 2. Apply a whole set of entitlement changes atomically (one event -> many features).
create or replace function public.apply_entitlement_changes(p_changes jsonb)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c jsonb;
  v_user uuid; v_feature text; v_source text; v_status text;
  v_sub text; v_pi text; v_cs text;
  v_granted timestamptz; v_end timestamptz;
  v_existing public.entitlements%rowtype;
  v_past timestamptz;
  v_n integer := 0;
begin
  if jsonb_typeof(p_changes) is distinct from 'array' then
    raise exception 'invalid_changes';
  end if;

  for c in select value from jsonb_array_elements(p_changes) loop
    v_user := (c ->> 'user_id')::uuid;
    v_feature := c ->> 'feature';
    v_source := c ->> 'source';
    v_status := c ->> 'status';
    v_sub := nullif(c ->> 'stripe_subscription_id', '');
    v_pi := nullif(c ->> 'stripe_payment_intent_id', '');
    v_cs := nullif(c ->> 'stripe_checkout_session_id', '');
    v_granted := (c ->> 'granted_at')::timestamptz;
    v_end := (c ->> 'current_period_end')::timestamptz;

    if v_user is null then raise exception 'invalid_user_id'; end if;
    if not exists (select 1 from public.entitlement_features where feature = v_feature) then
      raise exception 'invalid_feature';
    end if;
    if v_source is null or v_source not in ('stripe_subscription','stripe_payment','admin_grant') then
      raise exception 'invalid_source';
    end if;
    if v_status is null or v_status not in ('active','past_due','canceled','expired','refunded') then
      raise exception 'invalid_status';
    end if;
    if v_source = 'stripe_subscription' and v_sub is null then
      raise exception 'subscription_id_required';
    end if;
    if v_source = 'stripe_payment' and v_pi is null and v_cs is null then
      raise exception 'payment_reference_required';
    end if;

    select e.* into v_existing
    from public.entitlements e
    where e.user_id = v_user and e.feature = v_feature
      and (
        (v_sub is not null and e.stripe_subscription_id = v_sub)
        or (v_pi is not null and e.stripe_payment_intent_id = v_pi)
        or (v_cs is not null and e.stripe_checkout_session_id = v_cs)
        or (v_source = 'admin_grant' and e.source = 'admin_grant'
            and e.stripe_subscription_id is null
            and e.stripe_payment_intent_id is null
            and e.stripe_checkout_session_id is null)
      )
    order by e.granted_at desc
    limit 1
    for update;

    if found then
      v_past := case
        when v_status <> 'past_due' then null
        when v_existing.status = 'past_due' then v_existing.past_due_since
        else now()
      end;
      update public.entitlements set
        source = v_source,
        stripe_subscription_id = coalesce(v_sub, stripe_subscription_id),
        stripe_payment_intent_id = coalesce(v_pi, stripe_payment_intent_id),
        stripe_checkout_session_id = coalesce(v_cs, stripe_checkout_session_id),
        status = v_status,
        current_period_end = v_end,
        past_due_since = v_past,
        updated_at = now()
      where id = v_existing.id;
    else
      insert into public.entitlements (
        user_id, feature, source, stripe_subscription_id, stripe_payment_intent_id,
        stripe_checkout_session_id, status, granted_at, current_period_end, past_due_since
      ) values (
        v_user, v_feature, v_source, v_sub, v_pi, v_cs, v_status,
        coalesce(v_granted, now()), v_end,
        case when v_status = 'past_due' then now() else null end
      );
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

drop function if exists public.apply_entitlement_event(
  text, text, uuid, text, text, text, text, text, text, timestamptz, timestamptz
);

revoke all on function public.claim_stripe_event(text, text) from public, anon, authenticated;
revoke all on function public.complete_stripe_event(text, boolean, text) from public, anon, authenticated;
revoke all on function public.apply_entitlement_changes(jsonb) from public, anon, authenticated;
grant execute on function public.claim_stripe_event(text, text) to service_role;
grant execute on function public.complete_stripe_event(text, boolean, text) to service_role;
grant execute on function public.apply_entitlement_changes(jsonb) to service_role;

-- 3. my_entitlements returns the server-computed answer too.
drop function if exists public.my_entitlements();
create function public.my_entitlements()
returns table (feature text, status text, current_period_end timestamptz, is_active boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select e.feature, e.status, e.current_period_end,
         public._has_entitlement_for_user(auth.uid(), e.feature)
  from public.entitlements e
  where e.user_id = auth.uid()
  order by e.feature, e.granted_at desc;
$$;
revoke all on function public.my_entitlements() from public, anon, authenticated;
grant execute on function public.my_entitlements() to authenticated;

-- 4. Future tables are closed to clients by default.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;