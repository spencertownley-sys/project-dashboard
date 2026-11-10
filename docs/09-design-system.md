# 09. Design System

Version 1.0, 10 Nov 2026. Owner: Design.

The approved mockup (`mockup/index.html`) is the visual source of truth. This document lifts its tokens and components into rules for the app. Where the mockup and this document differ, the mockup's look wins and this document is corrected.

## 1. Design intent

- **Calm control room.** Muted green-gray neutrals, one teal accent, color reserved for status and risk.
- **Dense but legible.** 14 px body, 1.5 line height, tabular numbers everywhere a number is compared.
- **Numbers are mono.** Scores, hours, dates and counts use Geist Mono or tabular figures so columns align.
- **No decoration.** 1 px borders, 10 px radius panels, no shadows, no gradients, no illustrations.
- **No component library.** Components are small local React components using semantic CSS classes ported from the mockup, all colored by tokens.

## 2. Typography

### 2.1 Families

| Token | Stack | Loaded by |
|---|---|---|
| `--f-ui` | `var(--font-geist-sans), "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` | `geist` package (`GeistSans` from `geist/font/sans`), class on `<html>` |
| `--f-mono` | `var(--font-geist-mono), "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | `geist` package (`GeistMono` from `geist/font/mono`) |

### 2.2 Ramp

| Role | Size | Weight | Other |
|---|---|---|---|
| h1 (page title) | 22 px | 700 | letter-spacing −0.01em, `text-wrap: balance` |
| h2 (section) | 18 px | 650 | |
| h3 (card title) | 14 px | 600 | |
| Body | 14 px | 400 | line-height 1.5 |
| Secondary text | 13 px / 12.5 px | 400 | `--muted` |
| Lane and table headers, labels | 11.5 to 12 px | 600 | uppercase, letter-spacing 0.05 to 0.06em, `--muted` |
| KPI value | 26 px | 650 | tabular, letter-spacing −0.02em |
| Detail meter value | 28 px | 650 | tabular |
| Mono (repo, hours, dates, ETA) | 11.5 to 12 px | 400 | `--f-mono` |
| Pill, chip | 11.5 px | 600 (pill), 400 (chip) | |

## 3. Color tokens

Defined on `:root` in `app/globals.css`, overridden for dark under `@media (prefers-color-scheme: dark)` with `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]` so a future manual toggle needs no CSS changes.

### 3.1 Neutrals and accent

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f5f6f4` | `#101512` | Page background |
| `--surface` | `#ffffff` | `#171d19` | Panels, top bar, cards |
| `--sunk` | `#eceeea` | `#1e2621` | Bar track, row hover, arch nodes |
| `--line` | `#dadfd8` | `#2b352f` | Borders, dividers, KPI gaps |
| `--fg` | `#17201b` | `#e6ece8` | Primary text |
| `--muted` | `#5d6a62` | `#9daaa2` | Secondary text, labels |
| `--faint` | `#8b968f` | `#6f7c74` | Tertiary text, empty doc dots, ticks |
| `--accent` | `#0d6b5e` | `#4cc3ad` | Links, active tab text, bars, focus ring, primary button |
| `--accent-soft` | `#d9ece7` | `#16332d` | Active tab, selected row |
| `--accent-fg` | `#ffffff` | `#06201b` | Text on accent |

### 3.2 Status and semantic

| Token pair | Light (fg / bg) | Dark (fg / bg) | Used for |
|---|---|---|---|
| `--live` / `--live-bg` | `#1f7a3f` / `#dcf0e2` | `#6fd38f` / `#163222` | Status live |
| `--preview` / `--preview-bg` | `#1d5fae` / `#dde9f8` | `#82b6f2` / `#172a42` | Status preview |
| `--build` / `--build-bg` | `#7b4bb5` / `#ece3f7` | `#c3a2ee` / `#2a2140` | Status building |
| `--stall` / `--stall-bg` | `#9a6400` / `#f8ebcf` | `#f0bf5c` / `#3a2d10` | Status stalled, warnings, capacity meter, needs dot |
| `--archive` / `--archive-bg` | `#7a7f7c` / `#e7e9e7` | `#a7aeaa` / `#262c28` | Status archive, idea, unknown |
| `--risk` / `--risk-bg` | `#b3362c` / `#f7e0dd` | `#f08a80` / `#3d1c19` | Sync alerts, CI failing, errors, delete hover |
| `--note` / `--note-line` / `--note-fg` | `#fff6d6` / `#e7cf7a` / `#5a4710` | `#2f2a14` / `#6b5c22` / `#ecd98f` | Reserved for Phase 3 proposal cards |

