# 15. Quality and Test Plan

Version 1.0, 10 Nov 2026. Owner: Engineering.

## 1. Strategy

| Level | Tool | Scope | Runs |
|---|---|---|---|
| Static | ESLint (`eslint-config-next`), `next typegen && tsc --noEmit` strict | Whole repo | CI on every push to `main` and every PR |
| Unit | Vitest (`tests/metrics.test.ts`) | `lib/metrics.ts`, `lib/auth-core.ts`, `lib/alerts.ts`, `ciConclusion`, `matchProject` | CI |
| Database | Vitest with in-memory PGlite (`tests/db.test.ts`) | Migrations, seed, queries, `runSync` with a fake `fetch` | CI |
| Smoke E2E | Playwright (`e2e/smoke.spec.ts`), Desktop Chrome and Pixel 7 | Main journeys on a production build, open auth mode, fresh seeded PGlite | CI and before release |
| Manual | Checklist in section 7 | Clerk sign-in, real tokens, dark mode, accessibility | Each phase exit |

Every functional requirement in document 02 maps to at least one automated or manual check below. The project rule (`CLAUDE.md`): run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:e2e` when UI or actions changed, before pushing.

## 2. Test data and fakes

- `createDb({ pgliteDir: "memory", url: "" })` gives a migrated in-memory database; `seed(db)` loads the real `data/inventory.json`.
- Unit tests build small project fixtures with an `mk(...)` helper and pin `today` to a fixed date.
- `runSync(db, env, fetch)` takes the environment and `fetch` as parameters; tests pass `{}` (all skipped) or a fake `fetch` that answers GitHub, Vercel and Supabase URLs with canned JSON. No test touches the network.

## 3. Unit tests (built)

| Group | Cases | Requirement |
|---|---|---|
| `finishScore` | value × completion ÷ hours × 100 to one decimal; null when an input is missing or hours is zero | FR-5 |
| `focusLanes` | sorts projects into lanes by hours and value; leaves out archived projects and launch pushes over 60 h | FR-5 |
| `planQueue` | stacks projects back to back; ETAs round up to whole weeks (first ETA 2026-11-17, finish 2026-11-24 in the fixture) | FR-17 |
| Dates and summary | days since a push; stale threshold; portfolio summary counts, average, hours, weeks, stale | FR-4 |
| `hoursAfterToggle` | subtract when done, add back when undone, floor at zero, null stays null | FR-12 |
| Auth | Clerk only with both keys; open in development or with `ALLOW_NO_AUTH=1`; closed in production; owner emails case-insensitive; empty list denies everyone | FR-1, FR-2 |
| Alerts and CI | check runs roll up to none, failure, pending, success; notes and failing CI, deploy and Supabase signals become alerts in order | FR-6, FR-26 |
| `matchProject` | exact names, unique prefixes and trailing "?" link; shared ("A, B") or unknown labels stay unlinked | FR-14 |

## 4. Database tests (built)

| Test | Checks | Requirement |
|---|---|---|
| Seed loads the inventory | 26 projects; TaskParty linked to `spencertownley-sys/ProjectManager` and Vercel `taskparty`; steps and sessions present; more than 30 components | FR-22 |
| Seed is idempotent | `seedIfEmpty` returns false and counts are unchanged | FR-22 |
| Branch-hosted repos | Strata maps to `spencertownley-sys/Database`; PromoVault has no repo | FR-22 |
| First open step | Quiz Platform's is "Point the Railway web service at main" | FR-5 |
| Needs-you notes | Quiz Platform's note is an alert of kind `needs` | FR-6 |
| Sync skipped | No tokens: no fetch, `ok = true`, GitHub `skipped`, run row finished | FR-24 |
| Sync stores signals | With fakes: last push updated to 2026-11-09; 2 open PRs; CI failure; Vercel READY; CI alert for TaskParty, paused-database alert for Chronologue, repo-not-found alert for FrameVote; a second run upserts instead of duplicating | FR-24, FR-26 |

## 5. Smoke E2E (built)

`playwright.config.ts`: one worker, `webServer` runs `rm -rf .data/e2e && npm run build && npm start -- -p 3100` with `ALLOW_NO_AUTH=1` and `PGLITE_DIR=.data/e2e`, waits on `/api/health`. The `desktop` project runs every test; the `phone` project (Pixel 7) runs tests tagged `@phone`.

| Test | Asserts | Requirement |
|---|---|---|
| Overview `@phone` | heading, "Projects tracked", Needs you, a Spotted Zebra card; no horizontal overflow on a phone | FR-4 to FR-6, NFR-7 |
| Projects table | Games filter shows Smoosh and hides TaskParty; search "framevote" and open it; architecture text visible | FR-8 to FR-10 |
| Step toggle | Spotted Zebra 6 h; tick the 0.5 h step gives 5.5 h; untick gives 6 h | FR-12 |
| Edit form | 150% blocked by the browser; 75% saves with "Saved" and updates the meter | FR-11 |
| Add step and idea | New step appears as a checkbox; new parking-lot idea appears on /ideas | FR-12, FR-20 |
| Planner | Move Spotted Zebra down, reload, order kept; move it back | FR-18 |
| Housekeeping | Approve timeline_web_app.py, "Approved" shown, Undo restores the buttons | FR-21 |
| Infrastructure and cron | "2 of 2 active", R2 bucket row visible; `/api/cron/sync` without a bearer is 401 | FR-15, FR-25 |

## 6. Gaps to cover next (not yet written)

| Gap | Proposed test |
|---|---|
| Server actions against the database | Call `toggleStep`, `saveQueue`, `setHousekeepingDecision`, `updateProject` with `requireOwner` mocked; assert rows, idempotent toggle, 0-based queue positions |
| Not-owner paths | With Clerk mocked, a non-owner is redirected to `/not-authorized` from a page and from an action, and nothing is written |
| Closed mode | Production build without keys and without `ALLOW_NO_AUTH`: app routes return the setup page with 503; `/api/health` is 200 |
| Cron success path | Valid bearer returns 200, or 207 when a source errors |
| Seed numbers | Exact counts (101 steps, 67 ideas, 32 sessions, 39 components with 34 linked, 12 housekeeping items) and the lanes and KPIs in document 11 |
| Ideas star | Toggle a parking-lot star and check ordering |

## 7. Manual checklist (each phase exit)

- [ ] Clerk sign-in with the owner account reaches the Overview; a second account lands on "This dashboard is private" and can sign out.
- [ ] A preview without Clerk keys shows "Sign-in isn't set up yet" on every app route.
- [ ] Every screen at 360 px, 768 px and 1240 px: no horizontal page scroll; the table and timeline scroll inside their panels.
- [ ] Dark mode via the OS setting: text readable; pills, bars and signal chips visible.
- [ ] Keyboard only: tabs, filters, sort headers, checkboxes, queue buttons, forms and housekeeping buttons reachable with a visible focus ring.
- [ ] Screen reader spot check: checkboxes read the step title; queue buttons name the project.
- [ ] Contrast of `--muted`, `--accent` and the status foregrounds in both themes (document 09, section 9).
- [ ] Phase 2: real tokens set; Sync now completes; the Chronologue paused-database alert and any CI failures appear in Needs you.

## 8. Performance budgets

| Budget | Target | How measured |
|---|---|---|
| Overview server render | under 500 ms P95 on Vercel with Neon | Vercel logs |
| Server action round trip | under 1 s | Manual, Playwright timing |
| Full sync | under 60 s | `sync_runs` start to finish |
| Lighthouse (mobile) Overview | Performance ≥ 90, Accessibility 100 | Manual at phase exit |

## 9. Defect severity

| Severity | Definition | Response |
|---|---|---|
| S1 | Data shown to a non-owner, data loss, or the app unusable | Fix first; roll back if needed |
| S2 | A rule computes wrong numbers (score, hours, ETA) or an action fails | Fix in the current phase |
| S3 | Visual or copy issue; a sync source failing with a clear message | Backlog |

## 10. Definition of done

A build step (document 16) is done when its code is on `main`, CI is green, its tests pass, the relevant document is updated if behavior changed, and the production deployment works.
