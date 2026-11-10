# 13. Project Inventory

Version 1.0, 10 Nov 2026. Owner: Product. Source: `data/inventory.json`, audited 2026-11-10.

This is the seed data document. `npm run db:seed` loads exactly this content into an empty database (mapping in document 06, section 5). Status, URLs, hosting, sessions, infrastructure and last push were gathered from GitHub, Vercel, Supabase, Cloudflare and Railway configuration in the repos, and the Claude Code session list on the audit date. **Completion %, hours left and value scores are first-pass estimates for the owner to correct** in the edit form; they drive every score, lane and ETA below. Derived numbers (score, stale, lanes, ETA) are computed with the rules in document 11 as of 10 Nov 2026.

## 1. Portfolio summary

| Measure | Value |
|---|---|
| Projects tracked | 26 (22 active, 4 archive or idea) |
| By status | Live 11, Preview URL 3, Building 4, Stalled 3, Not assessed 1, Idea 1, Archive 3 |
| By category | SaaS 10, Game 4, Content 3, Portfolio 2, Business site 2, Tool 2, Consumer app 1, Content + search 1, App 1 |
| Live on a real URL | 11 (plus 3 on preview URLs) |
| Average completion (active, assessed) | 67% across 20 projects |
| Hours to finish all active | 827 h, about 69 weeks at 12 h/week |
| Need your action | 9 projects with a needs note |
| No push in 30+ days (active) | 11: NimbusWatch, Chronologue, Mentionful, Earshot, VYGR Cruises, NestCraft, MORE., Split the G, spencertownley.com, Townley Photography, Amanda Williams Portfolio |
| Next steps | 101 steps, 833.5 h in total |
| Feature ideas | 62, plus 5 new-project ideas |
| Claude Code sessions | 32 across 19 projects |
| Infrastructure components | 39 in 7 provider groups |
| Housekeeping items | 12 |

### 1.1 Focus lanes at seed

| Lane | Projects (finish score) |
|---|---|
| Quick wins (≤15 h) | Spotted Zebra (45.0), Amanda Williams Portfolio (35.0), Townley Photography (26.7), FrameVote (20.8) |
| Launch pushes (value ≥4, 15–60 h) | spencertownley.com (21.2), Quiz Platform (14.3), Book Builder (10.7), TaskParty (6.0) |
| Steady builds (>15 h, value <4) | Chronologue (12.8), Cruise News You Can Use (10.5), Smoosh (8.5), NimbusWatch (8.0) |

## 2. All projects

Sorted by finish score (nulls last), as the Projects table opens. Q = planner queue position.

| Project | id | Category | Status | % | Hours | Value | Score | Last push | Q |
|---|---|---|---|---|---|---|---|---|---|
| Spotted Zebra | `zebra` | Content | Live | 90 | 6 | 3 | 45.0 | 2026-11-08, 2d | 1 |
| Amanda Williams Portfolio | `amanda` | Portfolio | Building | 70 | 4 | 2 | 35.0 | 2026-09-24, 47d (stale) | 2 |
| Townley Photography | `photo` | Business site | Live | 80 | 12 | 4 | 26.7 | 2026-09-21, 50d (stale) | 4 |
| spencertownley.com | `personal` | Portfolio | Live | 85 | 16 | 4 | 21.2 | 2026-10-10, 31d (stale) | 5 |
| FrameVote | `framevote` | Consumer app | Live | 90 | 13 | 3 | 20.8 | 2026-11-04, 6d | 3 |
| Quiz Platform | `quiz` | SaaS | Preview URL | 80 | 28 | 5 | 14.3 | 2026-11-08, 2d | 7 |
| Chronologue | `chrono` | SaaS | Building | 85 | 20 | 3 | 12.8 | 2026-10-10, 31d (stale) | 6 |
| Book Builder | `book` | SaaS | Building | 75 | 35 | 5 | 10.7 | 2026-10-11, 30d | 8 |
| Cruise News You Can Use | `cruise` | Content | Live | 70 | 20 | 3 | 10.5 | 2026-11-10, 0d | 10 |
| Smoosh | `smoosh` | Game | Live | 85 | 30 | 3 | 8.5 | 2026-11-08, 2d | 11 |
| Downbeat | `downbeat` | SaaS | Live | 80 | 30 | 3 | 8.0 | 2026-10-17, 24d | 12 |
| NimbusWatch | `nimbus` | SaaS | Preview URL | 80 | 30 | 3 | 8.0 | 2026-10-10, 31d (stale) | 9 |
| TaskParty | `taskparty` | SaaS | Preview URL | 75 | 50 | 4 | 6.0 | 2026-11-08, 2d | 15 |
| Mentionful | `mentionful` | SaaS | Live | 65 | 60 | 5 | 5.4 | 2026-10-10, 31d (stale) | 13 |
| Earshot | `earshot` | SaaS | Live | 70 | 55 | 4 | 5.1 | 2026-10-10, 31d (stale) | 14 |
| Mariners Prediction Hub | `mariners` | Tool | Archive | 40 | 10 | 1 | 4.0 | 2026-09-12, 59d (stale) | — |
| JIMOTHY: A Seattle Story | `jimothy` | Game | Live | 60 | 56 | 2 | 2.1 | 2026-11-09, 1d | 16 |
| VYGR Cruises | `vyg` | Content + search | Stalled | 35 | 45 | 2 | 1.6 | 2026-05-27, 167d (stale) | 17 |
| Strata | `strata` | SaaS | Stalled | 40 | 90 | 3 | 1.3 | 2026-10-12, 29d | 18 |
| MORE. | `more` | Game | Live | 25 | 200 | 3 | 0.4 | 2026-09-26, 45d (stale) | 19 |
| Townley Creative | `creative` | Business site | Building | 5 | 27 | 2 | 0.4 | 2026-10-17, 24d | — |
| AI News Site | `ainews` | Content | Idea | 0 | 20 | 2 | — | 2026-10-17, 24d | — |
| NestCraft | `nestcraft` | App | Not assessed | — | — | — | — | 2026-10-10, 31d (stale) | — |
| PromoVault | `promovault` | SaaS | Archive | — | — | — | — | 2026-09-06, 65d (stale) | — |
| Split the G | `splitg` | Game | Stalled | — | — | — | — | 2026-08-30, 72d (stale) | — |
| timeline_web_app.py | `timeline` | Tool | Archive | 2 | — | 1 | — | 2026-05-22, 172d (stale) | — |

