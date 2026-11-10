# 07. API Specification

Version 1.0, 10 Nov 2026. Owner: Engineering.

## 1. Surfaces

| Surface | Callers | Auth |
|---|---|---|
| Pages (Server Components) | The owner's browser | Clerk session + owner check (document 08) |
| Server actions (`app/actions.ts`) | Client Components in this app | `requireOwner()` inside every action |
| `GET /api/health` | Uptime checks, the owner | Public; returns no project data |
| `GET /api/cron/sync` | Vercel Cron | `Authorization: Bearer $CRON_SECRET` |

There is no public REST API, no webhooks and no API keys. Reads happen in Server Components through `lib/queries.ts`; writes happen only through the 12 server actions below.

## 2. Page routes and query parameters

| Route | Query parameters | Notes |
|---|---|---|
| `/` | none | Overview |
| `/projects` | `f` filter key (`all`, `live`, `preview`, `building`, `stalled`, `archive`, `SaaS`, `Game`, `site`), `q` search text, `sort` (`name`, `status`, `pct`, `hours`, `score`, `last`), `dir` (`asc`, `desc`) | Defaults `f=all`, `sort=score`, `dir=desc`. Unknown values fall back to defaults. |
| `/projects/[id]` | none | 404 page (Next `notFound()`) for an unknown id |
| `/infrastructure` | none | |
| `/planner` | none | |
| `/ideas` | none | |
| `/housekeeping` | none | |
| `/sign-in` | Clerk managed | Catch-all `[[...sign-in]]` |

## 3. Route handlers

### 3.1 GET /api/health

Public, `Cache-Control: no-store`. Runs `SELECT 1`.

| Status | Body |
|---|---|
| 200 | `{ "status": "ok", "db": "ok", "auth": "clerk" \| "open" \| "locked", "time": "2026-11-10T13:23:04.512Z" }` |
| 503 | `{ "status": "error", "db": "error", "auth": "...", "time": "..." }` |

`auth` is the auth mode from document 08, section 2, useful when diagnosing a setup page. No counts, names or errors are returned.

### 3.2 GET /api/cron/sync

Node runtime, `maxDuration = 60`, `Cache-Control: no-store`. Excluded from Clerk in `proxy.ts`.

| Condition | Status | Body |
|---|---|---|
| `CRON_SECRET` unset or empty | 503 | `{ "error": "CRON_SECRET is not configured" }` |
| Header missing or not equal to `Bearer <CRON_SECRET>` (constant-time compare) | 401 | `{ "error": "unauthorized" }` |
| Run completed (with or without per-source errors) | 200 | `{ "ok": true, "runId": 14, "summary": { ... } }` (`ok` mirrors `sync_runs.ok`) |
| `runSync()` threw before finishing | 500 | `{ "ok": false, "runId": 14, "error": "message" }` and the run row is finished with `ok = false` |

A run with per-source errors still returns 200 so Vercel Cron logs it as delivered; the failure is visible in `sync_runs` and on the Overview (decision). The summary shape is in document 12, section 6.

## 4. Server action contract

All actions live in `app/actions.ts` (`'use server'`), take a single plain object (or nothing), and return:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: 'UNAUTHORIZED' | 'VALIDATION' | 'NOT_FOUND' | 'INTERNAL';
      message: string; fields?: Record<string, string> };
```

Every action, in order:
1. `requireOwner()`; on failure return `UNAUTHORIZED` ("Sign in as the owner to make changes").
2. Validate input with `lib/validation.ts`; on failure return `VALIDATION` with per-field messages in `fields`.
3. Perform the write (transaction where noted).
4. `revalidatePath('/', 'layout')` (decision: one call refreshes every page; the app is small).
5. Return `ok: true` with the data below. Unexpected exceptions are logged and returned as `INTERNAL` with a generic message.

Strings are trimmed before validation. For nullable text fields an empty string means null.

## 5. Server actions

### 5.1 updateProject

Input: `{ id: string; status?; pct?; hoursLeft?; value?; needs?; summary?; claudeProjectUrl?; githubRepo?; vercelProject?; supabaseRef? }`. Only provided keys change.

| Field | Rule | Message |
|---|---|---|
| `status` | one of the seven `project_status` values | "Pick a status" |
| `pct` | integer 0 to 100, or null | "Enter a whole number from 0 to 100" |
| `hoursLeft` | number ≥ 0 and ≤ 10000, or null | "Enter hours as 0 or more" |
| `value` | integer 1 to 5, or null | "Value is 1 to 5" |
| `needs` | ≤ 500 chars, or null | "Keep it under 500 characters" |
| `summary` | ≤ 1000 chars | "Keep it under 1000 characters" |
| `claudeProjectUrl` | `https://` URL ≤ 500 chars, or null | "Paste the full https link" |
| `githubRepo` | `^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$`, or null | "Use owner/name" |
| `vercelProject` | 1 to 100 chars of `[A-Za-z0-9._-]`, or null | "Use the Vercel project name or id" |
| `supabaseRef` | `^[a-z]{20}$`, or null | "A Supabase ref is 20 lowercase letters" |

Output: `{ project: Project }`. Sets `updated_at`. Errors: `NOT_FOUND` for an unknown id.

### 5.2 toggleStep

Input: `{ stepId: number; done: boolean }`.
Transaction: load step and project with `FOR UPDATE`; if `step.done === done`, return the current state unchanged (idempotent, so a double click never subtracts twice; decision). Otherwise set `done`, `done_at = done ? now() : null`; if `hours_left` is not null set it to `max(0, hours_left − hours)` when ticking or `hours_left + hours` when unticking; set `updated_at`.
Output: `{ stepId, done, hoursLeft: number | null }`. Errors: `NOT_FOUND`.

