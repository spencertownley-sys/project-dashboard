# 16. Build Guide

Version 1.0, 10 Nov 2026. Owner: Engineering.

This is the implementation sequence for building Project Control Room with Claude Code in this repository. Each step names the documents it depends on, what to produce and how to verify it. Steps are small enough for one session and leave the app runnable. Phase 1 and Phase 2 steps are checked because they were built on 10 Nov 2026; Phase 3 steps are open.

Read `CLAUDE.md` (agent rules) and `HANDOFF.md` (current state) at the repository root first.

## Phase 1: Seeded dashboard

### Step 1.1: Scaffold

- [x] Next.js 16.4 App Router, React 19, TypeScript strict, ESLint (`eslint-config-next`), `@/*` alias.
- [x] Dependencies: `@clerk/nextjs`, `drizzle-orm`, `postgres`, `@electric-sql/pglite`, `geist`, `zod`, `server-only`; dev: `drizzle-kit`, `tailwindcss`, `@tailwindcss/postcss`, `tsx`, `vitest`, `@playwright/test`.
- [x] Scripts from document 05, section 6; `typecheck` runs `next typegen` first.
- [x] `next.config.ts`: `serverExternalPackages: ["@electric-sql/pglite"]` and security headers (document 05, section 10).
- [x] `.env.example` with every Phase 1 and 2 variable (document 14, section 3); `.gitignore` covers `.data/` and `.env*.local`.
- Verify: `npm run dev` serves a page; `npm run lint` and `npm run typecheck` pass.

### Step 1.2: Design tokens and shell (document 09)

- [x] `app/globals.css`: Tailwind import, the mockup's three token blocks verbatim, component classes ported from the mockup, app additions (`.btn`, `.field`, `.sig`, `.center`).
- [x] Geist and Geist Mono via the `geist` package on `<html>`.
- [x] `components/Shell.tsx` (top bar, brand, footer), `Nav.tsx` (tabs with `aria-current`), `ui.tsx` (`Bar`, `Pill`, `SectionHead`).
- Verify: every tab renders in light and dark (OS setting) with no raw colors in components.

### Step 1.3: Database (document 06)

- [x] `lib/db/schema.ts` with the nine tables and `project_status` enum; `npm run db:generate` produced `drizzle/0000_init.sql`.
- [x] `lib/db/index.ts`: `createDb` (postgres-js or PGlite, PGlite self-migrating), `getDb` (memoized, seeds local PGlite when empty), `migratePostgres`; fail fast on Vercel without `DATABASE_URL`.
- [x] `scripts/migrate.ts`.
- Verify: `npm run db:migrate` creates `.data/pglite`; a Vitest file opens `createDb({ pgliteDir: "memory", url: "" })`.

### Step 1.4: Seed (documents 06 section 5, 13)

- [x] `lib/db/seed.ts`: `seed`, `seedIfEmpty`, `githubRepoFor`, `matchProject`, resource links for TaskParty, NimbusWatch and Chronologue, housekeeping group mapping, settings `hours_per_week` and `supabase_free_limit`.
- [x] `scripts/seed.ts`; `vercel-build` runs migrate, seed, build.
- Verify: seed tests (26 projects, links, idempotent, Strata to `Database`, PromoVault null).

### Step 1.5: Auth (document 08)

- [x] `lib/auth-core.ts` (`authMode`, `ownerEmails`, `isOwnerEmail`) and `lib/auth.ts` (`requireOwner` with redirects).
- [x] `proxy.ts`: Clerk in clerk mode, rewrite to `/setup` (503) in closed mode, pass-through in open mode.
- [x] `app/layout.tsx` adds `ClerkProvider` only in clerk mode; `/sign-in`, `/not-authorized`, `/setup` pages; `UserMenu`.
- [x] `lib/page.ts` `load()` used by every page; `(app)/layout.tsx` calls `requireOwner()`.
- Verify: auth unit tests; manual check of all three modes.