## 3. Project entries

Grouped by category in inventory order. Each entry gives status, completion, hours, value, hosting, Claude sessions and next steps (hours in brackets), then ideas, risks and the needs-you note.

### 3.1 SaaS

#### TaskParty (`taskparty`)

**Preview URL**, 75% complete, 50 h left, value 4/5, finish score 6.0. Project and task suite in the Asana and Linear space, with a Microsoft 365 look. Repo `ProjectManager`, last push 2026-11-08 (2 days ago). URLs: `taskparty-spencer-s-projects18.vercel.app`, `mail.taskparty.app (planned)`. Hosting: Vercel · project taskparty. Client: Next.js 16 · React 19 · Tailwind 4 · shadcn on Fluent tokens. Data: Supabase “TaskParty” (us-west-1) · Drizzle · Realtime. Auth: Clerk Organizations. Services: Inngest jobs · PostHog · Resend and Stripe pending. Host tags: Vercel, Supabase, Clerk, Inngest. Claude Code sessions (3): “TaskParty views implementation”; “System review and improvements”; “Preview display”. Docs: PRD, Tech spec, API design, UI/UX notes, CLAUDE.md (16-part suite plus HANDOFF.md). Planner queue position 15.

Next steps: Create Clerk instances, test real sign-in, repair migration history (8 h); Send notification email through Inngest and Resend (8 h); Attachment upload to Supabase Storage (6 h); Responsive, WCAG 2.2 AA and performance pass (16 h); Landing page and beta onboarding for 10 testers (8 h). Total 46 h.

Ideas: MCP server so agents can read and update tasks; AI task drafting and thread summaries; Teams connector with task cards. Risks: Real sign-in has never run end to end; Hosted migration history doesn’t match the files; Very large scope for one builder.

#### NimbusWatch (`nimbus`)

**Preview URL**, 80% complete, 30 h left, value 3/5, finish score 8.0. Calm dashboard of weather, wildfire smoke, quakes, air quality and NWS alerts for saved locations. Repo `AllClear`, last push 2026-10-10 (31 days ago, stale). URLs: `web-production-41f16.up.railway.app`. Hosting: Railway web + worker (Vercel config ready). Client: Next.js 16 · Leaflet · Tailwind 4. Data: Supabase “allclear” · PostGIS · 9 migrations · Edge Function seed-snapshot. Auth: Supabase Auth. Services: NWS, FIRMS, USGS, AirNow, NHC and 10 more feeds · Resend · Web Push · Sentry. Host tags: Railway, Supabase, GH Actions cron. Claude Code sessions (1): “AllClear app from Claude chat”. Docs: PRD, Tech spec, API design, UI/UX notes, Launch checklist, CLAUDE.md. Planner queue position 9.

Next steps: Deploy the worker with all keys, confirm the cache fills, retire the keepalive (4 h); Buy a domain and choose Vercel or Railway for the web app (3 h); Sentry and alerts for stale pollers (4 h); Launch checklist: RLS check, a11y, safety disclaimer (10 h); Playwright smoke test from sign-up to alert (6 h). Total 27 h.

Ideas: Family safety circle that shares check-in status; AI morning briefing for each location; Evacuation zone and road closure overlays. Risks: Production secrets are missing, so the worker isn’t running; Free Supabase project pauses without the keepalive; Open-Meteo is licensed for non-commercial use only. **Needs you:** Rename the GitHub repo and buy the domain.

#### Chronologue (`chrono`)

**Building**, 85% complete, 20 h left, value 3/5, finish score 12.8. Build, import, filter and share timelines with an Excel template round trip. Repo `chronologue`, last push 2026-10-10 (31 days ago, stale). Hosting: Not chosen (Dockerfile ready). Client: Next.js 16 · Base UI · vis-timeline · SheetJS. Data: Supabase · likely the paused “Make Me A Timeline” project. Auth: Supabase Auth + Google. Services: Sentry (optional). Host tags: Docker, Supabase. No Claude Code session found. Docs: PRD, Tech spec, API design, UI/UX notes, Launch checklist, CLAUDE.md. Planner queue position 6.

Next steps: Pick a host, create the prod database, push migrations, set the domain (5 h); Google OAuth, redirect URLs and an SMTP sender (3 h); Privacy and terms pages, CI workflow (4 h); Launch checklist (0 of 59 done) (8 h). Total 20 h.

Ideas: PNG and PDF export for presentations; Pull dated events out of pasted text or a PDF with AI; Embeddable public timeline widget. Risks: Supabase free plan is full (2 of 2 active); No host or domain decided; BCE and month-only dates unresolved.

#### Quiz Platform (`quiz`)

**Preview URL**, 80% complete, 28 h left, value 5/5, finish score 14.3. Personality and brain quizzes with a free result and paid one-time reports. Brand still open. Repo `quizplatform`, last push 2026-11-08 (2 days ago). URLs: `web-production-1692a.up.railway.app`. Hosting: Railway (Vercel config also present). Client: Next.js 16 · Tailwind 4 · react-pdf · next/og cards. Data: Postgres · Drizzle. Auth: Clerk Core 3. Services: Stripe Checkout, Billing, Tax · Resend · PostHog · GA4. Host tags: Railway, Postgres, Clerk, Stripe. Claude Code sessions (1): “Quiz monetization website”. Docs: PRD, CLAUDE.md (REQUIREMENTS, QUIZ_CATALOG, QUIZ_STRUCTURES, CONTENT_GUIDE). Planner queue position 7.

Next steps: Point the Railway web service at main (0.5 h); Pick brand and domain, add live Clerk, Stripe and Resend keys (6 h); Review and publish the 20 draft quizzes (15 h); Stripe test purchases, a refund and a cancel; add the cron service (4 h); Lawyer review of terms and auto-renewal (3 h). Total 28.5 h.

