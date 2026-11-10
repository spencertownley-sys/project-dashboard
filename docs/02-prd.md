# 02. Product Requirements Document

Product: Project Control Room
Version 1.0, 10 Nov 2026
Owner: Product (solo builder)
Status: Approved for build. Phase 1 and Phase 2 in build; Phase 3 planned.

## 1. Overview

### 1.1 Vision

One private page that tells the owner, every morning, where all of their AI-built projects stand, what to work on next, and what is waiting on them.

### 1.2 Problem statement

The owner runs 26 projects across GitHub, Vercel, Railway, Cloudflare, Supabase, GitHub Pages and Claude Code sessions. Status, completion, remaining effort, architecture, infrastructure ownership and blockers are scattered across those tools and the owner's memory. Prioritization is by feel, and failures (broken CI, failed deploys, paused databases) are noticed late. Document 01 has the detail.

### 1.3 Product name

Project Control Room (decided in the approved mockup). Brand mark: the letters "PC" in a 26 px accent square.

### 1.4 Goals

| Goal | Measure | Target |
|---|---|---|
| One source of truth | Projects in the dashboard vs. projects in the audit | 26 of 26 on first seed; every new project added within a week of its first commit |
| Faster decisions | Time from opening the app to choosing the next work item | Under 1 minute |
| Fewer surprises | Failing CI, failed production deploys and paused Supabase projects surfaced in Needs you | Within 24 hours of occurrence (one nightly sync) |
| Honest estimates | Projects with pct, hours and value all set | 22 of 22 active projects by end of Phase 2 (20 of 22 at seed) |
| Finishing | Projects moved to live or archive per month | At least 2 per month, tracked manually |

### 1.5 Non-goals

- Multiple users, teams, roles, invitations or a public share link (owner-only; document 08).
- Issue or ticket tracking at task granularity.
- Taking any action on external systems: no deploys, no archiving repos, no deleting resources. Housekeeping decisions are records only.
- Native mobile apps. The web app is responsive down to 360 px.
- Real-time collaboration, comments, notifications by email or push.
- Reading claude.ai chat Projects (no API). They are a link field the owner fills in.
- Time tracking.

## 2. Persona

**The owner, solo builder.** Builds with Claude Code, 8 to 15 hours a week, across SaaS apps, games and content sites. Comfortable with GitHub, Vercel and Railway dashboards; impatient with tools that need daily upkeep. Opens the dashboard on a laptop in the morning and on a phone in between. Wants transparent formulas they can argue with, and edits estimates when they disagree.

## 3. Scope

### 3.1 Phase 1: seeded dashboard (in build)

Overview (KPI strip, focus lanes, Needs you), Projects table, Project detail with edit form and next steps, Infrastructure, Planner, Ideas, Housekeeping, sign-in, owner gate, health route, seed and migrations, local PGlite development, tests and CI.

### 3.2 Phase 2: live sync (in build)

GitHub, Vercel and Supabase adapters; signals table; sync runs; nightly Vercel Cron; "Sync now"; sync alerts in Needs you; last push kept current from GitHub.

### 3.3 Phase 3: AI assist and more sources (planned, not built)

Weekly Claude review proposing updated pct, next steps and risks for approval; Monday plan draft; Railway GraphQL and Cloudflare API adapters. Detailed in documents 04 and 12.

## 4. Functional requirements

Each requirement has an identifier for traceability into user stories (document 03) and tests (document 15). Phase in brackets.

### 4.1 Access

- FR-1 [P1] The app MUST require Clerk sign-in and MUST admit only a user whose primary email address appears in `OWNER_EMAILS` (comma separated, case-insensitive, trimmed). Any other signed-in user MUST be sent to a "not authorized" page (`/not-authorized`) with a sign-out button. The primary address must also be verified.
- FR-2 [P1] When Clerk keys are absent, the app MUST run without auth only when `NODE_ENV !== 'production'` or `ALLOW_NO_AUTH=1`, and MUST show a visible "local mode · no sign-in" notice in the top bar. In production without keys it MUST fail closed with a setup page (`/setup`, status 503).
- FR-3 [P1] Every server action MUST re-check the owner before reading or writing.

### 4.2 Overview

- FR-4 [P1] The Overview MUST show a KPI strip: projects tracked, live on a real URL, average completion, hours to finish all, need your action, no push in 30+ days (formulas in document 11, section 2).
- FR-5 [P1] The Overview MUST show three focus lanes (Quick wins, Launch pushes, Steady builds), each with the top 4 active projects by finish score, as defined in section 6.
- FR-6 [P1] The Overview MUST show a Needs you list combining projects with a needs note and (Phase 2) sync alerts.
- FR-7 [P2] The Overview MUST show the last sync time and outcome and a "Sync now" button.

### 4.3 Projects

