# 15. Quality and Test Plan

Version 1.0, 10 Nov 2026. Owner: Engineering.

## 1. Strategy

| Level | Tool | Scope | Runs |
|---|---|---|---|
| Static | ESLint (Next config), `tsc --noEmit` strict | Whole repo | CI on every push |
| Unit | Vitest | `lib/rules.ts`, `lib/validation.ts`, `lib/auth.ts` mode logic, sync adapters with mocked `fetch`, alert derivation | CI |
| Integration | Vitest with in-memory PGlite | Migrations, seed, every server action's database effect, `runSync` writes, cron and health route handlers | CI |
| Smoke E2E | Playwright (Chromium) | Main journeys against `next dev` in open auth mode on a seeded PGlite | Locally before release |
| Manual | Checklist in section 7 | Clerk sign-in, real tokens, responsive, dark mode, accessibility | Each phase exit |

Every functional requirement in document 02 maps to at least one test below. Tests pin `today = '2026-11-10'` so seed-derived expectations are stable.

## 2. Test data

- `tests/helpers/db.ts` exports `createTestDb()`: a fresh in-memory PGlite with `/drizzle` migrations applied, and `seedTestDb(db)` running the real seed against `data/inventory.json`.
- Fixtures for adapters live in `tests/fixtures/{github,vercel,supabase}/*.json`, trimmed copies of real API responses.
- No test touches the network; `fetch` is stubbed with `vi.stubGlobal`.

## 3. Unit tests

### 3.1 Rules (`tests/unit/rules.test.ts`)

| Case | Expected |
|---|---|
| `finishScore` Spotted Zebra (3, 90, 6) | 45.0 |
| `finishScore` TaskParty (4, 75, 50) | 6.0 |
| `finishScore` Townley Photography (4, 80, 12) | 26.7 (rounding) |
| `finishScore` with pct 0, value null, hours null, hours 0 | null for each |
| `isStale` last push 2026-10-10 / 2026-10-11 / null | true / false / false |
| `buildLanes` on seed | Exactly the lanes in document 11, section 3, including NimbusWatch over Downbeat on the tie |
| `buildLanes` excludes archive and idea | Mariners Prediction Hub (score 4.0, 10 h) not in Quick wins |
| `buildKpis` on seed | 26 / 11 / 67% / 827 / 9 / 11 and sub-lines as in document 11, section 2 |
| `buildNeeds` on seed | 9 items in the documented order |
| `buildNeeds` with signals | ci failure, vercel ERROR, supabase INACTIVE each add one risk item, listed before notes |
| `applyStepToggle` | 6 − 1.5 = 4.5; 1 − 3 floors at 0; untick adds back; null stays null |
| `planQueue` seed at 12 h | ETAs per document 11, section 7 (spot check rows 1, 3, 7, 19); all-done 2028-02-22 |
| `planQueue` at 24 h | FrameVote Nov 17 |
| `planQueue` null hours entry | contributes 0; ETA equals the previous entry's |
| Timeline math | totalW 67 gives tickStep 8; bar width floor 0.6% |
| `filterProjects` | counts per filter as in document 11, section 5.1; search "railway" returns the 7 projects tagged Railway |
| `sortProjects` | nulls last both directions; status order; tie by name |
| `groupIdeas` on seed | high-value 7 projects, other 14, parking lot 5; starred first |

### 3.2 Validation (`tests/unit/validation.test.ts`)

Boundary values for every rule in document 07, section 5.1 (pct −1, 0, 100, 101, 50.5; value 0, 1, 5, 6; `githubRepo` "a/b", "a", "a/b/c"; `supabaseRef` 20 lowercase letters vs 19 or uppercase; URL http vs https; empty string to null).

### 3.3 Auth (`tests/unit/auth.test.ts`)

| Env | Mode |
|---|---|
| Both Clerk keys | clerk |
| No keys, NODE_ENV development | open |
| No keys, NODE_ENV production | locked |
| No keys, production, `ALLOW_NO_AUTH=1` | open |
| No keys, production, `ALLOW_NO_AUTH=true` | locked |
| One key only, production | locked |

Owner matching: `OWNER_EMAILS=" A@x.com ,b@y.com"` admits `a@x.com` and `B@Y.COM`; rejects `c@z.com`; empty list rejects everyone. Clerk `auth()` and `currentUser()` are mocked.

### 3.4 Adapters (`tests/unit/sync-*.test.ts`)

| Case | Expected |
|---|---|
| Token unset | `status: 'skipped'`, `fetch` never called |
| GitHub happy path | 5 signals written, `last_push` updated to the date of `pushed_at` |
| GitHub check runs: none / all success / one failure / one in progress | `none` / `success` / `failure` / `pending` |
| GitHub 404 on one of three projects | 2 updated, 1 error, status `error` |
| GitHub 401 | adapter-level error, no further calls |
| Vercel name resolution then deployment `ERROR` | signal `production.state = 'ERROR'` |
| Vercel no deployments | `state: 'NONE'` |
| Supabase list with linked ref INACTIVE | signal `INACTIVE`, capacity active counts only non-inactive projects |
| Supabase ref missing from list | per-project error |
| Error sanitizing | a message containing `Bearer abc123` is stored without the token |

