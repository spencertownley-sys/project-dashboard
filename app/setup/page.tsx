export const metadata = { title: "Finish setup" };

export default function Setup() {
  return (
    <main className="center gut">
      <div className="panel">
        <h1>Sign-in isn’t set up yet</h1>
        <p className="muted">
          This deployment has no Clerk keys, so it stays locked. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY and OWNER_EMAILS in the project’s
          environment variables, then redeploy.
        </p>
      </div>
    </main>
  );
}
