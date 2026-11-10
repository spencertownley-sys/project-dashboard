# 06. Data Model

Version 1.0, 10 Nov 2026. Owner: Engineering.

The executable schema is `lib/db/schema.ts` (Drizzle) and the SQL drizzle-kit generates from it in `/drizzle`. This document explains it. When they disagree, the schema wins and this document must be corrected.

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

## 2. Enums

| Enum | Values | Used by |
|---|---|---|
| `project_status` | `live`, `preview`, `building`, `stalled`, `archive`, `idea`, `unknown` | `projects.status` |
| `housekeeping_group` | `archive`, `overlap`, `docs` | `housekeeping_items.group` |
| `housekeeping_decision` | `pending`, `approved`, `skipped` | `housekeeping_items.decision` |

`signals.source` is `text` (not an enum) checked in application code against `github`, `vercel`, `supabase`, so Phase 3 can add `railway` and `cloudflare` without an enum migration (decision).

Display labels for status (document 09): live "Live", preview "Preview URL", building "Building", stalled "Stalled", archive "Archive", idea "Idea", unknown "Not assessed".

## 3. Tables

### 3.1 projects

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | text | no | | Primary key; slug from the inventory (`taskparty`, `zebra`) |
| `name` | text | no | | Display name |
| `repo` | text | no | `''` | Display text, may describe a branch (`Database · branch strata-spec-reconciliation`) |
| `github_repo` | text | yes | | `owner/name`; drives the GitHub adapter |
| `category` | text | no | `''` | Free text: SaaS, Game, Content, Portfolio, Business site, Tool, Consumer app, Content + search, App |
| `status` | project_status | no | `unknown` | |
| `pct` | integer | yes | | 0 to 100, CHECK enforced |
| `hours_left` | real | yes | | ≥ 0, CHECK enforced |
| `value` | integer | yes | | 1 to 5, CHECK enforced |
| `summary` | text | no | `''` | One or two sentences |
| `needs` | text | yes | | "Needs you" note; non-null and non-empty puts the project in Needs you |
| `risks` | text[] | no | `{}` | Ordered list |
| `urls` | text[] | no | `{}` | Hostnames or URLs; entries containing `(` are labels, not links (`mail.taskparty.app (planned)`) |
| `host_tags` | text[] | no | `{}` | Chips shown in the table (`Vercel`, `D1`, `Cloudflare Pages?`) |
| `arch` | jsonb | yes | | `{ Client, Host, Data, Auth, Services }`, each a string; null = not assessed |
| `docs` | jsonb | yes | | `{ prd, tech, api, ui, launch, claude }`, each 0 or 1; null = not assessed |
| `doc_note` | text | no | `''` | Free text next to the doc dots |
| `claude_project_url` | text | yes | | claude.ai chat Project link (not readable by API) |
| `vercel_project` | text | yes | | Vercel project id or name |
| `supabase_ref` | text | yes | | 20-letter project ref |
| `last_push` | date | yes | | Seeded from the audit; overwritten by GitHub sync |
| `queue_position` | integer | yes | | 1-based planner order; null = not queued |
| `created_at` | timestamptz | no | `now()` | |
| `updated_at` | timestamptz | no | `now()` | Set by `updateProject` and `toggleStep` |

Indexes: `projects_queue_position_idx` on `queue_position`.

### 3.2 steps

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | serial | no | | Primary key |
| `project_id` | text | no | | FK `projects.id` ON DELETE CASCADE |
| `title` | text | no | | |
| `hours` | real | no | `0` | ≥ 0 |
| `done` | boolean | no | `false` | |
| `done_at` | timestamptz | yes | | Set when ticked, cleared when unticked |
| `position` | integer | no | | Order within the project; new steps get max + 1 |

Index: `steps_project_position_idx` on (`project_id`, `position`).

### 3.3 ideas

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | serial | no | | |
| `project_id` | text | yes | | FK ON DELETE SET NULL; null = new-project idea (parking lot) |
| `title` | text | no | | |
| `detail` | text | no | `''` | |
| `starred` | boolean | no | `false` | |
| `created_at` | timestamptz | no | `now()` | |

Index: `ideas_project_idx` on `project_id`.

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
| `project_label` | text | no | `''` | Owner text as audited; may name several projects |
| `project_id` | text | yes | | FK ON DELETE SET NULL; set when the label matches one project |
| `note` | text | no | `''` | |
| `position` | integer | no | | Global order; cards appear in order of their first component |

### 3.6 housekeeping_items

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | serial | no | | |
| `group` | housekeeping_group | no | | `group` is a reserved SQL word; Drizzle quotes it |
| `title` | text | no | | |
| `detail` | text | no | `''` | |
| `decision` | housekeeping_decision | no | `pending` | |
| `decided_at` | timestamptz | yes | | Set on approve or skip, cleared on undo |

Display order is `id` ascending within each group.

### 3.7 signals

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `project_id` | text | no | | FK ON DELETE CASCADE |
| `source` | text | no | | `github`, `vercel`, `supabase` |
| `key` | text | no | | See table below |
| `value` | jsonb | no | | Scalar or object |
| `observed_at` | timestamptz | no | `now()` | Time of the sync that wrote it |

Primary key (`project_id`, `source`, `key`). Writes are upserts (`ON CONFLICT DO UPDATE`). A failed fetch leaves the previous signal in place; `observed_at` shows its age.