- FR-8 [P1] The Projects page MUST list all projects in a table with name, repo, status, completion, hours left, finish score, host tags and last push.
- FR-9 [P1] The table MUST support status filters, category filters and a text search over name, repo, host tags and category, and sorting by name, status, completion, hours left, finish score and last push.
- FR-10 [P1] The project detail page MUST show where it lives (URLs, repo, last push), Claude sessions (with add), architecture (Client, Host, Data, Auth, Services), documents coverage, next steps, ideas and risks.
- FR-11 [P1] The detail page MUST provide an edit form for status, pct, hours left, value, needs note, summary, Claude project URL, GitHub repo, Vercel project and Supabase ref. The built form also edits name, category, host tags, URLs and risks.
- FR-12 [P1] Next steps MUST support tick and untick, add and delete. Ticking a step MUST subtract its hours from the project's hours left (floor 0); unticking MUST add them back.
- FR-13 [P2] The detail page MUST show the latest live signals for the project (GitHub, Vercel, Supabase) with their observed time.

### 4.4 Infrastructure

- FR-14 [P1] The Infrastructure page MUST show one card per provider listing each component (resource, owning project, note), with linked projects navigable.
- FR-15 [P1] The Supabase card MUST show active projects against the free-plan limit (2 of 2 at seed) and a warning style when at or over the limit.

### 4.5 Planner

- FR-16 [P1] The Planner MUST show the hours-per-week setting (default 12), saved on change.
- FR-17 [P1] The Planner MUST list queued projects by `queue_position` with an ETA each: today + ceil(cumulative hours ÷ hours per week) weeks.
- FR-18 [P1] The owner MUST be able to move a project up or down, add an unqueued project to the end and remove a project from the queue; every change MUST be saved through a server action.
- FR-19 [P1] The Planner MUST show timeline bars for the queue on a week scale with date ticks.

### 4.6 Ideas and housekeeping

- FR-20 [P1] The Ideas page MUST group feature ideas by project and show a new-project parking lot; the owner MUST be able to add, star and delete ideas. Built: parking-lot ideas are added, starred and deleted on `/ideas`; feature ideas are added, starred and deleted on the project page and listed on `/ideas` grouped by project.
- FR-21 [P1] The Housekeeping page MUST list archive, overlap and docs items, each with Approve and Skip, and an Undo back to pending. Decisions MUST NOT change anything outside the database.

### 4.7 Data and sync

- FR-22 [P1] `npm run db:seed` MUST load `data/inventory.json` into an empty database and MUST do nothing when projects already exist. The same `seedIfEmpty` also runs in the Vercel build and on the first request against a local PGlite database.
- FR-23 [P1] `npm run db:migrate` MUST apply drizzle-kit generated SQL from `/drizzle`; the Vercel build MUST run it before `next build`.
- FR-24 [P2] A sync run MUST call the GitHub, Vercel and Supabase adapters, skip (not fail) any adapter whose token is missing, write signals, update `last_push` from GitHub, and record per-source counts and errors in `sync_runs`.
- FR-25 [P2] Vercel Cron MUST call `GET /api/cron/sync` daily at `23 13 * * *` UTC with `Authorization: Bearer $CRON_SECRET`; any other caller MUST get 401.
- FR-26 [P2] Sync alerts MUST be raised for: GitHub default-branch CI failing, latest Vercel production deployment in ERROR, Supabase project INACTIVE.
- FR-27 [P1] `GET /api/health` MUST return `200 { ok: true }` without auth and without exposing data (liveness only).

### 4.8 Phase 3 (planned)

- FR-28 [P3] A weekly Claude review MUST propose updated pct, next steps and risks per active project; nothing changes until the owner accepts each proposal.
- FR-29 [P3] A Monday plan draft MUST summarize the week's suggested focus from lanes, queue and Needs you.
- FR-30 [P3] Railway and Cloudflare adapters MUST add deployment and resource signals when their tokens are present.

## 5. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | Overview server render under 500 ms P95 on Vercel with Neon (26 projects, one round of queries). |
| NFR-2 | Every mutation reflects in the UI within 1 s on a broadband connection (server action plus revalidation). |
| NFR-3 | A full sync of 26 projects completes in under 60 s (the cron function limit). |
| NFR-4 | No secret ever reaches the browser. Tokens are read only in server code. |
| NFR-5 | Owner check on every page render and every server action; fail closed on misconfiguration. |
| NFR-6 | WCAG 2.2 AA: contrast from the token palette in both themes, keyboard operation of every control, visible focus ring, `aria-pressed` on filter toggles, labelled checkboxes. |
| NFR-7 | Usable at 360 px width with no horizontal page scroll (tables scroll inside their panel). |
| NFR-8 | Light and dark themes from the mockup tokens, following the OS setting. |
| NFR-9 | TypeScript strict; lint, typecheck, unit and database tests, and the e2e smoke run (which builds the app) pass in CI on every push to `main` and every pull request. |
| NFR-10 | Runs locally with zero configuration (PGlite, auth open in development). |
| NFR-11 | Free-tier hosting: Vercel Hobby, Neon free, Clerk free. |

