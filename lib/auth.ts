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
  // Only the verified primary address counts, so a secondary address added to another account can't pass.
  const primary = user.primaryEmailAddress;
  const verified = primary?.verification?.status === "verified";
  if (!primary || !verified || !isOwnerEmail([primary.emailAddress], ownerEmails())) redirect("/not-authorized");
  return { mode, email: primary.emailAddress };
}
