# 10. Application Screens

Version 1.0, 10 Nov 2026. Owner: Design.

Every screen below maps to a lettered section of the approved mockup. The mockup is one long page with anchors; the app splits it into routes behind one top bar. Behaviors and formulas are in document 11; tokens and components in document 09.

| Route | Screen | Mockup section |
|---|---|---|
| `/` | Overview | A (Portfolio at a glance), B (What to work on next) |
| `/projects` | Projects | C (All projects) |
| `/projects/[id]` | Project detail | D (Project detail), shown as a page instead of a side panel |
| `/infrastructure` | Infrastructure | E (Infrastructure and domains) |
| `/planner` | Planner | F (Capacity planner) |
| `/ideas` | Ideas | G (Ideas backlog) |
| `/housekeeping` | Housekeeping | H (Housekeeping) |
| `/sign-in` | Sign in | none (Clerk) |
| n/a | Not authorized, Setup required | none (rendered in place by the layout) |

Section I of the mockup (build plan) is this document suite and does not ship as a screen.

## 1. Shell

- Sticky top bar (document 09, section 6): brand, tabs, last sync, user button.
- Tabs: Overview, Projects, Infrastructure, Planner, Ideas, Housekeeping. `/projects/[id]` highlights Projects.
- Last sync text: "Synced Nov 10 · 13:23 UTC" from the latest `sync_runs.finished_at` (or `started_at` while running: "Syncing…"); "Never synced" when the table is empty; prefixed with a risk dot when the latest run has `ok = false`.
- In open mode an "Auth disabled" pill (note colors) sits before the sync text.
- Page title in the browser tab: "{Screen} · Project Control Room".

## 2. Overview (`/`)

Layout top to bottom:

1. **H1 "Portfolio at a glance"** and the KPI strip (six cells, document 11, section 2). Seed values: 26 Projects tracked (22 active · 4 archive or idea); 11 Live on a real URL (3 more on preview URLs); 67% Average completion (across 20 assessed projects); 827 Hours to finish all (about 69 weeks at 12 h/week); 9 Need your action (blocked on you, not on code); 11 No push in 30+ days (candidates to pause or restart).
2. **H2 "What to work on next"** with the caption "Finish score = value × completion ÷ hours left". Left: three lanes (Quick wins "≤15 h", Launch pushes "value 4–5", Steady builds ">15 h"), four cards each. Right: Needs you panel.
3. **Sync card** (Phase 2) under Needs you: "Last sync" with time, outcome ("OK", or "2 errors" in risk color with the `error` text), per-source line ("GitHub 20 · Vercel 1 · Supabase skipped"), and a secondary "Sync now" button. While running the button reads "Syncing…" and is disabled; on completion the page revalidates.

States:
- Lane with no candidates: "Nothing fits this lane." in muted text.
- Needs you empty: "Nothing is waiting on you."
- Sync card before any run: "Never synced. Add GITHUB_TOKEN, VERCEL_TOKEN or SUPABASE_ACCESS_TOKEN, then Sync now."

## 3. Projects (`/projects`)

- H2 "All projects" with the search input on the right.
- Filter row: All, Live, Preview, Building, Stalled, SaaS, Games, Sites, Archive and ideas (pill toggles, one active).
- Table columns: Project (name, repo beneath), Status (pill), Complete (90 px bar and "N%", or "—"), Hours left ("N h" or "—"), Finish score (mono, or "—"), Hosting and data (host tag chips), Last push ("MM-DD" mono plus "Nd" muted, or "—").
- Sortable headers: Project, Status, Complete, Hours left, Finish score, Last push. Hosting is not sortable.
- Row click (and Enter on a focused row link) opens `/projects/[id]`. The project name is a real link for keyboard and middle-click.
- A small risk dot after the name marks projects with an active sync alert; an "archived" chip appears when GitHub reports the repo archived (Phase 2).
- Empty: one row "No projects match. Clear the search or pick another filter."

## 4. Project detail (`/projects/[id]`)

Breadcrumb "Projects / {name}".

**Header.** Left: H1 name, status pill, category chip; summary in muted text; repo line in mono (`github.com/{github_repo}` link when set, otherwise the `repo` display text). Right: meter with "75%" large, bar, and "50 h left · done around Dec 15 at 12 h/week · value 4/5" (TaskParty at seed) (standalone ETA = today + ceil(hours ÷ hours_per_week) weeks; "No estimate yet" when hours is null). An "Edit" secondary button opens the edit form.

**Grid (three columns, 1 px gaps):**

