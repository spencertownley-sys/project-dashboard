# 11. Views Specification

Version 1.0, 10 Nov 2026. Owner: Engineering.

This document defines the behavior behind each screen in document 10: every formula, filter, sort and ordering rule. The rules live in `lib/metrics.ts` and `lib/alerts.ts`, are pure (no I/O), take `today` as a `Date` parameter so tests can pin it, and are unit tested (document 15). Pages get `today = new Date()` from `load()`. Worked numbers use the seed on 10 Nov 2026.

## 1. Shared definitions

| Name | Definition |
|---|---|
| `isActive(p)` | `status` not `archive` and not `idea` (`unknown` counts as active) |
| `daysSince(date, today)` | `max(0, round((today − date at 12:00 UTC) ÷ 1 day))`; null when `date` is null |
| `isStale(p, today)` | `daysSince > 30` |
| `finishScore(p)` | null if `value`, `pct` or `hoursLeft` is null, or `hoursLeft <= 0`; else `round(value × pct/100 ÷ hoursLeft × 1000) ÷ 10` (one decimal) |
| `hpw` | `settings.hours_per_week`, fallback 12, floored at 1 |
| `addWeeks(d, n)` | `d + 7n` days |
| `fmtDate(d, withYear?)` | `en-US`, `{ month: 'short', day: 'numeric' }`, optional year, in UTC: "Nov 17", "Feb 22, 2028" |

Stale examples: Book Builder (last push 2026-10-11, 30 days) is not stale; NimbusWatch (2026-10-10, 31 days) is stale; Strata (29 days) is not.

Score examples: Spotted Zebra 3 × 0.90 ÷ 6 × 100 = 45.0; TaskParty 4 × 0.75 ÷ 50 × 100 = 6.0; NestCraft (all null) is null. AI News Site has pct 0 and scores 0 rather than null; the spec says pct zero gives null. It is an idea project, so it never reaches a lane either way; the Projects table shows "0" (deviation noted in document 16).

## 2. KPI strip (`portfolioSummary` plus `buildAlerts`)

| # | Value | Label | Sub-line | Seed |
|---|---|---|---|---|
| 1 | count of all projects | Projects tracked | "{active} active · {inactive} archive or idea" | 26; "22 active · 4 archive or idea" |
| 2 | count with status `live` | Live on a real URL | "{preview} more on preview URLs" | 11; 3 |
| 3 | `round(mean(pct))` over active projects with pct not null (0 when none), plus "%" | Average completion | "across {n} assessed projects" | 67%; 20 |
| 4 | `round(sum(hoursLeft ?? 0))` over active projects | Hours to finish all | "about {ceil(sum ÷ hpw)} weeks at {hpw} h/week" | 827; 69 |
| 5 | number of Needs you items (section 4) | Need your action | "blocked on you, not on code" | 9 |
| 6 | active projects that are stale | No push in 30+ days | "candidates to pause or restart" | 11 |

## 3. Focus lanes (`focusLanes`)

```
pool = list.filter(isActive).map(p => [p, finishScore(p)]).filter(score != null)
quick  = hoursLeft <= 15
launch = value >= 4 && 15 < hoursLeft <= 60
steady = hoursLeft > 15 && value < 4
each lane: stable sort by score desc, take 4
```

- The input list comes from `listProjects`, ordered by name, so equal scores keep name order (decision, effectively "ties by name ascending").
- The conditions are mutually exclusive. Active projects with value ≥ 4 and more than 60 hours appear in no lane (none at seed).
- Card: name, score, pct bar, first open step (`firstOpenSteps`: lowest `position` among not-done steps; "No open steps"), "{pct}% done", "{hoursLeft} h left".

Seed result:

| Lane | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Quick wins (≤15 h) | Spotted Zebra 45.0 | Amanda Williams Portfolio 35.0 | Townley Photography 26.7 | FrameVote 20.8 |
| Launch pushes (value 4–5) | spencertownley.com 21.2 | Quiz Platform 14.3 | Book Builder 10.7 | TaskParty 6.0 |
| Steady builds (>15 h) | Chronologue 12.8 | Cruise News You Can Use 10.5 | Smoosh 8.5 | Downbeat 8.0 |

NimbusWatch also scores 8.0 and loses the tie to Downbeat on name order. (The mockup showed NimbusWatch there because it used inventory order.)

