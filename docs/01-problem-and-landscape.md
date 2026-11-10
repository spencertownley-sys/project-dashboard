# 01. Problem and Landscape

Product: Project Control Room
Version 1.0, 10 Nov 2026. Owner: Product (solo builder).

## 1. The problem

The owner builds software alone with AI agents. On the audit date (10 Nov 2026) there were 26 projects: 10 SaaS apps, 4 games, 7 content, portfolio and business sites, 2 tools, 1 consumer app, 1 private app and 1 empty idea repo. They are spread across seven hosting and data platforms (GitHub, GitHub Pages and Actions, Vercel, Railway, Cloudflare Workers/D1/R2/DNS/Pages, Supabase, Claude Code sessions and a Claude scheduled task) and at least 10 registered domains.

Nothing answers the basic questions in one place:

| Question | Where the answer lives today |
|---|---|
| Which projects are live, on a preview URL, stalled or abandoned? | Memory, GitHub repo list, six hosting dashboards |
| How close is each one to done, and how many hours are left? | Nowhere; scattered in READMEs, BUILD_PLAN files, launch checklists |
| Which one should I work on next for the most payoff? | Gut feel |
| What is blocked on me rather than on code? | Buried in Claude Code session transcripts |
| Which Worker, database, bucket or domain belongs to which project? | Cloudflare, Railway, Supabase and registrar dashboards, separately |
| Did a deploy fail, did CI break, did a free database pause? | Email notifications, if noticed |
| Which Claude Code sessions worked on this project? | Session titles in the Claude app |
| Am I near a plan limit (Supabase free plan is 2 of 2 active)? | Discovered when a new project fails to provision |

The audit itself took a full session of manual reading across 22 GitHub repositories, the Vercel and Supabase accounts and the Claude Code session list. The result was stale the next day. The cost of not knowing is concrete: on the audit date, 11 of 22 active projects had no push in more than 30 days, 9 projects were blocked on an owner action (a domain purchase, a merge, a key), one Railway service was deploying an old branch, and one production worker had never run because its secrets were missing.

## 2. Who it is for

Exactly one person: the owner. A solo builder who:

- Starts projects quickly with Claude Code and finishes them slowly.
- Has 8 to 15 working hours a week across all projects.
- Thinks in "what can I ship this week" rather than sprints or tickets.
- Is comfortable editing estimates by hand but will not maintain a ticket tracker.
- Wants one browser tab that is true without being updated by hand every day.

There are no other users, no team, no customers. The product is private and never public. Anyone who is not the owner sees a "not authorized" page (document 08).

## 3. Jobs to be done

1. See every project's status, completion percentage, hours left and value on one screen.
2. Pick what to work on next using a transparent formula, not a feeling.
3. See what is blocked on me (owner actions and failing infrastructure) before it costs a week.
4. Know where each project lives: URLs, repo, host, database, auth, services, Claude sessions.
5. Keep a short, honest list of next steps per project and tick them off as they ship.
6. Plan the next months: given my weekly hours and a priority order, when does each project finish?
7. Park ideas (features and whole new projects) without losing them or acting on them.
8. Decide cleanup (archive, merge, split repos, write docs) one item at a time.

## 4. Landscape

| Option | What it does well | Why it does not fit |
|---|---|---|
| GitHub Projects | Native to the repos; issues, PRs and CI live next to it; free | Tracks issues, not projects-as-products. No hours-left, value or finish score. Knows nothing about Vercel, Railway, Cloudflare or Supabase. Projects living on a branch of another repo (Strata, Split the G) or with no repo (ideas) do not fit. A board per repo, not a portfolio. |
| Linear | Fast, keyboard first, excellent cycles and projects | Built for teams shipping one product. Portfolio view needs every project modeled as a Linear project with issues. No infrastructure inventory, no hosting health. Paid beyond the free tier limits; another account to maintain. |
| Notion | Flexible databases; can model projects, ideas and infra as tables | Everything is manual. No live signals without third-party automation. Formulas for the finish score are possible but brittle. Planner timelines need a paid add-on or hand-built views. Drifts from reality within a week. |
| A spreadsheet | Fastest to start; formulas for score and ETA are trivial | No live data. Next steps as checkboxes per project become a second sheet. No per-project detail page with architecture and links. Editing on a phone is painful. The audit spreadsheet would be stale on day two. |
| Hosting dashboards (Vercel, Railway, Cloudflare, Supabase) | Authoritative for their own resources | Six tabs, six logins, no shared project identity, no completion or priority concept. |

### 4.1 What the options miss in common

- A project is a product, not a repository. It can span a repo, a Worker, a D1 database, an R2 bucket, a domain and three Claude sessions.
- A single prioritization number combining value, completion and remaining effort.
- Capacity planning in hours per week rather than story points or dates.
- Live health from the owner's actual providers with no setup beyond pasting tokens.
- Owner-action tracking: things code cannot fix.

## 5. Why build it

1. **It is small.** One Next.js app, nine tables, eight screens. Phase 1 is about 3 days, Phase 2 about 4 days (document 04).
2. **The data already exists.** The audited inventory (`data/inventory.json`, document 13) seeds every project, step, idea, session, component and cleanup item on first run.
3. **It reuses tools the owner already runs.** Vercel hosting, Vercel Cron, Clerk, Neon through the Vercel Marketplace, GitHub, and the provider APIs the owner already has tokens for. No new vendor.
4. **The rules are explicit.** Finish score, focus lanes, stale threshold, planner ETAs and needs-you alerts are defined formulas (document 11), so the dashboard can be checked and trusted.
5. **It compounds.** Phase 3 adds a weekly Claude review that proposes updated completion, next steps and risks for approval, so the inventory stays current with almost no manual effort.

## 6. What it is not

- Not an issue tracker. Next steps are coarse (2 to 40 hours each), not tickets.
- Not a team tool. One owner, no roles, no sharing (document 08).
- Not a deployment tool. It reads provider state; it never deploys, archives, deletes or changes anything outside its own database.
- Not a replacement for provider dashboards. It links to them and flags when to open them.

## 7. Risks to the premise

| Risk | Mitigation |
|---|---|
| Estimates (%, hours, value) are first-pass guesses and drift | Edit form on every project; ticking steps reduces hours automatically; Phase 3 weekly review proposes corrections |
| Owner stops opening it | Overview is the default tab and answers "what next" in one glance; nightly sync keeps it true without effort |
| Provider APIs change or tokens expire | Each adapter is independent and skipped when its token is missing; sync runs record per-source errors visibly on the Overview |
| Scope creep into a full project manager (there is already TaskParty and Strata in the portfolio) | Non-goals in document 02; every feature must map to a job in section 3 |