Ideas: AI-personalized narrative for the Deep Report; Spanish versions of the top 10 quizzes; Auto-export results as Story images. Risks: All 20 quizzes are drafts, so nothing is for sale; Auto-renewal law exposure; Mental-health screeners carry liability. **Needs you:** Railway still deploys an old branch.

#### Mentionful (`mentionful`)

**Live**, 65% complete, 60 h left, value 5/5, finish score 5.4. SEO and AI-answer visibility: site audit, scores, drafted fixes and mention tracking across 4 AI engines. Repo `SEOBuilder`, last push 2026-10-10 (31 days ago, stale). URLs: `mentionful.com`, `betterseobuilder.com`. Hosting: Railway “seobuilder”: web + landing services. Client: Next.js 16 · Tailwind. Data: Railway Postgres · job queue in Postgres. Auth: Built-in accounts. Services: Claude, OpenAI, Gemini, Perplexity · PageSpeed Insights. Host tags: Railway, Postgres, LLM APIs. Claude Code sessions (1): “SEO/GEO chat function extraction”. Docs: PRD, Tech spec, CLAUDE.md. Planner queue position 13.

Next steps: Engine keys in prod, cost benchmark, per-run metering (8 h); Email: password reset, verification, weekly report (10 h); Stripe plans at $29, $99 and $299 (14 h); Structured parser for AI answers (8 h); Rank data from DataForSEO and Search Console (20 h). Total 60 h.

Ideas: Track Google AI Overviews; Auto-PR or CMS plugin that applies the drafted fixes; White-label PDF reports for agencies. Risks: AI-visibility features don’t work without engine keys; LLM cost per run isn’t metered; No password reset yet.

#### Earshot (`earshot`)

**Live**, 70% complete, 55 h left, value 4/5, finish score 5.1. Self-serve social listening with tunable profiles, alerts and digests. Repo `social-listening-app`, last push 2026-10-10 (31 days ago, stale). URLs: `earshot-listening.up.railway.app`. Hosting: Railway “earshot” + volume. Client: Next.js 16 · Tailwind 4 · Recharts. Data: Railway Postgres · nightly backups 08:00 UTC. Auth: Email + password, invites, roles. Services: Claude Haiku and Opus · Reddit, X, Bluesky, YouTube, RSS · Resend · Slack. Host tags: Railway, Postgres, Claude API. Claude Code sessions (1): “Social listening app extraction”. Docs: PRD, Tech spec, API design (BUILD_PLAN 39 of 43 done). Planner queue position 14.

Next steps: Stripe billing and plan limits (16 h); Password reset and Google sign-in (8 h); Rollback UI and boolean query editor (8 h); Landing and pricing page, onboarding, domain (10 h); Semantic topics with pgvector (12 h). Total 54 h.

Ideas: Competitor share of voice; AI reply drafts you copy, never auto-post; Weekly executive report to Slack or PDF. Risks: Reddit, X and Meta API approvals and costs; Scheduler can’t run on more than one instance; Unused Supabase schema drifting from the real one. **Needs you:** Finish owner setup at /setup and add the Resend key.

#### Book Builder (`book`)

**Building**, 75% complete, 35 h left, value 5/5, finish score 10.7. Personalized children’s picture books, shared with family and printed as hardcovers. Repo `bookbuilder`, last push 2026-10-11 (30 days ago). Hosting: Vercel (planned). Client: Next.js 16 · Konva editor · jsPDF. Data: Postgres + Supabase Storage (not provisioned). Auth: Clerk. Services: Stripe + Tax · Lulu Print API · fal.ai or gpt-image-1. Host tags: Vercel, Supabase, Clerk, Stripe, Lulu. Claude Code sessions (1): “Bookbuilder website build”. Docs: README only. Planner queue position 8.

Next steps: Provision database, storage, Clerk prod and Stripe; deploy (6 h); Lulu sandbox test, then order one real printed copy (6 h); Upscale the 12 template backgrounds for print (3 h); Tests for checkout, webhooks and fulfilment (10 h); Domain, COPPA-aware legal pages, pricing copy (6 h). Total 31 h.

Ideas: AI story draft from a few facts about the child; Gift a book credit; Yearly keepsake series bundle. Risks: Supabase free plan is full; Template art prints at about 117 dpi; Children’s photos and COPPA.

#### Downbeat (`downbeat`)

**Live**, 80% complete, 30 h left, value 3/5, finish score 8.0. Bands share a link, members tap availability, the leader sees the overlap. Repo `downbeat`, last push 2026-10-17 (24 days ago). URLs: `trydownbeat.app`. Hosting: Railway (Dockerfile). Client: Next.js 16 · shadcn · Recharts. Data: Railway Postgres · Drizzle, 8 migrations. Auth: Clerk for leaders; links, passkeys and recovery codes for members. Services: None yet. Host tags: Railway, Postgres, Clerk. Claude Code sessions (2): “Trydownbeat.app redesign”; “Downbeat login diagnosis”. Docs: README only. Planner queue position 12.

Next steps: Setlist builder with vote and veto (14 h); Email reminders and best-slot notices (8 h); Calendar export (.ics) (5 h); CI for tests, lint and build (2 h); Analytics and a feedback link (2 h). Total 31 h.

Ideas: Gig mode with venue, load-in and set length; “Book this slot” that confirms with everyone; Split rehearsal room costs. Risks: A drifting copy lives in the Database repo; No CI; Anyone with the member link can edit. **Needs you:** Phone sideways-scroll fix found but not pushed.

#### Strata (`strata`)

**Stalled**, 40% complete, 90 h left, value 3/5, finish score 1.3. Structured work management with custom item types and a spreadsheet-grade grid with preview and undo. Repo `Database · branch strata-spec-reconciliation`, last push 2026-10-12 (29 days ago). Hosting: Not deployed (docker-compose). Client: Next.js 15 · TanStack Table and Virtual · Tailwind 4. Data: Postgres 16 · Drizzle · RLS per workspace. Auth: Magic link. Services: None yet. Host tags: Docker, Postgres. Claude Code sessions (2): “Strata work-management platform”; “Strata spec reconciliation fixes”. Docs: PRD, Tech spec, API design, UI/UX notes, Launch checklist, CLAUDE.md (Launch checklist 0 of 164). Planner queue position 18.

