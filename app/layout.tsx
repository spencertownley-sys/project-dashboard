import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { authMode } from "@/lib/auth-core";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Project Control Room", template: "%s · Project Control Room" },
  description: "Every AI project in one place: status, hosting, next steps and what to work on next.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const body = (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
  if (authMode() !== "clerk") return body;
  const { ClerkProvider } = await import("@clerk/nextjs");
  return <ClerkProvider>{body}</ClerkProvider>;
}
