import { eq, sql } from "drizzle-orm";
import type { Db } from "../db";
import * as s from "../db/schema";
import { setSetting } from "../queries";
import { syncGithub } from "./github";
import { syncSupabase } from "./supabase";
import { type AdapterResult, type Fetch } from "./types";
import { syncVercel } from "./vercel";

type Env = Record<string, string | undefined>;

/** Pull fresh signals from every source that has a token, store them, and record the run. */
export async function runSync(db: Db, env: Env = process.env, fetchImpl: Fetch = fetch) {
  const [run] = await db.insert(s.syncRuns).values({}).returning({ id: s.syncRuns.id });
  const targets = await db
    .select({ id: s.projects.id, githubRepo: s.projects.githubRepo, vercelProject: s.projects.vercelProject, supabaseRef: s.projects.supabaseRef })
    .from(s.projects);

  const sources: [keyof s.SyncSummary & string, string | undefined, () => Promise<AdapterResult>][] = [
    ["github", env.GITHUB_TOKEN, () => syncGithub(targets, env.GITHUB_TOKEN!, fetchImpl)],
    ["vercel", env.VERCEL_TOKEN, () => syncVercel(targets, env.VERCEL_TOKEN!, env.VERCEL_TEAM_ID || undefined, fetchImpl)],
    ["supabase", env.SUPABASE_ACCESS_TOKEN, () => syncSupabase(targets, env.SUPABASE_ACCESS_TOKEN!, fetchImpl)],
  ];

  const summary: s.SyncSummary = {};
  for (const [name, token, fn] of sources) {
    if (!token) {
      summary[name] = { status: "skipped", updated: 0, message: "No token set" };
      continue;
    }
    try {
      const res = await fn();
      await store(db, res);
      summary[name] = {
        status: res.errors.length ? "error" : "ok",
        updated: res.signals.length,
        ...(res.errors.length ? { message: res.errors.slice(0, 5).join("; ") } : {}),
      };
    } catch (e) {
      summary[name] = { status: "error", updated: 0, message: (e as Error).message };
    }
  }

  const ok = Object.values(summary).every((v) => v.status !== "error");
  await db.update(s.syncRuns).set({ finishedAt: new Date(), ok, summary }).where(eq(s.syncRuns.id, run.id));
  return { id: run.id, ok, summary };
}

async function store(db: Db, res: AdapterResult) {
  for (const sig of res.signals) {
    await db
      .insert(s.signals)
      .values({ ...sig, observedAt: new Date() })
      .onConflictDoUpdate({
        target: [s.signals.projectId, s.signals.source, s.signals.key],
        set: { value: sql`excluded.value`, observedAt: sql`excluded.observed_at` },
      });
  }
  for (const [id, date] of res.lastPush ?? []) {
    await db.update(s.projects).set({ lastPush: date }).where(eq(s.projects.id, id));
  }
  for (const [key, value] of Object.entries(res.settings ?? {})) await setSetting(db, key, value);
}