| Cell | Content |
|---|---|
| Where it lives | URLs (links unless the entry contains "("; "None yet" when empty), Repo (mono), Last push ("2026-11-08 (2 days ago)"), and in Phase 2 a "Live signals" list: open PRs, CI ("passing", "failing", "running", "no checks"), production deploy state with link, Supabase status, each with "checked 3 h ago". Then "Claude sessions": chips (linked when a URL exists), the Claude project link when set, and an "Add session" inline form (title, optional URL). Empty: "No Claude Code session found. Link a claude.ai project here." |
| Architecture (spans 2) | Five arch nodes; "Not assessed." when null. Then "Documents": doc dots and `doc_note`; "Not assessed." when null. |
| Next steps | Step list with checkboxes, hours, delete; add row. Footer line: "N of M done · X h open". Empty: "Not assessed yet." plus the add row. |
| Ideas to build | Bulleted ideas for this project with star toggle; "Add idea" inline input; "None yet." when empty. |
| Risks and blockers | Bulleted risks; "None noted." Then "Needs you: {needs}" with the label in stall color when set; sync alerts listed in risk color. |

**Edit form.** Inline panel replacing the header when open (decision: no modal). Fields: Status (select), Completion % (number 0 to 100), Hours left (number, step 0.5), Value (select blank, 1 to 5), Needs you (text), Summary (textarea, 3 rows), Claude project URL, GitHub repo (placeholder `owner/name`), Vercel project, Supabase ref. Buttons: "Save" (primary), "Cancel". Field errors inline (document 07, section 5.1). Risks are edited in Phase 3 through proposals; in Phases 1 and 2 they are read-only (decision).

**Not found.** Unknown id renders the Next.js not-found page: "No project with id {id}." and a link back to Projects.

## 5. Infrastructure (`/infrastructure`)

- H2 "Infrastructure and domains", caption "Every Worker, database, service and domain, and the project that owns it".
- Seven provider cards in seed order: Cloudflare, Railway, Supabase, Vercel, GitHub Pages and Actions, Shared services, Domains.
- Supabase card header shows the capacity meter "2 of 2 active" with a stall-colored bar and the `warn` style when active ≥ limit; under the limit it shows "1 of 2 active" in muted text.
- Component rows: resource, project (link when `project_id` is set, plain text otherwise, e.g. "Chronologue?", "Unmatched"), note.
- Empty provider list (unseeded): "No infrastructure recorded. Run npm run db:seed."

## 6. Planner (`/planner`)

- H2 "Capacity planner", caption "Reorder the queue and set your weekly hours to see finish dates".
- Left panel: control row with "Hours per week" range slider (4 to 40, step 1), value ("12 h", mono), and "All done around Feb 2028" on the right. Queue list (document 09 Queue). Below: "Not queued" select listing unqueued projects with an "Add" button.
- Right panel: timeline with ticks and one bar per queued project.
- Queue entries with null hours show "— h" and contribute 0 hours; their ETA equals the previous entry's.
- Empty queue: "Queue is empty. Add a project below."

## 7. Ideas (`/ideas`)

- H2 "Ideas backlog".
- Three panels: "Feature ideas: high-value projects" (value 4–5), "Feature ideas: other projects" (value 1–3 or unset), "New project ideas" ("parking lot").
- Feature panels list one block per project: project name (link) then its ideas, each with a star toggle (☆/★, `aria-pressed`) and a delete (×) with confirm-on-second-click ("Delete?" for 3 s; decision, no dialog).
- Each feature panel ends with an "Add idea" row: project select, title input, Add. The parking lot add row has title and detail inputs.
- Archive and idea projects' feature ideas are included in "other projects" (decision: ideas are never hidden).

## 8. Housekeeping (`/housekeeping`)

- H2 "Housekeeping", caption "Cleanup that makes the rest easier to manage".
- Three panels: "Archive or merge", "Overlaps to decide", "Docs coverage".
- Each item: title (semibold), detail (muted), and two buttons "Approve" and "Skip". After a decision the buttons are replaced by a chip ("Approved Nov 10" in live colors or "Skipped Nov 10" in archive colors) and an "Undo" text button.
- Footer note: "Decisions are a record for you. Nothing is archived, moved or deleted by this app."

## 9. Sign in (`/sign-in`)

Centered Clerk `<SignIn />` on `--bg` with the brand above it. No sign-up link.

## 10. Not authorized and Setup required

Full-page centered panel (max 480 px) without tabs. Content in document 08, sections 5.1 and 5.2.

## 11. Loading and error states

- Each route has a `loading.tsx` with skeleton blocks in `--sunk` matching the layout (KPI cells, three lane columns, table rows).
- Each route group has an `error.tsx`: "Something went wrong loading this page." with the error digest in mono and a "Try again" button calling `reset()`.
- Database unreachable: the error boundary shows "Can't reach the database. Check DATABASE_URL." (detected by error type in the boundary message; decision).
- Action failures show inline next to the control that triggered them, in risk color, and never as a toast (no toast system; decision).
