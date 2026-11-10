import type { Signal } from "./db/schema";

export type Alert = { projectId: string; projectName: string; kind: "needs" | "ci" | "deploy" | "database" | "repo"; text: string; severity: "warn" | "risk" };

type GithubRepoSignal = { missing?: boolean; archived?: boolean; defaultBranch?: string };
type CiSignal = { conclusion?: "success" | "failure" | "pending" | "none"; branch?: string };
type DeploySignal = { state?: string };
type SupabaseSignal = { status?: string };

function get<T>(signals: Signal[], source: string, key: string): T | undefined {
  return signals.find((s) => s.source === source && s.key === key)?.value as T | undefined;
}

/** Everything waiting on the owner: hand-written "needs you" notes plus problems the sync found. */
export function buildAlerts(
  projects: { id: string; name: string; needs: string | null; status: string }[],
  signals: Signal[],
): Alert[] {
  const out: Alert[] = [];
  for (const p of projects) {
    const mine = signals.filter((s) => s.projectId === p.id);
    if (p.needs) out.push({ projectId: p.id, projectName: p.name, kind: "needs", text: p.needs, severity: p.status === "stalled" ? "risk" : "warn" });
    const ci = get<CiSignal>(mine, "github", "ci");
    if (ci?.conclusion === "failure")
      out.push({ projectId: p.id, projectName: p.name, kind: "ci", text: `CI is failing on ${ci.branch ?? "the default branch"}`, severity: "risk" });
    const repo = get<GithubRepoSignal>(mine, "github", "repo");
    if (repo?.missing) out.push({ projectId: p.id, projectName: p.name, kind: "repo", text: "GitHub repo not found or not readable with the sync token", severity: "warn" });
    const dep = get<DeploySignal>(mine, "vercel", "deployment");
    if (dep?.state === "ERROR") out.push({ projectId: p.id, projectName: p.name, kind: "deploy", text: "Latest Vercel production deploy failed", severity: "risk" });
    const sb = get<SupabaseSignal>(mine, "supabase", "project");
    if (sb?.status && /INACTIVE|PAUSED/.test(sb.status))
      out.push({ projectId: p.id, projectName: p.name, kind: "database", text: "Supabase project is paused", severity: "warn" });
  }
  return out;
}
