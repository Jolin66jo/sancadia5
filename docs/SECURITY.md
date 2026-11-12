# Security checklist

## Keys and secrets

- The Supabase project URL and publishable key (legacy `anon` key) are public and may be used by the client. Access is constrained by authentication, grants, and row-level security.
- The Supabase service-role key is secret and bypasses RLS. Keep it on trusted servers only; never put it in browser code or commit it.
- Stripe secret keys, Resend API keys, and Turnstile secret keys are secrets. Store them in server-side environment variables or the deployment secret manager, not client bundles or source control. A Turnstile site key is public; its secret key is not.

## RLS model

- Enable RLS on every table in `public`.
- Grant only the privileges needed for each role; RLS policies are additional row-level controls, not a substitute for grants.
- `games` is publicly readable and has no client write policy.
- `profiles` is readable by its owner only. Other users' display names are exposed through a display-name-only view. Authenticated users may update only their own `display_name`.
- `game_stats`, `game_results`, and imported stats are readable only by their owner and have no client write policies. Trusted writes go through narrowly scoped security-definer functions.
- Admin content is publicly readable only when published. Reports allow authenticated inserts owned by the caller and no client reads or updates.
- Leaderboard views use `security_invoker = false` deliberately: they must aggregate results across users even though the underlying tables are owner-readable. They expose only game ID, display name, points, wins, and rank—never user IDs or emails. Keep their projections and filters narrow.
- The service-role key bypasses RLS; it must never be shipped to clients.

## Billing data flow and table writers

- Billing access is feature-based. Add a feature by inserting one row in `entitlement_features`; `billing_config` is the single place for `paywall_enabled` and the past-due grace period. The default paywall setting is off.
- Clients use the publishable key to read their own `stripe_customers` and `entitlements` rows and may call `has_entitlement(feature)` / `my_entitlements()`. They cannot write `stripe_customers`, `entitlements`, `stripe_events`, features, or billing configuration.
- The future trusted Stripe webhook will insert a `stripe_events` row first and call `apply_entitlement_event` in the same transaction. That service-role-only function records the event and applies an idempotent entitlement grant, update, cancellation, expiration, or refund. No Stripe endpoint is implemented yet.
- Only `service_role` writes `stripe_customers`, `entitlements`, `stripe_events`, `entitlement_features`, and `billing_config`. The later webhook must keep Stripe secrets on the server.
- `submit_result` writes verified `game_results` and `game_stats`; its database trigger flags expert results without `expert_access` when the paywall config is enabled. `admin_content` is written only through the allowlisted admin Edge Function's service-role client. Authenticated users may insert their own abuse reports; they cannot read or modify reports.

When adding a database table:

- RLS is auto-enabled for new `public` tables by `rls_auto_enable()`; also explicitly enable it in the migration and verify it after deployment.
- Do not add client write policies unless the use case is documented and justified.
- Grant only the minimum required privileges; RLS does not replace privilege review.
- Review read policies for data exposure and write policies for ownership and validation.
- Add tests that verify unauthorized clients cannot read or modify the table.
- Document any security-definer view or function and set a fixed `search_path` on security-definer functions.
- Add privileged writes through a validated server-side function instead of weakening client RLS policies.
