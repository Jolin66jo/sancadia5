-- Run after `supabase db reset` with a local Postgres client.
begin;

do $$
declare
  v_user_a uuid := gen_random_uuid();
  v_user_b uuid := gen_random_uuid();
  v_result jsonb;
  v_claim text;
  v_event_id text := 'evt_verify_' || gen_random_uuid()::text;
  v_event_marker text;
  v_count integer;
begin
  insert into auth.users (id, aud, role, email) values
    (v_user_a, 'authenticated', 'authenticated', v_user_a::text || '@billing-test.invalid'),
    (v_user_b, 'authenticated', 'authenticated', v_user_b::text || '@billing-test.invalid');

  insert into public.stripe_customers (user_id, stripe_customer_id)
  values (v_user_b, 'cus_verify_' || v_user_b::text);
  insert into public.entitlements (
    user_id, feature, source, status, current_period_end
  ) values
    (v_user_a, 'expert_access', 'stripe_payment', 'active', now() - interval '1 second'),
    (v_user_b, 'latrunculi_premium', 'admin_grant', 'active', null);

  insert into public.admin_content (content_type, slug, title, payload, status)
  values
    ('campaign', 'verify-published', 'Published verification content', '{}'::jsonb, 'published'),
    ('campaign', 'verify-draft', 'Draft verification content', '{}'::jsonb, 'draft');

  execute 'set local role anon';
  begin
    perform public.latrunculi_admin_metrics(30);
    raise exception 'FAIL: anon can execute latrunculi_admin_metrics';
  exception when insufficient_privilege then null;
  end;
  select count(*) into v_count from public.admin_content where slug like 'verify-%';
  if v_count <> 1 then raise exception 'FAIL: anon can read unpublished admin content'; end if;
  begin
    insert into public.admin_content (content_type, slug, title)
    values ('campaign', 'anon-write', 'Denied');
    raise exception 'FAIL: anon can write admin_content';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.admin_content set title = 'Denied' where slug = 'verify-published';
    raise exception 'FAIL: anon can update admin_content';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.admin_content where slug = 'verify-published';
    raise exception 'FAIL: anon can delete admin_content';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';

  begin
    perform public.latrunculi_admin_metrics(30);
    raise exception 'FAIL: authenticated can execute latrunculi_admin_metrics';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.admin_content (content_type, slug, title)
    values ('campaign', 'auth-write', 'Denied');
    raise exception 'FAIL: authenticated can write admin_content';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.admin_content set title = 'Denied' where slug = 'verify-published';
    raise exception 'FAIL: authenticated can update admin_content';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.admin_content where slug = 'verify-published';
    raise exception 'FAIL: authenticated can delete admin_content';
  exception when insufficient_privilege then null;
  end;

  select count(*) into v_count from public.entitlements where user_id = v_user_b;
  if v_count <> 0 then raise exception 'FAIL: user A can read user B entitlements'; end if;
  if public.has_entitlement('expert_access') then
    raise exception 'FAIL: expired active entitlement was accepted';
  end if;

  begin
    insert into public.entitlements (user_id, feature, source, status)
    values (v_user_a, 'expert_access', 'admin_grant', 'active');
    raise exception 'FAIL: user can insert own entitlement';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.entitlements set status = 'canceled' where user_id = v_user_a;
    raise exception 'FAIL: user can update own entitlement';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.entitlements where user_id = v_user_a;
    raise exception 'FAIL: user can delete own entitlement';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.stripe_customers (user_id, stripe_customer_id)
    values (v_user_a, 'cus_client_write');
    raise exception 'FAIL: user can write stripe_customers';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.stripe_customers set stripe_customer_id = 'cus_changed'
    where user_id = v_user_b;
    raise exception 'FAIL: user can update stripe_customers';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.stripe_customers where user_id = v_user_b;
    raise exception 'FAIL: user can delete stripe_customers';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.stripe_events (event_id, type)
    values ('evt_client_write', 'test');
    raise exception 'FAIL: user can write stripe_events';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.stripe_events where event_id = 'evt_verify_missing';
    raise exception 'FAIL: user can delete stripe_events';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.stripe_events set status = 'processed'
    where event_id = 'evt_verify_missing';
    raise exception 'FAIL: user can update stripe_events';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.claim_stripe_event('evt_client_claim', 'test');
    raise exception 'FAIL: user can call claim_stripe_event';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.apply_entitlement_changes('[]'::jsonb);
    raise exception 'FAIL: user can call apply_entitlement_changes';
  exception when insufficient_privilege then null;
  end;

  -- Webhook flow as service_role: claim, apply, complete.
  execute 'reset role';
  execute 'set local role service_role';
  v_claim := public.claim_stripe_event(v_event_id, 'customer.subscription.created');
  if v_claim <> 'claimed' then raise exception 'FAIL: first event was not claimed'; end if;
  perform public.apply_entitlement_changes(jsonb_build_array(jsonb_build_object(
    'user_id', v_user_b, 'feature', 'latrunculi_imperial',
    'source', 'stripe_subscription', 'status', 'active',
    'stripe_subscription_id', 'sub_verify_1',
    'stripe_checkout_session_id', 'cs_verify_1',
    'granted_at', now(), 'current_period_end', now() + interval '30 days'
  )));
  perform public.complete_stripe_event(v_event_id, true);

  v_claim := public.claim_stripe_event(v_event_id, 'customer.subscription.created');
  if v_claim <> 'duplicate' then raise exception 'FAIL: processed event was claimed again'; end if;

  v_event_marker := null;
  insert into public.stripe_events (event_id, type)
  values (v_event_id, 'duplicate-check')
  on conflict (event_id) do nothing
  returning event_id into v_event_marker;
  if v_event_marker is not null then raise exception 'FAIL: duplicate event insert was not detected'; end if;

  -- Applying the same change twice must not create a second row.
  perform public.apply_entitlement_changes(jsonb_build_array(jsonb_build_object(
    'user_id', v_user_b, 'feature', 'latrunculi_imperial',
    'source', 'stripe_subscription', 'status', 'active',
    'stripe_subscription_id', 'sub_verify_1',
    'stripe_checkout_session_id', 'cs_verify_1',
    'granted_at', now(), 'current_period_end', now() + interval '30 days'
  )));
  select count(*) into v_count
  from public.entitlements
  where user_id = v_user_b and feature = 'latrunculi_imperial'
    and stripe_subscription_id = 'sub_verify_1';
  if v_count <> 1 then raise exception 'FAIL: event replay created duplicate entitlement'; end if;

  -- A failed event can be retried.
  v_claim := public.claim_stripe_event('evt_fail_' || v_user_b::text, 'invoice.paid');
  if v_claim <> 'claimed' then raise exception 'FAIL: failing event was not claimed'; end if;
  perform public.complete_stripe_event('evt_fail_' || v_user_b::text, false, 'boom');
  v_claim := public.claim_stripe_event('evt_fail_' || v_user_b::text, 'invoice.paid');
  if v_claim <> 'claimed' then raise exception 'FAIL: failed event was not retryable'; end if;
  execute 'reset role';

  -- Past-due grace period.
  execute 'set local role service_role';
  v_claim := public.claim_stripe_event('evt_past_due_' || v_user_b::text, 'invoice.payment_failed');
  if v_claim <> 'claimed' then raise exception 'FAIL: past-due event was not claimed'; end if;
  perform public.apply_entitlement_changes(jsonb_build_array(jsonb_build_object(
    'user_id', v_user_b, 'feature', 'expert_access',
    'source', 'stripe_subscription', 'status', 'past_due',
    'stripe_subscription_id', 'sub_past_due_verify',
    'granted_at', now(), 'current_period_end', now() + interval '30 days'
  )));
  perform public.complete_stripe_event('evt_past_due_' || v_user_b::text, true);
  execute 'reset role';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_b, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  if not public.has_entitlement('expert_access') then
    raise exception 'FAIL: past-due grace period was not applied';
  end if;
  execute 'reset role';
  update public.entitlements
  set past_due_since = now() - interval '8 days'
  where user_id = v_user_b and feature = 'expert_access';
  execute 'set local role authenticated';
  if public.has_entitlement('expert_access') then
    raise exception 'FAIL: expired past-due grace period was accepted';
  end if;
  execute 'reset role';

  -- Expert gating.
  update public.billing_config set paywall_enabled = false where singleton;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  v_result := public.submit_result(
    gen_random_uuid(), 'noughts-and-crosses', 'expert', 'win', null, 0
  );
  if (v_result ->> 'points_awarded')::integer < 1 then
    raise exception 'FAIL: expert result failed with paywall disabled';
  end if;
  select count(*) into v_count
  from public.game_results
  where user_id = v_user_a and difficulty = 'expert' and flagged = true;
  if v_count <> 0 then raise exception 'FAIL: paywall-off expert result was flagged'; end if;

  execute 'reset role';
  update public.billing_config set paywall_enabled = true where singleton;
  execute 'set local role authenticated';
  v_result := public.submit_result(
    gen_random_uuid(), 'noughts-and-crosses', 'expert', 'win', null, 0
  );
  select count(*) into v_count
  from public.game_results
  where user_id = v_user_a and difficulty = 'expert' and flagged = true;
  if v_count <> 1 then raise exception 'FAIL: unentitled expert result was not flagged'; end if;

  execute 'reset role';
  execute 'set local role service_role';
  v_claim := public.claim_stripe_event('evt_expert_' || v_user_a::text, 'customer.subscription.created');
  if v_claim <> 'claimed' then raise exception 'FAIL: expert event was not claimed'; end if;
  perform public.apply_entitlement_changes(jsonb_build_array(jsonb_build_object(
    'user_id', v_user_a, 'feature', 'expert_access',
    'source', 'stripe_subscription', 'status', 'active',
    'stripe_subscription_id', 'sub_expert_verify',
    'granted_at', now(), 'current_period_end', now() + interval '30 days'
  )));
  perform public.complete_stripe_event('evt_expert_' || v_user_a::text, true);
  execute 'reset role';
  execute 'set local role authenticated';
  if not public.has_entitlement('expert_access') then
    raise exception 'FAIL: active expert entitlement was not recognized';
  end if;
  v_result := public.submit_result(
    gen_random_uuid(), 'noughts-and-crosses', 'expert', 'win', null, 0
  );
  select count(*) into v_count
  from public.game_results
  where user_id = v_user_a and difficulty = 'expert' and flagged = true;
  if v_count <> 1 then raise exception 'FAIL: entitled expert result was flagged'; end if;

  execute 'reset role';
  for v_event_marker in
    select p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('latrunculi_admin_metrics', 'claim_stripe_event',
                        'complete_stripe_event', 'apply_entitlement_changes')
      and (
        has_function_privilege('anon', p.oid, 'execute')
        or has_function_privilege('authenticated', p.oid, 'execute')
      )
  loop
    raise exception 'FAIL: client role can execute %', v_event_marker;
  end loop;
end;
$$;

rollback;

do $$ begin raise notice 'All billing and admin SQL tests passed.'; end $$;