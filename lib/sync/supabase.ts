import { type AdapterResult, type Fetch, getJson, type SyncTarget } from "./types";

type SbProject = { id?: string; ref?: string; name: string; region: string; status: string };

export async function syncSupabase(targets: SyncTarget[], token: string, fetchImpl: Fetch = fetch): Promise<AdapterResult> {
  const out: AdapterResult = { signals: [], errors: [], settings: {} };
  let list: SbProject[];
  try {
    list = await getJson<SbProject[]>(fetchImpl, "https://api.supabase.com/v1/projects", { Authorization: `Bearer ${token}` });
  } catch (e) {
    out.errors.push(`projects: ${(e as Error).message}`);
    return out;
  }
  const byRef = new Map(list.map((p) => [p.ref ?? p.id ?? "", p]));
  for (const t of targets) {
    if (!t.supabaseRef) continue;
    const p = byRef.get(t.supabaseRef);
    out.signals.push({
      projectId: t.id,
      source: "supabase",
      key: "project",
      value: p ? { status: p.status, region: p.region, name: p.name } : { status: "NOT_FOUND" },
    });
  }
  out.settings!.supabase_projects = list.map((p) => ({ name: p.name, status: p.status, region: p.region }));
  out.settings!.supabase_active_count = list.filter((p) => p.status.startsWith("ACTIVE")).length;
  return out;
}