The mockup's annotation banner and lettered tags (A to I) are mockup-only and do not ship.

### 3.3 Status pill mapping

| Status | Class | Label |
|---|---|---|
| live | `s-live` | Live |
| preview | `s-preview` | Preview URL |
| building | `s-building` | Building |
| stalled | `s-stalled` | Stalled |
| archive, idea, unknown | `s-archive` | Archive, Idea, Not assessed |

Pill: inline-flex, gap 5 px, padding 1 px 8 px, radius 99 px, 11.5 px semibold, a 6 px `currentColor` dot before the label.

## 4. Shape and spacing

| Token | Value | Use |
|---|---|---|
| `--r` | 10 px | Panels, KPI strip, detail |
| Card radius | 8 px | Lane cards, arch nodes, search input |
| Small radius | 5 to 7 px | Tabs (7), chips (6), move buttons (5), brand mark (7) |
| Pill radius | 99 px | Pills, filter buttons, bars |
| Panel padding | 16 px (`.pad`), 12 to 14 px rows | |
| Section gap | 36 px between sections, 14 px inside | |
| Page max width | 1240 px, side gutter 16 px (or safe-area inset) | |
| Top bar height | min 56 px, sticky | |

## 5. Layout

- Page: sticky top bar, then `main` at max 1240 px with 24 px top and 64 px bottom padding.
- Overview: KPI strip (6 columns; 3 under 900 px; 2 under 480 px), then a two-column grid (1.6fr lanes, 1fr Needs you; one column under 900 px). Lanes are 3 columns, one column under 700 px.
- Projects: filter row, then a panel with a horizontally scrolling table (min width 880 px).
- Detail: header row (title, pills, summary, meter), then a 3-column grid with 1 px gaps (one column under 900 px). Architecture and documents span two columns.
- Infrastructure: `repeat(auto-fill, minmax(280px, 1fr))` card grid.
- Planner: two columns (1fr queue, 1.4fr timeline; one column under 900 px).
- Ideas and Housekeeping: 3 columns (one under 900 px).
- No horizontal page scroll at 360 px; only tables and the timeline scroll inside their panels.

## 6. Components

