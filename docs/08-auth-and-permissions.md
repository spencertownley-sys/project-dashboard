# 08. Authentication and Permissions

Version 1.0, 10 Nov 2026. Owner: Engineering.

## 1. Summary

The app has exactly one permission: "is the owner". The owner is any Clerk user whose primary email address is listed in `OWNER_EMAILS`. Everyone else, signed in or not, sees no data. There are no roles, invitations, guests or share links (the mockup's optional read-only share link is dropped; decision). Two machine endpoints sit outside Clerk: `/api/health` (public, no data) and `/api/cron/sync` (bearer secret).

## 2. Auth modes

`lib/auth.ts getAuthMode()` decides the mode once per request from environment variables.

| Mode | Condition | Behavior |
|---|---|---|
| `clerk` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` both set | Clerk sign-in required; owner allow-list enforced |
| `open` | Either key missing, and (`NODE_ENV !== 'production'` or `ALLOW_NO_AUTH === '1'`) | No sign-in. Every request is treated as the owner. Top bar shows an "Auth disabled" pill in the stall color. |
| `locked` | Either key missing, `NODE_ENV === 'production'`, `ALLOW_NO_AUTH !== '1'` | Fail closed: every app route renders the setup page; every server action returns `UNAUTHORIZED` |

Notes:
- Only the exact string `1` enables `ALLOW_NO_AUTH`. `true`, `yes` and empty do not (decision).
- `next build` and `next start` set `NODE_ENV=production`, so a local production build without keys is `locked` unless `ALLOW_NO_AUTH=1`. The Playwright smoke spec runs against `next dev` (open mode) for that reason.
- A half-configured Clerk (one key only) is treated as missing keys.

## 3. Owner check

```ts
type OwnerResult =
  | { ok: true; mode: 'clerk' | 'open'; email: string | null }
  | { ok: false; reason: 'signed_out' | 'not_authorized' | 'setup_required'; email?: string };
```

`getOwner()`:
1. Mode `locked`: return `setup_required`.
2. Mode `open`: return `{ ok: true, mode: 'open', email: null }`.
3. Mode `clerk`: `await auth()`; no `userId` means `signed_out`. Otherwise `await currentUser()` and read `primaryEmailAddress?.emailAddress`.
4. Parse `OWNER_EMAILS`: split on commas, trim, lowercase, drop empties. An empty list authorizes nobody (fail closed).
5. If the lowercased primary email is in the list, return ok; else `not_authorized` with the email.

Only the primary email counts, not secondary addresses (spec). `requireOwner()` wraps `getOwner()` and throws an `UnauthorizedError` that server actions convert to `{ ok: false, code: 'UNAUTHORIZED' }`.

`getOwner()` is wrapped in React `cache()` so the layout and page share one Clerk lookup per request.

## 4. Clerk configuration

### 4.1 Clerk dashboard

- One application, "Project Control Room".
- Sign-in methods: email code and Google (owner's choice; either works because only the primary email matters).
- Sign-ups: restricted (no public sign-up). The owner's account is created in the dashboard or by allow-listing their email.
- Development instance keys on the `*.vercel.app` URL are acceptable for Phases 1 and 2. Move to a production instance when a custom domain is chosen (open question, document 02).
- No organizations, no webhooks.

### 4.2 Next.js integration

- `app/layout.tsx` wraps children in `<ClerkProvider>` only in `clerk` mode, so the app renders with no keys.
- `app/sign-in/[[...sign-in]]/page.tsx` renders `<SignIn />` centered on the `--bg` background, appearance variables mapped to tokens (`colorPrimary: var(--accent)`, `fontFamily: var(--f-ui)`, `borderRadius: 10px`). In non-clerk modes it redirects to `/`.
- Sign-in URL passed in code (`signInUrl="/sign-in"` on the provider and middleware); no extra env var (decision).
- There is no `/sign-up` route.

### 4.3 proxy.ts

Next.js 16 renames middleware to `proxy.ts` at the project root.

```ts
// proxy.ts (shape, not final code)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublic = createRouteMatcher(['/sign-in(.*)', '/api/health', '/api/cron/(.*)']);
const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

export default hasClerk
  ? clerkMiddleware(async (auth, req) => { if (!isPublic(req)) await auth.protect(); })
  : () => NextResponse.next();

export const config = {
  matcher: ['/((?!_next|.*\\.(?:css|js|png|jpg|svg|ico|woff2?|txt)$).*)', '/(api)(.*)'],
};
```

The proxy only guarantees a Clerk session. The owner allow-list is checked in the `(app)` layout and in every server action, because the primary email is not in the session token by default and the proxy must stay fast.

## 5. What each visitor sees

| Visitor | Mode | App routes | Server actions | `/api/health` | `/api/cron/sync` |
|---|---|---|---|---|---|
| Owner, signed in | clerk | Full app | Allowed | 200 | Needs bearer |
| Other Clerk user | clerk | Not-authorized page | `UNAUTHORIZED` | 200 | Needs bearer |
| Signed out | clerk | Redirect to `/sign-in` | `UNAUTHORIZED` | 200 | Needs bearer |
| Anyone | open | Full app, "Auth disabled" pill | Allowed | 200 | Needs bearer |
| Anyone | locked | Setup page | `UNAUTHORIZED` | 200 | Needs bearer |
| Vercel Cron | any | n/a | n/a | n/a | 200 with valid bearer |

### 5.1 Not-authorized page

Rendered in place by `app/(app)/layout.tsx` (no separate route; decision). Content: the brand mark, heading "Not authorized", text "You are signed in as {email}. This dashboard is private to its owner. If this is your dashboard, add this address to OWNER_EMAILS and redeploy.", and a "Sign out" button (`<SignOutButton>`). Response status 403 is not possible from a layout, so the page renders with 200 and `noindex`.

### 5.2 Setup page

Rendered in place in `locked` mode. Heading "Setup required". Lists which of `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `OWNER_EMAILS` are missing (names only, never values), and explains `ALLOW_NO_AUTH=1` as a deliberate opt-out. No data is queried.

## 6. Cron authentication

- Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when the `CRON_SECRET` env var is set on the project.
- The route compares with `crypto.timingSafeEqual` on equal-length buffers (length mismatch returns 401 without comparing).
- `CRON_SECRET` unset returns 503, never runs (fail closed; decision).
- The secret is at least 32 random characters; rotate by changing the env var and redeploying.

## 7. Secrets handling

| Secret | Read by | Exposure rule |
|---|---|---|
| `CLERK_SECRET_KEY` | Clerk SDK, server | Never logged |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser and server | Public by design |
| `OWNER_EMAILS` | `lib/auth.ts` | Never rendered except the current user's own email on the not-authorized page |
| `CRON_SECRET` | Cron route | Never logged |
| `GITHUB_TOKEN`, `VERCEL_TOKEN`, `SUPABASE_ACCESS_TOKEN` | `lib/sync/*` (server-only modules) | Never logged; error messages from providers are stored with any `Bearer` text stripped |
| `DATABASE_URL` | `lib/db/client.ts` | Never logged |

Token scopes (least privilege): GitHub fine-grained token with read-only Metadata, Pull requests, Checks (or Commit statuses) on the owner's repositories; Vercel token scoped to the team; Supabase personal access token (read use only by this app).

## 8. Threat model

| Threat | Control |
|---|---|
| Stranger finds the URL | Clerk sign-in, sign-ups restricted, allow-list |
| Someone creates a Clerk account anyway | Allow-list check in layout and every action |
| Direct POST to a server action | `requireOwner()` inside the action, not only in the page |
| Misconfigured production (keys missing) | `locked` mode, fail closed |
| Cron endpoint abuse | Bearer secret, constant-time compare; a run is read-only against providers |
| Token leakage through errors | Error text sanitized before storing in `sync_runs` |
| XSS from seeded or synced text | React escaping; URLs rendered as links only when they parse as `http(s)` |
| CSRF | Server actions are POST with Next.js origin checks; no GET mutations |

## 9. Sessions

Clerk defaults: session lifetime per Clerk settings, multi-session off. Sign out from the user button in the top bar (`<UserButton>` in `clerk` mode).