Next steps: Move Strata into its own repo (1 h); Provision Postgres and deploy a preview (6 h); Category trees and variant inheritance (40 h); Launch checklist pass (30 h). Total 77 h.

Ideas: Excel import with change-set preview; Saved grid views per role; AI bulk edits proposed as change sets. Risks: Overlaps with TaskParty; Lives on a branch of an unrelated repo; Rough estimate; needs a proper review. **Needs you:** Session is waiting on database and Vercel access.

#### PromoVault (`promovault`)

**Archive**, not estimated yet. Trade promotion and product data system for cruise marketing. Promo Offer Studio is archived; a migration spec targets Power Apps. Repo `Database (main history) · promo-offer-studio`, last push 2026-09-06 (65 days ago, stale). Architecture not assessed. Claude Code sessions (3): “TPM/PIM SaaS”; “Promo offer studio app”; “Promo offer studio live”. Docs not assessed.

Next steps: none recorded.

### 3.2 Consumer app

#### FrameVote (`framevote`)

**Live**, 90% complete, 13 h left, value 3/5, finish score 20.8. Share a photo batch, group near-duplicates, collect votes and get a fair leaderboard. Repo `framevote`, last push 2026-11-04 (6 days ago). URLs: `framevote.com`, `shortlist.spencertownley.workers.dev`. Hosting: Cloudflare Worker “shortlist” (Hono API + assets). Client: React 18 SPA · Vite 6 · Tailwind 4. Data: D1 “shortlist” · R2 “shortlist-photos”. Auth: None: owner token and one ballot per device. Services: PostHog. Host tags: Cloudflare Worker, D1, R2. Claude Code sessions (2): “Framevote deployment”; “Shortlist photo voting app”. Docs: README only. Planner queue position 3.

Next steps: Poll expiry and a Cron Trigger that purges D1 rows and R2 photos (5 h); Rate limits or Turnstile on poll creation and uploads (3 h); Privacy page and an owner “delete poll” button (3 h); CI that runs tests and wrangler deploy (2 h). Total 13 h.

Ideas: HEIC support through Cloudflare Images; Flag blurry or eyes-closed frames with AI; Download the winners as a ZIP album. Risks: R2 storage grows with no cleanup; Device ballots can be spoofed; Deploys run by hand from your machine.

### 3.3 Content + search

#### VYGR Cruises (`vyg`)

**Stalled**, 35% complete, 45 h left, value 2/5, finish score 1.6. Independent cruise search by destination, port, ship and length. Repo `vyg`, last push 2026-05-27 (167 days ago, stale). URLs: `vygrcruises.com`. Hosting: Railway (web and worker in one container). Client: Next.js 16 · Tailwind 4. Data: SQLite on a volume · Drizzle. Auth: Lucia, admin only. Services: Unsplash and Wikimedia images. Host tags: Railway, SQLite. No Claude Code session found. Docs: CLAUDE.md. Planner queue position 17.

Next steps: Choose a data source: affiliate feed or a reviewed crawl (8 h); First real source with live prices (20 h); Price labels, affiliate links and disclosures (4 h); Stop committing the database; scheduled refresh (3 h); SEO content and launch (8 h). Total 43 h.

Ideas: Fare-drop alerts; Compare sailings side by side; Cruises from my nearest port. Risks: Shows invented fares today; Terms-of-service exposure if crawling; README overstates the crawler.

### 3.4 App

#### NestCraft (`nestcraft`)

**Not assessed**, not estimated yet. Private repo. This session wasn’t allowed to open it, so it isn’t assessed yet. Repo `NestCraft (private)`, last push 2026-10-10 (31 days ago, stale). Architecture not assessed. Claude Code sessions (1): “NestCraft app creation”. Docs not assessed.

Next steps: none recorded.

Risks: Grant read access to include it.

### 3.5 Game

#### Smoosh (`smoosh`)

**Live**, 85% complete, 30 h left, value 3/5, finish score 8.5. Physics merge game in a watercolor fantasy world, with endless and story modes. Repo `Merge_Game1`, last push 2026-11-08 (2 days ago). URLs: `spencertownley-sys.github.io/Merge_Game1`. Hosting: GitHub Pages (Actions deploy, Playwright CI). Client: React 19 · PixiJS 8 · Rapier2D in a worker · installable PWA. Data: IndexedDB on device. Auth: None. Services: Higgsfield art. Host tags: GitHub Pages, PWA. Claude Code sessions (2): “Smoosh fruit merge game”; “Game level review tool”. Docs: PRD, API design, UI/UX notes, CLAUDE.md (Plus game design, art direction, journey plan). Planner queue position 11.

Next steps: Levels 35–41 and the finale (14 h); Act cards and the epilogue (6 h); Daily Glow seeded run (4 h); Real-device playtest and performance (6 h). Total 30 h.

Ideas: Skylight Album collection screen; Seed challenges shared by link; App store build with Capacitor. Risks: Mobile Lighthouse score around 0.8; Working title isn’t final.

#### JIMOTHY: A Seattle Story (`jimothy`)

**Live**, 60% complete, 56 h left, value 2/5, finish score 2.1. Cozy platformer starring Ballard’s short-spined raccoon. Repo `jimothy`, last push 2026-11-09 (1 days ago). URLs: `spencertownley-sys.github.io/jimothy`, `spencertownley.com/play/jimothy`. Hosting: GitHub Pages. Client: Phaser 3.90 · TypeScript · Tiled maps. Data: localStorage saves. Auth: None. Services: Higgsfield art · Epidemic Sound audio. Host tags: GitHub Pages. Claude Code sessions (1): “Jimothy: A Seattle Story”. Docs: PRD, Tech spec, UI/UX notes, Launch checklist, CLAUDE.md (GDD, level specs, asset manifest, QA 0 of 45). Planner queue position 16.

Next steps: World 4 and the Bridge Troll boss (20 h); World 5, ending and secret level (16 h); Sprite animation frames (12 h); QA checklist and difficulty tuning (8 h). Total 56 h.