## 4. Integration tests (PGlite)

| Test | Checks |
|---|---|
| Migrations | All 9 tables and 3 enums exist; CHECK constraints reject pct 101 and value 0 |
| Seed | Counts 26 / 101 / 67 / 32 / 39 (27 linked) / 12 / 3 settings; queue positions 1 to 19; link fields null; running it twice leaves counts unchanged |
| `toggleStep` | Tick and untick update `hours_left`, `done_at`, `updated_at` in one transaction; repeated tick is a no-op |
| `addStep`, `deleteStep` | Position max + 1; hours_left unchanged |
| `updateProject` | Partial update; empty strings to null; invalid input returns `VALIDATION` with fields and writes nothing; unknown id `NOT_FOUND` |
| `addIdea`, `toggleIdeaStar`, `deleteIdea` | Project and parking-lot ideas |
| `addSession` | Inserted with optional URL |
| `setHousekeepingDecision` | `decided_at` set and cleared on undo |
| `saveQueue` | Positions rewritten, others nulled; duplicates and unknown ids rejected |
| `setHoursPerWeek` | Upsert; 0 and 81 rejected |
| Unauthorized | With `getOwner` mocked to `not_authorized`, every action returns `UNAUTHORIZED` and writes nothing |
| `runSync` | Inserts and finishes a `sync_runs` row; `ok` true when all skipped; `ok` false and `error` set with one adapter error; signals upserted, not duplicated, on a second run |
| Cron route | 503 without `CRON_SECRET`; 401 with a wrong or missing header; 200 with the right one |
| Health route | 200 with a working database; 503 when the query throws |
| Cascade | Deleting a project removes steps, sessions, signals; nulls ideas and components |

## 5. Smoke E2E (`e2e/smoke.spec.ts`)

Playwright `webServer` runs `npm run db:migrate && npm run db:seed && npm run dev` with a fresh temp `PGLITE_DIR` and no Clerk keys (open mode).

1. Overview: six KPI cells; "Spotted Zebra" first in Quick wins; Needs you shows 9 items; "Auth disabled" pill visible.
2. Projects: click "Games" filter, see 4 rows; search "railway", see Mentionful; sort by Hours left, first row is Amanda Williams Portfolio (4 h).
3. Detail: open Spotted Zebra; tick "Add 10–20 gig photos"; meter shows "4.5 h left"; untick; "6 h left".
4. Edit: set value to 5 and save; header shows "value 5/5".
5. Planner: move Amanda Williams Portfolio up; reload; it is first.
6. Housekeeping: approve "timeline_web_app.py"; chip "Approved" appears; Undo restores the buttons.
7. Every top bar tab loads without a console error.

## 6. Performance and quality budgets

| Budget | Target | How measured |
|---|---|---|
| Overview server render | under 500 ms P95 on Vercel with Neon | Vercel logs `ms` field |
| Server action round trip | under 1 s | Manual check, Playwright timing |
| Full sync | under 60 s | `sync_runs` duration |
| JavaScript on Overview | under 150 KB gzipped first load | `next build` output |
| Lighthouse (mobile) Overview | Performance ≥ 90, Accessibility 100 | Manual run at phase exit |

## 7. Manual checklist (each phase exit)

- [ ] Clerk sign-in with the owner account reaches the Overview; a second account sees not-authorized and can sign out.
- [ ] Production without keys shows the setup page (test on a preview with keys removed).
- [ ] Every screen at 360 px, 768 px and 1240 px: no horizontal page scroll; tables and timeline scroll in their panels.
- [ ] Dark mode via OS setting: all text readable; pills and bars visible.
- [ ] Keyboard only: tabs, filters, sort headers, checkboxes, queue buttons, forms and housekeeping buttons reachable with a visible focus ring.
- [ ] Screen reader spot check (VoiceOver): checkbox labels are step titles; move buttons announce the project.
- [ ] Contrast check of `--muted`, `--accent` and the status foregrounds in both themes (document 09, section 9).
- [ ] Phase 2: real tokens set; Sync now completes; a known failing repo shows a CI alert.

## 8. Defect severity

| Severity | Definition | Response |
|---|---|---|
| S1 | Data shown to a non-owner, data loss, or the app unusable | Fix before anything else; roll back if needed |
| S2 | A rule computes wrong numbers (score, hours, ETA) or an action fails | Fix in the current phase |
| S3 | Visual or copy issue, a sync source failing with a clear message | Backlog |

## 9. Definition of done

A step in document 16 is done when its code is merged to `main`, CI is green, the tests listed for it pass, the relevant document is updated if behavior changed, and the production deployment works.
