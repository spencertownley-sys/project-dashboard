# 14. Deployment and Operations

Version 1.0, 10 Nov 2026. Owner: Engineering.

## 1. Repository

- GitHub repository `project-dashboard` under the owner's account; default branch `main`.
- `main` is always deployable. Work happens on short branches with pull requests; Vercel builds a preview for each.
- Committed: source, `/drizzle` migrations, `data/inventory.json`, `.env.example`, `vercel.json`, `docs/`. Ignored: `.env*.local`, `.data/` (PGlite), `node_modules`, `.next`, `playwright-report`, `test-results`.

## 2. Environments

| Environment | Where | Database | Auth mode | Sync |
|---|---|---|---|---|
| Local development | `npm run dev` on the owner's machine | PGlite file at `PGLITE_DIR` or `.data/pglite` | `open` (no keys) or `clerk` (keys in `.env.local`) | Manual "Sync now" with local tokens |
| Test | Vitest, CI | In-memory PGlite per test file | Mocked | Adapters with mocked `fetch` |
| E2E | Playwright against `next dev` | PGlite in a temp `PGLITE_DIR`, seeded | `open` | Not run |
| Preview | Vercel preview deployment per PR | Neon preview branch if the integration's branching is enabled; otherwise the production database (decision: enable branching) | `clerk` | Cron does not run on previews |
| Production | Vercel production (`main`) | Neon main branch | `clerk` | Vercel Cron daily `23 13 * * *` UTC |

## 3. Environment variables

| Variable | Required | Environments | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Production, Preview | Set by the Neon Marketplace integration | Postgres connection (pooled URL) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production, Preview | Vercel env | Clerk frontend key |
| `CLERK_SECRET_KEY` | Production, Preview | Vercel env | Clerk backend key |
| `OWNER_EMAILS` | With Clerk | Vercel env | Comma-separated allow-list of primary emails |
| `CRON_SECRET` | Production (Phase 2) | Vercel env | Bearer secret for `/api/cron/sync`; Vercel Cron sends it |
| `GITHUB_TOKEN` | Optional | Vercel env, `.env.local` | GitHub adapter; skipped when unset |
| `VERCEL_TOKEN` | Optional | Vercel env, `.env.local` | Vercel adapter; skipped when unset |
| `VERCEL_TEAM_ID` | Optional | Vercel env, `.env.local` | Team scope for the Vercel API |
| `SUPABASE_ACCESS_TOKEN` | Optional | Vercel env, `.env.local` | Supabase adapter; skipped when unset |
| `ALLOW_NO_AUTH` | Never in production | `.env.local` only | `1` runs a production build without Clerk |
| `PGLITE_DIR` | Optional | Local, E2E | PGlite directory, default `.data/pglite` |

Phase 3 adds `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `RAILWAY_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

`.env.example` lists every Phase 1 and 2 name with an empty value and a one-line comment. `lib/env.ts` reads them; nothing else touches `process.env` except Next.js and Clerk internals.

## 4. Vercel configuration

- Framework preset Next.js; Node.js 22 or later.
- `vercel.json`:

```json
{
  "buildCommand": "npm run db:migrate && next build",
  "crons": [{ "path": "/api/cron/sync", "schedule": "23 13 * * *" }]
}
```

- Install command: Vercel default for npm with the committed `package-lock.json`.
- The cron route sets `maxDuration = 60` (Hobby limit).
- Marketplace: add the Neon integration and connect it to this project. It provisions the database and writes `DATABASE_URL` (and related `PG*` variables, unused) for Production and Preview.
- No custom domain is required for Phases 1 and 2; the `*.vercel.app` URL works with a Clerk development instance.

## 5. Database operations

### 5.1 Migrations

1. Change `lib/db/schema.ts`.
2. `npm run db:generate` writes a new SQL file under `/drizzle` (review it; commit it).
3. `npm run db:migrate` locally applies it to PGlite.
4. Push. The Vercel build runs `npm run db:migrate` against Neon before `next build`.

Rules: migrations are additive (new tables, nullable columns, new enum values) so the previous deployment keeps working during rollout and after an instant rollback. Destructive changes need a two-release plan (stop using, then drop). Never edit a committed migration.

### 5.2 Seeding production

Once, after the first successful deploy:

```
DATABASE_URL="<Neon production URL>" npm run db:seed
```

The seed refuses to do anything if projects exist, so rerunning is safe. It is deliberately not part of the build (decision), so a wiped table is never silently refilled with stale audit data.

### 5.3 Local reset