Ideas: Speedrun timer with par medals; Daily remix level; Phone app with Capacitor. Risks: Based on a real local raccoon; check likeness; Sprites are single poses; Music licence for a native app.

#### MORE. (`more`)

**Live**, 25% complete, 200 h left, value 3/5, finish score 0.4. 16-bit story game about the paperclip maximizer. You play Pip, a factory AI. Repo `More_A_Playable_Story`, last push 2026-09-26 (45 days ago, stale). URLs: `makemorepaperclips.com`. Hosting: GitHub Pages. Client: Plain JS canvas engine at 384×288. Data: localStorage save. Auth: None. Services: Higgsfield art · Python pixel-snap tool. Host tags: GitHub Pages. Claude Code sessions (2): “SNES game story: paperclip thought experiment”; “Paperclip Drift vertical slice”. Docs: README only (STORY.md story bible). Planner queue position 19.

Next steps: Mailing list and an itch.io page (3 h); Chapter 2 “The Floor” (40 h); Chapter 3 “The Town” (50 h); Chapters 4–6 and epilogue (100 h); Playtest and save migration (8 h). Total 201 h.

Ideas: Clip-count speedrun board; Achievements for alignment choices; Desktop build for Steam. Risks: Each chapter needs new mechanics and art; Higgsfield licensing for a commercial release; Comparisons to Universal Paperclips. **Needs you:** A pull request is waiting for your merge.

#### Split the G (`splitg`)

**Stalled**, not estimated yet. Three-mode stout-pouring iPhone game in SwiftUI. Not assessed yet. Repo `Database · branch split-the-g-game`, last push 2026-08-30 (72 days ago, stale). Hosting: App Store (not submitted). Client: SwiftUI · Xcode project SplitTheG. Data: On device. Auth: None. Services: Game Center. Host tags: iOS. Claude Code sessions (1): “Split the G iPhone game”. Docs: README only.

Next steps: none recorded.

Risks: Lives on a branch of the Database repo.

### 3.6 Content

#### Cruise News You Can Use (`cruise`)

**Live**, 70% complete, 20 h left, value 3/5, finish score 10.5. AI-written weekday cruise industry brief with a social pulse page and a podcast source. Repo `CruiseNewsYouCanUse`, last push 2026-11-10 (0 days ago). URLs: `spencertownley-sys.github.io/CruiseNewsYouCanUse`. Hosting: GitHub Pages. Client: Static HTML with client-side search. Data: Markdown in data/ rendered by publish_post.py. Auth: None. Services: Scheduled Claude task, weekdays 6:52 PT · Bluesky and X · NotebookLM. Host tags: GitHub Pages, Claude schedule. Claude Code sessions (4): “Cruise News weekday brief scheduler”; “Cruise News daily brief runner”; “Troubleshooting”; “Cruise brief publisher”. Docs: README only. Planner queue position 10.

Next steps: Reliable schedule with a missed-day alert (4 h); RSS feed and email signup (5 h); Custom domain, share tags, analytics (2 h); Feed Social Pulse from Earshot, or remove it (4 h); Automate the podcast with TTS (6 h). Total 21 h.

Ideas: Follow pages per cruise line and ship; Deal of the week from VYGR fares; Weekly email with CCL, NCLH and RCL prices. Risks: Automation lives outside the repo; No review step for AI factual errors; Missed days need backfills. **Needs you:** Add the repo to the “Cruise News weekday brief” scheduled task.

#### Spotted Zebra (`zebra`)

**Live**, 90% complete, 6 h left, value 3/5, finish score 45.0. Site for the Seattle party cover band: bookings, shows, music and blog. Repo `spotted_zebra`, last push 2026-11-08 (2 days ago). URLs: `spottedzebra.party`. Hosting: GitHub Pages, daily scheduled-post workflow. Client: Jekyll · plain JS jukebox and keyboard. Data: YAML in _data. Auth: None. Services: Cloudflare DNS and Email Routing · FormSubmit. Host tags: GitHub Pages, Cloudflare DNS. Claude Code sessions (2): “Spotted zebra site updates”; “Spotted Zebra band website”. Docs: README only. Planner queue position 1.

Next steps: Add 10–20 gig photos (1.5 h); Search Console and Google Business Profile (2 h); Retire the old Wix site (1 h); Check licensing for cover recordings (1 h); Fix the “(2027 Guide)” post title (0.5 h). Total 6 h.

Ideas: Sync shows from Bandsintown; Downloadable press kit PDF; Song request voting before gigs. Risks: Licensing for posted covers; GitHub stops scheduled workflows after 60 idle days; 8 MB hero video.

#### AI News Site (`ainews`)

**Idea**, 0% complete, 20 h left, value 2/5, finish score —. Empty repo. Could reuse the Cruise News pipeline. Repo `AI_news_site`, last push 2026-10-17 (24 days ago). Architecture not assessed. No Claude Code session found. Docs not assessed.

Next steps: Define the concept (2 h); Fork the Cruise News generator (6 h); Ingestion and summaries on a schedule (8 h); Newsletter and SEO basics (4 h). Total 20 h.

Risks: Crowded niche.

### 3.7 Portfolio

#### spencertownley.com (`personal`)

**Live**, 85% complete, 16 h left, value 4/5, finish score 21.2. Personal portfolio with a photoreal Room mode and a 3D Brain mode. Repo `spencertownleysite`, last push 2026-10-10 (31 days ago, stale). URLs: `spencertownley.com`. Hosting: Railway “spencertownley-site” behind Cloudflare DNS. Client: React 19 · Vite 8 · three.js · WebGL depth shader · d3-geo. Data: Static. Auth: None. Services: Higgsfield and Depth Anything assets. Host tags: Railway, Cloudflare DNS. Claude Code sessions (1): “Personal professional website”. Docs: CLAUDE.md. Planner queue position 5.

Next steps: Resume PDF and career story (4 h); Landscape and wildlife picks, video reel (4 h); Trip itinerary and Brain copy (4 h); Email routing and analytics (1 h); Lighthouse and accessibility pass (3 h). Total 16 h.

