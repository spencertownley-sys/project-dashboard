# 12. Integrations and Sync

Version 1.0, 10 Nov 2026. Owner: Engineering.

## 1. Integration model

The dashboard only reads from providers and only writes to its own database. Each provider is an adapter in `lib/sync/` with one function:

```ts
type AdapterResult = {
  status: 'ok' | 'error' | 'skipped';
  reason?: string;              // for skipped
  checked: number;              // projects attempted
  updated: number;              // projects whose signals were written
  errors: { projectId: string | null; message: string }[];
  ms: number;
  [extra: string]: unknown;     // e.g. supabase.active
};
type Adapter = (ctx: { db: Db; projects: Project[]; now: Date }) => Promise<AdapterResult>;
```

`runSync({ trigger })` in `lib/sync/index.ts` runs GitHub, then Vercel, then Supabase, each in its own try/catch, so one failing adapter never stops the others.

| Source | Phase | Token | Linked by | Writes |
|---|---|---|---|---|
| GitHub | 2 | `GITHUB_TOKEN` | `projects.github_repo` | signals `github/*`, `projects.last_push` |
| Vercel | 2 | `VERCEL_TOKEN`, optional `VERCEL_TEAM_ID` | `projects.vercel_project` | signal `vercel/production` |
| Supabase | 2 | `SUPABASE_ACCESS_TOKEN` | `projects.supabase_ref` | signal `supabase/status`, `settings.supabase_capacity.active` |
| Railway | 3 (planned) | `RAILWAY_TOKEN` | `projects.railway_service` | signal `railway/deployment` |
| Cloudflare | 3 (planned) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | `projects.cloudflare_resources` | signals `cloudflare/*` |
| Claude API | 3 (planned) | `ANTHROPIC_API_KEY` | `projects.github_repo` | `review_proposals`, `plans` |
| Claude Code sessions | n/a | none (no API) | manual `addSession` | `claude_sessions` |
| claude.ai chat Projects | n/a | none (no API) | manual `claude_project_url` | `projects` |

## 2. Common rules

- **Missing token means skipped.** If an adapter's token is unset or empty it returns `{ status: 'skipped', reason: 'GITHUB_TOKEN not set', checked: 0, updated: 0, errors: [] }` without any network call. Skipped never makes a run fail.
- **Only linked projects.** Projects with a null link field are not checked. At seed every link field is null, so a first sync checks nothing until the owner fills them in (document 13, section 5).
- **Per-project isolation.** A failure for one project is appended to `errors` and the adapter continues. The adapter status is `error` if `errors` is non-empty, else `ok`.
- **Keep last known values.** Signals are upserted on success only; a failed fetch leaves the previous row and its `observed_at`.
- **Timeouts.** Every fetch uses `AbortSignal.timeout(10_000)`.
- **Sanitized errors.** Messages are `"{status} {statusText}"` or the exception message, with any `Bearer ...` or token-looking substring removed, truncated to 200 characters.
- **Server-only.** `lib/sync/*` imports `server-only`; tokens are read from `process.env` inside the adapter at call time.

## 3. GitHub adapter (Phase 2)

Headers: `Authorization: Bearer $GITHUB_TOKEN`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, `User-Agent: project-control-room`.

For each project with `github_repo = "{o}/{r}"`, concurrency 4:

| Step | Request | Uses |
|---|---|---|
| 1 | `GET https://api.github.com/repos/{o}/{r}` | `pushed_at`, `archived`, `default_branch` |
| 2 | `GET /repos/{o}/{r}/pulls?state=open&per_page=100` | array length, capped at 100 (decision: no pagination) |
| 3 | `GET /repos/{o}/{r}/commits/{default_branch}/check-runs?per_page=100` | combined conclusion below |

Combined CI conclusion (decision):

| Condition over `check_runs` | `ci` signal |
|---|---|
| `total_count` is 0 | `"none"` |
| any completed run with conclusion `failure`, `timed_out`, `cancelled`, `action_required` or `startup_failure` | `"failure"` |
| otherwise, any run whose `status` is not `completed` | `"pending"` |
| otherwise (all `success`, `neutral` or `skipped`) | `"success"` |

Writes: signals `pushed_at`, `archived`, `default_branch`, `open_prs`, `ci`; and `projects.last_push = date(pushed_at)` in UTC (always overwritten; GitHub is authoritative). `updated_at` is not touched by sync (decision: it tracks owner edits).

Errors: 404 "Repository not found or token has no access"; 401 aborts the adapter ("GITHUB_TOKEN rejected") with one adapter-level error; 403 or 429 with `x-ratelimit-remaining: 0` aborts the remaining projects with "Rate limited until {reset}". Budget: 3 requests per project, about 60 per run against 5,000 per hour.