### Step 1.6: Rules (document 11)

- [x] `lib/metrics.ts`: `finishScore`, `isActive`, `daysSince`, `isStale`, `focusLanes`, `planQueue`, `addWeeks`, `portfolioSummary`, `hoursAfterToggle`, `fmtDate`, status labels and order.
- [x] `lib/alerts.ts` `buildAlerts` (notes now; sync alerts read signals once Phase 2 writes them).
- [x] `lib/queries.ts` read functions and settings helpers.
- Verify: `tests/metrics.test.ts` passes.

### Step 1.7: Overview (document 10 section 2)

- [x] KPI strip, three lanes with first open step, Needs you panel, last-sync line and Sync now slot.
- Verify: seed lanes and KPIs match document 11, sections 2 and 3.

### Step 1.8: Projects table (document 11 section 5)

- [x] `components/ProjectsTable.tsx`: nine filters, search, six sortable columns with `aria-sort`, empty state.
- Verify: e2e "projects table filters and opens a project".

### Step 1.9: Project detail and edit (document 10 section 4)

- [x] Header meter, where it lives, sessions (add, delete), architecture, linked components, documents, risks and needs.
- [x] `StepList` (optimistic tick and delete), add-step form; ideas add and delete.
- [x] `EditProjectForm` with `useActionState`; `updateProject` zod schema (document 07, section 5.1).
- Verify: e2e step toggle (6 → 5.5 → 6 h) and edit form ("Saved", 75%).

### Step 1.10: Infrastructure (document 10 section 5)

- [x] Provider cards in seed order, constant subtitles, Supabase capacity meter from settings or component notes, project links.
- Verify: e2e shows "2 of 2 active".

### Step 1.11: Planner (document 11 section 7)

- [x] `components/Planner.tsx`: slider (saved on release), queue with ETAs, move, remove, add-to-queue, timeline bars and ticks.
- [x] Actions `saveQueue`, `addToQueue`, `removeFromQueue`, `setHoursPerWeek`.
- Verify: e2e reorder persists across reload.

### Step 1.12: Ideas and Housekeeping (document 10 sections 7 and 8)

- [x] Ideas: feature panels by value for active projects; parking lot with add, star, delete.
- [x] Housekeeping: three groups, Approve, Skip, Undo, pending count.
- Verify: e2e add idea; e2e approve and undo.

### Step 1.13: Health, tests and CI (documents 14, 15)

- [x] `GET /api/health` returning `{ ok: true }`.
- [x] Vitest config, `tests/metrics.test.ts`, `tests/db.test.ts`; Playwright config (build, start on 3100, `ALLOW_NO_AUTH=1`, fresh `.data/e2e`, desktop and phone) and `e2e/smoke.spec.ts`.
- [x] `.github/workflows/ci.yml`: lint, typecheck, test, e2e.
- Verify: CI green.

Phase 1 exit: document 04, section 2.

## Phase 2: Live sync

### Step 2.1: Sync core (document 12 sections 1, 2, 6)

- [x] `lib/sync/types.ts` (`AdapterResult`, `getJson`, `HttpError`, `pool`) and `lib/sync/index.ts` `runSync(db, env, fetch)`: skip without token, store signals by upsert, update `last_push` and settings, record `sync_runs`.
- Verify: "skips sources without tokens and records the run".

### Step 2.2: GitHub adapter (document 12 section 3)

- [x] Repo metadata (404 to `repo.missing`), open PRs, default-branch check runs with `ciConclusion`; concurrency 4.
- Verify: CI roll-up unit test; fake-fetch database test.

### Step 2.3: Vercel adapter (document 12 section 4)

- [x] Resolve project, latest production deployment, `deployment` signal; optional team id; concurrency 3.

### Step 2.4: Supabase adapter (document 12 section 5)