Ideas: “Now building” feed from this dashboard; Case-study pages with metrics; Clickable travel map with photos. Risks: Waiting on your content; Heavy payload on phones; Jimothy build is copied in by hand.

#### Amanda Williams Portfolio (`amanda`)

**Building**, 70% complete, 4 h left, value 2/5, finish score 35.0. One-page portfolio and resume for a project manager’s job search. Repo `Amanda-Williams-Portfolio`, last push 2026-09-24 (47 days ago, stale). Hosting: Cloudflare Pages (planned). Client: Single HTML file. Data: Static. Auth: None. Services: None. Host tags: Cloudflare Pages. No Claude Code session found. Docs: README only (Hosting guide for the owner). Planner queue position 2.

Next steps: Move the site to the repo root, fix the README (0.5 h); Share tags, favicon, structured data, resume PDF (1.5 h); Pull images out into WebP files (1 h); Domain, deploy and email routing with Amanda (1 h). Total 4 h.

Ideas: Downloadable resume; Case-study pages; Contact form instead of a mailto link. Risks: Waiting on the owner to buy a domain; Personal email address is public. **Needs you:** Amanda needs to buy a domain.

### 3.8 Business site

#### Townley Photography (`photo`)

**Live**, 80% complete, 12 h left, value 4/5, finish score 26.7. Portraits, real estate, prints and video around Puget Sound. Repo `townley-photography-site`, last push 2026-09-21 (50 days ago, stale). URLs: `townleyphotography.com`. Hosting: Cloudflare Pages or GitHub Pages (unclear). Client: Static HTML and CSS. Data: Static. Auth: None. Services: Formspree. Host tags: Cloudflare Pages?, GitHub Pages?. No Claude Code session found. Docs: README only (llms.txt and sitemap only). Planner queue position 4.

Next steps: Make the newsletter signup work (1.5 h); Video embeds on /video (3 h); Print checkout with Stripe Payment Links (4 h); Pick one host and add a README (1.5 h); WebP images and lazy loading (2 h). Total 12 h.

Ideas: Client proofing galleries; Booking with a deposit; Real estate price calculator. Risks: Uploaded build with no source files; Subscribe button does nothing on 11 pages.

#### Townley Creative (`creative`)

**Building**, 5% complete, 27 h left, value 2/5, finish score 0.4. Higgsfield site scaffold; five layouts proposed on 9 Nov. Repo `townleycreative`, last push 2026-10-17 (24 days ago). Hosting: Cloudflare Workers through Higgsfield. Client: TanStack Start · React 19 · Higgsfield Quanta UI. Data: None yet (D1 and R2 available). Auth: None. Services: Higgsfield generation SDK. Host tags: Cloudflare Worker, Higgsfield. Claude Code sessions (1): “Townley Creative website”. Docs: README only.

Next steps: Pick one of the five proposed layouts (1 h); Define services and content (3 h); Build the pages (16 h); Inquiry form (5 h); Domain and SEO (3 h). Total 28 h.

Ideas: Proofing galleries on R2; AI mood boards through Higgsfield; Booking with availability. Risks: Overlaps the photography and personal sites; Deploy config is generated outside the repo. **Needs you:** Choose one of the five layouts.

### 3.9 Tool

#### Mariners Prediction Hub (`mariners`)

**Archive**, 40% complete, 10 h left, value 1/5, finish score 4.0. Friends guess monthly Mariners wins. Archived on GitHub; dormant until April. Repo `mariners-tracker`, last push 2026-09-12 (59 days ago, stale). Hosting: None. Client: Single HTML file. Data: localStorage + JSON. Auth: None. Services: None. No Claude Code session found. Docs: README only.

Next steps: Fetch records from the MLB Stats API (3 h); Shared storage so guesses sync (4 h); 2027 season reset and leaderboard (2 h). Total 9 h.

Ideas: Season-long leaderboard; Reminder to submit guesses. Risks: Friends’ names in a public CSV.

#### timeline_web_app.py (`timeline`)

**Archive**, 2% complete, — h left, value 1/5, finish score —. Untouched Streamlit template. Chronologue covers the same idea. Repo `timeline_web_app.py`, last push 2026-05-22 (172 days ago, stale). Architecture not assessed. Host tags: Streamlit. No Claude Code session found. Docs not assessed.

Next steps: none recorded.

## 4. Documentation coverage

| Project | PRD | Tech | API | UI | Launch | CLAUDE.md | Note |
|---|---|---|---|---|---|---|---|
| TaskParty | ● | ● | ● | ● | ○ | ● | 16-part suite plus HANDOFF.md |
| NimbusWatch | ● | ● | ● | ● | ● | ● |  |
| Chronologue | ● | ● | ● | ● | ● | ● |  |
| FrameVote | ○ | ○ | ○ | ○ | ○ | ○ |  |
| Quiz Platform | ● | ○ | ○ | ○ | ○ | ● | REQUIREMENTS, QUIZ_CATALOG, QUIZ_STRUCTURES, CONTENT_GUIDE |
| Mentionful | ● | ● | ○ | ○ | ○ | ● |  |
| Earshot | ● | ● | ● | ○ | ○ | ○ | BUILD_PLAN 39 of 43 done |
| Book Builder | ○ | ○ | ○ | ○ | ○ | ○ |  |
| Downbeat | ○ | ○ | ○ | ○ | ○ | ○ |  |
| VYGR Cruises | ○ | ○ | ○ | ○ | ○ | ● |  |
| Strata | ● | ● | ● | ● | ● | ● | Launch checklist 0 of 164 |
| NestCraft | — | — | — | — | — | — | Not assessed |
| Smoosh | ● | ○ | ● | ● | ○ | ● | Plus game design, art direction, journey plan |
| JIMOTHY: A Seattle Story | ● | ● | ○ | ● | ● | ● | GDD, level specs, asset manifest, QA 0 of 45 |
| MORE. | ○ | ○ | ○ | ○ | ○ | ○ | STORY.md story bible |
| Split the G | ○ | ○ | ○ | ○ | ○ | ○ |  |
| Cruise News You Can Use | ○ | ○ | ○ | ○ | ○ | ○ |  |
| Spotted Zebra | ○ | ○ | ○ | ○ | ○ | ○ |  |
| spencertownley.com | ○ | ○ | ○ | ○ | ○ | ● |  |
| Townley Photography | ○ | ○ | ○ | ○ | ○ | ○ | llms.txt and sitemap only |
| Townley Creative | ○ | ○ | ○ | ○ | ○ | ○ |  |
| Amanda Williams Portfolio | ○ | ○ | ○ | ○ | ○ | ○ | Hosting guide for the owner |
| Mariners Prediction Hub | ○ | ○ | ○ | ○ | ○ | ○ |  |
| timeline_web_app.py | — | — | — | — | — | — | Not assessed |
| AI News Site | — | — | — | — | — | — | Not assessed |
| PromoVault | — | — | — | — | — | — | Not assessed |

