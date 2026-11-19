# Runbook (Phase 8)

## Roll back
- **Frontend:** Cloudflare dashboard, the project, Deployments, pick the last good one, Rollback.
- **Worker:** Worker, Deployments (Versions), pick the previous one, Rollback. CLI: `cd worker && npx wrangler rollback`.
- **Database:** migrations are forward-only. Write a new corrective migration; restore a backup only for data loss.

## Rotate keys
- **Supabase service-role key:** Supabase, Project Settings, API Keys, rotate. Then
  `cd worker && npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY`. Verify `/api/health`.
- **Turnstile secret:** Cloudflare, Turnstile, rotate the secret. Update `npx wrangler secret put TURNSTILE_SECRET`
  and, if CAPTCHA is on, the secret in Supabase Auth, Attack Protection.
- Rotate any key that appeared in a log, screenshot or chat.

## Find and remove a cheater's results
Run in the Supabase SQL editor (service role). Flagged results disappear from leaderboards.
```sql
-- who has implausible results
select user_id, count(*) from public.game_results where flagged group by 1 order by 2 desc limit 20;

-- flag everything from one user
update public.game_results set flagged = true where user_id = '<uuid>';

-- or wipe their stats and results entirely
delete from public.game_stats where user_id = '<uuid>';
delete from public.game_results where user_id = '<uuid>';
```

## Leaderboards flooded
1. Find the window and the users: `select user_id, count(*) from public.game_results where created_at > now() - interval '1 hour' group by 1 order by 2 desc;`
2. Flag them with the update above.
3. Tighten `worker/src/rules.ts` or the Worker rate limits and redeploy.

## Worker logs
Cloudflare, the Worker, Logs. Events: `accepted`, `rejected` (reason code), `upstream_error`, `misconfigured`, `unhandled`.
Alert on a spike in `upstream_error` or `unhandled`.
