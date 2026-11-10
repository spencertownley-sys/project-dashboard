import { count } from "drizzle-orm";
import inventory from "@/data/inventory.json";
import type { Db } from "./index";
import * as s from "./schema";

type InvProject = {
  id: string;
  name: string;
  repo: string;
  cat: string;
  status: s.Status;
  pct: number | null;
  hrs: number | null;
  value: number | null;
  last: string;
  sum: string;
  urls: string[];
  sessions: string[];
  arch: s.Arch | null;
  hostTags: string[];
  docs: s.DocFlags | null;
  docNote?: string;
  next: [string, number][];
  ideas: string[];
  risks: string[];
  needs?: string;
};

const OWNER = "spencertownley-sys";
/** Links between seed projects and the hosted resources the sync jobs read. */
const RESOURCE_LINKS: Record<string, { vercelProject?: string; supabaseRef?: string; githubRepo?: string | null }> = {
  taskparty: { vercelProject: "taskparty", supabaseRef: "tpjmtxhgmcoxzuweenow" },
  nimbus: { supabaseRef: "etebsocjdmetcvoqtqdv" },
  chrono: { supabaseRef: "bvazkrbjucxwfazodlhg" },
  promovault: { githubRepo: null },
};
const HK_GROUP: Record<string, (typeof s.HK_GROUPS)[number]> = {
  "Archive or merge": "archive",
  "Overlaps to decide": "overlap",
  "Docs coverage": "docs",
};

/** Link an infrastructure row to one project only when its label names exactly one project. */
export function matchProject(label: string, list: { id: string; name: string }[]): string | null {
  const l = label.replace(/\?$/, "").trim().toLowerCase();
  if (!l || l.includes(",")) return null;
  const exact = list.find((p) => p.name.toLowerCase() === l);
  if (exact) return exact.id;
  const prefix = list.filter((p) => l.length >= 4 && p.name.toLowerCase().startsWith(l));
  return prefix.length === 1 ? prefix[0].id : null;
}

export function githubRepoFor(p: { id: string; repo: string }): string | null {
  const link = RESOURCE_LINKS[p.id];
  if (link && "githubRepo" in link) return link.githubRepo ?? null;
  const name = p.repo.split(/\s/)[0];
  return name ? `${OWNER}/${name}` : null;
}

export async function seedIfEmpty(db: Db): Promise<boolean> {
  const [{ n }] = await db.select({ n: count() }).from(s.projects);
  if (n > 0) return false;
  await seed(db);
  return true;
}

export async function seed(db: Db) {
  const inv = inventory as unknown as {
    projects: InvProject[];
    infrastructure: { prov: string; items: [string, string, string][] }[];
    newIdeas: [string, string][];
    housekeeping: { t: string; items: [string, string][] }[];
    queue: string[];
  };
  const queuePos = new Map(inv.queue.map((id, i) => [id, i]));

  await db.transaction(async (tx) => {
    await tx.insert(s.projects).values(
      inv.projects.map((p) => ({
        id: p.id,
        name: p.name,
        repo: p.repo,
        githubRepo: githubRepoFor(p),
        category: p.cat,
        status: p.status,
        pct: p.pct,
        hoursLeft: p.hrs,
        value: p.value,
        summary: p.sum,
        needs: p.needs ?? null,
        risks: p.risks,
        urls: p.urls,
        hostTags: p.hostTags,
        arch: p.arch,
        docs: p.docs,
        docNote: p.docNote ?? null,
        vercelProject: RESOURCE_LINKS[p.id]?.vercelProject ?? null,
        supabaseRef: RESOURCE_LINKS[p.id]?.supabaseRef ?? null,
        lastPush: p.last,
        queuePosition: queuePos.get(p.id) ?? null,
      })),
    );

    const stepRows = inv.projects.flatMap((p) =>
      p.next.map(([title, hours], position) => ({ projectId: p.id, title, hours, position })),
    );
    if (stepRows.length) await tx.insert(s.steps).values(stepRows);

    const sessionRows = inv.projects.flatMap((p) => p.sessions.map((title) => ({ projectId: p.id, title })));
    if (sessionRows.length) await tx.insert(s.claudeSessions).values(sessionRows);

    const ideaRows = [
      ...inv.projects.flatMap((p) => p.ideas.map((title) => ({ projectId: p.id, title }))),
      ...inv.newIdeas.map(([title, detail]) => ({ projectId: null, title, detail })),
    ];
    if (ideaRows.length) await tx.insert(s.ideas).values(ideaRows);

    let pos = 0;
    const componentRows = inv.infrastructure.flatMap((g) =>
      g.items.map(([resource, projectLabel, note]) => {
        const projectId = matchProject(projectLabel, inv.projects);
        return { provider: g.prov, resource, projectLabel, projectId, note, position: pos++ };
      }),
    );
    if (componentRows.length) await tx.insert(s.components).values(componentRows);

    const hkRows = inv.housekeeping.flatMap((g) =>
      g.items.map(([title, detail]) => ({ group: HK_GROUP[g.t] ?? "archive", title, detail })),
    );
    if (hkRows.length) await tx.insert(s.housekeepingItems).values(hkRows);

    await tx
      .insert(s.settings)
      .values([
        { key: "hours_per_week", value: 12 },
        { key: "supabase_free_limit", value: 2 },
      ])
      .onConflictDoNothing();
  });
}
