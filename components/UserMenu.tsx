import { authMode } from "@/lib/auth-core";

export async function UserMenu() {
  const mode = authMode();
  if (mode !== "clerk") {
    return <span className="sync mono">{mode === "open" ? "local mode · no sign-in" : ""}</span>;
  }
  const { UserButton } = await import("@clerk/nextjs");
  return <UserButton />;
}
