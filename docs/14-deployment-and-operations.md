# 14. Deployment and Operations

Version 1.0, 10 Nov 2026. Owner: Engineering.

`HANDOFF.md` at the repo root holds the short step-by-step deploy checklist; this document is the reference behind it.

## 1. Repository

- GitHub repository `spencertownley-sys/project-dashboard`; default branch `main`.
- `main` is always deployable. Work happens on short branches with pull requests; Vercel builds a preview for each.
- Committed: source, `/drizzle` migrations, `data/inventory.json`, `.env.example`, `vercel.json`, `docs/`, `CLAUDE.md`, `HANDOFF.md`. Ignored: `.env*.local`, `.data/` (PGlite, including `.data/e2e`), `node_modules`, `.next`, Playwright output.

## 2. Environments

| Environment | Where | Database | Auth mode | Sync |
|---|---|---|---|---|
| Local development | `npm run dev` | PGlite at `PGLITE_DIR` (default `.data/pglite`), migrated and seeded on first request | `open` without keys, `clerk` with keys in `.env.local` | Sync now or `npm run sync` with local tokens |
| Unit and database tests | Vitest, CI | In-memory PGlite | n/a (pure functions; actions not called) | Adapters with fake `fetch` |
| E2E | Playwright: `next build` then `next start -p 3100` | PGlite at `.data/e2e`, wiped first | `open` via `ALLOW_NO_AUTH=1` | Not run (cron returns 401) |
| Preview | Vercel preview per PR | Neon preview branch if the integration's branching is enabled, else the production database (decision: enable branching) | `clerk` | Cron runs only on production |
| Production | Vercel production (`main`) | Neon | `clerk` | Vercel Cron daily `23 13 * * *` UTC |

## 3. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Production, Preview (set by the Neon integration) | Postgres connection. Unset locally means PGlite. Required whenever `VERCEL` is set. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production, Preview | Clerk frontend key |
| `CLERK_SECRET_KEY` | Production, Preview | Clerk backend key |
| `OWNER_EMAILS` | With Clerk | Comma-separated owner emails; empty denies everyone |
| `CRON_SECRET` | Production (Phase 2) | Bearer secret Vercel Cron sends; unset makes the cron route always 401 |
| `GITHUB_TOKEN` | Optional | GitHub adapter; skipped when unset |
| `VERCEL_TOKEN` | Optional | Vercel adapter; skipped when unset |
| `VERCEL_TEAM_ID` | Optional | Team scope for the Vercel API |
| `SUPABASE_ACCESS_TOKEN` | Optional | Supabase adapter; skipped when unset |
| `ALLOW_NO_AUTH` | Never in production | `1` runs a production build without Clerk (used by the e2e run) |
| `PGLITE_DIR` | Optional | PGlite directory; `memory` for in-memory |

Phase 3 adds `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `RAILWAY_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

`.env.example` lists every Phase 1 and 2 name with a one-line comment and no values.

## 4. Vercel configuration

- Framework preset Next.js. `vercel.json`:

```json
{
  "buildCommand": "npm run vercel-build",
  "crons": [{ "path": "/api/cron/sync", "schedule": "23 13 * * *" }]
}
```

- `vercel-build` = `npm run db:migrate && npm run db:seed && next build`: apply migrations to Neon, seed if the projects table is empty, build. The seed is a no-op on every deploy after the first.
- Storage: add Neon Postgres from the Marketplace and connect it to the project; it sets `DATABASE_URL`.
- The cron route sets `maxDuration = 60`.
- No custom domain is needed for Phases 1 and 2; the `*.vercel.app` URL works with Clerk development keys.

## 5. Database operations

### 5.1 Migrations

1. Change `lib/db/schema.ts`.
2. `npm run db:generate` writes a new SQL file under `/drizzle`. Review and commit it. Never edit generated SQL by hand.
3. Locally, PGlite applies it on next open (or run `npm run db:migrate`).
4. Push; the Vercel build applies it to Neon before `next build`.

Rules: migrations are additive (new tables, nullable columns, new enum values) so the previous deployment keeps working during rollout and after an instant rollback. Destructive changes need two releases (stop using, then drop).

### 5.2 Seeding

- Production: automatic on the first deploy via `vercel-build`. Manual equivalent: `DATABASE_URL="<Neon URL>" npm run db:seed`.
- The seed only runs into an empty projects table, so it never overwrites edits. Once a database has rows, edits happen in the app.
- If production is ever wiped, the next deploy reseeds the 10 Nov 2026 audit; re-enter later edits.