## 4. Needs you (`buildAlerts`)

For each project, in `listProjects` order (by name), items are added in this order:

| Kind | Condition | Text | Severity (dot) |
|---|---|---|---|
| `needs` | `needs` is set | the note | `risk` if status is `stalled`, else `warn` |
| `ci` | github `ci.conclusion = "failure"` | "CI is failing on {branch, else 'the default branch'}" | risk |
| `repo` | github `repo.missing` | "GitHub repo not found or not readable with the sync token" | warn |
| `deploy` | vercel `deployment.state = "ERROR"` | "Latest Vercel production deploy failed" | risk |
| `database` | supabase `project.status` matches `/INACTIVE\|PAUSED/` | "Supabase project is paused" | warn |

`warn` renders the stall-colored dot, `risk` the risk-colored dot. The `repo` alert is an addition beyond the spec's three sync alerts; it catches a wrong `github_repo` or a token without access (for example the private NestCraft repo).

Seed order (notes only): Amanda Williams Portfolio, Cruise News You Can Use, Downbeat, Earshot, MORE., NimbusWatch, Quiz Platform, Strata (risk dot, stalled), Townley Creative.

## 5. Projects table (`components/ProjectsTable.tsx`)

### 5.1 Filters (one active)

| Key | Label | Match |
|---|---|---|
| `all` | All | every project |
| `live`, `preview`, `building`, `stalled` | Live, Preview, Building, Stalled | status equals the key |
| `saas` | SaaS | `category === 'SaaS'` |
| `game` | Games | `category === 'Game'` |
| `site` | Sites | `/content\|site\|portfolio/i` on category |
| `archive` | Archive and ideas | status `archive`, `idea` or `unknown` |

Seed counts: All 26, Live 11, Preview 3, Building 4, Stalled 3, SaaS 10, Games 4, Sites 8, Archive and ideas 5.

### 5.2 Search

Lowercased, trimmed query must be a substring of `name repo hostTags category` (space joined, lowercased). Combined with the active filter. Filter, search and sort are React state on the client (not persisted).

### 5.3 Sort

| Key | Column | First-click direction | Comparator |
|---|---|---|---|
| `name` | Project | asc | string |
| `status` | Status | asc | live, preview, building, stalled, unknown, idea, archive |
| `pct` | Complete | desc | number |
| `hoursLeft` | Hours left | asc | number |
| `score` | Finish score | desc (default) | number |
| `lastPush` | Last push | desc | ISO date string |

Clicking the active column flips direction. Nulls sort last in both directions. Ties keep the server order (name).

## 6. Next steps (`hoursAfterToggle`)

```
hoursAfterToggle(hoursLeft, stepHours, nowDone):
  null stays null
  next = nowDone ? hoursLeft − stepHours : hoursLeft + stepHours
  return max(0, round(next × 10) ÷ 10)
```

- Runs in `toggleStep` inside a transaction; a repeated tick or untick is a no-op.
- Because of the floor, tick then untick can raise hours above the original (2 h left, 4 h step: 2 → 0 → 4). Accepted (spec rule).
- Add and delete never change `hoursLeft`; no step action changes `pct` (decisions).
- Steps display by `position` then `id`; done steps stay in place, styled as done.

Seed example: Spotted Zebra, 6 h; ticking "Fix the “(2027 Guide)” post title" (0.5 h) gives 5.5 h; unticking gives 6 h.

## 7. Planner (`planQueue`)

```
queue = projects with queuePosition != null, sorted by queuePosition
cum = 0
for each p: start = cum; cum += max(0, hoursLeft ?? 0); eta = addWeeks(today, ceil(cum / hpw))
weeks = ceil(cum / hpw); finish = addWeeks(today, weeks)
```

Seed at 12 h/week (today 10 Nov 2026):