## 5. Link fields to fill after seeding

The inventory has no `github_repo`, `vercel_project`, `supabase_ref` or `claude_project_url` values, so the seed leaves them null (decision, document 02 section 9.1) and sync checks nothing until they are set in each project's edit form. Suggested values below come from the audit (repository names under the owner's GitHub account `spencertownley-sys`, as used in the mockup). Verify each before saving.

| Project | Suggested `github_repo` | `vercel_project` | `supabase_ref` |
|---|---|---|---|
| TaskParty | `spencertownley-sys/ProjectManager` | `taskparty` | ref of `TaskParty` (us-west-1) |
| NimbusWatch | `spencertownley-sys/AllClear` | — | ref of `allclear` (us-west-1) |
| Chronologue | `spencertownley-sys/chronologue` | — | ref of “Make Me A Timeline” (us-east-1, paused) if confirmed |
| FrameVote | `spencertownley-sys/framevote` | — | — |
| Quiz Platform | `spencertownley-sys/quizplatform` | — | — |
| Mentionful | `spencertownley-sys/SEOBuilder` | — | — |
| Earshot | `spencertownley-sys/social-listening-app` | — | — |
| Book Builder | `spencertownley-sys/bookbuilder` | — | — |
| Downbeat | `spencertownley-sys/downbeat` | — | — |
| VYGR Cruises | `spencertownley-sys/vyg` | — | — |
| Strata | Leave empty until split out (lives in the `Database` repo; CI there would not reflect this project) | — | — |
| NestCraft | `spencertownley-sys/NestCraft` (private; token needs access) | — | — |
| Smoosh | `spencertownley-sys/Merge_Game1` | — | — |
| JIMOTHY: A Seattle Story | `spencertownley-sys/jimothy` | — | — |
| MORE. | `spencertownley-sys/More_A_Playable_Story` | — | — |
| Split the G | Leave empty until split out (lives in the `Database` repo; CI there would not reflect this project) | — | — |
| Cruise News You Can Use | `spencertownley-sys/CruiseNewsYouCanUse` | — | — |
| Spotted Zebra | `spencertownley-sys/spotted_zebra` | — | — |
| spencertownley.com | `spencertownley-sys/spencertownleysite` | — | — |
| Townley Photography | `spencertownley-sys/townley-photography-site` | — | — |
| Townley Creative | `spencertownley-sys/townleycreative` | — | — |
| Amanda Williams Portfolio | `spencertownley-sys/Amanda-Williams-Portfolio` | — | — |
| Mariners Prediction Hub | `spencertownley-sys/mariners-tracker` | — | — |
| timeline_web_app.py | `spencertownley-sys/timeline_web_app.py` | — | — |
| AI News Site | `spencertownley-sys/AI_news_site` | — | — |
| PromoVault | Leave empty until split out (lives in the `Database` repo; CI there would not reflect this project) | — | — |

No project has a known claude.ai chat Project URL; add them as they are found.

## 6. Infrastructure inventory

Seeded into `components` in this order (`position` 1 to 39). "Linked" shows the project id the seed resolves by exact, case-insensitive name match; blank means the label is kept as text only.

### Cloudflare

Subtitle: Workers, D1, R2, DNS, Pages.

| # | Resource | Project | Linked | Note |
|---|---|---|---|---|
| 1 | Worker shortlist | FrameVote | `framevote` | Custom domains framevote.com and www |
| 2 | D1 shortlist | FrameVote | `framevote` | No expiry or cleanup yet |
| 3 | R2 shortlist-photos | FrameVote | `framevote` | Grows with every poll |
| 4 | Worker (Higgsfield-managed) | Townley Creative | `creative` | Config generated at deploy |
| 5 | DNS spencertownley.com | spencertownley.com | `personal` | Proxied to Railway |
| 6 | DNS + Email Routing spottedzebra.party | Spotted Zebra | `zebra` | contact@ and booking@ to Gmail |
| 7 | Pages townleyphotography.com? | Townley Photography | `photo` | Host unconfirmed |

### Railway

Subtitle: About 8 services.

| # | Resource | Project | Linked | Note |
|---|---|---|---|---|
| 8 | seobuilder: web, landing | Mentionful | `mentionful` | — |
| 9 | earshot + Postgres + volume | Earshot | `earshot` | Hobby plan, own backups |
| 10 | downbeat + Postgres | Downbeat | `downbeat` | — |
| 11 | spencertownley-site: web | spencertownley.com | `personal` | — |
| 12 | web-production-41f16 + worker | NimbusWatch | `nimbus` | Worker not running |
| 13 | web-production-1692a | Quiz Platform | `quiz` | Deploys an old branch |
| 14 | vyg (SQLite volume) | VYGR Cruises | `vyg` | Stale since May |

### Supabase

Subtitle: Free plan. Capacity: 2 of 2 active (warning: at the free-plan limit).

| # | Resource | Project | Linked | Note |
|---|---|---|---|---|
| 15 | allclear · us-west-1 | NimbusWatch | `nimbus` | Active · kept awake by a GitHub Action |
| 16 | TaskParty · us-west-1 | TaskParty | `taskparty` | Active · migrations 0001–0004 |
| 17 | Make Me A Timeline · us-east-1 | Chronologue? |  | Paused |

### Vercel

Subtitle: Team scope.

| # | Resource | Project | Linked | Note |
|---|---|---|---|---|
| 18 | taskparty | TaskParty | `taskparty` | Production deploys ready |

