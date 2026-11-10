# 11. Views Specification

Version 1.0, 10 Nov 2026. Owner: Engineering.

This document defines the behavior behind each screen in document 10: every formula, filter, sort and ordering rule. All functions named here live in `lib/rules.ts`, are pure, take `today` as a parameter (a UTC `YYYY-MM-DD` string) so tests can pin it, and are unit tested against the seed data (document 15). Worked numbers use the seed on 10 Nov 2026.

## 1. Shared definitions

| Name | Definition |
|---|---|
| `today` | Current UTC date at request time (decision: UTC everywhere) |
| `daysSince(date)` | Whole days from `date` to `today`: `floor((Date.UTC(today) − Date.UTC(date)) / 86 400 000)` |
| `isActive(p)` | `p.status` not in `archive`, `idea` |
| `isStale(p)` | `p.lastPush != null && daysSince(p.lastPush) > 30` |
| `finishScore(p)` | `null` if `value`, `pct` or `hoursLeft` is null or 0; else `Math.round(value * (pct / 100) / hoursLeft * 100 * 10) / 10` |
| `hpw` | `settings.hours_per_week`, default 12 |
| `addWeeks(today, n)` | `today + 7n` days |

Stale boundary examples: Book Builder (last push 2026-10-11, 30 days) is not stale; NimbusWatch (2026-10-10, 31 days) is stale; Strata (29 days) is not.

Score examples: Spotted Zebra 3 × 0.90 ÷ 6 × 100 = 45.0; TaskParty 4 × 0.75 ÷ 50 × 100 = 6.0; AI News Site pct 0 gives null; NestCraft (all null) gives null.

## 2. KPI strip (`buildKpis`)

| # | Value | Label | Sub-line | Seed |
|---|---|---|---|---|
| 1 | count of all projects | Projects tracked | "{active} active · {others} archive or idea" | 26; "22 active · 4 archive or idea" |
| 2 | count with status `live` | Live on a real URL | "{preview count} more on preview URLs" | 11; "3 more" |
| 3 | `round(mean(pct))` over active projects with pct not null, plus "%"; "—" if none | Average completion | "across {n} assessed projects" | 67%; 20 |
| 4 | `round(sum(hoursLeft ?? 0))` over active projects | Hours to finish all | "about {ceil(sum ÷ hpw)} weeks at {hpw} h/week" | 827; 69 weeks |
| 5 | number of Needs you items (section 4) | Need your action | "blocked on you, not on code" | 9 |
| 6 | count of active projects that are stale | No push in 30+ days | "candidates to pause or restart" | 11 |

Note that "others" counts every non-active project (archive and idea; 3 archive plus 1 idea at seed); `unknown` counts as active.

## 3. Focus lanes (`buildLanes`)

```
pool = projects.filter(isActive).filter(p => finishScore(p) != null)
quick  = pool.filter(p => p.hoursLeft <= 15)
launch = pool.filter(p => p.value >= 4 && p.hoursLeft > 15 && p.hoursLeft <= 60)
steady = pool.filter(p => p.hoursLeft > 15 && p.value < 4)
each lane: sort by score desc, then queuePosition asc (nulls last), then name asc; take 4
```

- The three conditions are mutually exclusive, so a project appears in at most one lane. Active projects with value ≥ 4 and hours over 60 appear in none (none at seed).
- Card content: name, score, pct bar, the first not-done step by `position` ("No open steps" when none), "{pct}% done", "{hoursLeft} h left".

Seed result:

| Lane | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Quick wins (≤15 h) | Spotted Zebra 45.0 | Amanda Williams Portfolio 35.0 | Townley Photography 26.7 | FrameVote 20.8 |
| Launch pushes (value 4–5) | spencertownley.com 21.2 | Quiz Platform 14.3 | Book Builder 10.7 | TaskParty 6.0 |
| Steady builds (>15 h) | Chronologue 12.8 | Cruise News You Can Use 10.5 | Smoosh 8.5 | NimbusWatch 8.0 |

Downbeat also scores 8.0 and loses the tie on queue position (12 vs 9).

## 4. Needs you (`buildNeeds`)

Items come from two sources:

| Kind | Condition | Text | Dot |
|---|---|---|---|
| note | `needs` is non-empty after trim | the note | risk if status is `stalled`, else stall (as in the mockup) |
| alert `ci` | signal github/`ci` = `"failure"` | "CI failing on {default_branch signal, else 'the default branch'}" | risk |
| alert `deploy` | signal vercel/`production` with `state = "ERROR"` | "Latest production deployment failed" | risk |
| alert `supabase` | signal supabase/`status` = `"INACTIVE"` | "Supabase project is paused (INACTIVE)" | risk |

- Alerts consider every project with signals (signals exist only where a link field is set). A project can contribute a note and several alerts; each is one item.
- Order: alerts first (by project name), then notes by value desc (nulls last), then name.
- Each item links to its project.

Seed order (notes only, no signals yet): Quiz Platform, Earshot, Cruise News You Can Use, Downbeat, MORE., NimbusWatch, Strata (risk dot, stalled), Amanda Williams Portfolio, Townley Creative.

## 5. Projects table (`filterProjects`, `sortProjects`)

### 5.1 Filters (one active at a time)

| Key | Label | Match |
|---|---|---|
| `all` | All | every project |
| `live`, `preview`, `building`, `stalled` | Live, Preview, Building, Stalled | `status` equals key |
| `SaaS` | SaaS | `category === 'SaaS'` |
| `Game` | Games | `category === 'Game'` |
| `site` | Sites | `/Content\|site\|Portfolio/` tested on category (case-sensitive, as in the mockup) |
| `archive` | Archive and ideas | `status` in `archive`, `idea`, `unknown` |

Seed counts: All 26, Live 11, Preview 3, Building 4, Stalled 3, SaaS 10, Games 4, Sites 8 (Content 3, Content + search 1, Portfolio 2, Business site 2), Archive and ideas 5.

### 5.2 Search

Lowercased `q` (trimmed) must be a substring of `name + ' ' + repo + ' ' + hostTags.join(' ') + ' ' + category`, lowercased. Applied together with the filter. Debounced 150 ms; the URL updates with `router.replace` (no history entry per keystroke).

### 5.3 Sort

| Key | Column | First-click direction | Comparator |
|---|---|---|---|
| `name` | Project | asc | locale compare |
| `status` | Status | asc | order live, preview, building, stalled, unknown, idea, archive |
| `pct` | Complete | desc | number |
| `hours` | Hours left | asc | number |
| `score` | Finish score | desc | number (default sort) |
| `last` | Last push | desc | date |

Clicking the active column flips direction. Nulls sort last in both directions. Ties break by name asc. Filtering and sorting run on the client over all rows (26), state mirrored to the URL (`f`, `q`, `sort`, `dir`).

## 6. Next steps (`applyStepToggle`)

```
tick:   hoursLeft = hoursLeft == null ? null : Math.max(0, hoursLeft - step.hours)
untick: hoursLeft = hoursLeft == null ? null : hoursLeft + step.hours
```

- Executed server-side in `toggleStep` in one transaction; idempotent when the step is already in the requested state.
- Because of the floor, tick then untick can raise hours above the original (1 h left, 3 h step: 1 → 0 → 3). Accepted and documented (spec rule).
- Add and delete never change `hoursLeft`; no step operation changes `pct` (decisions).
- Display order is `position`; done steps stay in place with strike-through.
- Footer: "{done} of {total} done · {sum of open step hours} h open".

## 7. Planner (`planQueue`)