| Source | Key | Value | Example |
|---|---|---|---|
| github | `pushed_at` | ISO timestamp string | `"2026-11-08T21:14:03Z"` |
| github | `archived` | boolean | `false` |
| github | `default_branch` | string | `"main"` |
| github | `open_prs` | number (capped at 100) | `1` |
| github | `ci` | `"success"`, `"failure"`, `"pending"`, `"none"` | `"failure"` |
| vercel | `production` | `{ state, url, createdAt, id }` | `{ "state": "READY", ... }` |
| supabase | `status` | Management API status string | `"ACTIVE_HEALTHY"`, `"INACTIVE"` |

### 3.8 sync_runs

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | serial | no | | |
| `started_at` | timestamptz | no | `now()` | |
| `finished_at` | timestamptz | yes | | Null while running or if the function died |
| `ok` | boolean | no | `false` | True when no non-skipped source recorded an error |
| `summary` | jsonb | no | `{}` | Per-source result (document 12, section 6) |
| `error` | text | yes | | Short human summary of errors |

What started the run is not a column; the summary records `"trigger": "cron"` or `"manual"` (decision). Index: `sync_runs_started_idx` on `started_at` descending.

### 3.9 settings

| Key | Value | Seeded | Notes |
|---|---|---|---|
| `hours_per_week` | integer | `12` | Planner and KPI weeks; 1 to 80 |
| `supabase_capacity` | `{ "active": number, "limit": number }` | `{ "active": 2, "limit": 2 }` | From the inventory `cap`; `active` updated by the Supabase adapter (decision) |
| `provider_subtitles` | `{ [provider]: string }` | From inventory `sub` | Card subtitles, e.g. Railway "About 8 services" (decision) |

`key` text primary key, `value` jsonb not null.

## 4. Derived values (never stored)

| Value | Definition | Where |
|---|---|---|
| Finish score | `round1(value × pct/100 ÷ hours_left × 100)`, null if any input null or zero | `lib/rules.ts finishScore` |
| Active | status not in (`archive`, `idea`) | `isActive` |
| Stale | `last_push` not null and (today UTC − last_push) > 30 days | `isStale` |
| Lane | Quick wins, Launch pushes, Steady builds, or none | `laneOf`, `buildLanes` |
| Needs you items | needs notes plus sync alerts | `buildNeeds` |
| ETA | today + ceil(cumulative hours ÷ hours_per_week) weeks | `planQueue` |
| Supabase over capacity | `active >= limit` | Infrastructure page |

## 5. Seed mapping (`scripts/seed.ts`)

The seed runs only when `SELECT count(*) FROM projects` is 0; otherwise it prints "Already seeded, skipping" and exits 0. Everything is inserted in one transaction.

| Inventory field | Target |
|---|---|
| `projects[].id`, `name`, `repo`, `status`, `pct`, `value`, `urls`, `risks`, `arch`, `docs` | Same-named columns |
| `cat` | `category` |
| `hrs` | `hours_left` |
| `sum` | `summary` |
| `needs` (absent = null) | `needs` |
| `hostTags` | `host_tags` |
| `docNote` (absent = `''`) | `doc_note` |
| `last` | `last_push` |
| `next[]` as `[title, hours]` | `steps` with `position` = array index, `done = false` |
| `ideas[]` strings | `ideas` with that `project_id`, `detail = ''` |
| `sessions[]` strings | `claude_sessions` with `url = null` |
| `queue[]` ids | `projects.queue_position` = index + 1; other projects null |
| `newIdeas[]` as `[title, detail]` | `ideas` with `project_id = null` |
| `infrastructure[].items[]` as `[resource, label, note]` | `components` with `provider = prov`, `position` = running 1-based index across all groups, `project_id` = the project whose `name` equals the label case-insensitively, else null |
| `infrastructure[].sub` | `settings.provider_subtitles` |
| `infrastructure[].cap` (Supabase) | `settings.supabase_capacity` |
| `housekeeping[].t` "Archive or merge", "Overlaps to decide", "Docs coverage" | `group` `archive`, `overlap`, `docs` |
| `housekeeping[].items[]` as `[title, detail]` | `housekeeping_items`, decision `pending` |
| (constant) | `settings.hours_per_week = 12` |

Not seeded (decision): `github_repo`, `vercel_project`, `supabase_ref`, `claude_project_url` stay null; `auditedAt` and `docSuite` are not stored. Settings inserts use `ON CONFLICT DO NOTHING`.

Expected counts after seed: 26 projects, 101 steps, 67 ideas (62 feature, 5 new-project), 32 Claude sessions, 39 components (27 linked to a project), 12 housekeeping items, 3 settings, 0 signals, 0 sync runs.

## 6. Integrity rules

- Deleting a project (no UI in Phases 1 to 2) cascades steps, sessions and signals and orphans ideas and components.
- `toggleStep` updates the step and the project in one transaction.
- `saveQueue` rewrites all `queue_position` values in one transaction.
- CHECK constraints: `pct BETWEEN 0 AND 100`, `value BETWEEN 1 AND 5`, `hours_left >= 0`, `steps.hours >= 0`.

## 7. Planned Phase 3 additions (not built)

| Table | Columns | Purpose |
|---|---|---|
| `review_proposals` | `id` serial, `project_id` FK cascade, `run_id` int, `kind` text (`pct`, `steps`, `risks`), `payload` jsonb, `rationale` text, `status` text (`pending`, `accepted`, `rejected`), `created_at`, `decided_at` | Weekly Claude review output awaiting approval |
| `plans` | `id` serial, `week_of` date unique, `body` text (markdown), `created_at`, `dismissed_at` | Monday plan drafts |

Phase 3 also adds `projects.railway_service` (text, null) and `projects.cloudflare_resources` (text[], default `{}`) for the new adapters, and signal sources `railway` and `cloudflare`. All additive migrations.
