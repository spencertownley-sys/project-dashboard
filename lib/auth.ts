import "server-only";
import { redirect } from "next/navigation";
import { authMode, isOwnerEmail, ownerEmails, type AuthMode } from "./auth-core";

export { authMode, isOwnerEmail, ownerEmails, type AuthMode };

export type Viewer = { mode: AuthMode; email: string | null };

/** Call at the top of every page and server action. Redirects anyone who isn't the owner. */
export async function requireOwner(): Promise<Viewer> {
  const mode = authMode();
  if (mode === "open") return { mode, email: null };
  if (mode === "closed") redirect("/setup");
  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const emails = user.emailAddresses.map((e) => e.emailAddress);
  if (!isOwnerEmail(emails, ownerEmails())) redirect("/not-authorized");
  return { mode, email: user.primaryEmailAddress?.emailAddress ?? emails[0] ?? null };
}
