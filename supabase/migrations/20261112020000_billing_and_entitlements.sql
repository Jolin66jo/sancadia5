create table if not exists public.entitlement_features (
  feature text primary key check (feature ~ '^[a-z][a-z0-9_]*$')
);

insert into public.entitlement_features (feature) values
  ('expert_access'),
  ('latrunculi_premium'),
  ('latrunculi_imperial')
on conflict (feature) do nothing;

create table if not exists public.billing_config (
  singleton boolean primary key default true check (singleton),
  paywall_enabled boolean not null default false,
  past_due_grace_days integer not null default 7
    check (past_due_grace_days between 0 and 30),
  updated_at timestamptz not null default now()
);

insert into public.billing_config (singleton) values (true)
on conflict (singleton) do nothing;

create table if not exists public.stripe_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null references public.entitlement_features (feature),
  source text not null check (
    source in ('stripe_subscription', 'stripe_payment', 'admin_grant')
  ),
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  status text not null check (
    status in ('active', 'past_due', 'canceled', 'expired', 'refunded')
  ),
  granted_at timestamptz not null default now(),
  current_period_end timestamptz,
  past_due_since timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, feature, stripe_subscription_id)
);

create unique index if not exists entitlements_payment_intent_key
  on public.entitlements (user_id, feature, stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
create unique index if not exists entitlements_checkout_session_key
  on public.entitlements (user_id, feature, stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create table if not exists public.stripe_events (
  event_id text primary key,
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'processing'
    check (status in ('processing', 'processed', 'failed')),
  error text
);

create index if not exists stripe_events_received_at_idx
  on public.stripe_events (received_at desc);

do $$
declare
  table_name text;
begin
  for table_name in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

revoke all on public.stripe_customers, public.entitlements, public.stripe_events,
  public.entitlement_features, public.billing_config
  from public, anon, authenticated;

create policy "Own Stripe customer readable" on public.stripe_customers
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own entitlements readable" on public.entitlements
  for select to authenticated using ((select auth.uid()) = user_id);

grant select on public.stripe_customers, public.entitlements to authenticated;
grant all on public.stripe_customers, public.entitlements, public.stripe_events,
  public.entitlement_features, public.billing_config to service_role;

-- This single row controls grace-period length and the not-yet-live paywall.
comment on table public.billing_config is
  'Singleton billing controls: past_due_grace_days and paywall_enabled are the sole configuration points.';

create or replace function public._has_entitlement_for_user(
  p_user_id uuid,
  p_feature text
) returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select exists (
      select 1
      from public.entitlements e
      where e.user_id = p_user_id
        and e.feature = p_feature
        and (
          e.status = 'active'
          or (
            e.status = 'past_due'
            and c.past_due_grace_days > 0
            and e.past_due_since >=
              now() - make_interval(days => c.past_due_grace_days)
          )
        )
        and (e.current_period_end is null or e.current_period_end > now())
    )
    from public.billing_config c
    where c.singleton = true
  ), false);
$$;

revoke all on function public._has_entitlement_for_user(uuid, text)
  from public, anon, authenticated;

create or replace function public.has_entitlement(p_feature text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public._has_entitlement_for_user(auth.uid(), p_feature), false);
$$;

revoke all on function public.has_entitlement(text) from public, anon, authenticated;
grant execute on function public.has_entitlement(text) to authenticated;