## 6. Business rules

| Rule | Definition |
|---|---|
| Finish score | value × (pct ÷ 100) ÷ hours_left × 100, rounded to one decimal. Null when value, pct or hours_left is null, or hours_left is zero. A project at 0% scores 0. |
| Active project | status not `archive` and not `idea`. |
| Quick wins | Active, score not null, hours_left ≤ 15. Top 4 by score. |
| Launch pushes | Active, score not null, value ≥ 4 and 15 < hours_left ≤ 60. Top 4 by score. |
| Steady builds | Active, score not null, hours_left > 15 and value < 4. Top 4 by score. |
| Lane tie break | Equal scores keep name order (decision; projects load sorted by name). |
| Stale | last_push more than 30 days before today (UTC). |
| Step toggle | Done: hours_left = max(0, hours_left − step.hours). Undone: hours_left + step.hours. |
| Planner ETA | today + ceil(cumulative hours ÷ hours_per_week) × 7 days. |

## 7. Success metrics

No analytics product is used (single user). Metrics are read from the database: projects with complete estimates, steps ticked per week (`steps.done_at`), sync run success rate (`sync_runs.ok`), housekeeping items decided, and projects reaching `live` or `archive`.

## 8. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Lockout from a typo in `OWNER_EMAILS` | Owner cannot use the app | Not-authorized page shows the signed-in email and says to check `OWNER_EMAILS`; fix in Vercel env and redeploy (document 14 runbook) |
| Seed estimates are wrong | Bad prioritization | Edit form; first-session task to review values (document 13) |
| Provider API rate limits or changes | Missing signals | Adapters isolated, per-project errors recorded, previous signals kept |
| Supabase free plan full | Cannot host this app's DB there | Neon through Vercel Marketplace (decided) |
| Next.js 16 and Clerk 7 API differences from older docs | Build delays | Read `node_modules/next/dist/docs/` before coding; middleware is `proxy.ts` |

## 9. Decisions and open questions

### 9.1 Decided (10 Nov 2026)

1. Data lives in Postgres (Neon via Vercel Marketplace), edited from the app. The YAML-in-repo alternative is rejected.
2. Phase 2 syncs GitHub, Vercel and Supabase. Railway and Cloudflare move to Phase 3 because each needs a new token.
3. claude.ai chat Projects are a URL field (`claude_project_url`). Claude Code sessions are seeded from the audit and added by hand.
4. Value scores (1 to 5) are the owner's and drive the finish score and queue order.
5. Housekeeping items are decisions only; the app never archives or moves anything.
6. No component library. The mockup mentioned shadcn/ui; the spec supersedes it with Tailwind 4 plus CSS custom-property tokens.
7. Project detail is a route (`/projects/[id]`), not the side panel the mockup suggested.
8. The mockup's "optional read-only share link" is dropped; the app is owner-only.
9. The inventory has no link fields, so the seed derives them: `github_repo = spencertownley-sys/<first word of repo>` for every project except PromoVault, `vercel_project = taskparty` for TaskParty, and `supabase_ref` for TaskParty, NimbusWatch and Chronologue. `claude_project_url` stays null (document 13, section 5).
10. Adding or deleting a step does not change `hours_left`; only ticking and unticking does. Steps never change `pct`.
11. "Today" is the request time; days since a push count from noon UTC on that date; displayed dates are formatted in UTC.
12. Theme follows the OS setting; no manual toggle in Phases 1 and 2.
13. Server action input is validated with zod 4.
14. Projects filter, search and sort are client state, not URL parameters.
15. Needs you adds a fourth sync alert beyond the spec's three: "GitHub repo not found or not readable with the sync token".
16. The cron route answers 207 (not 500) when a sync finishes with source errors, and 401 when `CRON_SECRET` is unset.
17. The Vercel build seeds an empty production database (`npm run vercel-build` = migrate, seed, build).
18. Queue positions are 0-based; the planner also has add-to-queue and remove-from-queue actions, and session links can be deleted (`addToQueue`, `removeFromQueue`, `deleteSession`).

- Owner check uses only the verified primary email (resolved 10 Nov 2026).
- A project at 0% has a finish score of 0, not null; it is a real value (resolved 10 Nov 2026).
- Feature ideas are starred on the project page (resolved 10 Nov 2026).

### 9.2 Open

1. Custom domain for the dashboard (needed before moving Clerk from its development to its production instance).
2. Phase 3 model choice and weekly review cost ceiling.

## 10. Approval

| Role | Name | Date |
|---|---|---|
| Product owner | Owner | 10 Nov 2026 |
| Engineering | Claude Code build session | 10 Nov 2026 |
