import type { Signal } from "@/lib/db/schema";

type V = Record<string, unknown>;

export function Signals({ signals }: { signals: Signal[] }) {
  const get = (src: string, key: string) => signals.find((s) => s.source === src && s.key === key)?.value as V | number | undefined;
  const repo = get("github", "repo") as V | undefined;
  const prs = get("github", "open_prs") as number | undefined;
  const ci = get("github", "ci") as V | undefined;
  const dep = get("vercel", "deployment") as V | undefined;
  const sb = get("supabase", "project") as V | undefined;
  const items: [string, string][] = [];
  if (repo?.missing) items.push(["bad", "GitHub repo not found"]);
  if (repo?.archived) items.push(["warn", "Repo archived"]);
  if (typeof prs === "number") items.push([prs ? "warn" : "", `${prs} open PR${prs === 1 ? "" : "s"}`]);
  if (ci?.conclusion) {
    const c = String(ci.conclusion);
    items.push([c === "success" ? "good" : c === "failure" ? "bad" : c === "pending" ? "warn" : "", c === "none" ? "No CI runs" : `CI ${c}`]);
  }
  if (dep?.state) {
    const st = String(dep.state);
    items.push([st === "READY" ? "good" : st === "ERROR" ? "bad" : "warn", `Vercel ${st.toLowerCase()}`]);
  }
  if (sb?.status) {
    const st = String(sb.status);
    items.push([st.startsWith("ACTIVE") ? "good" : "warn", `Supabase ${st.toLowerCase().replace(/_/g, " ")}`]);
  }
  if (!items.length) return <p className="muted" style={{ fontSize: 12.5 }}>No live signals yet. Run a sync after adding tokens.</p>;
  const observed = signals.reduce<Date | null>((a, s) => (!a || s.observedAt > a ? s.observedAt : a), null);
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div className="signal-row">
        {items.map(([cls, text]) => (
          <span key={text} className={`sig ${cls}`}>{text}</span>
        ))}
      </div>
      {observed ? <span className="muted" style={{ fontSize: 11.5 }}>Observed {observed.toISOString().slice(0, 16).replace("T", " ")} UTC</span> : null}
    </div>
  );
}
