# Handoff

**State on 10 Nov 2026:** Phase 1 (dashboard) and Phase 2 (live sync for GitHub, Vercel and Supabase) are built and tested. The app isn't deployed yet. Phase 3 (AI review, Railway and Cloudflare sync) is not started.

## What works

- **Overview:** summary tiles, three focus lanes ranked by finish score, a "Needs you" list, and Sync now.
- **Projects:** a table with filters, search and sorting. Each project has a detail page showing where it lives, live signals, Claude sessions, architecture, docs coverage, next steps, ideas and risks, plus an edit form.
- **Next steps:** ticking a step subtracts its hours from the project's hours left. Unticking adds them back.
- **Infrastructure:** every Worker, database, service and domain, with the Supabase free-plan capacity.
- **Planner:** set hours per week, reorder the queue, and see an ETA per project and a timeline. The order is saved.
- **Ideas:** feature ideas grouped by project value, plus a parking lot for new project ideas (add, star, delete).
- **Housekeeping:** record Approve or Skip on archive, overlap and docs-coverage items.
- **Sync:** runs from the Sync now button, from `npm run sync`, or daily through Vercel Cron (`23 13 * * *` UTC, about 6:23 am Pacific). It stores open PRs, CI on the default branch, last push, the latest Vercel production deploy and Supabase project status. CI failures, failed deploys and paused databases show up under Needs you.
- **Auth:** Clerk, owner-only through `OWNER_EMAILS`. Production without Clerk keys shows a locked setup page.
- **Tests:** 21 unit and database tests (Vitest on PGlite) and 9 Playwright smoke tests (desktop and phone). CI runs lint, typecheck, unit tests and e2e on every PR.

## Deploy to Vercel (about 15 minutes)

1. In Vercel, choose **Add New → Project** and import `spencertownley-sys/project-dashboard`. The build command comes from `vercel.json`: it migrates, seeds an empty database, then builds.
2. In **Storage**, add **Neon Postgres** from the Marketplace and connect it to the project. That sets `DATABASE_URL`. Your Supabase free plan is full (2 of 2 active), which is why this uses Neon.
3. In Clerk, create a new application for this dashboard, kept separate from the shared dev instance the other apps use. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to Vercel. Set `OWNER_EMAILS` to the email you sign in with.
4. Set `CRON_SECRET` to a random string, for example the output of `openssl rand -hex 32`.
5. Add the sync tokens you want. A missing token just skips that source.
   - `GITHUB_TOKEN`: a fine-grained token with read access to Metadata, Pull requests, Checks and Contents on your repos.
   - `VERCEL_TOKEN`: an account token. Add `VERCEL_TEAM_ID` if your projects are under a team.
   - `SUPABASE_ACCESS_TOKEN`: a personal access token from the Supabase dashboard.
6. Deploy, sign in, and press **Sync now** on the Overview.

## Known gaps

- Completion %, hours and value scores are first-pass estimates from the 10 Nov audit. Correct them on each project page.
- NestCraft and promo-offer-studio are private repos the audit couldn't open, so they aren't assessed.
- claude.ai chat Projects can't be read automatically. Paste each one's link into the project's edit form. Claude Code sessions are already linked by title.
- There's no Railway or Cloudflare sync yet. Those rows on Infrastructure come from the audit.

## Next (Phase 3)

See `docs/04-roadmap-and-release-plan.md` and the unchecked steps in `docs/16-build-guide.md`:
1. A weekly Claude review that proposes updated %, next steps and risks for you to accept, and drafts a Monday plan.
2. Railway GraphQL and Cloudflare API adapters, each needing a token.
3. A "Now building" feed for spencertownley.com.
