# 12. Integrations and Sync

Version 1.0, 10 Nov 2026. Owner: Engineering.

## 1. Integration model

The dashboard only reads from providers and only writes to its own database. Each provider is an adapter in `lib/sync/` that takes the projects' link fields, a token and an injectable `fetch`, and returns what to write:

```ts
type SyncTarget = { id: string; githubRepo: string | null; vercelProject: string | null; supabaseRef: string | null };
type AdapterResult = {
  signals: { projectId: string; source: 'github' | 'vercel' | 'supabase'; key: string; value: unknown }[];
  lastPush?: Map<string, string>;       // project id -> YYYY-MM-DD (GitHub)
  settings?: Record<string, unknown>;   // e.g. supabase_active_count
  errors: string[];
};
```

`runSync(db, env = process.env, fetch = globalThis.fetch)` in `lib/sync/index.ts` runs GitHub, then Vercel, then Supabase. Adapters never touch the database; `runSync` stores their results. Callers: `GET /api/cron/sync`, the `runSyncNow` action, and `npm run sync`.

| Source | Phase | Token | Linked by | Writes |
|---|---|---|---|---|
| GitHub | 2 | `GITHUB_TOKEN` | `projects.github_repo` | signals `github/repo`, `github/open_prs`, `github/ci`; `projects.last_push` |
| Vercel | 2 | `VERCEL_TOKEN`, optional `VERCEL_TEAM_ID` | `projects.vercel_project` | signal `vercel/deployment` |
| Supabase | 2 | `SUPABASE_ACCESS_TOKEN` | `projects.supabase_ref` | signal `supabase/project`; settings `supabase_active_count`, `supabase_projects` |
| Railway | 3 (planned) | `RAILWAY_TOKEN` | `projects.railway_service` | signal `railway/deployment` |
| Cloudflare | 3 (planned) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | `projects.cloudflare_resources` | signals `cloudflare/*` |
| Claude API | 3 (planned) | `ANTHROPIC_API_KEY` | `projects.github_repo` | `review_proposals`, `plans` |
| Claude Code sessions | n/a | none (no API) | manual `addSession` | `claude_sessions` |
| claude.ai chat Projects | n/a | none (no API) | manual `claude_project_url` | `projects` |

## 2. Common rules

- **Missing token means skipped.** `runSync` does not call an adapter whose token is unset or empty and records `{ status: "skipped", updated: 0, message: "No token set" }`. Skipped never makes a run fail.
- **Only linked projects.** Projects with a null link field are not checked. The seed fills `github_repo` for 25 projects, `vercel_project` for TaskParty and `supabase_ref` for TaskParty, NimbusWatch and Chronologue (document 06, section 5), so the first sync with tokens already has work to do.
- **Per-project isolation.** A failure for one project adds a string to `errors` and the adapter continues. Source status is `error` when `errors` is non-empty or the adapter threw, else `ok`.
- **Keep last known values.** Signals are upserted on success only; a failed fetch leaves the previous row.
- **HTTP.** `getJson` sends the given headers with `cache: "no-store"` and throws `HttpError` (`HTTP {status} from {host}{path}`) on a non-2xx response. Messages never include tokens. No explicit timeout is set; the 60 s function limit bounds a run (decision; add `AbortSignal.timeout` if a provider hangs).
- **Concurrency.** `pool(items, limit, fn)`: 4 for GitHub, 3 for Vercel.

## 3. GitHub adapter

Headers: `Authorization: Bearer $GITHUB_TOKEN`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, `User-Agent: project-control-room`.

For each project with `github_repo = "{o}/{r}"`:

| Step | Request | Result |
|---|---|---|
| 1 | `GET https://api.github.com/repos/{o}/{r}` | 404: signal `repo = { missing: true }` and stop for this project. Other errors: one error string. Success: signal `repo = { archived, defaultBranch, url, private, pushedAt }`; `last_push = pushed_at[0..10]` |
| 2 | `GET /repos/{o}/{r}/pulls?state=open&per_page=100` | signal `open_prs` = array length (at most 100) |
| 3 | `GET /repos/{o}/{r}/commits/{default_branch}/check-runs?per_page=100` | signal `ci = { conclusion, branch, runs: total_count }`; 404, 409 or 422 (empty repo) gives `conclusion: "none"` |

Combined conclusion (`ciConclusion`):

| Condition over `check_runs` | `conclusion` |
|---|---|
| no runs | `none` |
| any conclusion in `failure`, `timed_out`, `action_required`, `startup_failure` | `failure` |
| otherwise any run with `status` not `completed` | `pending` |
| otherwise | `success` (`success`, `neutral`, `skipped`, `cancelled`) |

`cancelled` does not count as failing (decision: a superseded run should not raise an alert). Repositories that only use the legacy commit statuses API show `none`. `last_push` is always overwritten from GitHub; `updated_at` is not touched by sync.

Budget: 3 requests per project, about 75 per run, against 5,000 per hour.

## 4. Vercel adapter

Headers: `Authorization: Bearer $VERCEL_TOKEN`; `teamId` query parameter when `VERCEL_TEAM_ID` is set.

For each project with `vercel_project` (name or id):

| Step | Request | Uses |
|---|---|---|
| 1 | `GET https://api.vercel.com/v9/projects/{vercel_project}` | `id`, `framework` |
| 2 | `GET https://api.vercel.com/v6/deployments?projectId={id}&target=production&limit=1` | latest production deployment |

