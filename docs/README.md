# Project Control Room: Document Suite

Version 1.0, 10 Nov 2026.

Planning and reference documents for Project Control Room, the owner's private dashboard for all 26 AI-built projects. The approved layout is `mockup/index.html`; the seed data is `data/inventory.json` (audited 10 Nov 2026). Agent rules are in `CLAUDE.md` and the current state in `HANDOFF.md` at the repository root.

Status: Phase 1 (seeded dashboard) and Phase 2 (live sync for GitHub, Vercel and Supabase) are built and tested but not yet deployed. Phase 3 (weekly Claude review, Monday plan, Railway and Cloudflare sync) is planned.

| # | Document | What it covers |
|---|---|---|
| 01 | [Problem and landscape](01-problem-and-landscape.md) | The problem, who it is for, comparison with GitHub Projects, Linear, Notion and a spreadsheet, why build |
| 02 | [Product requirements](02-prd.md) | Goals, non-goals, persona, scope, FR-1 to FR-30, non-functional requirements, business rules, decisions and open questions |
| 03 | [User stories and backlog](03-user-stories-and-backlog.md) | Stories with acceptance criteria; prioritized backlog tagged Phase 1, 2 and 3 |
| 04 | [Roadmap and release plan](04-roadmap-and-release-plan.md) | Phases with exit gates, timeline, releases, preconditions |
| 05 | [Technical architecture](05-technical-architecture.md) | Stack, decisions, file layout, request lifecycles, scripts |
| 06 | [Data model](06-data-model.md) | Nine tables, signals and settings keys, derived values, seed mapping, Phase 3 tables |
| 07 | [API specification](07-api-specification.md) | Routes, health and cron handlers, server actions with inputs, effects and results |
| 08 | [Auth and permissions](08-auth-and-permissions.md) | Auth modes, owner check, proxy, cron secret, threat model |
| 09 | [Design system](09-design-system.md) | Tokens (light and dark), type, status pills, components |
| 10 | [Application screens](10-application-screens.md) | Every screen, mapped to mockup sections A to H |
| 11 | [Views specification](11-views-specification.md) | KPI, lane, Needs you, table, step, planner, infrastructure and ideas rules with seed numbers |
| 12 | [Integrations and sync](12-integrations-and-sync.md) | GitHub, Vercel and Supabase adapters, sync runs, schedule, Phase 3 Railway, Cloudflare and Claude |
| 13 | [Project inventory](13-project-inventory.md) | The full audited seed data: every project, infrastructure item, idea and cleanup item |
| 14 | [Deployment and operations](14-deployment-and-operations.md) | Environments, variables, Vercel, migrations, seeding, CI, runbooks |
| 15 | [Quality and test plan](15-quality-and-test-plan.md) | Unit, database and Playwright coverage, gaps, manual checklist |
| 16 | [Build guide](16-build-guide.md) | Ordered build steps with checkboxes (Phases 1 and 2 done, Phase 3 open) |

## Key rules at a glance

| Rule | Definition |
|---|---|
| Finish score | value × (pct ÷ 100) ÷ hours left × 100, one decimal |
| Quick wins | hours ≤ 15; top 4 active projects by score |
| Launch pushes | value ≥ 4 and 15 < hours ≤ 60 |
| Steady builds | hours > 15 and value < 4 |
| Stale | last push more than 30 days ago |
| Step tick | subtracts its hours from hours left (floor 0); untick adds them back |
| Planner ETA | today + ceil(cumulative hours ÷ hours per week) weeks |
| Sync | daily at 13:23 UTC; each source skipped when its token is missing |

## Where the docs and the build differ

The documents describe what is built. Three places where the build differs from the original specification are listed as open questions in document 02, section 9.2 (owner email check, score for pct 0, starring feature ideas). Spec-silent choices are marked "decision" in the document where they apply and collected in document 02, section 9.1.
