# 05. Technical Architecture

Version 1.0, 10 Nov 2026. Owner: Engineering.

## 1. Summary

Project Control Room is a single Next.js 16.4 application (App Router, React 19, TypeScript strict) deployed on Vercel from the GitHub repository `spencertownley-sys/project-dashboard`. Authentication is Clerk, restricted to the owner's email addresses. Data lives in Postgres accessed through Drizzle ORM from server code only: Neon in production (provisioned through the Vercel Marketplace), a PGlite file database locally, and in-memory PGlite in tests. A daily Vercel Cron job calls a sync route that reads GitHub, Vercel and Supabase and writes signals. There is no client data-fetching library, no background job service and no component library.

```
+-------------------------------------------------------------+
|  Browser: Server Component HTML + small Client Components   |
|  (ProjectsTable, StepList, EditProjectForm, Planner,        |
|   SyncButton, Nav)                                          |
+-----------------------------+-------------------------------+
                              | HTTPS: page requests, server actions
+-----------------------------v-------------------------------+
|  Vercel: Next.js 16.4 App Router (Node runtime)             |
|  - proxy.ts: clerkMiddleware | rewrite to /setup | pass     |
|  - lib/page.ts load(): requireOwner() + getDb()             |
|  - Server Components read via lib/queries.ts                |
|  - app/actions.ts: server actions, each requireOwner()      |
|  - lib/metrics.ts: score, lanes, planner, summary (pure)    |
|  - lib/alerts.ts: needs notes + sync alerts (pure)          |
|  - /api/health, /api/cron/sync (bearer CRON_SECRET)         |
|  - lib/sync: github.ts, vercel.ts, supabase.ts              |
+--------+-------------------+--------------------+-----------+
         |                   |                    |
+--------v--------+  +-------v-------+   +--------v-----------+
| Neon Postgres   |  | Clerk         |   | Provider APIs      |
| (DATABASE_URL)  |  | sessions,     |   | api.github.com     |
| Drizzle +       |  | email list    |   | api.vercel.com     |
| postgres-js     |  +---------------+   | api.supabase.com   |
+-----------------+                      +--------------------+
         ^
         |  Vercel Cron 23 13 * * * UTC -> GET /api/cron/sync
```

## 2. Stack and versions

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.4 App Router, React 19, TypeScript strict | Middleware is `proxy.ts` (Node runtime by default). `params` and `searchParams` are Promises; pages use the generated `PageProps<"/route">` type (`next typegen` runs inside `npm run typecheck`). Turbopack is the default for `dev` and `build`. Read `node_modules/next/dist/docs/` before writing framework code. |
| Styling | Tailwind CSS 4 (`@tailwindcss/postcss`) plus CSS custom-property tokens in `app/globals.css` | Tokens copied verbatim from the mockup `:root` block (light and dark). Component classes mirror the mockup (`.kpis`, `.qcard`, `.pill`, `.prov`, `.queue`). No component library. |
| Fonts | Geist and Geist Mono from the `geist` package (`geist/font/sans`, `geist/font/mono`) | Exposed as CSS variables and used by `--f-ui` and `--f-mono` (document 09). |
| Auth | Clerk, `@clerk/nextjs` 7 | Owner-only by email allow-list. Loaded with dynamic imports so the app runs without keys. |
| ORM | Drizzle ORM 0.45, drizzle-kit 0.31 | Schema in `lib/db/schema.ts`; generated SQL in `/drizzle` (initial migration `0000_init.sql`). |
| Production driver | `postgres` (postgres-js) | `postgres(DATABASE_URL, { max: 5, prepare: false })`; `prepare: false` keeps pooled Neon URLs safe. |
| Local and test driver | `@electric-sql/pglite` with `drizzle-orm/pglite` | File database at `PGLITE_DIR` (default `.data/pglite`) when `DATABASE_URL` is unset; `PGLITE_DIR=memory` (or `pgliteDir: "memory"`) for in-memory. Listed in `serverExternalPackages` so its WASM loads from `node_modules`. |
| Validation | zod 4 in `app/actions.ts` | Form data is parsed with zod schemas (document 07). |
| Tests | Vitest 5 (unit and PGlite integration), Playwright (smoke, desktop and phone) | Document 15. |
| CI | GitHub Actions: lint, typecheck, unit tests, e2e (the e2e step builds the app) | Document 14. |
| Hosting | Vercel, Vercel Cron | `vercel.json` sets `buildCommand: npm run vercel-build` and the cron. |
| Package manager | npm, Node.js 22 (CI) | |

## 3. Key decisions

### Decision 1: One Next.js app with server actions, no API layer

Alternatives: a separate API service; route handlers for every mutation.
Reason: one user, one client. Server actions give typed mutations with no fetch code and work as plain `<form action>` targets. Only two route handlers exist, for health checks and cron, because machines call them.

