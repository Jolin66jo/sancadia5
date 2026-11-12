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

When adding a database table:

- Enable row-level security (RLS) in the migration and verify it is enabled after deployment.
- Do not add client write policies unless the use case is documented and justified.
- Grant only the minimum required privileges; RLS does not replace privilege review.
- Review read policies for data exposure and write policies for ownership and validation.
- Add tests that verify unauthorized clients cannot read or modify the table.
- Document any security-definer view or function and set a fixed `search_path` on security-definer functions.
- Add privileged writes through a validated server-side function instead of weakening client RLS policies.
