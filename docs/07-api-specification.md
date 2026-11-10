# 07. API Specification

Version 1.0, 10 Nov 2026. Owner: Engineering.

## 1. Surfaces

| Surface | Callers | Auth |
|---|---|---|
| Pages (Server Components) | The owner's browser | Clerk session plus `requireOwner()` (document 08) |
| Server actions (`app/actions.ts`) | Forms and Client Components in this app | `requireOwner()` first in every action |
| `GET /api/health` | Uptime checks, Playwright readiness | Public; returns no data |
| `GET /api/cron/sync` | Vercel Cron, manual `curl` | `Authorization: Bearer $CRON_SECRET` |

There is no public REST API, no webhooks and no API keys. Reads happen in Server Components through `lib/queries.ts`; writes happen only through the server actions below.

## 2. Page routes

| Route | Notes |
|---|---|
| `/` | Overview |
| `/projects` | Filter, search and sort are client state (not in the URL; decision) |
| `/projects/[id]` | `notFound()` for an unknown id; title is the id |
| `/infrastructure`, `/planner`, `/ideas`, `/housekeeping` | |
| `/sign-in` | Clerk catch-all `[[...sign-in]]`; redirects to `/` when Clerk is not configured |
| `/not-authorized` | Signed in but not an owner; redirects to `/` when Clerk is not configured |
| `/setup` | Shown in production without Clerk keys (the proxy rewrites app routes here with status 503) |

## 3. Route handlers

### 3.1 GET /api/health