### GitHub Pages and Actions

Subtitle: Static hosting and cron.

| # | Resource | Project | Linked | Note |
|---|---|---|---|---|
| 19 | Pages: Merge_Game1 | Smoosh | `smoosh` | — |
| 20 | Pages: jimothy | JIMOTHY |  | — |
| 21 | Pages: makemorepaperclips.com | MORE. | `more` | — |
| 22 | Pages: spottedzebra.party | Spotted Zebra | `zebra` | — |
| 23 | Pages: CruiseNewsYouCanUse | Cruise News |  | — |
| 24 | cron 17 */6 * * * keepalive | NimbusWatch | `nimbus` | Stops Supabase pausing |
| 25 | cron 15:17 UTC publish posts | Spotted Zebra | `zebra` | Disabled after 60 idle days |

### Shared services

Subtitle: Accounts used across projects.

| # | Resource | Project | Linked | Note |
|---|---|---|---|---|
| 26 | Clerk (dev instance, 100-user cap) | TaskParty, Downbeat, Quiz, Book Builder |  | Production instances still needed |
| 27 | Claude scheduled task: weekday brief | Cruise News |  | Runs 6:52 PT |
| 28 | Higgsfield | Smoosh, JIMOTHY, MORE., Townley Creative |  | Art and hosting |
| 29 | Stripe | Quiz, Book Builder |  | Test mode only |

### Domains

Subtitle: Known from repos and DNS.

| # | Resource | Project | Linked | Note |
|---|---|---|---|---|
| 30 | framevote.com | FrameVote | `framevote` | — |
| 31 | mentionful.com | Mentionful | `mentionful` | — |
| 32 | betterseobuilder.com | Mentionful | `mentionful` | Ad landing page |
| 33 | trydownbeat.app | Downbeat | `downbeat` | — |
| 34 | vygrcruises.com | VYGR Cruises | `vyg` | — |
| 35 | spottedzebra.party | Spotted Zebra | `zebra` | — |
| 36 | spencertownley.com | Personal site |  | — |
| 37 | makemorepaperclips.com | MORE. | `more` | — |
| 38 | townleyphotography.com | Townley Photography | `photo` | — |
| 39 | makethat.wtf | Unmatched |  | Linked from your site; no repo found |

## 7. New project ideas (parking lot)

| Idea | Detail |
|---|---|
| PhotoVerify | Location-verified photo web app (May session, no repo) |
| Pixel-art web games | Research session from March with game concepts |
| Points Pool | Linked from your site at points-pool-production.up.railway.app; no repo found |
| Cruise data hub | Combine VYGR fares, Cruise News and Earshot listening into one cruise product |
| Project status widget | Embed live status from this dashboard on spencertownley.com |

## 8. Housekeeping items

All seeded with decision `pending`.

| Group | Item | Detail |
|---|---|---|
| `archive` (Archive or merge) | timeline_web_app.py | Untouched template; Chronologue covers it. Archive. |
| `archive` (Archive or merge) | Database repo | Holds 5 unrelated branches. Split Strata and Split the G into their own repos, then archive. |
| `archive` (Archive or merge) | AI_news_site | Empty. Delete, or fork the Cruise News pipeline into it. |
| `archive` (Archive or merge) | PromoVault | Superseded. Keep archived. |
| `overlap` (Overlaps to decide) | TaskParty and Strata | Both are work-management platforms. Pick one to carry forward. |
| `overlap` (Overlaps to decide) | Three Townley sites | Personal, Photography and Creative overlap. Decide what Creative is for. |
| `overlap` (Overlaps to decide) | Two timeline apps | Fold the Streamlit app into Chronologue. |
| `overlap` (Overlaps to decide) | Social listening twice | Cruise News Social Pulse stopped on 6 Oct; feed it from Earshot. |
| `docs` (Docs coverage) | Full suite | TaskParty, NimbusWatch, Chronologue, Strata |
| `docs` (Docs coverage) | Partial | Smoosh, JIMOTHY, Mentionful, Earshot, Quiz Platform |
| `docs` (Docs coverage) | README only | FrameVote, Downbeat, Book Builder, MORE., Cruise News, all content sites |
| `docs` (Docs coverage) | Suggestion | Generate a one-page PRD and CLAUDE.md for each README-only project |

## 9. Planner queue

Seeded `queue_position` 1 to 19 in this order; ETAs at 12 h/week are in document 11, section 7.

1. Spotted Zebra, 2. Amanda Williams Portfolio, 3. FrameVote, 4. Townley Photography, 5. spencertownley.com, 6. Chronologue, 7. Quiz Platform, 8. Book Builder, 9. NimbusWatch, 10. Cruise News You Can Use, 11. Smoosh, 12. Downbeat, 13. Mentionful, 14. Earshot, 15. TaskParty, 16. JIMOTHY: A Seattle Story, 17. VYGR Cruises, 18. Strata, 19. MORE.

Not queued: NestCraft, Split the G, Townley Creative, Mariners Prediction Hub, timeline_web_app.py, AI News Site, PromoVault.

## 10. Data quality notes

- NestCraft is a private repository the audit session could not open: no estimates, steps or architecture. Grant the GitHub token read access, then assess it.
- Split the G and PromoVault have no estimates; timeline_web_app.py has no hours. All three have a null finish score and appear in no lane.
- Strata, Split the G and PromoVault live on branches or history of the unrelated `Database` repo (housekeeping item "Database repo").
- AI News Site has pct 0, so its score is null even though hours and value are set.
- Townley Photography's host is unconfirmed (Cloudflare Pages or GitHub Pages); its host tags carry a "?".
- The "Make Me A Timeline" Supabase project is attributed to Chronologue with a "?"; the label stays unlinked.
- `makethat.wtf` and the Points Pool Railway URL are linked from the personal site but match no repository.
- Step hours do not always sum to hours left (for example Strata: 77 h of steps against 90 h left; MORE.: 201 h against 200 h). Hours left is the owner estimate; steps adjust it only when ticked.
- Last push dates are as audited and are overwritten by the first GitHub sync for every project with a `github_repo`.
