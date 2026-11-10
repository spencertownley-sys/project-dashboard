# 06. Data Model

Version 1.0, 10 Nov 2026. Owner: Engineering.

The executable schema is `lib/db/schema.ts` (Drizzle). drizzle-kit generates the SQL in `/drizzle` from it (`0000_init.sql` is the initial migration). This document explains both. When they disagree, the schema wins and this document must be corrected. Never edit generated SQL by hand.

## 1. Entity overview

```
                         settings (key -> jsonb)
                         sync_runs (one row per sync)

projects (id = slug) ---+---< steps            (cascade)
                        +---< claude_sessions  (cascade)
                        +---< signals          (cascade; PK project_id, source, key)
                        +---< ideas            (set null; project_id null = new-project idea)
                        +---< components       (set null; infrastructure inventory)

housekeeping_items (standalone; group archive | overlap | docs)
```

Nine tables. Everything hangs off `projects` except `housekeeping_items`, `sync_runs` and `settings`.

## 2. Enums and typed text

| Name | Values | Storage |
|---|---|---|
| `project_status` | `live`, `preview`, `building`, `stalled`, `archive`, `idea`, `unknown` | Postgres enum |
| Housekeeping group (`HK_GROUPS`) | `archive`, `overlap`, `docs` | `text`, typed in TypeScript |
| Housekeeping decision (`HK_DECISIONS`) | `pending`, `approved`, `skipped` | `text`, typed in TypeScript |
| Signal source (`SIGNAL_SOURCES`) | `github`, `vercel`, `supabase` | `text`, typed in TypeScript, so Phase 3 can add `railway` and `cloudflare` without an enum migration |

Status labels (`STATUS_LABEL` in `lib/metrics.ts`): live "Live", preview "Preview URL", building "Building", stalled "Stalled", archive "Archive", idea "Idea", unknown "Not assessed".

Ranges (pct 0 to 100, value 1 to 5, hours ≥ 0) are enforced by zod in the server actions and by HTML input constraints, not by database CHECK constraints (decision: keep the migration simple; one writer).

## 3. Tables

### 3.1 projects

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | text | no | | Primary key; slug from the inventory (`taskparty`, `zebra`) |
| `name` | text | no | | Display name; editable |
| `repo` | text | no | `''` | Display text, may describe a branch (`Database · branch strata-spec-reconciliation`) |
| `github_repo` | text | yes | | `owner/name`; drives the GitHub adapter |
| `category` | text | no | `''` | SaaS, Game, Content, Portfolio, Business site, Tool, Consumer app, Content + search, App |
| `status` | project_status | no | `building` | |
| `pct` | integer | yes | | 0 to 100 |
| `hours_left` | real | yes | | ≥ 0, one decimal after step toggles |
| `value` | integer | yes | | 1 to 5 |
| `summary` | text | no | `''` | |
| `needs` | text | yes | | "Needs you" note; non-empty puts the project in Needs you |
| `risks` | text[] | no | `{}` | One per line in the edit form |
| `urls` | text[] | no | `{}` | Hostnames or URLs; entries with spaces or "(" are labels, not links |
| `host_tags` | text[] | no | `{}` | Chips in the table; comma separated in the edit form |
| `arch` | jsonb | yes | | `{ Client?, Host?, Data?, Auth?, Services? }`; null = not assessed |
| `docs` | jsonb | yes | | `{ prd, tech, api, ui, launch, claude }`, each 0 or 1; null = not assessed |
| `doc_note` | text | yes | | Free text next to the doc dots |
| `claude_project_url` | text | yes | | claude.ai chat Project link (no API) |
| `vercel_project` | text | yes | | Vercel project id or name |
| `supabase_ref` | text | yes | | Supabase project ref |
| `last_push` | date | yes | | Seeded from the audit; overwritten by GitHub sync |
| `queue_position` | integer | yes | | 0-based planner order; null = not queued |
| `created_at` | timestamptz | no | `now()` | |
| `updated_at` | timestamptz | no | `now()` | Set by `updateProject` and `toggleStep` |

### 3.2 steps

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | serial | no | | Primary key |
| `project_id` | text | no | | FK `projects.id` ON DELETE CASCADE |
| `title` | text | no | | |
| `hours` | real | no | `0` | |
| `done` | boolean | no | `false` | |
| `done_at` | timestamptz | yes | | Set when ticked, cleared when unticked |
| `position` | integer | no | `0` | Order within the project; new steps get max + 1 |

