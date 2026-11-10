import { redirect } from "next/navigation";
import { authMode } from "@/lib/auth-core";

export const dynamic = "force-dynamic";
export const metadata = { title: "Not authorized" };

export default async function NotAuthorized() {
  if (authMode() !== "clerk") redirect("/");
  const { SignOutButton } = await import("@clerk/nextjs");
  return (
    <main className="center gut">
      <div className="panel">
        <h1>This dashboard is private</h1>
        <p className="muted">You are signed in with an account that isn’t on the owner list. Sign out and use the owner account.</p>
        <p className="muted" style={{ fontSize: 12.5 }}>Owner: add your email to OWNER_EMAILS in the deployment settings.</p>
        <div>
          <SignOutButton>
            <button className="btn">Sign out</button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}
