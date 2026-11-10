import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { seed, seedIfEmpty } from "@/lib/db/seed";
import { firstOpenSteps, getProject, listAlerts, listComponents, listProjects } from "@/lib/queries";
import { runSync } from "@/lib/sync";

let db: Db;

beforeAll(async () => {
  db = await createDb({ pgliteDir: "memory", url: "" });
  await seed(db);
});

describe("seed", () => {
  it("loads every audited project with steps, sessions and infrastructure", async () => {
    const projects = await listProjects(db);
    expect(projects).toHaveLength(26);
    const tp = await getProject(db, "taskparty");
    expect(tp?.project.githubRepo).toBe("spencertownley-sys/ProjectManager");
    expect(tp?.project.vercelProject).toBe("taskparty");
    expect(tp?.steps.length).toBeGreaterThan(0);
    expect(tp?.sessions.map((x) => x.title)).toContain("TaskParty views implementation");
    expect((await listComponents(db)).length).toBeGreaterThan(30);
  });
  it("is idempotent", async () => {
    expect(await seedIfEmpty(db)).toBe(false);
    expect(await listProjects(db)).toHaveLength(26);
  });
  it("links branch-hosted projects to their real repo", async () => {
    const strata = await getProject(db, "strata");
    expect(strata?.project.githubRepo).toBe("spencertownley-sys/Database");
    const pv = await getProject(db, "promovault");
    expect(pv?.project.githubRepo).toBeNull();
  });
});

describe("queries", () => {
  it("returns the first open step per project", async () => {
    const map = await firstOpenSteps(db);
    expect(map.get("quiz")).toBe("Point the Railway web service at main");
  });
  it("lists the needs-you notes", async () => {
    const alerts = await listAlerts(db);
    expect(alerts.some((a) => a.projectId === "quiz" && a.kind === "needs")).toBe(true);
  });
});

describe("sync", () => {
  it("skips sources without tokens and records the run", async () => {
    const res = await runSync(db, {}, (() => {
      throw new Error("should not fetch");
    }) as unknown as typeof fetch);
    expect(res.ok).toBe(true);
    expect(res.summary.github.status).toBe("skipped");
    const [run] = await db.select().from(s.syncRuns).where(eq(s.syncRuns.id, res.id));
    expect(run.finishedAt).not.toBeNull();
  });

  it("stores GitHub, Vercel and Supabase signals and updates the last push", async () => {
    const fake = (async (input: string | URL | Request) => {
      const url = String(input);
      const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
      if (url.includes("api.github.com")) {
        if (url.endsWith("/repos/spencertownley-sys/ProjectManager"))
          return json({ pushed_at: "2026-11-09T10:00:00Z", archived: false, default_branch: "main", html_url: "https://github.com/x", private: false });
        if (url.includes("/repos/spencertownley-sys/ProjectManager/pulls")) return json([{}, {}]);
        if (url.includes("/repos/spencertownley-sys/ProjectManager/commits/main/check-runs"))
          return json({ total_count: 1, check_runs: [{ status: "completed", conclusion: "failure" }] });
        return json({ message: "Not Found" }, 404);
      }
      if (url.includes("api.vercel.com/v9/projects/taskparty")) return json({ id: "prj_1", name: "taskparty", framework: "nextjs" });
      if (url.includes("api.vercel.com/v6/deployments"))
        return json({ deployments: [{ uid: "d1", url: "x.vercel.app", state: "READY", created: Date.now(), target: "production" }] });
      if (url.includes("api.supabase.com/v1/projects"))
        return json([
          { ref: "tpjmtxhgmcoxzuweenow", name: "TaskParty", region: "us-west-1", status: "ACTIVE_HEALTHY" },
          { ref: "bvazkrbjucxwfazodlhg", name: "Make Me A Timeline", region: "us-east-1", status: "INACTIVE" },
        ]);
      return json({}, 500);
    }) as typeof fetch;

    const res = await runSync(db, { GITHUB_TOKEN: "t", VERCEL_TOKEN: "t", SUPABASE_ACCESS_TOKEN: "t" }, fake);
    expect(res.summary.vercel.status).toBe("ok");
    expect(res.summary.supabase.status).toBe("ok");
    const tp = await getProject(db, "taskparty");
    expect(tp?.project.lastPush).toBe("2026-11-09");
    const v = (k: string, src = "github") => tp?.signals.find((x) => x.source === src && x.key === k)?.value;
    expect(v("open_prs")).toBe(2);
    expect(v("ci")).toMatchObject({ conclusion: "failure" });
    expect(v("deployment", "vercel")).toMatchObject({ state: "READY" });
    const alerts = await listAlerts(db);
    expect(alerts.some((a) => a.projectId === "taskparty" && a.kind === "ci")).toBe(true);
    expect(alerts.some((a) => a.projectId === "chrono" && a.kind === "database")).toBe(true);
    expect(alerts.some((a) => a.projectId === "framevote" && a.kind === "repo")).toBe(true);

    // A second run updates signals in place rather than duplicating them.
    await runSync(db, { GITHUB_TOKEN: "t" }, fake);
    const rows = await db.select().from(s.signals).where(eq(s.signals.projectId, "taskparty"));
    expect(rows.filter((r) => r.key === "ci")).toHaveLength(1);
  });
});
