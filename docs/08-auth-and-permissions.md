# 08. Authentication and Permissions

Version 1.0, 10 Nov 2026. Owner: Engineering.

## 1. Summary

The app has one permission: "is the owner". The owner is any Clerk user with an email address listed in `OWNER_EMAILS`. Everyone else, signed in or not, sees no data. There are no roles, invitations, guests or share links (the mockup's optional read-only share link is dropped; decision). Two machine endpoints sit outside Clerk: `/api/health` (public, no data) and `/api/cron/sync` (bearer secret).

## 2. Auth modes

`authMode()` in `lib/auth-core.ts` (pure, shared by the proxy, layouts and tests):

| Mode | Condition | Behavior |
|---|---|---|
| `clerk` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` both set | Clerk sign-in required; owner allow-list enforced |
| `open` | Either key missing, and (`NODE_ENV !== 'production'` or `ALLOW_NO_AUTH === '1'`) | No sign-in; every request is the owner. The top bar shows "local mode · no sign-in". |
| `closed` | Either key missing, `NODE_ENV === 'production'`, `ALLOW_NO_AUTH !== '1'` | Fail closed: the proxy rewrites every non-public route to `/setup` (503); `requireOwner()` redirects to `/setup` |

Notes:
- Only the exact string `1` enables `ALLOW_NO_AUTH`.
- `next build && next start` runs with `NODE_ENV=production`, so the Playwright smoke run sets `ALLOW_NO_AUTH=1` (document 15).
- One key without the other counts as no keys.

## 3. Owner check

```ts
// lib/auth-core.ts
ownerEmails(env)            // OWNER_EMAILS split on commas, trimmed, lowercased, empties dropped
isOwnerEmail(emails, list)  // false when the list is empty (fail closed); else any email in the list

// lib/auth.ts (server-only)
async function requireOwner(): Promise<{ mode; email: string | null }> {
  // open   -> { mode, email: null }
  // closed -> redirect('/setup')
  // clerk  -> currentUser(); none -> redirect('/sign-in')
  //           not isOwnerEmail(user.emailAddresses) -> redirect('/not-authorized')
  //           else { mode, email: primary email }
}
```

Every page calls it twice in practice (the `(app)` layout and `load()` in the page) and every server action calls it first. It is the only gate the data depends on; the proxy is a convenience that sends signed-out visitors to sign-in early.

**Deviation to resolve.** The specification says the user's *primary* email must be in `OWNER_EMAILS`. The built check accepts the user if *any* of their Clerk email addresses is listed. With sign-ups restricted (section 4.1) the practical difference is small, but a verified secondary address on another account would pass. Either change `requireOwner()` to compare only `user.primaryEmailAddress` or accept this as a decision (document 02, section 9.2).

## 4. Clerk configuration

### 4.1 Clerk dashboard

- A dedicated application for this dashboard, separate from the shared development instance the owner's other apps use.
- Sign-in methods: email code and Google (either works; only the email matters).
- Sign-ups: restricted; the owner's account is the only one.
- Development instance keys work on the `*.vercel.app` URL; move to a production instance when a custom domain is chosen (open question, document 02).
- No organizations, no webhooks.

### 4.2 Next.js integration

- `app/layout.tsx` wraps the document in `<ClerkProvider>` only in `clerk` mode, imported dynamically, so the app renders with no keys and no Clerk bundle.
- `/sign-in` renders `<SignIn />`; in other modes it redirects to `/`. There is no `/sign-up` route.
- The top bar shows `<UserButton />` in `clerk` mode.

### 4.3 proxy.ts

```ts
const isPublic = createRouteMatcher(['/sign-in(.*)', '/setup', '/api/health', '/api/cron/(.*)']);
const mode = authMode();
const clerk = mode === 'clerk'
  ? clerkMiddleware(async (auth, req) => { if (!isPublic(req)) await auth.protect(); })
  : null;

export default function proxy(req, ev) {
  if (clerk) return clerk(req, ev);
  if (mode === 'closed' && !isPublic(req)) return NextResponse.rewrite(new URL('/setup', req.url), { status: 503 });
  return NextResponse.next();
}
// matcher: everything except _next and static files, plus /(api|trpc)(.*) and /__clerk/(.*)
```

## 5. What each visitor sees

| Visitor | Mode | App routes | Server actions | `/api/health` | `/api/cron/sync` |
|---|---|---|---|---|---|
| Owner, signed in | clerk | Full app | Allowed | 200 | Needs bearer |
| Other Clerk user | clerk | Redirect to `/not-authorized` | Redirect | 200 | Needs bearer |
| Signed out | clerk | Redirect to `/sign-in` | Redirect | 200 | Needs bearer |
| Anyone | open | Full app, "local mode · no sign-in" | Allowed | 200 | Needs bearer |
| Anyone | closed | `/setup` (503) | Redirect to `/setup` | 200 | Needs bearer |
| Vercel Cron | any | n/a | n/a | n/a | 200 or 207 with a valid bearer |

### 5.1 Not authorized (`/not-authorized`)

Heading "This dashboard is private". Text: "You are signed in with an account that isn't on the owner list. Sign out and use the owner account." and "Owner: add your email to OWNER_EMAILS in the deployment settings." A "Sign out" button (`<SignOutButton>`). No project data is loaded.

### 5.2 Setup (`/setup`)

Heading "Sign-in isn't set up yet". Explains that the deployment has no Clerk keys and stays locked, and names the variables to add (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `OWNER_EMAILS`), then redeploy. Names only, never values. No data is queried.

## 6. Cron authentication

- Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when `CRON_SECRET` is set on the project.
- The route builds `Bearer ${secret}` and compares with `crypto.timingSafeEqual` after an equal-length check.
- `CRON_SECRET` unset means every call is 401 (fail closed).
- Use at least 32 random characters (`openssl rand -hex 32`); rotate by changing the env var and redeploying.

## 7. Secrets handling

| Secret | Read by | Exposure rule |
|---|---|---|
| `CLERK_SECRET_KEY` | Clerk SDK, server | Never logged |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser and server | Public by design |
| `OWNER_EMAILS` | `lib/auth-core.ts` | Never rendered |
| `CRON_SECRET` | Cron route | Never logged |
| `GITHUB_TOKEN`, `VERCEL_TOKEN`, `SUPABASE_ACCESS_TOKEN` | `runSync` (passed into adapters) | Never logged or stored; adapter errors record only `HTTP {status} from {host}{path}` |
| `DATABASE_URL` | `lib/db/index.ts` | Never logged |

Token scopes (least privilege): GitHub fine-grained token with read-only Metadata, Pull requests, Checks and Contents on the owner's repositories; Vercel account token (team scope via `VERCEL_TEAM_ID`); Supabase personal access token, used read-only.

## 8. Threat model

| Threat | Control |
|---|---|
| Stranger finds the URL | Clerk sign-in, sign-ups restricted, allow-list; `noindex` headers |
| Someone has a Clerk account anyway | Allow-list check in the layout, every page and every action |
| Direct POST to a server action | `requireOwner()` inside the action |
| Misconfigured production (keys missing) | `closed` mode, fail closed |
| Cron endpoint abuse | Bearer secret, constant-time compare; a run only reads providers |
| Token leakage through errors | Error text carries status and URL path only |
| XSS from seeded or synced text | React escaping; URLs become links only when they contain no spaces or "(" |
| Clickjacking | `X-Frame-Options: DENY` |
| CSRF | Server actions are POST with Next.js origin checks; no GET mutations |

## 9. Sessions

Clerk defaults for session lifetime. Sign out from `<UserButton />`.
