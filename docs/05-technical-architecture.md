# 05. Technical Architecture

Version 1.0, 10 Nov 2026. Owner: Engineering.

## 1. Summary

Project Control Room is a single Next.js 16.4 application (App Router, React 19, TypeScript strict) deployed on Vercel from the GitHub repository `project-dashboard`. Authentication is Clerk, restricted to the owner's email addresses. Data lives in Postgres accessed through Drizzle ORM from server code only: Neon in production (provisioned through the Vercel Marketplace), a PGlite file database locally, and in-memory PGlite in tests. A daily Vercel Cron job calls a sync route that reads GitHub, Vercel and Supabase and writes signals. There is no client-side data fetching library, no background job service, and no component library.

```
+-------------------------------------------------------------+
|  Browser: Server Components HTML + small Client Components  |
|  (filters, step checkboxes, planner queue, forms)           |
+-----------------------------+-------------------------------+
                              | HTTPS: page requests, server actions
+-----------------------------v-------------------------------+
|  Vercel: Next.js 16.4 App Router (Node runtime)             |
|  - proxy.ts: clerkMiddleware (when keys present)            |
|  - app/(app)/layout.tsx: owner gate (lib/auth.ts)           |
|  - Server Components read via lib/queries.ts                |
|  - app/actions.ts: 12 server actions, each requireOwner()   |
|  - lib/rules.ts: score, lanes, stale, ETA, step toggle      |
|  - /api/health, /api/cron/sync (bearer CRON_SECRET)         |
|  - lib/sync: github.ts, vercel.ts, supabase.ts              |
+--------+-------------------+--------------------+-----------+
         |                   |                    |
+--------v--------+  +-------v-------+   +--------v-----------+
| Neon Postgres   |  | Clerk         |   | Provider APIs      |
| (DATABASE_URL)  |  | sessions,     |   | api.github.com     |
| Drizzle +       |  | primary email |   | api.vercel.com     |
| postgres-js     |  +---------------+   | api.supabase.com   |
+-----------------+                      +--------------------+
         ^
         |  Vercel Cron 23 13 * * * UTC -> GET /api/cron/sync
```

## 2. Stack and versions

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.4 App Router, React 19, TypeScript strict | Middleware file is `proxy.ts` in Next 16. Route `params` and `searchParams` are Promises; await them. Read `node_modules/next/dist/docs/` before writing framework code. |
| Styling | Tailwind CSS 4 plus CSS custom-property tokens in `app/globals.css` | Tokens copied from the mockup `:root` block, mapped into Tailwind with `@theme inline`. No component library. |
| Fonts | Geist and Geist Mono via `next/font/google` | Exposed as `--f-ui` and `--f-mono` (document 09). |
| Auth | Clerk, `@clerk/nextjs` 7 | Owner-only by primary email. Sign-ups disabled in the Clerk dashboard. |
| ORM | Drizzle ORM 0.45, drizzle-kit for migrations | Schema in `lib/db/schema.ts`; SQL in `/drizzle`. |
| Production driver | `postgres` (postgres-js) | `postgres(DATABASE_URL, { max: 3, prepare: false })` (decision: small pool for serverless; `prepare: false` keeps pooled Neon URLs safe). |
| Local and test driver | `@electric-sql/pglite` with `drizzle-orm/pglite` | File database at `PGLITE_DIR` (default `.data/pglite`) when `DATABASE_URL` is unset; in-memory for tests. |
| Validation | Plain TypeScript guards in `lib/validation.ts` | Decision: no schema library dependency; rules in document 07. |
| Tests | Vitest (unit and PGlite integration), Playwright (smoke) | Document 15. |
| CI | GitHub Actions: lint, typecheck, test, build | Document 14. |
| Hosting | Vercel (Hobby), Vercel Cron | `vercel.json` holds the cron and build command. |
| Package manager | npm | Scripts listed in section 6. Node.js 22 or later (decision). |

## 3. Key decisions

### Decision 1: One Next.js app with server actions, no API layer

Alternatives: a separate API service; route handlers for every mutation.
Reason: one user, one client. Server actions give typed mutations with no fetch code. Only two route handlers exist, for health checks and cron, because those are called by machines.

### Decision 2: Neon through the Vercel Marketplace, not Supabase

