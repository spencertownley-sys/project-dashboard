export type AuthMode = "clerk" | "open" | "closed";
/** clerk: keys present. open: no keys, local dev or ALLOW_NO_AUTH=1. closed: production without keys (fail closed). */
export function authMode(env: NodeJS.ProcessEnv = process.env): AuthMode {
  if (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY) return "clerk";
  if (env.NODE_ENV !== "production" || env.ALLOW_NO_AUTH === "1") return "open";
  return "closed";
}

export function ownerEmails(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerEmail(emails: string[], allowed: string[]) {
  if (!allowed.length) return false;
  return emails.some((e) => allowed.includes(e.toLowerCase()));
}
