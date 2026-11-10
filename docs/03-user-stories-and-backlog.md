# 03. User Stories and Backlog

Version 1.0, 10 Nov 2026. Owner: Product.

There is one persona, the owner (document 02, section 2), so every story is written "As the owner". Priority uses MoSCoW: M (must for its phase), S (should), C (could). Every story cites the requirement it satisfies in document 02 and is tagged with its phase. Acceptance criteria are written so they convert directly into tests (document 15).

## Epic 1: Access

| ID | Story | Priority | Phase | Requirement |
|---|---|---|---|---|
| US-01 | As the owner, I sign in with Clerk and land on the Overview. | M | 1 | FR-1 |
| US-02 | As anyone else, I see a "not authorized" page and can sign out. | M | 1 | FR-1 |
| US-03 | As the owner developing locally, I can run the app with no Clerk keys and no database setup. | M | 1 | FR-2, NFR-10 |
| US-04 | As the owner, if I deploy to production without Clerk keys, the app shows a setup page instead of my data. | M | 1 | FR-2 |

Acceptance criteria for US-01 and US-02:
- Given `OWNER_EMAILS="a@example.com, B@Example.com"` and a signed-in user whose primary email is `b@example.com`, the Overview renders.
- Given the same setting and a user whose only email is `c@example.com`, every app route redirects to `/not-authorized`, which says the dashboard is private, offers "Sign out", and loads no project data.
- Given `OWNER_EMAILS` unset or empty with Clerk keys present, every signed-in user is sent to `/not-authorized` (fail closed).
- Built behavior: a user passes if any of their Clerk emails is listed; the spec says the primary email only (open question, document 02).
- A signed-out visitor to any app route is redirected to `/sign-in`.

Acceptance criteria for US-03 and US-04:
- With no Clerk keys and `NODE_ENV=development`, all routes render and the top bar shows "local mode · no sign-in"; the local PGlite database migrates and seeds itself on the first request.
- With no Clerk keys, `NODE_ENV=production` and `ALLOW_NO_AUTH` unset, every app route shows "Sign-in isn't set up yet" with status 503, naming the variables to add; server actions redirect to `/setup`; `/api/health` still returns 200.
- With no Clerk keys, `NODE_ENV=production` and `ALLOW_NO_AUTH=1`, the app runs open (this is how the e2e suite runs).

## Epic 2: Overview

| ID | Story | Priority | Phase | Requirement |
|---|---|---|---|---|
| US-10 | As the owner, I see six KPIs summarizing the portfolio. | M | 1 | FR-4 |
| US-11 | As the owner, I see Quick wins, Launch pushes and Steady builds, four projects each, ranked by finish score, with each card showing the next open step. | M | 1 | FR-5 |
| US-12 | As the owner, I see a Needs you list of what is blocked on me. | M | 1 | FR-6 |
| US-13 | As the owner, I see when the last sync ran and whether it succeeded, and can start one now. | M | 2 | FR-7 |
| US-14 | As the owner, failing CI, failed production deploys and paused Supabase projects appear in Needs you automatically. | M | 2 | FR-26 |

Acceptance criteria for US-11 (seed data, document 13):
- Quick wins shows, in order, Spotted Zebra 45.0, Amanda Williams Portfolio 35.0, Townley Photography 26.7, FrameVote 20.8.
- Launch pushes shows spencertownley.com 21.2, Quiz Platform 14.3, Book Builder 10.7, TaskParty 6.0.
- Steady builds shows Chronologue 12.8, Cruise News You Can Use 10.5, Smoosh 8.5, Downbeat 8.0 (Downbeat and NimbusWatch tie at 8.0; ties keep name order).
- Archive and idea projects never appear; projects with a null score never appear.
- Clicking a card opens `/projects/[id]`.

Acceptance criteria for US-14:
- Given a GitHub `ci` signal with conclusion `failure` on `main` for TaskParty, Needs you shows TaskParty with "CI is failing on main" and the risk dot.
- Given a Vercel `deployment` signal with state `ERROR`, Needs you shows "Latest Vercel production deploy failed".
- Given a Supabase `project` signal with status `INACTIVE`, Needs you shows "Supabase project is paused".
- Given a GitHub `repo` signal `{ missing: true }`, Needs you shows "GitHub repo not found or not readable with the sync token".
- When the next sync records a passing state, the alert disappears.

