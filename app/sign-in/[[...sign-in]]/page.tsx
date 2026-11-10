import { redirect } from "next/navigation";
import { authMode } from "@/lib/auth-core";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (authMode() !== "clerk") redirect("/");
  const { SignIn } = await import("@clerk/nextjs");
  return (
    <main className="center gut">
      <SignIn />
    </main>
  );
}
