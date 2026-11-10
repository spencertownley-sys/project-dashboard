# CLAUDE.md

Rules for agents working in this repo. Read `HANDOFF.md` first for the current state, and `docs/16-build-guide.md` for the build order.

## This is Next.js 16
APIs differ from older versions. Before writing framework code, read the matching guide in `node_modules/next/dist/docs/`. Key differences used here:
- Middleware is `proxy.ts`. It runs on Node.js by default.
- `params` and `searchParams` are Promises. Use the generated `PageProps<"/route">` type (`next typegen` runs inside `npm run typecheck`).
- Turbopack is the default for `dev` and `build`.

## Architecture in one breath
Server components read through `lib/queries.ts`. Every page calls `load()` from `lib/page.ts`, which runs the owner check and opens the database. Writes go through server actions in `app/actions.ts`. Each action calls `requireOwner()` first, validates with zod, and ends with `revalidatePath`. The scoring, lanes, planner and summary logic in `lib/metrics.ts` is pure and unit-tested. Sync adapters in `lib/sync/` take an injectable `fetch`, are skipped when their token is missing, and write to `signals`.

## Rules
- Never skip `requireOwner()` in a page or action. The app fails closed in production without Clerk keys.
- Change the schema only in `lib/db/schema.ts`, then `npm run db:generate`. Never edit generated SQL in `drizzle/` by hand.
- `data/inventory.json` is seed data for an empty database only. Once a database has rows, edits happen in the app.
- Colors come from the tokens in `app/globals.css` (light and dark). Don't write raw colors in components.
- Keep `lib/metrics.ts` free of I/O so it stays easy to test.
- Before you push, run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:e2e` when UI or actions changed.
- Don't put secrets, tokens or personal email addresses in code, seeds or docs.