Public, `dynamic = "force-dynamic"`. Returns `200 { "ok": true }`. It does not touch the database (decision: it is a liveness check used by Playwright's `webServer.url`; database health shows on the Overview).

### 3.2 GET /api/cron/sync

`dynamic = "force-dynamic"`, `maxDuration = 60`. Public to the proxy; protected by the bearer secret.

| Condition | Status | Body |
|---|---|---|
| `CRON_SECRET` unset, header missing, or header not equal to `Bearer <CRON_SECRET>` (constant-time compare, length checked first) | 401 | `{ "error": "Unauthorized" }` |
| Run finished, every source ok or skipped | 200 | `{ "id": 14, "ok": true, "summary": { ... } }` |
| Run finished, at least one source with status `error` | 207 | `{ "id": 15, "ok": false, "summary": { ... } }` |

The summary shape is in document 12, section 6. An unexpected exception inside `runSync` surfaces as a 500 from Next.js and leaves the run row with `finished_at` null.

## 4. Server action conventions

All actions live in `app/actions.ts` (`'use server'`).

1. `await requireOwner()` first. A non-owner never gets an error value: `requireOwner()` redirects to `/setup`, `/sign-in` or `/not-authorized`.
2. Form actions parse `FormData` with zod. Blank strings become null for nullable fields (`blankToNull`).
3. Write (in a transaction where noted).
4. `revalidatePath(path ?? '/', 'layout')`: `/` for most actions so every page refreshes; `/housekeeping` and `/planner` for their own actions.

Only `updateProject` and `runSyncNow` return a value to the UI: `type FormState = { ok: boolean; message: string } | null`. Other form actions return nothing; invalid input is ignored after HTML validation (`required`, `min`, `max`, `type=url`) has already blocked it in the browser (decision). `saveQueue` and `setHoursPerWeek` call `z.parse`, so invalid input throws and reaches the error boundary.

## 5. Server actions

| Action | Input | Effect | Returns |
|---|---|---|---|
| `updateProject(prev, form)` | FormData, used with `useActionState` | Update project fields (5.1) and `updated_at` | `{ ok: true, message: "Saved" }` or `{ ok: false, message: <first zod issue> }` |
| `toggleStep(stepId, nowDone)` | number, boolean | Transaction: no-op if unchanged; else `done`, `done_at`, and `hours_left = hoursAfterToggle(hours_left, step.hours, nowDone)`, `updated_at` | void |
| `addStep(form)` | `projectId`, `title` (1 to 300), `hours` (0 to 1000, default 1) | Insert at `max(position) + 1`; `hours_left` unchanged | void |
| `deleteStep(stepId)` | number | Delete; `hours_left` unchanged | void |
| `addIdea(form)` | `projectId` (blank = parking lot), `title` (1 to 200), `detail` (≤ 1000) | Insert | void |
| `toggleIdeaStar(id, starred)` | number, boolean | Set `starred` | void |
| `deleteIdea(id)` | number | Delete | void |
| `addSession(form)` | `projectId`, `title` (1 to 200), `url` (optional, valid URL) | Insert | void |
| `deleteSession(id)` | number | Delete a session link | void |
| `setHousekeepingDecision(id, decision)` | number, `pending` \| `approved` \| `skipped` | Set decision; `decided_at = now()` or null for pending. Records only | void |
| `saveQueue(ids)` | string[] (≤ 500) | Transaction: `queue_position = index` (0-based) for each id; null for every other project when the list is non-empty | void |
| `addToQueue(projectId)` | string | `queue_position = max + 1` | void |
| `removeFromQueue(ids)` | string[] | `queue_position = null` | void |
| `setHoursPerWeek(hours)` | integer 1 to 80 | Upsert `settings.hours_per_week` | void |
| `runSyncNow()` | none | `runSync(db)` | `{ ok, message }`, message like `github updated 57 · vercel updated 1 · supabase skipped` |

`addToQueue`, `removeFromQueue` and `deleteSession` go beyond the 12 actions in the original spec; they support the planner's add and remove and removing a wrong session link.

### 5.1 updateProject fields

| Field (form name) | Rule | Message |
|---|---|---|
| `id` | required | |
| `name` | 1 to 120 chars | "Name is required" |
| `category` | ≤ 60 chars | |
| `status` | one of the seven statuses | |
| `pct` | blank (null) or integer 0 to 100 | "Use a whole number" for decimals |
| `hoursLeft` | blank or number 0 to 10000 | |
| `value` | blank or integer 1 to 5 | |
| `summary` | ≤ 2000 chars | |
| `needs` | blank or ≤ 2000 chars | |
| `claudeProjectUrl` | blank or a URL | "Claude project link must be a full URL" |
| `githubRepo` | blank or `^[\w.-]+/[\w.-]+$` | "GitHub repo must look like owner/name" |
| `vercelProject`, `supabaseRef` | blank or ≤ 2000 chars | |
| `urls`, `risks` | one per line, trimmed, blanks dropped | |
| `hostTags` | comma separated, trimmed, blanks dropped | |

## 6. Object shapes

Types are inferred from the schema (`typeof projects.$inferSelect` and so on) and exported from `lib/db/schema.ts`: `Project`, `Step`, `Idea`, `ClaudeSession`, `Component`, `HousekeepingItem`, `Signal`, `SyncRun`. Key shapes:

```ts
type Status = 'live' | 'preview' | 'building' | 'stalled' | 'archive' | 'idea' | 'unknown';
type Arch = { Client?: string; Host?: string; Data?: string; Auth?: string; Services?: string };
type DocFlags = Record<'prd' | 'tech' | 'api' | 'ui' | 'launch' | 'claude', 0 | 1>;
type SyncSummary = Record<string, { status: 'ok' | 'skipped' | 'error'; updated: number; message?: string }>;
type Alert = { projectId: string; projectName: string;
  kind: 'needs' | 'ci' | 'deploy' | 'database' | 'repo'; text: string; severity: 'warn' | 'risk' };
```

## 7. Read functions (`lib/queries.ts`)

Internal and server-side, not an HTTP surface: `listProjects` (by name), `getProject(id)` (with steps, sessions, ideas, signals, components), `firstOpenSteps` (map of project id to first open step title), `listAlerts`, `listSignals`, `listComponents`, `listIdeas`, `listNewProjectIdeas`, `listHousekeeping`, `getSetting(key, fallback)`, `setSetting(key, value)`, `lastSyncRun`.

## 8. Phase 3 additions (planned)

| Action or route | Purpose |
|---|---|
| `GET /api/cron/review` (bearer `CRON_SECRET`, weekly) | Run the Claude review and Monday plan draft |
| `acceptProposal(id)`, `rejectProposal(id)` | Apply or dismiss a proposal |
| `dismissPlan(id)` | Hide the Monday plan card |
