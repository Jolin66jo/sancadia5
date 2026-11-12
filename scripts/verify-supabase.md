# Supabase verification

## Admin migration audit

- `admin_content` is created once by the LATRUNCULI admin migration. RLS is enabled. Its only row policy is published-only SELECT for `anon` and `authenticated`; table privileges are revoked from `PUBLIC`, `anon`, and `authenticated`, and all privileges are granted to `service_role`.
- The admin migration creates no views. It adds `match_mode` to the existing `game_results` table; the table and `profiles` originate in the earlier profiles/results migration.
- The seven-argument `submit_result` overload is executable by `authenticated` only after the security migration. `latrunculi_admin_metrics(integer)` is executable by `service_role` only; execute is revoked from `PUBLIC`, `anon`, and `authenticated`.
- `admin_content_set_updated_at` calls the pre-existing `set_updated_at()` trigger function. No duplicate profiles or results tables are introduced.
- The metrics function reads `game_results.created_at` and `profiles.created_at`; both columns are defined by the earlier profiles/results migration.
- No migration grants access based on `raw_user_meta_data`. The Edge Function checks IDs against `ADMIN_USER_IDS` and uses its server-side service-role client for database writes.

## From-empty local validation

Start the local stack and reset twice; each reset recreates the local database and applies every migration:

```sh
npx supabase start
npx supabase db reset
npx supabase db reset
npx supabase db lint
```

Run every SQL test file using the local Postgres container:

```sh
db_container="$(docker ps --filter 'name=supabase_db_' --format '{{.Names}}' | head -n 1)"
test -n "$db_container"
for test_file in supabase/tests/*.sql; do
  docker exec -i "$db_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$test_file"
done
```

The test files use transactions and roll their fixtures back. The two-user tests create real local `auth.users` rows and run requests as `anon`, `authenticated`, and `service_role`.

## Publishable-key live verification

Create two throwaway test accounts in the target project. Supply only the public project URL, publishable key, and those test accounts' credentials. Do not supply a service-role key:

```sh
export SUPABASE_URL='https://<project-ref>.supabase.co'
export SUPABASE_PUBLISHABLE_KEY='<publishable-key>'
export VERIFY_USER_A_EMAIL='<throwaway-a-email>'
export VERIFY_USER_A_PASSWORD='<throwaway-a-password>'
export VERIFY_USER_B_EMAIL='<throwaway-b-email>'
export VERIFY_USER_B_PASSWORD='<throwaway-b-password>'
node scripts/verify-supabase.mjs
node scripts/check-secret-hygiene.mjs
```

The publishable-key script checks cross-user reads, denied direct writes to stats/results/billing tables, rejection of an unknown game, and leaderboard response columns. The SQL tests cover cases that require privileged setup, including a real cross-user entitlement row and billing-event replay.

The secret-hygiene script scans the working tree and `dist/` when present. It checks for secret-key prefixes, privileged service-role JWTs, service-role key assignments, and secret-like `VITE_` assignments. It ignores `.git`, `node_modules`, and Supabase CLI's generated `.temp` directory.

## Pre-push checklist

1. Take a database backup.
2. Verify the linked target is the intended `sancadi5` project and apply the reviewed migrations with `supabase db push`.
3. Re-run the verification script against the live project using throwaway test users and the publishable key only.
4. Delete the throwaway users and any associated test data after verification.
5. Never push service-role or Stripe secrets; configure them only in the trusted server/Edge Function environment when those integrations are implemented.