Alternatives: Supabase (the owner's usual choice), a YAML file in the repo edited by pull request.
Reason: the Supabase free plan is full (2 of 2 active projects: `allclear` and `TaskParty`). Neon provisions from Vercel in one click and injects `DATABASE_URL`. Editing from the app (not pull requests) is a decided requirement. Any Postgres works through `DATABASE_URL`.

### Decision 3: PGlite for local development and tests

Alternatives: Docker Postgres, a Neon dev branch.
Reason: zero setup. `npm run dev` works on a fresh clone with no environment variables. Tests run real Postgres semantics (arrays, jsonb, enums, cascades) in memory, fast, in CI with no services.

### Decision 4: Clerk with an email allow-list instead of roles

Alternatives: Auth.js with a single credential; Vercel password protection.
Reason: Clerk is already used across the owner's projects, handles sessions and MFA, and gives the primary email directly. An allow-list in `OWNER_EMAILS` is the entire permission model (document 08).

### Decision 5: Server-rendered pages, client components only for interaction

Every page is a Server Component that queries the database at request time (pages read auth state, so they are dynamic). Client Components are limited to: projects filter bar and table sort, step checkboxes and add/delete, edit form, add-session form, planner slider and queue buttons, idea add/star/delete, housekeeping buttons, Sync now. After each server action the action calls `revalidatePath` for affected routes and the client uses `useTransition` or `useOptimistic` for instant feedback.

### Decision 6: Derived values are computed, never stored

Finish score, lanes, stale flags, KPIs, Needs you and planner ETAs are pure functions in `lib/rules.ts` over loaded rows. With 26 projects this costs microseconds and removes any chance of stale denormalized values. The only stored derived value is `hours_left`, which the owner also edits directly and step toggles adjust.

### Decision 7: Sync as a plain function called by cron and by a button

Alternatives: Inngest, a queue, a worker.
Reason: about 80 HTTP calls per run, well under one minute. `runSync()` in `lib/sync/index.ts` is called by the cron route and by the `runSyncNow` action. Adapters run in sequence (GitHub, Vercel, Supabase); inside the GitHub adapter, projects are fetched with a concurrency of 4.

### Decision 8: Single initial migration includes Phase 2 tables

`signals` and `sync_runs` are part of migration `0000`. Phase 1 code ignores them. This keeps Phase 1 and Phase 2 buildable in parallel from one schema.

## 4. Application structure

```
/app
  layout.tsx                 html, fonts, globals.css, ClerkProvider when keys present
  globals.css                tokens (light + dark), Tailwind import, @theme mapping
  actions.ts                 'use server': all 12 server actions
  /(app)
    layout.tsx               owner gate -> top bar + children | not-authorized | setup
    page.tsx                 /            Overview
    /projects/page.tsx       /projects
    /projects/[id]/page.tsx  /projects/[id]
    /infrastructure/page.tsx
    /planner/page.tsx
    /ideas/page.tsx
    /housekeeping/page.tsx
  /sign-in/[[...sign-in]]/page.tsx   Clerk <SignIn />
  /api/health/route.ts
  /api/cron/sync/route.ts
/components                  TopBar, Tabs, StatusPill, Chip, Bar, KpiStrip, LaneCard,
                             NeedsList, ProjectsTable, FilterBar, StepList, EditForm,
                             ProviderCard, CapMeter, Queue, Timeline, IdeaList, HkList,
                             NotAuthorized, SetupRequired
/lib
  env.ts                     typed access to env vars
  auth.ts                    getAuthMode(), getOwner(), requireOwner()
  rules.ts                   pure business rules (document 11)
  queries.ts                 read functions used by pages
  validation.ts              input guards for actions
  /db/schema.ts              Drizzle tables and enums
  /db/client.ts              postgres-js or PGlite by environment
  /sync/index.ts             runSync(): orchestrates adapters, writes sync_runs
  /sync/github.ts  /sync/vercel.ts  /sync/supabase.ts
  /sync/alerts.ts            signals -> Needs you alerts
/scripts
  migrate.ts                 applies /drizzle with the active driver
  seed.ts                    loads data/inventory.json when projects is empty
/drizzle                     generated SQL migrations and meta
/data/inventory.json         audited seed data
/tests/unit  /tests/integration  /e2e/smoke.spec.ts
proxy.ts  drizzle.config.ts  vercel.json  vitest.config.ts  playwright.config.ts
/docs                        this document set
```

## 5. Request lifecycles

### 5.1 Page render

1. `proxy.ts` runs `clerkMiddleware`. Signed-out requests to app routes redirect to `/sign-in`. When Clerk keys are absent it passes through.
2. `app/(app)/layout.tsx` calls `getOwner()`. It returns the owner, or a reason: `not_authorized` (signed in, email not allowed) or `setup_required` (production without keys). The layout renders the not-authorized or setup screen in place of the page.
3. The page calls `lib/queries.ts` (one query per table it needs) and `lib/rules.ts`, then renders.

### 5.2 Mutation (tick a step)

1. The checkbox client component calls `toggleStep({ stepId, done: true })` inside `startTransition`, with an optimistic checked state.
2. The action calls `requireOwner()`, validates input, and runs one transaction: update the step (`done`, `done_at`), then update the project's `hours_left` and `updated_at` (document 11, section 6).
3. The action calls `revalidatePath('/', 'layout')` so the Overview, Projects, detail and Planner all reflect the change, and returns `{ ok: true, data: { hoursLeft } }`.
4. On `{ ok: false }` the client reverts and shows the error inline.

### 5.3 Sync

1. Vercel Cron sends `GET /api/cron/sync` with `Authorization: Bearer <CRON_SECRET>`.
2. The route compares the header in constant time, then calls `runSync()`.
3. `runSync()` inserts a `sync_runs` row (`started_at`), runs each adapter, upserts `signals`, updates `projects.last_push`, the Supabase capacity setting, and finishes the run row with `ok`, `summary`, `error`.
4. The route returns the summary as JSON.

## 6. Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Local server on PGlite, auth open |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve a build |
| `lint` | `eslint .` | Lint |
| `typecheck` | `tsc --noEmit` | Strict types |
| `test` | `vitest run` | Unit and integration |
| `test:e2e` | `playwright test` | Smoke spec |
| `db:generate` | `drizzle-kit generate` | New SQL migration from schema changes |
| `db:migrate` | `tsx scripts/migrate.ts` | Apply migrations to the active database |
| `db:seed` | `tsx scripts/seed.ts` | Load inventory into an empty database |

`scripts/migrate.ts` uses `drizzle-orm/postgres-js/migrator` when `DATABASE_URL` is set and `drizzle-orm/pglite/migrator` otherwise. When `VERCEL` is set and `DATABASE_URL` is not, it exits non-zero with "DATABASE_URL is required on Vercel" so a misconfigured deploy fails at build time instead of writing to a throwaway PGlite directory (decision).

## 7. Database client

`lib/db/client.ts` exports a single `db` created lazily:
- `DATABASE_URL` set: postgres-js client, module-level singleton so warm serverless invocations reuse it.
- Unset: PGlite at `PGLITE_DIR` or `.data/pglite`, created on first use. `.data/` is git-ignored.
- Tests: `createTestDb()` returns in-memory PGlite with migrations applied, one per test file.

Both drivers share the same Drizzle schema; code never branches on the driver after construction.

## 8. Performance

26 projects and about 250 child rows mean every page is a handful of indexed queries. Budgets (document 15): Overview server render under 500 ms P95, a server action round trip under 1 s, a full sync under 60 s (`export const maxDuration = 60` on the cron route). External fetches use a 10 s timeout each.

## 9. Observability

- Vercel runtime logs: every server action and sync logs one structured JSON line (`{ event, ok, ms, error? }`).
- `sync_runs` is the sync audit trail, shown on the Overview.
- `/api/health` for uptime checks.
- No analytics or error-tracking service (single user; decision).

## 10. Security overview

Document 08 covers auth. Platform controls:
- Secrets only in Vercel environment variables and `.env.local`; `.env.example` lists names only.
- Provider tokens read only in `lib/sync`, which is server-only (`import 'server-only'`).
- Every server action calls `requireOwner()` first; inputs validated; Drizzle parameterizes all SQL.
- The cron route is excluded from Clerk and protected by the bearer secret with a constant-time compare.
- External links render with `rel="noopener noreferrer"`; URLs from the database are rendered as text unless they parse as `http(s)`.