### 5.3 addStep

Input: `{ projectId: string; title: string (1 to 200); hours: number (0 to 500) }`.
Inserts with `position = max(position) + 1` (0 when none), `done = false`. Does not change `hours_left` (decision).
Output: `{ step: Step }`. Errors: `NOT_FOUND` for the project, `VALIDATION`.

### 5.4 deleteStep

Input: `{ stepId: number }`. Deletes the row. Does not change `hours_left`, whether or not the step was done (decision).
Output: `{ stepId }`. Errors: `NOT_FOUND`.

### 5.5 addIdea

Input: `{ projectId: string | null; title: string (1 to 200); detail?: string (0 to 1000) }`. `projectId = null` adds to the new-project parking lot.
Output: `{ idea: Idea }`. Errors: `NOT_FOUND` when `projectId` is given and unknown.

### 5.6 toggleIdeaStar

Input: `{ ideaId: number }`. Flips `starred`.
Output: `{ ideaId, starred }`. Errors: `NOT_FOUND`.

### 5.7 deleteIdea

Input: `{ ideaId: number }`.
Output: `{ ideaId }`. Errors: `NOT_FOUND`.

### 5.8 addSession

Input: `{ projectId: string; title: string (1 to 200); url?: string | null }` (`url` must be `https://` when given).
Output: `{ session: ClaudeSession }`. Errors: `NOT_FOUND`, `VALIDATION`.

### 5.9 setHousekeepingDecision

Input: `{ itemId: number; decision: 'pending' | 'approved' | 'skipped' }`. Sets `decided_at = now()` for approved or skipped, null for pending. Records only; never acts externally.
Output: `{ item: HousekeepingItem }`. Errors: `NOT_FOUND`, `VALIDATION`.

### 5.10 saveQueue

Input: `{ projectIds: string[] }` in planner order, at most 100, no duplicates, every id must exist.
Transaction: set `queue_position = index + 1` for listed ids and null for every other project.
Output: `{ queue: string[] }`. Errors: `VALIDATION` ("Duplicate project in queue", "Unknown project: x").

The Planner calls it after every move, add or remove with the full new order (decision: no separate Save button).

### 5.11 setHoursPerWeek

Input: `{ hours: number }`, integer 1 to 80. Upserts `settings.hours_per_week`.
Output: `{ hoursPerWeek }`. Errors: `VALIDATION` ("Hours per week is 1 to 80").

The slider (4 to 40) calls it on commit (pointer up or keyboard change), not on every input event.

### 5.12 runSyncNow

Input: none. Calls `runSync({ trigger: 'manual' })` and waits for it.
Output: `{ runId, ok, summary }`. Errors: `UNAUTHORIZED`, `INTERNAL` if the run threw (the run row is still finished with `ok = false`).

## 6. Object shapes

```ts
type Status = 'live' | 'preview' | 'building' | 'stalled' | 'archive' | 'idea' | 'unknown';

type Project = {
  id: string; name: string; repo: string; githubRepo: string | null;
  category: string; status: Status; pct: number | null; hoursLeft: number | null;
  value: number | null; summary: string; needs: string | null;
  risks: string[]; urls: string[]; hostTags: string[];
  arch: { Client: string; Host: string; Data: string; Auth: string; Services: string } | null;
  docs: { prd: 0|1; tech: 0|1; api: 0|1; ui: 0|1; launch: 0|1; claude: 0|1 } | null;
  docNote: string; claudeProjectUrl: string | null; vercelProject: string | null;
  supabaseRef: string | null; lastPush: string | null /* YYYY-MM-DD */;
  queuePosition: number | null; createdAt: Date; updatedAt: Date;
};
type Step = { id: number; projectId: string; title: string; hours: number;
  done: boolean; doneAt: Date | null; position: number };
type Idea = { id: number; projectId: string | null; title: string; detail: string;
  starred: boolean; createdAt: Date };
type ClaudeSession = { id: number; projectId: string; title: string; url: string | null };
type Component = { id: number; provider: string; resource: string; projectLabel: string;
  projectId: string | null; note: string; position: number };
type HousekeepingItem = { id: number; group: 'archive' | 'overlap' | 'docs'; title: string;
  detail: string; decision: 'pending' | 'approved' | 'skipped'; decidedAt: Date | null };
type Signal = { projectId: string; source: string; key: string; value: unknown; observedAt: Date };
type SyncRun = { id: number; startedAt: Date; finishedAt: Date | null; ok: boolean;
  summary: SyncSummary; error: string | null };
```

## 7. Read functions (`lib/queries.ts`)

Internal, server-only, not an HTTP surface: `getProjects()`, `getProject(id)` (with steps, ideas, sessions, signals), `getStepsByProject()`, `getComponents()`, `getIdeas()`, `getHousekeeping()`, `getSettings()`, `getLatestSyncRun()`, `getSignals()`. Pages compose them with `lib/rules.ts`.

## 8. Phase 3 additions (planned)

| Action or route | Purpose |
|---|---|
| `GET /api/cron/review` (bearer `CRON_SECRET`, weekly) | Run the Claude review and Monday plan draft |
| `acceptProposal({ proposalId })`, `rejectProposal({ proposalId })` | Apply or dismiss a proposal |
| `dismissPlan({ planId })` | Hide the Monday plan card |
| `deleteSession({ sessionId })` | Remove a Claude session link |