Delete `.data/pglite`, then `npm run db:migrate && npm run db:seed`.

## 6. Clerk configuration

1. Create the application; enable email code and Google.
2. Restrict sign-ups; add the owner's account.
3. Copy the development instance keys to Vercel (Production and Preview) and `.env.local`.
4. Set `OWNER_EMAILS` to the owner's primary email.
5. When a custom domain is chosen: create the production instance, add the DNS records Clerk lists, swap the keys.

## 7. Continuous integration

GitHub Actions `.github/workflows/ci.yml`, on push to any branch and on pull requests:

| Step | Command |
|---|---|
| Checkout, setup Node 22 with npm cache | `actions/checkout`, `actions/setup-node` |
| Install | `npm ci` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Test | `npm test` (Vitest unit and PGlite integration; no services needed) |
| Build | `npm run build` (no `DATABASE_URL`; pages are dynamic so the build does not query the database) |

CI does not run migrations against any real database and needs no secrets. Playwright runs locally before a release (`npm run test:e2e`); adding it to CI is a Phase 3 backlog item.

## 8. Monitoring

| Signal | Where | Action |
|---|---|---|
| Sync health | Overview sync card and top bar dot (latest `sync_runs` row) | Read `error`, fix the token or link field |
| Cron delivery | Vercel dashboard, Cron Jobs tab | Check for missed runs |
| Runtime errors | Vercel runtime logs (structured JSON lines) | Investigate by `event` |
| Uptime | `GET /api/health` (optional external pinger) | 503 means the database is unreachable |
| Neon usage | Neon console via Vercel | Free plan compute and storage limits |

There is no paging; the owner checks the Overview daily.

## 9. Backups and recovery

- Neon keeps a restore window (point-in-time restore; length depends on the plan). Use it for accidental data loss.
- Before any risky migration: `pg_dump "$DATABASE_URL" > backup-YYYYMMDD.sql` locally.
- Disaster recovery of last resort: create a new Neon database, run migrations, run the seed (restores the 10 Nov 2026 audit), then re-enter changes. Signals refill on the next sync.

## 10. Runbooks

### 10.1 Locked out (not-authorized page for the owner)

1. Read the email shown on the page.
2. In Vercel, set `OWNER_EMAILS` to include exactly that address (case does not matter).
3. Redeploy (env changes apply to new deployments).

### 10.2 Setup page in production

Clerk keys are missing or only one is set. Add both in Vercel (Production) and redeploy. Do not set `ALLOW_NO_AUTH` in production.

### 10.3 Sync shows errors

| Error | Fix |
|---|---|
| `GITHUB_TOKEN rejected` | Token expired; create a new fine-grained token, update Vercel env, redeploy |
| `404 Repository not found or token has no access` | Fix `github_repo` in the edit form, or grant the token that repo |
| `Vercel project not found` | Check `vercel_project` and `VERCEL_TEAM_ID` |
| `Supabase project {ref} not in this account` | Fix `supabase_ref` |
| `Rate limited until ...` | Wait; nothing to do (should not happen at this volume) |
| Run shows "Interrupted" | The function hit 60 s; check provider latency in logs; rerun with Sync now |

### 10.4 Cron not running

Check `CRON_SECRET` is set (503 otherwise), the cron appears in the Vercel Cron Jobs tab, and the latest production deployment includes `vercel.json`. Trigger manually with `curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/sync`.

### 10.5 Rotate secrets

Change the value in the provider and in Vercel env; redeploy. For `CRON_SECRET`, both sides are the same variable, so one change suffices.

### 10.6 Build fails at migrate

"DATABASE_URL is required on Vercel": the Neon integration is not connected to this environment. Reconnect it. A SQL error: fix the migration in a new commit (never edit an applied one).

## 11. Local development

```
npm install
npm run db:migrate      # creates .data/pglite
npm run db:seed         # loads data/inventory.json
npm run dev             # http://localhost:3000, auth disabled
```

Optional `.env.local`: Clerk keys and `OWNER_EMAILS` to test real sign-in; provider tokens to test sync.

## 12. Cost

| Service | Plan | Expected cost |
|---|---|---|
| Vercel | Hobby | 0 (one daily cron, low traffic) |
| Neon | Free via Vercel Marketplace | 0 (a few MB of data) |
| Clerk | Free | 0 (one user) |
| GitHub, Vercel, Supabase APIs | Included | 0 |
| Claude API (Phase 3) | Pay as you go | Weekly review cost ceiling to be set (open question) |
