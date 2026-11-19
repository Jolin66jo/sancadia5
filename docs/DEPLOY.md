# Deploying Sancadia

- Domain: sancadia.com (DNS on Cloudflare).
- Frontend: Cloudflare project built from GitHub. Build `npm run build`, output `dist`, production branch `main`.
- Worker: `worker/` deployed as its own Worker (`sancadia-api`), routed at `sancadia.com/api/*`.
- Database: one Supabase project (`sancadi5`). There is no separate dev project.

## Frontend variables
| Variable | Type | Production | Preview |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Variable | project URL | leave empty (previews run local-only) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` (use the name in `.env.example`) | Variable | publishable key | leave empty |
| `VITE_TURNSTILE_SITE_KEY` | Variable (it is public) | site key | leave empty |
| `VITE_API_BASE` | Variable | empty (same domain) | URL of a dev Worker, or empty |

Never put a service-role key, `sb_secret_` value or Turnstile secret in any `VITE_` variable.

## Worker
Vars in `worker/wrangler.toml`: `SUPABASE_URL`, `ALLOWED_ORIGINS`.
Secrets (`npx wrangler secret put`): `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET`.

## Order of operations
1. Fix `base` and PWA `start_url`/`scope` to `/`.
2. Domain active on Cloudflare, attached to the frontend.
3. `public/_redirects` and `public/_headers` in place. Refreshing `/games/gomoku` must not 404.
4. Migration `20261119000000_submit_result_trusted.sql` applied (backup first).
5. Worker deployed, route added, `/api/health` shows `configured: true`.
6. Client sends Turnstile tokens (8E wiring).
7. Only then enable CAPTCHA in Supabase Auth.
8. `npm run smoke -- https://sancadia.com`.

## CSP
`_headers` ships a Report-Only CSP. Browse the whole app with the console open, note any
violations, fix them, then rename the header to `Content-Security-Policy`.