Signal `deployment`: `{ state, url, createdAt, framework }` where `state` is `state ?? readyState ?? "UNKNOWN"` (`QUEUED`, `BUILDING`, `INITIALIZING`, `READY`, `ERROR`, `CANCELED`), or `{ state: "NONE", framework }` when there is no production deployment. Alert when `state === "ERROR"`. At seed only TaskParty is linked (`taskparty`).

## 5. Supabase adapter

One request: `GET https://api.supabase.com/v1/projects` with `Authorization: Bearer $SUPABASE_ACCESS_TOKEN`. A failure records one error and returns.

- For each project with `supabase_ref`, find the returned project whose `ref` (or `id`) equals it; signal `project = { status, region, name }`, or `{ status: "NOT_FOUND" }`.
- Settings: `supabase_projects` = the account list (`name`, `status`, `region`); `supabase_active_count` = how many have a status starting with `ACTIVE`. The Infrastructure meter reads the count against `supabase_free_limit` (2).
- Alert when a linked project's status matches `INACTIVE` or `PAUSED`. At seed, Chronologue is linked to the paused "Make Me A Timeline" project, so the first Supabase sync raises that alert.

## 6. Sync runs

1. Insert a `sync_runs` row (`started_at`).
2. Load link fields for all projects.
3. For each source: skipped, or run the adapter, store signals (upsert on `project_id, source, key`, `observed_at = now()`), `last_push` updates and settings.
4. Finish the row: `finished_at`, `ok = no source has status "error"`, `summary`.

Summary example (stored in `sync_runs.summary` and returned by the cron route):

```json
{
  "github":   { "status": "error", "updated": 70, "message": "spencertownley-sys/NestCraft pulls: HTTP 403 from api.github.com/repos/..." },
  "vercel":   { "status": "ok", "updated": 1 },
  "supabase": { "status": "skipped", "updated": 0, "message": "No token set" }
}
```

`updated` counts signals written. `message` joins the first five errors. Overlapping runs (cron plus a manual click) are allowed; all writes are idempotent upserts (decision: no lock). A run killed mid-way keeps `finished_at = null` and does not change the Overview's "Last sync" line, which uses the latest row's `finished_at`.

## 7. Alerts

`lib/alerts.ts buildAlerts(projects, signals)` turns notes and signals into Needs you items at render time (rules in document 11, section 4). Alerts clear on the next sync that writes a passing value. No email or push notifications (non-goal).

## 8. Schedule

`vercel.json`:

```json
{
  "buildCommand": "npm run vercel-build",
  "crons": [{ "path": "/api/cron/sync", "schedule": "23 13 * * *" }]
}
```

13:23 UTC is 05:23 Pacific standard time (06:23 during daylight time), before the owner's morning. On the Vercel Hobby plan a daily cron may fire at any minute within the scheduled hour. Vercel sends `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set.

## 9. Phase 3 integrations (planned, not built)

### 9.1 Railway (GraphQL)

`POST https://backboard.railway.com/graphql/v2` with `Authorization: Bearer $RAILWAY_TOKEN`. For each project with `railway_service` (`{projectId}/{serviceId}`), query the latest production deployment: status (`SUCCESS`, `FAILED`, `CRASHED`, `BUILDING`, `DEPLOYING`, `REMOVED`) and source branch. Signal `railway/deployment`. Alerts: `FAILED` or `CRASHED`; and a branch that differs from the GitHub default branch ("Railway deploys {branch}, not {default}"), which would have caught Quiz Platform deploying an old branch. The inventory lists 7 Railway service groups (about 8 services).

### 9.2 Cloudflare API

`https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/...` with `Authorization: Bearer $CLOUDFLARE_API_TOKEN` (read-only: Workers Scripts, D1, R2, Pages). Lists `workers/scripts`, `d1/database`, `r2/buckets`, `pages/projects`. For each name in `projects.cloudflare_resources`: existence, Pages latest deployment status, D1 size. Alerts: Pages deployment failed; resource missing. Covers FrameVote (Worker, D1, R2), Townley Creative and Townley Photography.

### 9.3 Claude weekly review

- Trigger: `GET /api/cron/review` (bearer `CRON_SECRET`), weekly, planned schedule `47 14 * * 1` (Mondays 14:47 UTC).
- Input per active project with `github_repo`: README (first 20 KB), file names under `docs/`, commit messages from the last 7 days, current pct, hours, steps and risks, fetched with the GitHub token (Contents read access is already in the token scope).
- Call: Claude Messages API with a JSON tool schema returning `{ pct, pctRationale, addSteps: [{ title, hours }], doneStepIds: [], risks: [] }`. Model from `ANTHROPIC_MODEL` (the mockup proposed a Sonnet model; confirm the current model id when Phase 3 starts).
- Output: one `review_proposals` row per kind with a rationale. Nothing changes until the owner accepts (FR-28); accepting applies through the same code paths as the edit form and step actions.
- Monday plan: one more call with lanes, the first three queue entries, Needs you and accepted proposals; at most 200 words of markdown in `plans`, shown on the Overview until dismissed.
- Guardrails: skip projects with no commits and no doc changes in 7 days; cap input per project; record token usage in the run summary; stop at the cost ceiling (open question).