| # | Project | Hours | Cumulative | ETA |
|---|---|---|---|---|
| 1 | Spotted Zebra | 6 | 6 | Nov 17 |
| 2 | Amanda Williams Portfolio | 4 | 10 | Nov 17 |
| 3 | FrameVote | 13 | 23 | Nov 24 |
| 4 | Townley Photography | 12 | 35 | Dec 1 |
| 5 | spencertownley.com | 16 | 51 | Dec 15 |
| 6 | Chronologue | 20 | 71 | Dec 22 |
| 7 | Quiz Platform | 28 | 99 | Jan 12 |
| 8 | Book Builder | 35 | 134 | Feb 2 |
| 9 | NimbusWatch | 30 | 164 | Feb 16 |
| 10 | Cruise News You Can Use | 20 | 184 | Mar 2 |
| 11 | Smoosh | 30 | 214 | Mar 16 |
| 12 | Downbeat | 30 | 244 | Apr 6 |
| 13 | Mentionful | 60 | 304 | May 11 |
| 14 | Earshot | 55 | 359 | Jun 8 |
| 15 | TaskParty | 50 | 409 | Jul 13 |
| 16 | JIMOTHY: A Seattle Story | 56 | 465 | Aug 10 |
| 17 | VYGR Cruises | 45 | 510 | Sep 7 |
| 18 | Strata | 90 | 600 | Oct 26 |
| 19 | MORE. | 200 | 800 | Feb 22 |

Queue ETAs print without the year (rows 7 to 18 are in 2027, row 19 in 2028); "All done around Feb 22, 2028" prints it. Not queued at seed: NestCraft, Split the G, Townley Creative, Mariners Prediction Hub, timeline_web_app.py, AI News Site, PromoVault. The "Add to queue" select offers only unqueued active projects with hours > 0 (Townley Creative at seed).

### 7.1 Reorder, add, remove

- ▲ on the first row and ▼ on the last do nothing.
- A move swaps neighbors in client state, then calls `saveQueue` with the full id list (positions become 0-based indexes).
- Remove (×) drops the row and calls `removeFromQueue([id])`. Add appends in client state and calls `addToQueue(id)` (max + 1).

### 7.2 Hours per week

Slider 4 to 40, step 1. ETAs, bars and the all-done date recompute in the client while dragging; `setHoursPerWeek` is called on pointer up and key up. The KPI and the detail ETA use the saved value.

### 7.3 Timeline bars

```
W = max(weeks, 1)
tickStep = W > 40 ? 8 : W > 20 ? 4 : 2
ticks at w = 0, tickStep, ... <= W, label fmtDate(today + w weeks)
bar.left  = start / hpw / W × 100%
bar.width = max((end − start) / hpw / W × 100, 0.6)%
```

At seed W = 67, so ticks every 8 weeks.

## 8. Project detail meter

Standalone ETA: `addWeeks(today, ceil(hoursLeft / hpw))`, shown when `hoursLeft` is truthy. Text: "{h} h left · done around {date} at {hpw} h/week · value {v}/5 · score {s}", omitting parts that are null; "No estimate yet" when hours are null.

## 9. Infrastructure

- Components ordered by `position`, grouped by `provider` in first-seen order.
- Supabase meter: `active = settings.supabase_active_count` when a sync has written it, else the number of Supabase components whose note starts with "Active" (2 at seed); `limit = settings.supabase_free_limit` (2). Bar width `min(100, active ÷ limit × 100)%`; warning style when `active >= limit`.
- A component links to its project when `project_id` is set. Seed: 7 cards, 39 rows, 34 linked.

## 10. Ideas

- Feature panels include only active projects that have at least one idea, ordered by value descending (stable on name). Value ≥ 4 goes to "high-value projects"; value 1 to 3 or null to "other projects" (decision: archive and idea projects' ideas are not shown here; they remain on the project page).
- Ideas order: starred first, then `id`.
- Seed: high-value panel 7 projects (Book Builder, Mentionful, Quiz Platform at value 5; Earshot, spencertownley.com, TaskParty, Townley Photography at 4), other panel 13 (Mariners Prediction Hub is archived and hidden), parking lot 5.

## 11. Housekeeping

Panels in order archive, overlap, docs; items by `id`. Approve and Skip set the decision and `decided_at`; Undo returns to pending. The header counts pending items.

## 12. Formatting

| Value | Format | Example |
|---|---|---|
| ETA, ticks | `fmtDate` | Nov 17 |
| All done | `fmtDate(d, true)` | Feb 22, 2028 |
| Last sync | `fmtDate` plus `HH:MM UTC` | Nov 10 at 13:23 UTC |
| Table last push | ISO date plus `{n}d` | 2026-11-08 2d |
| Detail last push | `YYYY-MM-DD ({n} days ago)` | 2026-11-08 (2 days ago) |
| Hours | as stored | 0.5 h, 6 h |
| Score | number, up to one decimal | 45, 26.7 |