### 5.3 Local reset

Stop the dev server, delete `.data/pglite`, start it again (it migrates and seeds itself).

## 6. Clerk configuration

1. Create a dedicated application (separate from the shared dev instance other projects use); enable email code and Google.
2. Restrict sign-ups; keep only the owner's account.
3. Copy the keys to Vercel (Production and Preview) and optionally `.env.local`.
4. Set `OWNER_EMAILS` to the owner's sign-in email.
5. When a custom domain is chosen: create the production instance, add Clerk's DNS records, swap the keys.

## 7. Continuous integration

`.github/workflows/ci.yml`, on push to `main` and on pull requests, Ubuntu, Node 22 with npm cache:

| Step | Command |
|---|---|
| Install | `npm ci` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` (`next typegen && tsc --noEmit`) |
| Unit and database tests | `npm test` |
| Browsers | `npx playwright install --with-deps chromium` |
| E2E smoke | `npm run test:e2e` with `CI=1` (builds the app, starts it on a fresh PGlite, runs desktop and phone projects) |

The e2e step performs the production build, so it covers the spec's "build" check. CI needs no secrets and no database service.

## 8. Monitoring

| Signal | Where | Action |
|---|---|---|
| Sync health | Overview header ("Last sync … with errors"), Sync now result, `sync_runs` | Read the source `message`; fix the token or link field |
| Cron delivery | Vercel dashboard, Cron Jobs tab; 207 responses mean partial errors | Check for missed runs |
| Runtime errors | Vercel runtime logs | Investigate |
| Uptime | `GET /api/health` (liveness only) | Database problems show as page errors |
| Neon usage | Neon console via Vercel | Free plan limits |

No paging; the owner checks the Overview daily.

## 9. Backups and recovery

- Neon point-in-time restore (window depends on the plan) for accidental data loss.
- Before a risky migration: `pg_dump "$DATABASE_URL" > backup-YYYYMMDD.sql`.
- Last resort: new Neon database, redeploy (migrate and seed from the audit), re-enter changes; signals refill on the next sync.

## 10. Runbooks

### 10.1 Owner sees "This dashboard is private"

Add the sign-in email to `OWNER_EMAILS` in Vercel (case does not matter), then redeploy (env changes apply to new deployments).

### 10.2 Every page shows "Sign-in isn't set up yet"

Production has no Clerk keys (or only one). Add both and redeploy. Do not set `ALLOW_NO_AUTH` in production.

### 10.3 Sync errors

| Message | Fix |
|---|---|
| Needs you: "GitHub repo not found or not readable with the sync token" | Fix `github_repo` in the edit form, or grant the token that repo (NestCraft is private) |
| `HTTP 401 from api.github.com/...` | Token expired or revoked; create a new fine-grained token, update Vercel env, redeploy |
| `HTTP 404 from api.vercel.com/v9/projects/...` | Check `vercel_project` and `VERCEL_TEAM_ID` |
| Signal chip "Supabase not found" on a project | Fix `supabase_ref` |
| `HTTP 403` or `429` from GitHub | Rate limit; wait (should not happen at this volume) |

### 10.4 Cron not running

Check `CRON_SECRET` is set (401 otherwise), the job appears in Cron Jobs, and the latest production deployment includes `vercel.json`. Trigger by hand: `curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/sync`.

### 10.5 Rotate secrets

Change the value at the provider and in Vercel env; redeploy. `CRON_SECRET` is one variable used by both sides.

### 10.6 Build fails at migrate

"DATABASE_URL is not set. Add a Postgres database …": the Neon integration is not connected for this environment. Reconnect it. A SQL error: fix the schema and generate a new migration.

## 11. Local development

```
npm install
npm run dev          # http://localhost:3000, PGlite migrated and seeded on first request, no sign-in
npm test             # unit and database tests
npm run test:e2e     # build + smoke tests on a fresh database
npm run sync         # one sync from the command line (needs tokens in .env.local or the shell)
```

## 12. Cost

| Service | Plan | Expected cost |
|---|---|---|
| Vercel | Hobby | 0 (one daily cron, low traffic) |
| Neon | Free via Vercel Marketplace | 0 (a few MB) |
| Clerk | Free | 0 (one user) |
| GitHub, Vercel, Supabase APIs | Included | 0 |
| Claude API (Phase 3) | Pay as you go | Weekly review cost ceiling to be set (open question) |
