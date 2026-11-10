import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { authMode } from "./lib/auth-core";

const isPublic = createRouteMatcher(["/sign-in(.*)", "/setup", "/api/health", "/api/cron/(.*)"]);
const mode = authMode();

const clerk =
  mode === "clerk"
    ? clerkMiddleware(async (auth, req) => {
        if (!isPublic(req)) await auth.protect();
      })
    : null;

export default function proxy(req: NextRequest, ev: NextFetchEvent) {
  if (clerk) return clerk(req, ev);
  if (mode === "closed" && !isPublic(req)) {
    return NextResponse.rewrite(new URL("/setup", req.url), { status: 503 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest)).*)", "/(api|trpc)(.*)", "/__clerk/(.*)"],
};