### 3.3 ideas

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | serial | no | | |
| `project_id` | text | yes | | FK ON DELETE SET NULL; null = new-project idea (parking lot) |
| `title` | text | no | | |
| `detail` | text | no | `''` | |
| `starred` | boolean | no | `false` | |
| `created_at` | timestamptz | no | `now()` | |

### 3.4 claude_sessions

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | serial | no | | |
| `project_id` | text | no | | FK ON DELETE CASCADE |
| `title` | text | no | | Session title as shown in the Claude app |
| `url` | text | yes | | Session link when known; seeded null |

### 3.5 components (infrastructure inventory)

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | serial | no | | |
| `provider` | text | no | | Card name: Cloudflare, Railway, Supabase, Vercel, GitHub Pages and Actions, Shared services, Domains |
| `resource` | text | no | | `Worker shortlist`, `allclear · us-west-1`, `framevote.com` |
| `project_label` | text | no | `''` | Text as audited; may name several projects |
| `project_id` | text | yes | | FK ON DELETE SET NULL; set when the label names exactly one project |
| `note` | text | no | `''` | |
| `position` | integer | no | `0` | Global 0-based order; cards appear in order of their first component |

### 3.6 housekeeping_items

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | serial | no | | |
| `group` | text | no | | `archive`, `overlap`, `docs`; `group` is a reserved SQL word, Drizzle quotes it |
| `title` | text | no | | |
| `detail` | text | no | `''` | |
| `decision` | text | no | `pending` | `pending`, `approved`, `skipped` |
| `decided_at` | timestamptz | yes | | Set on approve or skip, cleared on undo |

### 3.7 signals

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `project_id` | text | no | | FK ON DELETE CASCADE |
| `source` | text | no | | `github`, `vercel`, `supabase` |
| `key` | text | no | | See below |
| `value` | jsonb | yes | | Scalar or object |
| `observed_at` | timestamptz | no | `now()` | Time of the sync that wrote it |

Primary key (`project_id`, `source`, `key`). Writes are upserts. A failed fetch leaves the previous signal in place.

| Source | Key | Value |
|---|---|---|
| github | `repo` | `{ archived, defaultBranch, url, private, pushedAt }`, or `{ missing: true }` on 404 |
| github | `open_prs` | number of open pull requests (first page, at most 100) |
| github | `ci` | `{ conclusion: "success" \| "failure" \| "pending" \| "none", branch, runs }` |
| vercel | `deployment` | `{ state, url, createdAt, framework }` for the latest production deployment, or `{ state: "NONE", framework }` |
| supabase | `project` | `{ status, region, name }`, or `{ status: "NOT_FOUND" }` |

### 3.8 sync_runs

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | serial | no | | |
| `started_at` | timestamptz | no | `now()` | |
| `finished_at` | timestamptz | yes | | Null while running or if the function died |
| `ok` | boolean | yes | | True when no source has status `error` |
| `summary` | jsonb | yes | | `{ [source]: { status: "ok" \| "skipped" \| "error", updated, message? } }` |
| `error` | text | yes | | Reserved; per-source messages live in `summary` |

### 3.9 settings

`key` text primary key, `value` jsonb not null.

| Key | Value | Written by | Notes |
|---|---|---|---|
| `hours_per_week` | integer | Seed (12), `setHoursPerWeek` | Planner, KPI weeks, detail ETA |
| `supabase_free_limit` | integer | Seed (2) | Denominator of the Supabase capacity meter |
| `supabase_active_count` | integer | Supabase adapter | Projects in the account whose status starts with `ACTIVE` |
| `supabase_projects` | `[{ name, status, region }]` | Supabase adapter | Account-wide list, for reference |

Before the first Supabase sync the capacity meter counts Supabase components whose note starts with "Active" (2 at seed).

## 4. Derived values (never stored)