Repositories that report status through the legacy commit statuses API rather than check runs show `"none"` (accepted; the owner's repos use GitHub Actions).

## 4. Vercel adapter (Phase 2)

Headers: `Authorization: Bearer $VERCEL_TOKEN`. When `VERCEL_TEAM_ID` is set, every request adds `?teamId=...`.

For each project with `vercel_project` (a project name or id):

| Step | Request | Uses |
|---|---|---|
| 1 | `GET https://api.vercel.com/v9/projects/{vercel_project}` | `id` (resolves names to ids) |
| 2 | `GET https://api.vercel.com/v6/deployments?projectId={id}&target=production&limit=1` | first deployment |

Signal `vercel/production` value: `{ state, url, createdAt, id }` where `state` is the deployment's `state` (falling back to `readyState`): `QUEUED`, `BUILDING`, `INITIALIZING`, `READY`, `ERROR` or `CANCELED`; `url` is `https://{deployment.url}`; `createdAt` ISO from `created`; `id` from `uid`. No production deployment writes `{ state: "NONE" }`. Alert when `state === "ERROR"`.

Errors: 404 "Vercel project not found (check the name and VERCEL_TEAM_ID)"; 401/403 aborts the adapter.

At seed only TaskParty has a Vercel project (`taskparty`).

## 5. Supabase adapter (Phase 2)

One request: `GET https://api.supabase.com/v1/projects` with `Authorization: Bearer $SUPABASE_ACCESS_TOKEN`.

- For each dashboard project with `supabase_ref`, find the returned project whose `ref` (or `id`) equals it and upsert signal `supabase/status` with its `status` (for example `ACTIVE_HEALTHY`, `COMING_UP`, `INACTIVE`, `PAUSING`, `RESTORING`). Not found: per-project error "Supabase project {ref} not in this account".
- Capacity: set `settings.supabase_capacity.active` to the number of returned projects whose status is not `INACTIVE`, `PAUSING` or `REMOVED`; `limit` is left unchanged (2) (decision). The Infrastructure card reads it.
- Alert when a linked project's status is `INACTIVE` (paused).

At seed the Supabase projects are `allclear` (NimbusWatch, active), `TaskParty` (active) and "Make Me A Timeline" (paused, possibly Chronologue). Refs are not in the inventory; the owner copies them from the Supabase dashboard.

## 6. Sync runs

`runSync` lifecycle:
1. Insert `sync_runs` with `started_at = now()`, `ok = false`, `summary = { trigger }`.
2. Load all projects once; run adapters in order.
3. Update the row: `finished_at = now()`, `ok = no adapter has status 'error'`, `summary`, `error` (null when ok; otherwise one line per failing source, e.g. `github: 1 error (strata: 404 Repository not found or token has no access)`, truncated to 500 characters).

Summary example:

```json
{
  "trigger": "cron",
  "github":   { "status": "error", "checked": 20, "updated": 19, "errors": [{ "projectId": "strata", "message": "404 Repository not found or token has no access" }], "ms": 4210 },
  "vercel":   { "status": "ok", "checked": 1, "updated": 1, "errors": [], "ms": 620 },
  "supabase": { "status": "skipped", "reason": "SUPABASE_ACCESS_TOKEN not set", "checked": 0, "updated": 0, "errors": [], "ms": 0 }
}
```

Overlapping runs (cron plus a manual click) are allowed; all writes are idempotent upserts (decision: no lock). A run whose function was killed keeps `finished_at = null`; the Overview shows it as "Interrupted" once it is more than 5 minutes old.

## 7. Alerts

`lib/sync/alerts.ts` turns signals into Needs you items (rules in document 11, section 4). Alerts are computed at render time from current signals, so they clear on the next successful sync with a passing value. No email or push notifications are sent (non-goal).

## 8. Schedule

`vercel.json`:

```json
{
  "buildCommand": "npm run db:migrate && next build",
  "crons": [{ "path": "/api/cron/sync", "schedule": "23 13 * * *" }]
}
```

13:23 UTC is 05:23 Pacific standard time (06:23 during daylight time), before the owner's morning. On the Vercel Hobby plan a daily cron may fire at any minute within the scheduled hour. Vercel sends `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set on the project.

## 9. Phase 3 integrations (planned, not built)

### 9.1 Railway (GraphQL)

`POST https://backboard.railway.com/graphql/v2` with `Authorization: Bearer $RAILWAY_TOKEN`. For each project with `railway_service` (`{projectId}/{serviceId}`), query the latest deployment for the production environment: status (`SUCCESS`, `FAILED`, `CRASHED`, `BUILDING`, `DEPLOYING`, `REMOVED`) and the source branch. Signal `railway/deployment`. Alerts: `FAILED` or `CRASHED`; and branch differs from the GitHub `default_branch` signal ("Railway deploys {branch}, not {default}"), which would have caught Quiz Platform deploying an old branch. The inventory lists 7 Railway service groups (about 8 services).

### 9.2 Cloudflare API

`https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/...` with `Authorization: Bearer $CLOUDFLARE_API_TOKEN` (read-only: Workers Scripts, D1, R2, Pages). Lists `workers/scripts`, `d1/database`, `r2/buckets`, `pages/projects`. For each name in `projects.cloudflare_resources`: existence signal, Pages latest deployment status, D1 size in bytes. Alerts: Pages deployment failed; resource missing. Covers FrameVote (Worker, D1, R2), Townley Creative and Townley Photography.

### 9.3 Claude weekly review

- Trigger: `GET /api/cron/review` (bearer `CRON_SECRET`), weekly, planned schedule `47 14 * * 1` (Mondays 14:47 UTC).
- Input per active project with `github_repo`: README (first 20 KB), names of files under `docs/`, commit messages from the last 7 days, current pct, hours, steps and risks. Fetched through the GitHub token.
- Call: Claude Messages API with a JSON tool schema returning `{ pct, pctRationale, addSteps: [{ title, hours }], doneStepIds: [], risks: [] }`. Model from `ANTHROPIC_MODEL` (the mockup proposed a Sonnet model; confirm the current model id when Phase 3 starts).
- Output: one `review_proposals` row per kind with a rationale. Nothing changes until the owner accepts (FR-28). Accept applies through the same code paths as the edit form and step actions.
- Monday plan: one further call with lanes, the first three queue entries, Needs you and accepted proposals; returns at most 200 words of markdown stored in `plans` and shown on the Overview until dismissed.
- Guardrails: skip projects with no commits and no doc changes in 7 days; cap input per project; record token usage in the run summary; stop if the cost ceiling (open question) is reached.