### Decision 2: Neon through the Vercel Marketplace, not Supabase

Alternatives: Supabase (the owner's usual choice), a YAML file in the repo edited by pull request.
Reason: the Supabase free plan is full (2 of 2 active projects: `allclear` and `TaskParty`). Neon provisions from Vercel and injects `DATABASE_URL`. Editing from the app is a decided requirement. Any Postgres works through `DATABASE_URL`.

### Decision 3: PGlite for local development and tests, self-migrating and self-seeding

Reason: zero setup. On a fresh clone `npm run dev` works with no environment variables: the first `getDb()` call opens PGlite, applies `/drizzle` migrations, and loads `data/inventory.json` if the projects table is empty. Tests run real Postgres semantics (arrays, jsonb, enums, cascades) in memory. Production Postgres is never auto-migrated or auto-seeded at runtime; that happens in the build (section 6).

### Decision 4: Clerk with an email allow-list instead of roles

Reason: Clerk is already used across the owner's projects and handles sessions and MFA. An allow-list in `OWNER_EMAILS` is the whole permission model (document 08).

### Decision 5: Server-rendered pages, client components only for interaction

Every page under `app/(app)` is a Server Component that starts with `load()` from `lib/page.ts` (owner check, database handle, `today`). Client Components are limited to: `ProjectsTable` (filters, search, sort), `StepList` (tick, delete with `useOptimistic`), `EditProjectForm` (`useActionState`), `Planner` (slider, queue moves), `SyncButton` and `Nav` (active tab). Other mutations (add step, ideas, sessions, housekeeping) are plain forms posting to server actions. Every action ends with `revalidatePath`.

### Decision 6: Derived values are computed, never stored

Finish score, lanes, stale flags, KPIs, Needs you and planner ETAs are pure functions in `lib/metrics.ts` and `lib/alerts.ts` with no I/O. With 26 projects this costs microseconds and removes stale denormalized values. The only stored derived value is `hours_left`, which the owner also edits and step toggles adjust.

### Decision 7: Sync as a plain function with injectable fetch

Alternatives: Inngest, a queue, a worker.
Reason: about 60 HTTP calls per run. `runSync(db, env, fetch)` in `lib/sync/index.ts` is called by the cron route, the `runSyncNow` action and `npm run sync`. Adapters run in sequence (GitHub, Vercel, Supabase); inside an adapter, projects are fetched with a small concurrency pool (4 for GitHub, 3 for Vercel). `env` and `fetch` are parameters so tests pass fakes.

### Decision 8: Single initial migration includes Phase 2 tables

`signals` and `sync_runs` are in `0000_init.sql`, so Phase 1 and Phase 2 were built in parallel from one schema.

## 4. Application structure

```
/app
  layout.tsx                    html, Geist fonts, globals.css, ClerkProvider only in clerk mode
  globals.css                   tokens (light + dark), Tailwind import, mockup component classes
  actions.ts                    'use server': all server actions (document 07)
  not-found.tsx                 "Nothing here"
  /(app)
    layout.tsx                  requireOwner(), then Shell (top bar, tabs, user menu)
    page.tsx                    /                Overview
    /projects/page.tsx          /projects
    /projects/[id]/page.tsx     /projects/[id]
    /infrastructure/page.tsx
    /planner/page.tsx
    /ideas/page.tsx
    /housekeeping/page.tsx
  /sign-in/[[...sign-in]]/page.tsx   Clerk <SignIn /> (redirects to / without Clerk)
  /not-authorized/page.tsx      signed in but not on OWNER_EMAILS
  /setup/page.tsx               production without Clerk keys
  /api/health/route.ts
  /api/cron/sync/route.ts
/components                     Shell, Nav, UserMenu, ProjectsTable, StepList, EditProjectForm,
                                Planner, Signals, SyncButton, ui.tsx (Bar, Pill, SectionHead)
/lib
  auth-core.ts                  authMode(), ownerEmails(), isOwnerEmail() (pure, used by proxy)
  auth.ts                       requireOwner() (server-only; redirects)
  page.ts                       load(): requireOwner + getDb + today
  metrics.ts                    pure rules (document 11)
  alerts.ts                     buildAlerts(): needs notes + sync alerts
  queries.ts                    read functions and settings helpers
  /db/schema.ts                 Drizzle tables and the project_status enum
  /db/index.ts                  createDb(), getDb(), migratePostgres()
  /db/seed.ts                   seed(), seedIfEmpty(), matchProject(), githubRepoFor()
  /sync/index.ts                runSync(): adapters, signal upserts, sync_runs
  /sync/types.ts                AdapterResult, getJson, HttpError, pool
  /sync/github.ts  /sync/vercel.ts  /sync/supabase.ts
/scripts                        migrate.ts, seed.ts, sync.ts (run with tsx)
/drizzle                        generated SQL and meta
/data/inventory.json            audited seed data
/tests                          metrics.test.ts, db.test.ts (Vitest)
/e2e/smoke.spec.ts              Playwright
proxy.ts  next.config.ts  drizzle.config.ts  vercel.json  vitest.config.ts  playwright.config.ts
/docs                           this document set
```

## 5. Request lifecycles

### 5.1 Page render

1. `proxy.ts` computes the auth mode. In `clerk` mode it runs `clerkMiddleware` and calls `auth.protect()` for non-public routes (signed-out visitors go to `/sign-in`). In `closed` mode it rewrites every non-public route to `/setup` with status 503. In `open` mode it passes through.
2. `app/(app)/layout.tsx` calls `requireOwner()`; the page calls `load()`, which calls it again (cheap) and then `getDb()`. `requireOwner()` redirects to `/setup`, `/sign-in` or `/not-authorized` when the visitor is not the owner.
3. The page reads through `lib/queries.ts`, applies `lib/metrics.ts` and renders.

### 5.2 Mutation (tick a step)

1. `StepList` calls `toggleStep(stepId, true)` inside `startTransition` with an optimistic checked state.
2. The action calls `requireOwner()`, then one transaction: read the step; if it is already in that state, stop (idempotent); else set `done` and `done_at`, read the project, and write `hours_left = hoursAfterToggle(...)` and `updated_at`.
3. `revalidatePath('/', 'layout')` refreshes every page, so the meter, score, lanes and planner update.

### 5.3 Sync

1. Vercel Cron sends `GET /api/cron/sync` with `Authorization: Bearer <CRON_SECRET>`.
2. The route compares the header in constant time, opens the database and calls `runSync(db)`.
3. `runSync` inserts a `sync_runs` row, loads link fields for all projects, runs each adapter whose token is set, upserts signals, updates `projects.last_push` and sync settings, and finishes the run row with `ok` and `summary`.
4. The route returns `{ id, ok, summary }` with status 200, or 207 when any source had errors.

## 6. Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Local server on PGlite (auto-migrated and seeded), auth open |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve a build |
| `vercel-build` | `npm run db:migrate && npm run db:seed && next build` | Vercel build command (via `vercel.json`) |
| `lint` | `eslint .` | Lint (eslint-config-next) |
| `typecheck` | `next typegen && tsc --noEmit` | Route types, then strict types |
| `test` | `vitest run` | Unit and database tests |
| `test:e2e` | `playwright test --trace off` | Builds, starts on port 3100 with a fresh PGlite and runs the smoke spec |
| `db:generate` | `drizzle-kit generate` | New SQL migration after a schema change |
| `db:migrate` | `tsx scripts/migrate.ts` | Postgres when `DATABASE_URL` is set, else opens (and so migrates) PGlite |
| `db:seed` | `tsx scripts/seed.ts` | `seedIfEmpty` against the active database |
| `sync` | `tsx scripts/sync.ts` | Seed if empty, run one sync, print the result, exit 1 if not ok |

`scripts/migrate.ts` exits 1 with a clear message when `VERCEL` is set and `DATABASE_URL` is not, and `createDb()` throws the same way at runtime, so a misconfigured deploy never writes to a throwaway PGlite directory.

## 7. Database client

`lib/db/index.ts`:
- `createDb({ url?, pgliteDir? })`: postgres-js when a URL is set; otherwise PGlite (file or `memory`), migrated on open.
- `getDb()`: the shared app database, memoized on `globalThis` so warm serverless invocations and dev hot reloads reuse it. When `DATABASE_URL` is unset it also runs `seedIfEmpty`. A failed open clears the memo so the next request retries.
- `migratePostgres(url)`: applies `/drizzle` with the postgres-js migrator (used by `db:migrate`).

## 8. Performance

26 projects and about 250 child rows mean every page is a handful of queries. Budgets (document 15): Overview server render under 500 ms P95, a server action round trip under 1 s, a full sync under 60 s (`maxDuration = 60` on the cron route).

## 9. Observability

- Vercel runtime logs and the Cron Jobs tab.
- `sync_runs` is the sync audit trail; the Overview header shows the latest run and whether it had errors.
- `/api/health` for uptime checks.
- No analytics or error-tracking service (single user; decision).

## 10. Security overview

Document 08 covers auth. Platform controls:
- Secrets only in Vercel environment variables and `.env.local`; `.env.example` lists names only.
- Provider tokens are read from `process.env` only inside sync code on the server; `lib/auth.ts` and `lib/page.ts` import `server-only`.
- Every page and server action calls `requireOwner()`; inputs are parsed with zod; Drizzle parameterizes all SQL.
- The cron route is public to the proxy and protected by the bearer secret with a constant-time compare.
- `next.config.ts` sends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and `X-Robots-Tag: noindex, nofollow` on every response; the root metadata also sets `robots: noindex`.
- External links use `rel="noopener noreferrer"`; URL entries containing spaces or "(" render as text.