| Value | Definition | Where |
|---|---|---|
| Finish score | `round1(value × pct/100 ÷ hours_left × 100)`; null if any input is null or hours ≤ 0 (pct 0 gives 0.0) | `finishScore` |
| Active | status not in (`archive`, `idea`) | `isActive` |
| Days since push | whole days from noon UTC on `last_push` to now, rounded, never negative | `daysSince` |
| Stale | days since push > 30 | `isStale` |
| Lanes | Quick wins, Launch pushes, Steady builds | `focusLanes` |
| KPIs | six summary tiles | `portfolioSummary` plus `buildAlerts().length` |
| Needs you | needs notes plus sync alerts | `buildAlerts` in `lib/alerts.ts` |
| ETA | now + ceil(cumulative hours ÷ hours_per_week) weeks | `planQueue` |

## 5. Seed mapping (`lib/db/seed.ts`)

`seedIfEmpty(db)` runs `seed(db)` only when `count(projects) = 0` and returns whether it seeded. It is called by `npm run db:seed`, by `npm run vercel-build` (so the first production deploy seeds an empty Neon database), by `npm run sync`, and by `getDb()` on local PGlite. Everything is inserted in one transaction.

| Inventory field | Target |
|---|---|
| `projects[].id`, `name`, `repo`, `status`, `pct`, `value`, `urls`, `risks`, `arch`, `docs` | Same-named columns |
| `cat` | `category` |
| `hrs` | `hours_left` |
| `sum` | `summary` |
| `needs` (absent = null) | `needs` |
| `hostTags` | `host_tags` |
| `docNote` (absent = null) | `doc_note` |
| `last` | `last_push` |
| `repo` | `github_repo = "spencertownley-sys/" + first word of repo` (so Strata and Split the G map to `spencertownley-sys/Database`); PromoVault is explicitly null |
| (resource links in code) | `vercel_project` `taskparty` for TaskParty; `supabase_ref` for TaskParty, NimbusWatch (`allclear`) and Chronologue ("Make Me A Timeline") |
| `next[]` as `[title, hours]` | `steps`, `position` = array index |
| `ideas[]` strings | `ideas` with that `project_id` |
| `sessions[]` strings | `claude_sessions`, `url` null |
| `queue[]` ids | `projects.queue_position` = 0-based index; others null |
| `newIdeas[]` as `[title, detail]` | `ideas` with `project_id = null` |
| `infrastructure[].items[]` as `[resource, label, note]` | `components`, `provider = prov`, `position` = running 0-based index; `project_id` from `matchProject(label)` |
| `housekeeping[].t` "Archive or merge", "Overlaps to decide", "Docs coverage" | `group` `archive`, `overlap`, `docs`; decision `pending` |
| (constants) | `settings.hours_per_week = 12`, `settings.supabase_free_limit = 2` (`ON CONFLICT DO NOTHING`) |

`matchProject(label)`: strip a trailing "?", lowercase; labels containing a comma stay unlinked; an exact name match wins; otherwise a unique name prefix of at least 4 characters links (so "JIMOTHY", "Cruise News" and "Chronologue?" link, "Personal site" and "Unmatched" do not).

Not stored: `infrastructure[].sub` (card subtitles are constants in the Infrastructure page), `cap` (replaced by `supabase_free_limit` and the active count), `auditedAt`, `docSuite`.

Expected counts after seed: 26 projects, 101 steps, 67 ideas (62 feature, 5 new-project), 32 Claude sessions, 39 components (34 linked), 12 housekeeping items, 2 settings, 0 signals, 0 sync runs.

## 6. Integrity rules

- Deleting a project (no UI) cascades steps, sessions and signals and orphans ideas and components.
- `toggleStep` updates the step and the project in one transaction and is a no-op when the step is already in the requested state.
- `saveQueue` rewrites positions in one transaction.

## 7. Planned Phase 3 additions (not built)

| Table | Columns | Purpose |
|---|---|---|
| `review_proposals` | `id` serial, `project_id` FK cascade, `kind` text (`pct`, `steps`, `risks`), `payload` jsonb, `rationale` text, `status` text (`pending`, `accepted`, `rejected`), `created_at`, `decided_at` | Weekly Claude review output awaiting approval |
| `plans` | `id` serial, `week_of` date unique, `body` text (markdown), `created_at`, `dismissed_at` | Monday plan drafts |

Phase 3 also adds `projects.railway_service` (text, null) and `projects.cloudflare_resources` (text[], default `{}`), and signal sources `railway` and `cloudflare`. All additive.