| Component | Spec |
|---|---|
| TopBar | Surface background, bottom border. Brand: 26 px accent square with "PC" in mono 12 px, then "Project Control Room" bold. Tabs: Overview, Projects, Infrastructure, Planner, Ideas, Housekeeping; 6 × 10 px padding, 7 px radius, muted text; hover `--sunk`; active `--accent-soft` bg with accent text and `aria-current="page"`. Right side: Clerk `<UserButton>` in clerk mode, or "local mode · no sign-in" (mono 12 px muted) in open mode. The last sync time sits in the Overview header, not the top bar. Tabs scroll horizontally on narrow screens. |
| KpiStrip | Six cells separated by 1 px `--line` gaps inside a bordered rounded container; value, label (12 px muted), sub-line (11.5 px faint). |
| LaneCard | Button-styled card: name (semibold) and score (mono) on one row, progress bar, next open step (12.5 px muted), "N% done" and "N h left" (mono 11.5 px). Hover border accent. Whole card links to the project. |
| NeedsList | Panel with header "Needs you" and count; rows with an 8 px dot (stall for notes, risk for alerts), project name semibold 13 px, text 13 px muted. |
| Bar | 6 px track `--sunk`, accent fill, radius 99. Capacity variant fills with `--stall`. |
| Chip | 1 × 7 px, 1 px border, radius 6, 11.5 px muted, surface bg. |
| FilterButton | Pill outline; pressed state inverts to `--fg` bg and `--bg` text; uses `aria-pressed`. |
| Search | 200 px input, 1 px border, 8 px radius, placeholder "Search name, repo, host…". |
| Table | Header 11.5 px uppercase muted, sortable headers are buttons with `aria-sort`. Cells 10 × 12 px padding, bottom border; row hover `--sunk`. Name semibold with repo in mono faint beneath. |
| StepList | Grid 18 px checkbox / title / hours (mono 11.5 px). Done steps: title struck through in `--muted`. Delete button (×) appears on hover and focus. Add row: title input, hours input (step 0.5), Add button. |
| ArchNodes | Five flex boxes (min 140 px) on `--sunk`, uppercase label 11 px, value 12.5 px. |
| DocDots | 3-column grid; filled dot `●` accent for 1, hollow `○` faint for 0. Labels: PRD, Tech spec, API design, UI/UX notes, Launch checklist, CLAUDE.md. |
| ProviderCard | Header with provider name and either subtitle or capacity meter ("2 of 2 active" in stall color, 80 px bar). Rows: resource (mono 12 px) and project (12 px muted, right aligned; link when `project_id` is set), note on a second line. |
| Queue | Ordered rows: index (mono 11 px faint, zero padded), name with hours, ETA (mono 12 px), up and down buttons (24 × 22 px). Remove (×) button; "Add to queue" select under the list. |
| Signal chip (`.sig`) | 1 × 8 px, radius 6, 11.5 px, line border, muted text. `.good` live colors (CI success, Vercel ready, Supabase active), `.bad` risk colors (CI failure, deploy error, repo not found), `.warn` stall colors (pending, open PRs, archived, paused). Also used for Approved on Housekeeping. |
| Timeline | Week-scale ticks (mono 10.5 px faint) above rows of 150 px name plus a 16 px track with a 12 px accent bar at 85 percent opacity. |
| Button (`.btn`) | Default: surface bg, 1 px line border, fg text, 8 px radius, 6 × 12 px padding, 13 px medium; hover border and text accent. `.primary`: accent bg and border, accent-fg text. `.sm`: 3 × 9 px, 12 px. `.ghost`: transparent, muted text, risk on hover (delete buttons). Disabled at 55 percent opacity. |
| Field | Label 12.5 px muted above input; input 1 px line border, 8 px radius, 6 × 10 px padding, surface bg; error text 12 px risk below; `aria-invalid` and `aria-describedby`. |

## 7. Motion

No animation beyond 120 ms color and border transitions on hover. All transitions disabled under `prefers-reduced-motion: reduce`.

## 8. UI copy

- Sentence case everywhere. Plain verbs: "Sync now", "Add step", "Approve", "Skip", "Undo".
- Empty states say what to do: "No Claude Code session found. Link a claude.ai project here." "Not assessed yet." "None noted."
- Numbers with units: "12 h", "75%", "value 4/5", "31d".
- Dates: "Nov 17" style (`en-US`, month short, day numeric); add year when not the current year ("Feb 22, 2028").

## 9. Accessibility

- Contrast: `--fg`, `--muted`, `--accent` and the status foregrounds are the text colors for information and must meet 4.5:1 on their backgrounds in both themes (verify in the a11y pass, document 15). `--faint` is about 3:1 and is reserved for supplementary text that repeats information shown elsewhere (repo under the name, timeline ticks, queue index, hollow doc dots).
- Focus: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }` on every interactive element.
- Checkboxes labelled by the step title; move buttons labelled "Move {name} up/down"; filter toggles use `aria-pressed`; sortable headers use `aria-sort`.
- Status is never color only: pills always carry a text label; Needs you dots are paired with text.

## 10. Token implementation

`app/globals.css` starts with `@import "tailwindcss";`, then the three token blocks copied verbatim from the mockup (`:root`, the `prefers-color-scheme: dark` block guarded by `:root:not([data-theme="light"])`, and `:root[data-theme="dark"]`), then component classes ported from the mockup (`.top`, `.tabs`, `.kpis`, `.qcard`, `.inbox`, `.pill` and `.s-*`, `.chip`, `.bar`, `.fbtn`, `.search`, table styles, `.detail`, `.dgrid`, `.kv`, `.steps`, `.arch`, `.docdots`, `.prov`, `.cap`, `.planner`, `.queue`, `.gantt`, `.cols3`, `.list`) plus app additions (`.btn` variants, `.field`, `.form-grid`, `.inline-form`, `.sig` signal chips, `.center` for the setup and not-authorized pages).

Decision: the app uses these semantic classes rather than Tailwind utility strings, so the mockup's CSS carries over one to one; Tailwind 4 is available for one-off layout utilities. No `@theme` mapping is needed for that.

Rule: colors come only from the tokens; no raw hex values outside the token blocks in `globals.css`.
