# Project Control Room

A private dashboard for every AI project: status, completion, hours left, where it's hosted, which Claude sessions built it, next steps, ideas, risks, and what to work on next.

The approved layout is in `mockup/index.html`. The full document suite is in [`docs/`](docs/README.md).

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

No setup is needed for local use. Without `DATABASE_URL`, the app uses a PGlite database in `.data/pglite`. The first request loads the audited inventory from `data/inventory.json`. Without Clerk keys, sign-in is off in development.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Unit and database tests (Vitest, in-memory PGlite) |
| `npm run test:e2e` | Builds the app and runs the Playwright smoke tests on a fresh database |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:generate` | Generate a migration after changing `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations (Postgres when `DATABASE_URL` is set) |
| `npm run db:seed` | Load the inventory if the database is empty |
| `npm run sync` | Pull GitHub, Vercel and Supabase signals once, from the command line |

## Deploy

See [HANDOFF.md](HANDOFF.md) for the step-by-step Vercel setup (database, Clerk, cron, tokens).

## Stack

Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript, Tailwind 4 with design tokens, Drizzle ORM on Postgres (Neon in production, PGlite locally), Clerk for owner-only sign-in, and Vercel with a daily cron for live sync.