## Epic 3: Projects

| ID | Story | Priority | Phase | Requirement |
|---|---|---|---|---|
| US-20 | As the owner, I see all projects in a sortable table. | M | 1 | FR-8 |
| US-21 | As the owner, I filter by status or category and search by name, repo, host or category. | M | 1 | FR-9 |
| US-22 | As the owner, I open a project and see where it lives, sessions, architecture, docs, steps, ideas and risks. | M | 1 | FR-10 |
| US-23 | As the owner, I edit status, pct, hours, value, needs, summary and link fields. | M | 1 | FR-11 |
| US-24 | As the owner, I tick a next step and hours left drops by its hours. | M | 1 | FR-12 |
| US-25 | As the owner, I add and delete next steps. | M | 1 | FR-12 |
| US-26 | As the owner, I add a Claude session link to a project. | M | 1 | FR-10 |
| US-27 | As the owner, I see live signals (last push, open PRs, CI, deploy state, Supabase status) on the detail page. | S | 2 | FR-13 |

Acceptance criteria for US-21:
- Status filters: All, Live, Preview, Building, Stalled, Archive and ideas (archive, idea and unknown). Category filters: SaaS, Games (`Game`), Sites (category contains "Content", "site" or "Portfolio"). One filter is active at a time; All is the default.
- Search is case-insensitive substring over name, repo, host tags and category; it combines with the active filter.
- With no matches, the table shows "No projects match. Clear the search or pick another filter."
- Filter, search and sort are client state and reset on reload (decision).

Acceptance criteria for US-24:
- Given Spotted Zebra with hours_left 6 and step "Fix the “(2027 Guide)” post title" (0.5 h), ticking it sets hours_left to 5.5, `done = true`, `done_at` set; unticking returns hours_left to 6 and clears `done_at`.
- Given hours_left 2 and a 4 h step, ticking sets hours_left to 0; unticking sets it to 4 (documented floor behavior).
- Ticking an already-done step changes nothing.
- Given hours_left null, ticking changes only the step.
- The finish score, lanes and planner ETAs reflect the new hours on the next render.

Acceptance criteria for US-23:
- pct accepts a whole number 0 to 100 or empty (null); hours accepts 0 to 10000 or empty; value accepts 1 to 5 or empty. The browser blocks out-of-range numbers before submit.
- GitHub repo must look like `owner/name`; the Claude project link must be a full URL; Vercel project and Supabase ref are free text; all may be empty.
- On success the form shows "Saved"; on a validation failure it shows the first message and saves nothing.

## Epic 4: Infrastructure

| ID | Story | Priority | Phase | Requirement |
|---|---|---|---|---|
| US-30 | As the owner, I see every Worker, database, bucket, service, cron and domain grouped by provider with its owning project. | M | 1 | FR-14 |
| US-31 | As the owner, I see the Supabase free-plan capacity and a warning at 2 of 2. | M | 1 | FR-15 |
| US-32 | As the owner, Supabase capacity updates from the Management API on each sync. | S | 2 | FR-15, FR-24 |

## Epic 5: Planner

| ID | Story | Priority | Phase | Requirement |
|---|---|---|---|---|
| US-40 | As the owner, I set my hours per week and every ETA updates. | M | 1 | FR-16, FR-17 |
| US-41 | As the owner, I move projects up and down the queue and the order is saved. | M | 1 | FR-18 |
| US-42 | As the owner, I add an unqueued project to the queue or remove one. | S | 1 | FR-18 |
| US-43 | As the owner, I see the queue as timeline bars. | M | 1 | FR-19 |

Acceptance criteria for US-40 (seed queue, 12 h/week, today 10 Nov 2026):
- Spotted Zebra (6 h, cumulative 6) and Amanda Williams Portfolio (cumulative 10) show 17 Nov; FrameVote (cumulative 23) shows 24 Nov; MORE. (cumulative 800) shows 22 Feb 2028.
- Changing the slider to 24 h/week saves `settings.hours_per_week = 24` on release and FrameVote shows Nov 17.

## Epic 6: Ideas and housekeeping

| ID | Story | Priority | Phase | Requirement |
|---|---|---|---|---|
| US-50 | As the owner, I see feature ideas grouped by project and new-project ideas in a parking lot. | M | 1 | FR-20 |
| US-51 | As the owner, I add, star and delete ideas. | M | 1 | FR-20 |
| US-52 | As the owner, I approve or skip each housekeeping item, and can undo. | M | 1 | FR-21 |