- [x] Account project list, `project` signal per linked ref, `supabase_active_count` and `supabase_projects` settings.

### Step 2.5: Cron, Sync now, CLI (document 12 section 8)

- [x] `GET /api/cron/sync` with constant-time bearer check, `maxDuration = 60`, 200 or 207.
- [x] `vercel.json` cron `23 13 * * *`; `runSyncNow` action and `SyncButton`; `scripts/sync.ts`.
- Verify: e2e cron 401 without bearer; manual `curl` with the secret.

### Step 2.6: Alerts and signals UI (document 11 section 4)

- [x] `buildAlerts` for CI failure, repo missing, deploy error, Supabase paused; Needs you and KPI count.
- [x] `components/Signals.tsx` on the detail page with observed time.
- Verify: fake-fetch test raises CI, database and repo alerts.

### Step 2.7: Deploy

- [ ] Vercel project, Neon integration, Clerk app, `OWNER_EMAILS`, `CRON_SECRET`, tokens (`HANDOFF.md`, document 14). Not yet deployed on 10 Nov 2026; this is an owner action, not a code step.

Phase 2 exit: document 04, section 2.

## Phase 3: AI assist and more sources (planned)

### Step 3.1: Close the spec gaps from Phases 1 and 2

- [ ] Decide the open questions in document 02, section 9.2: primary-email-only owner check, pct 0 score, starring feature ideas.
- [ ] Add the missing tests in document 15, section 6 (server actions, not-owner and closed mode, cron 200/207, exact seed counts).

### Step 3.2: Proposals schema

- [ ] Add `review_proposals` and `plans` (document 06, section 7) to `lib/db/schema.ts`; `npm run db:generate`; additive migration.

### Step 3.3: Weekly Claude review (document 12 section 9.3)

- [ ] `lib/review/` gathering README, docs listing and 7 days of commits through the GitHub token; a Messages API call with a JSON tool schema; proposals stored as pending; token usage recorded.
- [ ] `GET /api/cron/review` (bearer `CRON_SECRET`) and a weekly cron `47 14 * * 1` in `vercel.json`.
- [ ] Env `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` in `.env.example` and document 14.
- Verify: unit tests with a fake Anthropic client; a manual run on two projects.

### Step 3.4: Review screen

- [ ] Proposals list per project with rationale; `acceptProposal` applies through the existing update paths; `rejectProposal`.
- Verify: accepting a pct proposal changes the meter; rejecting changes nothing.

### Step 3.5: Monday plan draft

- [ ] Plan generation from lanes, queue head, Needs you and accepted proposals; Overview card with `dismissPlan`.

### Step 3.6: Railway adapter (document 12 section 9.1)

- [ ] `projects.railway_service`, `RAILWAY_TOKEN`, GraphQL deployment status and branch; alerts for failed or crashed deploys and branch drift.

### Step 3.7: Cloudflare adapter (document 12 section 9.2)

- [ ] `projects.cloudflare_resources`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; Workers, D1, R2, Pages signals and alerts.

### Step 3.8: Polish backlog

- [ ] Star toggle for feature ideas, manual theme toggle, loading skeletons, "Now building" feed idea for the personal site (needs a public read endpoint; decide first).

## Working agreements for Claude Code sessions

1. Start by reading `CLAUDE.md`, `HANDOFF.md` and the documents named in the step. Read the matching guide in `node_modules/next/dist/docs/` before writing framework code.
2. Never skip `requireOwner()` in a page or action.
3. Change the schema only in `lib/db/schema.ts`, then `npm run db:generate`. Never edit generated SQL by hand.
4. Keep `lib/metrics.ts` and `lib/alerts.ts` free of I/O; adapters take an injectable `fetch`.
5. Colors only from tokens; no secrets, tokens or personal email addresses in code, seeds or docs.
6. Before pushing: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:e2e` when UI or actions changed.
7. When the implementation deviates from these documents, update the document in the same change.