```
queue = projects.filter(p => p.queuePosition != null).sort(by queuePosition asc)
cum = 0
for each p: start = cum; cum += p.hoursLeft ?? 0; end = cum
            eta = addWeeks(today, ceil(end / hpw))
totalWeeks = ceil(cum / hpw); allDone = addWeeks(today, totalWeeks)
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
| 7 | Quiz Platform | 28 | 99 | Jan 12, 2027 |
| 8 | Book Builder | 35 | 134 | Feb 2, 2027 |
| 9 | NimbusWatch | 30 | 164 | Feb 16, 2027 |
| 10 | Cruise News You Can Use | 20 | 184 | Mar 2, 2027 |
| 11 | Smoosh | 30 | 214 | Mar 16, 2027 |
| 12 | Downbeat | 30 | 244 | Apr 6, 2027 |
| 13 | Mentionful | 60 | 304 | May 11, 2027 |
| 14 | Earshot | 55 | 359 | Jun 8, 2027 |
| 15 | TaskParty | 50 | 409 | Jul 13, 2027 |
| 16 | JIMOTHY: A Seattle Story | 56 | 465 | Aug 10, 2027 |
| 17 | VYGR Cruises | 45 | 510 | Sep 7, 2027 |
| 18 | Strata | 90 | 600 | Oct 26, 2027 |
| 19 | MORE. | 200 | 800 | Feb 22, 2028 |

"All done around Feb 2028". Not queued at seed: NestCraft, Split the G, Townley Creative, Mariners Prediction Hub, timeline_web_app.py, AI News Site, PromoVault.

### 7.1 Reorder

- Up on the first row and down on the last row are disabled.
- Each move swaps with the neighbor in client state (`useOptimistic`), then calls `saveQueue` with the full id list. On failure the order reverts and an inline error shows.
- Add appends to the end; remove (×) drops the entry and sets its position null. Both call `saveQueue`.

### 7.2 Hours per week

Slider 4 to 40, step 1. ETAs recompute live in the client while dragging; `setHoursPerWeek` is called on commit. The KPI "about N weeks" uses the saved value.

### 7.3 Timeline bars

```
totalW = max(totalWeeks, 1)
tickStep = totalW > 40 ? 8 : totalW > 20 ? 4 : 2
ticks at w = 0, tickStep, 2·tickStep, ... ≤ totalW, label = addWeeks(today, w) as "Nov 10"
bar.left  = start / hpw / totalW × 100%
bar.width = max((end − start) / hpw / totalW × 100, 0.6)%
```

The timeline panel scrolls horizontally below 620 px of inner width.

## 8. Project detail meter

ETA for one project in isolation: `addWeeks(today, ceil(hoursLeft / hpw))`, shown only when `hoursLeft > 0`. "No estimate yet" when null; "Done" when 0.

## 9. Infrastructure (`groupComponents`)

- Group components by `provider`; groups ordered by the smallest `position` in each, rows by `position`.
- Card subtitle: `settings.provider_subtitles[provider]`, except the Supabase card, which shows `settings.supabase_capacity` as "{active} of {limit} active" with a bar at `active ÷ limit` (capped at 100%) and the warning style when `active >= limit`.
- A project link renders when `project_id` is set; otherwise `project_label` as plain text.
- Seed: 7 cards, 39 rows, 27 linked.

## 10. Ideas (`groupIdeas`)

- Feature ideas: ideas with a `project_id`, grouped by project. Projects with value ≥ 4 go to "high-value projects"; all others (value 1 to 3 or null, any status) to "other projects".
- Project order inside a panel: value desc (nulls last), then name. Idea order inside a project: starred first, then `created_at` asc, then `id` asc.
- Parking lot: ideas with null `project_id`, starred first, then `created_at` asc.
- All ideas are shown (the mockup's limit of six projects per panel is dropped; decision).
- Seed: high-value panel 7 projects (TaskParty, Quiz Platform, Mentionful, Earshot, Book Builder, spencertownley.com, Townley Photography), other panel 14 projects, parking lot 5.

## 11. Housekeeping

Panels in order archive ("Archive or merge"), overlap ("Overlaps to decide"), docs ("Docs coverage"); items by `id`. Approve and Skip set the decision; Undo returns it to pending. Panel header shows "{decided} of {total} decided".

## 12. Date and number formatting

| Value | Format | Example |
|---|---|---|
| ETA, ticks, decisions | `en-US` `{ month: 'short', day: 'numeric' }`, plus `year` when not the current UTC year | Nov 17; Feb 22, 2028 |
| All-done | `{ month: 'short', year: 'numeric' }` | Feb 2028 |
| Table last push | `MM-DD` plus `{n}d` | 11-08 2d |
| Detail last push | `YYYY-MM-DD ({n} days ago)`; "today" for 0, "1 day ago" for 1 | 2026-11-08 (2 days ago) |
| Hours | up to one decimal, trailing ".0" dropped | 0.5 h, 6 h |
| Score | always one decimal | 45.0 |
| Sync time | "Nov 10 · 13:23 UTC" | |
