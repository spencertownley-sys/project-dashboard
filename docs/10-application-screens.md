# 10. Application Screens

Version 1.0, 10 Nov 2026. Owner: Design.

Every screen maps to a lettered section of the approved mockup. The mockup is one long page with anchors; the app splits it into routes behind one top bar. Behaviors and formulas are in document 11; tokens and components in document 09.

| Route | Screen | Mockup section |
|---|---|---|
| `/` | Overview | A (Portfolio at a glance), B (What to work on next) |
| `/projects` | Projects | C (All projects) |
| `/projects/[id]` | Project detail and edit form | D (Project detail), as a page instead of a side panel |
| `/infrastructure` | Infrastructure | E (Infrastructure and domains) |
| `/planner` | Planner | F (Capacity planner) |
| `/ideas` | Ideas | G (Ideas backlog) |
| `/housekeeping` | Housekeeping | H (Housekeeping) |
| `/sign-in` | Sign in | none (Clerk) |
| `/not-authorized`, `/setup` | Access screens | none |

Section I of the mockup (build plan) is this document suite and does not ship. The mockup's annotation banner and lettered tags do not ship.

## 1. Shell

- Sticky top bar (`components/Shell.tsx`): brand mark "PC" and "Project Control Room" (links to `/`), tabs (Overview, Projects, Infrastructure, Planner, Ideas, Housekeeping), and the user menu (Clerk `<UserButton />`, or "local mode · no sign-in" in open mode).
- The active tab has `aria-current="page"`; `/projects/[id]` highlights Projects.
- Footer: "Private dashboard. Estimates are yours to edit on each project page."
- Browser title: "{Screen} · Project Control Room" (project pages use the project id).

## 2. Overview (`/`)

1. **Header.** H1 "Portfolio at a glance" with a status line: "Last sync Nov 10 at 13:23 UTC" (plus ", with errors" when the latest run was not ok), or "Not synced yet. Data comes from the audited inventory." On the right, the Sync now button; after a run it shows the result inline, for example "github updated 57 · vercel updated 1 · supabase skipped", in the stall color when not ok.
2. **KPI strip** (six tiles, document 11, section 2). Seed values: 26 Projects tracked (22 active · 4 archive or idea); 11 Live on a real URL (3 more on preview URLs); 67% Average completion (across 20 assessed projects); 827 Hours to finish all (about 69 weeks at 12 h/week); 9 Need your action (blocked on you, not on code); 11 No push in 30+ days (candidates to pause or restart).
3. **What to work on next** with the note "Finish score = value × completion ÷ hours left". Left: three lanes, Quick wins "≤15 h", Launch pushes "value 4–5", Steady builds ">15 h", up to four cards each (name, score, bar, first open step, "N% done", "N h left"); a card links to the project. Right: the Needs you panel with count ("9 items"), each row a dot, the project name (link) and the text.

Empty states: lane "Nothing here right now."; Needs you "Nothing is waiting on you."

## 3. Projects (`/projects`)

- H1 "All projects" and "26 projects. Select one to see where it lives, its architecture and next steps."
- Filter row: All, Live, Preview, Building, Stalled, SaaS, Games, Sites, Archive and ideas (pill toggles with `aria-pressed`, one active), then the search input ("Search name, repo, host…", label "Search projects").
- Table columns: Project (name over repo, the whole cell a link), Status (pill), Complete (90 px bar and "N%", or "—"), Hours left ("N h" or "—"), Finish score (mono, or "—"), Hosting and data (host tag chips), Last push (`YYYY-MM-DD` mono plus "Nd", or "—").
- Sortable headers are buttons with `aria-sort` and an arrow on the active column. Default sort: finish score descending.
- Empty: "No projects match. Clear the search or pick another filter."

## 4. Project detail (`/projects/[id]`)

A "← All projects" link, then the detail panel, then the edit panel.

**Header.** H1 name, status pill, category chip; summary; `github.com/{github_repo}` link when set. Meter: "75%" large and bar (or "—"), then "50 h left · done around Dec 15 at 12 h/week · value 4/5 · score 6" (TaskParty at seed; "No estimate yet" when hours are null).

**Grid (three columns; one under 900 px):**