## Epic 7: Data and sync

| ID | Story | Priority | Phase | Requirement |
|---|---|---|---|---|
| US-60 | As the owner, running the seed twice loads the inventory once. | M | 1 | FR-22 |
| US-61 | As the owner, a nightly sync updates last push, PRs, CI, deploy and database state. | M | 2 | FR-24, FR-25 |
| US-62 | As the owner, a missing token skips that source with a note, not an error. | M | 2 | FR-24 |
| US-63 | As the owner, a weekly Claude review proposes pct, next steps and risks that I accept or reject one by one. | M | 3 | FR-28 |
| US-64 | As the owner, I get a Monday plan draft. | S | 3 | FR-29 |
| US-65 | As the owner, Railway and Cloudflare deployments and resources sync once I add tokens. | S | 3 | FR-30 |

Acceptance criteria for US-62:
- With only `GITHUB_TOKEN` set, a run records `vercel` and `supabase` as `skipped` with "No token set", and `ok = true` if GitHub had no errors.
- A 404 for one repo writes a `repo = { missing: true }` signal (a Needs you alert) and continues; other HTTP errors are recorded in the source message and set `ok = false`.

## Prioritized backlog

Ordered by build sequence (document 16). Phase 1 and Phase 2 are in build; Phase 3 is planned.

| # | Item | Phase | Priority | Stories |
|---|---|---|---|---|
| 1 | Scaffold, tokens, fonts, top bar | Phase 1 | M | NFR-8 |
| 2 | Database schema, PGlite/Postgres client, migrations | Phase 1 | M | US-60 |
| 3 | Seed from `inventory.json` | Phase 1 | M | US-60 |
| 4 | Auth modes, owner gate, sign-in, proxy | Phase 1 | M | US-01 to US-04 |
| 5 | Rules library (score, lanes, stale, ETA, step toggle) | Phase 1 | M | US-11, US-24, US-40 |
| 6 | Overview (KPIs, lanes, Needs you notes) | Phase 1 | M | US-10 to US-12 |
| 7 | Projects table with filters, search, sort | Phase 1 | M | US-20, US-21 |
| 8 | Project detail and edit form | Phase 1 | M | US-22, US-23 |
| 9 | Steps toggle, add, delete; add session | Phase 1 | M | US-24 to US-26 |
| 10 | Infrastructure page with Supabase capacity | Phase 1 | M | US-30, US-31 |
| 11 | Planner queue, hours per week, timeline | Phase 1 | M | US-40 to US-43 |
| 12 | Ideas page | Phase 1 | M | US-50, US-51 |
| 13 | Housekeeping page | Phase 1 | M | US-52 |
| 14 | Health route, CI with Playwright smoke | Phase 1 | M | NFR-9 |
| 15 | Signals and sync_runs, sync orchestrator | Phase 2 | M | US-61, US-62 |
| 16 | GitHub adapter | Phase 2 | M | US-61 |
| 17 | Vercel adapter | Phase 2 | M | US-61 |
| 18 | Supabase adapter and capacity update | Phase 2 | M | US-32, US-61 |
| 19 | Cron route, `vercel.json` schedule, Sync now | Phase 2 | M | US-13 |
| 20 | Sync alerts in Needs you; signals on detail | Phase 2 | M | US-14, US-27 |
| 21 | Review proposals table and approval UI | Phase 3 | M | US-63 |
| 22 | Weekly Claude review job | Phase 3 | M | US-63 |
| 23 | Monday plan draft | Phase 3 | S | US-64 |
| 24 | Railway GraphQL adapter | Phase 3 | S | US-65 |
| 25 | Cloudflare API adapter | Phase 3 | S | US-65 |
| 26 | Star toggle for feature ideas; manual theme toggle; loading skeletons | Phase 3 | C | US-51 |
| 27 | Server action and closed-mode tests (document 15, section 6) | Phase 3 | S | NFR-9 |

## Cut line

Phase 1 ships every M story tagged Phase 1; the app is useful with seeded data and manual edits alone. Phase 2 adds sync without changing any Phase 1 screen except the Overview sync card, Needs you alerts and the detail signals block. Phase 3 items are independent and can ship in any order once the review proposals table exists.
