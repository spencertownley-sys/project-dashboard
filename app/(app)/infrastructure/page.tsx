import Link from "next/link";
import { load } from "@/lib/page";
import { getSetting, listComponents } from "@/lib/queries";

export const metadata = { title: "Infrastructure" };

const SUB: Record<string, string> = {
  Cloudflare: "Workers, D1, R2, DNS, Pages",
  Railway: "Services and databases",
  Supabase: "Free plan",
  Vercel: "Team scope",
  "GitHub Pages and Actions": "Static hosting and cron",
  "Shared services": "Accounts used across projects",
  Domains: "Known from repos and DNS",
};

export default async function InfrastructurePage() {
  const { db } = await load();
  const [components, limit, synced] = await Promise.all([
    listComponents(db),
    getSetting(db, "supabase_free_limit", 2),
    getSetting<number | null>(db, "supabase_active_count", null),
  ]);
  const groups = new Map<string, typeof components>();
  for (const c of components) groups.set(c.provider, [...(groups.get(c.provider) ?? []), c]);
  const sbActive = synced ?? (groups.get("Supabase") ?? []).filter((c) => /^active/i.test(c.note)).length;

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Infrastructure and domains</h1>
          <p>Every Worker, database, service and domain, and the project that owns it.</p>
        </div>
      </div>
      <div className="infra">
        {[...groups].map(([prov, items]) => (
          <div className="panel prov" key={prov}>
            <header>
              <h3>{prov}</h3>
              {prov === "Supabase" ? (
                <span className="cap">
                  <span className="bar">
                    <i style={{ width: `${Math.min(100, (sbActive / Math.max(1, limit)) * 100)}%` }} />
                  </span>
                  <span className={sbActive >= limit ? "warn" : "muted"}>
                    {sbActive} of {limit} active
                  </span>
                </span>
              ) : (
                <span className="muted" style={{ fontSize: 12 }}>{SUB[prov] ?? `${items.length} items`}</span>
              )}
            </header>
            <ul>
              {items.map((c) => (
                <li key={c.id}>
                  <span className="r">{c.resource}</span>
                  <span className="pj">
                    {c.projectId ? (
                      <Link href={`/projects/${c.projectId}`} className="tlink">{c.projectLabel}</Link>
                    ) : (
                      c.projectLabel
                    )}
                  </span>
                  {c.note ? <span className="nt">{c.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