| Cell | Content |
|---|---|
| Where it lives | URLs (links unless the entry has spaces or "("; "None yet"), Repo (mono), Last push ("2026-11-08 (2 days ago)"), Claude project ("Open in Claude" or "Not linked. Add it in Edit below."). "Live signals": chips for repo not found, archived, open PRs, CI, Vercel state, Supabase status, then "Observed {time} UTC"; before any sync "No live signals yet. Run a sync after adding tokens." "Claude Code sessions": list (linked when a URL exists) with a × remove button; "No sessions linked."; an add form (Session title, Link optional). |
| Architecture (spans 2) | Arch nodes for the keys present; "Not assessed." when null. "Infrastructure components": chips "{provider}: {resource}" for components linked to this project (note as tooltip). "Documents": doc dots and the doc note; "Not assessed." when null. |
| Next steps | Checkbox list with hours and a × delete; "No steps yet. Add the next thing to do below."; add form (New step, Hours default 1, step 0.5). |
| Ideas to build | Ideas (★ prefix when starred) with × delete; "None yet."; add form (New idea). |
| Risks and blockers | Bulleted risks or "None noted."; then "Needs you:" in the stall color with the note when set. |

**Edit panel** ("Edit project", note "Your estimates drive the finish score and the planner"), always visible below the detail (decision: no modal or toggle). Fields: Name, Status, Category, Complete %, Hours left, Value 1–5, Hosting tags (comma separated), Summary, Needs you (leave blank when nothing is waiting on you), URLs and domains (one per line), Risks and blockers (one per line), Claude project link, GitHub repo for sync (`owner/name`), Vercel project for sync, Supabase project ref for sync. "Save changes" shows "Saving…" while pending, then a status message ("Saved" or the first validation message in the stall color).

**Not found.** "Nothing here. That project or page doesn't exist. It may have been renamed." with an "All projects" button.

## 5. Infrastructure (`/infrastructure`)

- H1 "Infrastructure and domains", "Every Worker, database, service and domain, and the project that owns it."
- Seven provider cards in seed order: Cloudflare, Railway, Supabase, Vercel, GitHub Pages and Actions, Shared services, Domains. Subtitles are constants: "Workers, D1, R2, DNS, Pages", "Services and databases", "Free plan", "Team scope", "Static hosting and cron", "Accounts used across projects", "Known from repos and DNS".
- The Supabase card shows the capacity meter instead: "2 of 2 active" in the warning style when active ≥ limit, muted otherwise.
- Rows: resource (mono), project label (a link when linked), note.

## 6. Planner (`/planner`)

- H1 "Capacity planner", "Work the queue top to bottom. Reorder it and set your weekly hours to see finish dates."
- Left panel: "Hours per week" slider (4 to 40) with the value, and "All done around Feb 22, 2028" (or "Queue is empty"; " · saving" while a save runs). Queue rows: index, name and hours, ETA, ▲ ▼ × buttons labelled "Move {name} up/down" and "Remove {name} from the queue". Below, "Add to queue" with a select of unqueued active projects that have hours, and an Add button.
- Right panel: timeline ticks and one bar per queued project.

## 7. Ideas (`/ideas`)

- H1 "Ideas backlog", "Feature ideas live on each project page. New project ideas live here until they get a repo."
- Three panels: "Feature ideas: high-value projects" (value 4–5), "Feature ideas: other projects" (value 1–3), "New project ideas" (parking lot).
- Feature panels: one row per active project with ideas, the project name (link) and its ideas joined with " · " (★ marks starred). Read-only here; add and delete on the project page.
- Parking lot: each idea with a star toggle (☆/★, `aria-pressed`) and a × delete; an add form (Idea, One-line description, "Add idea").

## 8. Housekeeping (`/housekeeping`)

- H1 "Housekeeping" and "Cleanup that makes the rest easier to manage. {n} of 12 still need a decision. Approving here records your call; the change itself is done in a Claude session."
- Three panels: "Archive or merge", "Overlaps to decide", "Docs coverage". Each item: title, detail, and Approve and Skip buttons; once decided, an "Approved" (live colors) or "Skipped" chip and an Undo button.

## 9. Sign in (`/sign-in`)

Clerk `<SignIn />` centered on the page background. No sign-up link.

## 10. Not authorized and Setup

Centered panels without the top bar. Copy in document 08, sections 5.1 and 5.2.

## 11. Loading and error states

- No custom `loading.tsx` or `error.tsx` in Phases 1 and 2 (pages are fast server renders; decision). Next.js defaults apply; adding skeletons is a Phase 3 backlog item.
- Pending feedback is inline: "Syncing…", "Saving…", " · saving", optimistic checkboxes and removals.
- Validation messages show next to the Save button; other forms rely on HTML constraints.
