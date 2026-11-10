import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { runSync } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(header: string | null, secret: string | undefined) {
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Called daily by Vercel Cron with "Authorization: Bearer $CRON_SECRET". */
export async function GET(req: Request) {
  if (!authorized(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const res = await runSync(db);
  return Response.json(res, { status: res.ok ? 200 : 207 });
}
