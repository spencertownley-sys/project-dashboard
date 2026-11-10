import { type AdapterResult, type Fetch, getJson, pool, type SyncTarget } from "./types";

type VProject = { id: string; name: string; framework: string | null };
type VDeployments = { deployments: { uid: string; url: string; state?: string; readyState?: string; created: number; target: string | null }[] };

export async function syncVercel(targets: SyncTarget[], token: string, teamId: string | undefined, fetchImpl: Fetch = fetch): Promise<AdapterResult> {
  const headers = { Authorization: `Bearer ${token}` };
  const team = teamId ? `teamId=${encodeURIComponent(teamId)}` : "";
  const out: AdapterResult = { signals: [], errors: [] };
  const withProject = targets.filter((t): t is SyncTarget & { vercelProject: string } => !!t.vercelProject);

  await pool(withProject, 3, async (t) => {
    try {
      const project = await getJson<VProject>(fetchImpl, `https://api.vercel.com/v9/projects/${encodeURIComponent(t.vercelProject)}${team ? `?${team}` : ""}`, headers);
      const q = new URLSearchParams({ projectId: project.id, target: "production", limit: "1" });
      if (teamId) q.set("teamId", teamId);
      const { deployments } = await getJson<VDeployments>(fetchImpl, `https://api.vercel.com/v6/deployments?${q}`, headers);
      const d = deployments[0];
      out.signals.push({
        projectId: t.id,
        source: "vercel",
        key: "deployment",
        value: d
          ? { state: d.state ?? d.readyState ?? "UNKNOWN", url: d.url, createdAt: new Date(d.created).toISOString(), framework: project.framework }
          : { state: "NONE", framework: project.framework },
      });
    } catch (e) {
      out.errors.push(`${t.vercelProject}: ${(e as Error).message}`);
    }
  });
  return out;
}