create or replace function public.my_entitlements()
returns table (feature text, status text, current_period_end timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select e.feature, e.status, e.current_period_end
  from public.entitlements e
  where e.user_id = auth.uid()
  order by e.feature, e.granted_at desc;
$$;

revoke all on function public.my_entitlements() from public, anon, authenticated;
grant execute on function public.my_entitlements() to authenticated;

create or replace function public.is_expert_allowed(p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_paywall_enabled boolean;
begin
  select c.paywall_enabled into v_paywall_enabled
  from public.billing_config c
  where c.singleton = true;

  if not found then return false; end if;
  if not v_paywall_enabled then return true; end if;
  return public._has_entitlement_for_user(p_user_id, 'expert_access');
end;
$$;

revoke all on function public.is_expert_allowed(uuid) from public, anon, authenticated;

create or replace function public.flag_unentitled_expert_result()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.difficulty = 'expert'
     and not public.is_expert_allowed(new.user_id) then
    new.flagged := true;
  end if;
  return new;
end;
$$;

revoke all on function public.flag_unentitled_expert_result() from public, anon, authenticated;

drop trigger if exists game_results_flag_unentitled_expert on public.game_results;
create trigger game_results_flag_unentitled_expert
before insert on public.game_results
for each row execute function public.flag_unentitled_expert_result();

-- The event row and entitlement change commit together. Duplicate event IDs return false.
create or replace function public.apply_entitlement_event(
  p_event_id text,
  p_event_type text,
  p_user_id uuid,
  p_feature text,
  p_source text,
  p_status text,
  p_stripe_subscription_id text default null,
  p_stripe_payment_intent_id text default null,
  p_stripe_checkout_session_id text default null,
  p_granted_at timestamptz default null,
  p_current_period_end timestamptz default null
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing public.entitlements%rowtype;
  v_past_due_since timestamptz;
begin
  if p_event_id is null or length(btrim(p_event_id)) = 0 then
    raise exception 'invalid_event_id';
  end if;
  if p_event_type is null or length(btrim(p_event_type)) = 0 then
    raise exception 'invalid_event_type';
  end if;

  insert into public.stripe_events (event_id, type, status)
  values (p_event_id, p_event_type, 'processing')
  on conflict (event_id) do nothing;
  if not found then return false; end if;

  if p_user_id is null then raise exception 'invalid_user_id'; end if;
  if not exists (
    select 1 from public.entitlement_features where feature = p_feature
  ) then
    raise exception 'invalid_feature';
  end if;
  if p_source is null
     or p_source not in ('stripe_subscription', 'stripe_payment', 'admin_grant') then
    raise exception 'invalid_source';
  end if;
  if p_status is null
     or p_status not in ('active', 'past_due', 'canceled', 'expired', 'refunded') then
    raise exception 'invalid_status';
  end if;
  if p_source = 'stripe_subscription' and p_stripe_subscription_id is null then
    raise exception 'subscription_id_required';
  end if;
  if p_source = 'stripe_payment'
     and p_stripe_payment_intent_id is null
     and p_stripe_checkout_session_id is null then
    raise exception 'payment_reference_required';
  end if;

  select e.* into v_existing
  from public.entitlements e
  where e.user_id = p_user_id
    and e.feature = p_feature
    and (
      (p_stripe_subscription_id is not null
        and e.stripe_subscription_id = p_stripe_subscription_id)
      or (p_stripe_payment_intent_id is not null
        and e.stripe_payment_intent_id = p_stripe_payment_intent_id)
      or (p_stripe_checkout_session_id is not null
        and e.stripe_checkout_session_id = p_stripe_checkout_session_id)
      or (p_source = 'admin_grant'
        and e.source = 'admin_grant'
        and e.stripe_subscription_id is null
        and e.stripe_payment_intent_id is null
        and e.stripe_checkout_session_id is null)
    )
  order by e.granted_at desc
  limit 1
  for update;

  if found then
    v_past_due_since := case
      when p_status <> 'past_due' then null
      when v_existing.status = 'past_due' then v_existing.past_due_since
      else now()
    end;

    update public.entitlements
    set source = p_source,
        stripe_subscription_id = coalesce(p_stripe_subscription_id, stripe_subscription_id),
        stripe_payment_intent_id = coalesce(p_stripe_payment_intent_id, stripe_payment_intent_id),
        stripe_checkout_session_id = coalesce(p_stripe_checkout_session_id, stripe_checkout_session_id),
        status = p_status,
        granted_at = coalesce(p_granted_at, granted_at),
        current_period_end = p_current_period_end,
        past_due_since = v_past_due_since,
        updated_at = now()
    where id = v_existing.id;
  else
    insert into public.entitlements (
      user_id, feature, source, stripe_subscription_id, stripe_payment_intent_id,
      stripe_checkout_session_id, status, granted_at, current_period_end, past_due_since
    ) values (
      p_user_id, p_feature, p_source, p_stripe_subscription_id, p_stripe_payment_intent_id,
      p_stripe_checkout_session_id, p_status, coalesce(p_granted_at, now()),
      p_current_period_end, case when p_status = 'past_due' then now() else null end
    );
  end if;

  update public.stripe_events
  set status = 'processed', processed_at = now(), error = null
  where event_id = p_event_id;
  return true;
end;
$$;

revoke all on function public.apply_entitlement_event(
  text, text, uuid, text, text, text, text, text, text, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.apply_entitlement_event(
  text, text, uuid, text, text, text, text, text, text, timestamptz, timestamptz
) to service_role;

-- The LATRUNCULI admin edge function is the sole writer; no client or PUBLIC grants.
revoke all on public.admin_content from public, anon, authenticated;
grant select on public.admin_content to anon, authenticated;
grant all on public.admin_content to service_role;
