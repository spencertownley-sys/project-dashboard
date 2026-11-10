# 04. Roadmap and Release Plan

Version 1.0, 10 Nov 2026. Owner: Product.

## 1. Principles

- Every phase ends with a deployed, useful dashboard. Phase 1 alone replaces the audit spreadsheet.
- Exit gates are checklists, not dates. Durations are the mockup's estimates for one builder working with Claude Code.
- Phases add; they do not rework. Phase 2 adds tables and a cron route without changing Phase 1 schemas. Phase 3 adds a proposals table and new adapters without changing Phase 2 ones.
- Nothing in any phase writes to an external system. The dashboard reads providers and writes only its own database.

## 2. Phases

### Phase 1: Seeded dashboard (about 3 days, in build)

Scope:
- Next.js 16.4 scaffold, Tailwind 4 with mockup tokens, Geist fonts, top bar with tabs.
- Drizzle schema for all nine tables (the Phase 2 tables are created now so there is a single initial migration), PGlite locally, Neon in production.
- `npm run db:migrate` and `npm run db:seed` from `data/inventory.json` (also run by `vercel-build`; local PGlite migrates and seeds itself).
- Clerk auth, owner-only gate, auth-disabled and setup modes, `proxy.ts`.
- Screens: Overview (KPIs, lanes, Needs you from notes), Projects, Project detail with edit form, steps, sessions, Infrastructure, Planner, Ideas, Housekeeping, Sign-in.
- Server actions: updateProject, toggleStep, addStep, deleteStep, addIdea, toggleIdeaStar, deleteIdea, addSession, deleteSession, setHousekeepingDecision, saveQueue, addToQueue, removeFromQueue, setHoursPerWeek.
- `GET /api/health`.
- Vitest unit and PGlite integration tests, Playwright smoke spec, GitHub Actions CI.

Exit gate:
- [ ] Production deployment on Vercel with Neon; owner signs in; a second Clerk account sees the not-authorized page.
- [ ] 26 projects, 101 steps, 67 ideas, 32 sessions, 39 components and 12 housekeeping items present after seed; second seed run changes nothing.
- [ ] Overview lanes and KPIs match document 13, section 1 exactly.
- [ ] Ticking and unticking a step updates hours left, score and planner ETA.
- [ ] CI green: lint, typecheck, test, build.
- [ ] Playwright smoke (desktop and phone) passes in CI against a fresh PGlite build.

### Phase 2: Live sync (about 4 days, in build)

Scope:
- `signals` and `sync_runs` in use; sync orchestrator in `lib/sync`.
- GitHub adapter (repo metadata, open PRs, default-branch check runs, updates `last_push`).
- Vercel adapter (latest production deployment state).
- Supabase adapter (project status; account-wide active count for the capacity meter).
- `GET /api/cron/sync` with bearer auth; Vercel Cron `23 13 * * *` UTC.
- `runSyncNow` server action and the Overview sync card.
- Needs you alerts; live signals block on project detail.

Exit gate:
- [ ] With all three tokens set, a run completes in under 60 s and records `ok = true`.
- [ ] With no tokens set, a run records all three sources as skipped and `ok = true`.
- [ ] A deliberately wrong `github_repo` records one per-project error and the rest succeed.
- [ ] The cron route returns 401 without the bearer token or when `CRON_SECRET` is unset, 200 on a clean run and 207 when a source errors.
- [ ] The first scheduled run appears in `sync_runs` the next morning (13:23 UTC, 05:23 Pacific standard time).
- [ ] The owner has checked the seeded link fields (document 13, section 5), fixed any repo the first sync reports as not found, and granted the token access to private repos (NestCraft).

### Phase 3: AI assist and more sources (about 3 days, planned)

Scope:
- `review_proposals` and `plans` tables (document 06, section 7).
- Weekly Claude review: for each active project with a `github_repo`, read the README, docs folder listing and the last 7 days of commits; propose pct, next steps and risks with a one-line rationale; store as pending proposals.
- Review screen: accept or reject each proposal; accepting applies it through the same code paths as `updateProject`, `addStep` and risk edits.
- Monday plan draft: a short markdown plan from lanes, queue head, Needs you and accepted proposals, shown on the Overview until dismissed.
- Railway GraphQL adapter (`RAILWAY_TOKEN`) and Cloudflare API adapter (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).
- Backlog items: star toggle for feature ideas, manual theme toggle, loading skeletons, server-action and closed-mode tests.

Exit gate:
- [ ] A weekly run produces proposals for every active project with a repo, costs under the agreed ceiling (open question, document 02), and changes nothing until accepted.
- [ ] Railway and Cloudflare signals appear and failed deployments raise Needs you alerts.

## 3. Timeline

| Phase | Start | Target finish | Status |
|---|---|---|---|
| Layout mockup and audit | 10 Nov 2026 | 10 Nov 2026 | Approved |
| Document suite | 10 Nov 2026 | 10 Nov 2026 | This set |
| Phase 1 | 10 Nov 2026 | 13 Nov 2026 | In build |
| Phase 2 | 10 Nov 2026 (in parallel) | 17 Nov 2026 | In build |
| Phase 3 | After Phase 2 exit | About 3 working days later | Planned |

Phase 1 and Phase 2 are built from the same specification at the same time; Phase 2 depends only on the Phase 1 schema and rules library.

## 4. Release plan

| Release | Contents | Gate |
|---|---|---|
| 0.1.0 | Phase 1 complete, seeded production | Phase 1 exit gate |
| 0.2.0 | Phase 2 sync live, cron scheduled | Phase 2 exit gate |
| 0.3.0 | Weekly review and plan draft | Phase 3 review items |
| 0.4.0 | Railway and Cloudflare adapters | Phase 3 adapter items |

Release mechanics:
- Every push to `main` deploys to production on Vercel; pull requests get preview deployments (document 14).
- Migrations run in the Vercel build (`npm run vercel-build` = migrate, seed if empty, build), so a release with a schema change is one push.
- Versions are tagged in Git (`v0.1.0`) and noted in a `CHANGELOG.md` at the repo root.
- Rollback is Vercel "Instant Rollback" to the previous deployment. Migrations are additive in every planned release, so the previous build still runs against the newer schema.

## 5. Dependencies and preconditions

| Dependency | Needed for | Owner action |
|---|---|---|
| Vercel project linked to the `project-dashboard` repo | Phase 1 deploy | Import repo in Vercel |
| Neon database through Vercel Marketplace | Phase 1 deploy | Add the Neon integration; it sets `DATABASE_URL` |
| Clerk application (development instance is fine on `*.vercel.app`) | Phase 1 auth | Create app, disable sign-ups, copy keys |
| `OWNER_EMAILS` | Phase 1 auth | Set in Vercel env |
| `CRON_SECRET` | Phase 2 cron | Generate a random 32+ character string |
| `GITHUB_TOKEN` (fine-grained, read-only Metadata, Pull requests, Checks, Contents) | Phase 2 | Create in GitHub settings |
| `VERCEL_TOKEN`, optional `VERCEL_TEAM_ID` | Phase 2 | Create in Vercel account settings |
| `SUPABASE_ACCESS_TOKEN` | Phase 2 | Create in Supabase account tokens |
| Anthropic API key, Railway token, Cloudflare token and account id | Phase 3 | Create when Phase 3 starts |

## 6. Out of the roadmap

Multi-user sharing, public status pages, mobile apps, provider write actions (deploy, archive, delete) and issue-level tracking are not planned in any phase (document 02, section 1.5). The "Project status widget" idea in the parking lot (embed status on the personal site) would need a public read endpoint and is deliberately not scheduled.
