import Link from "next/link";
import { SyncButton } from "@/components/SyncButton";
import { Bar, SectionHead } from "@/components/ui";
import { fmtDate, finishScore, focusLanes, portfolioSummary } from "@/lib/metrics";
import { load } from "@/lib/page";
import { firstOpenSteps, getSetting, lastSyncRun, listAlerts, listProjects } from "@/lib/queries";

export default async function Overview() {
  const { db, today } = await load();
  const [projects, alerts, nextSteps, hpw, sync] = await Promise.all([
    listProjects(db),
    listAlerts(db),
    firstOpenSteps(db),
    getSetting(db, "hours_per_week", 12),
    lastSyncRun(db),
  ]);
  const k = portfolioSummary(projects, today, hpw);
  const lanes = focusLanes(projects);
  const tiles: [string | number, string, string][] = [
    [k.total, "Projects tracked", `${k.active} active · ${k.inactive} archive or idea`],
    [k.live, "Live on a real URL", `${k.preview} more on preview URLs`],
    [`${k.avgPct}%`, "Average completion", `across ${k.assessed} assessed projects`],
    [k.hours, "Hours to finish all", `about ${k.weeks} weeks at ${hpw} h/week`],
    [alerts.length, "Need your action", "blocked on you, not on code"],
    [k.stale, "No push in 30+ days", "candidates to pause or restart"],
  ];
  const laneDefs = [
    ["Quick wins", "≤15 h", lanes.quick],
    ["Launch pushes", "value 4–5", lanes.launch],
    ["Steady builds", ">15 h", lanes.steady],
  ] as const;

  return (
    <>
      <section>
        <div className="page-head">
          <div>
            <h1>Portfolio at a glance</h1>
            <p>
              {sync?.finishedAt
                ? `Last sync ${fmtDate(sync.finishedAt)} at ${sync.finishedAt.toISOString().slice(11, 16)} UTC${sync.ok ? "" : ", with errors"}`
                : "Not synced yet. Data comes from the audited inventory."}
            </p>
          </div>
          <SyncButton />
        </div>
        <div className="kpis">
          {tiles.map(([v, l, sub]) => (
            <div className="kpi" key={l}>
              <span className="v">{v}</span>
              <span className="l">{l}</span>
              <span className="s">{sub}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHead title="What to work on next" note="Finish score = value × completion ÷ hours left" />
        <div className="two">
          <div className="lanes">
            {laneDefs.map(([title, sub, list]) => (
              <div className="lane" key={title}>
                <h3>
                  <span>{title}</span>
                  <span>{sub}</span>
                </h3>
                {list.length === 0 ? <p className="muted" style={{ fontSize: 12.5 }}>Nothing here right now.</p> : null}
                {list.map((p) => (
                  <Link className="qcard" key={p.id} href={`/projects/${p.id}`}>
                    <span className="row">
                      <span className="nm">{p.name}</span>
                      <span className="mono num">{finishScore(p)}</span>
                    </span>
                    <Bar pct={p.pct ?? 0} />
                    <span className="nx">{nextSteps.get(p.id) ?? "No open steps"}</span>
                    <span className="row mono muted" style={{ fontSize: 11.5 }}>
                      <span>{p.pct}% done</span>
                      <span>{p.hoursLeft} h left</span>
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="panel inbox">
            <div className="cardhead">
              <h3>Needs you</h3>
              <span className="muted mono">{alerts.length} items</span>
            </div>
            {alerts.length === 0 ? <p className="empty">Nothing is waiting on you.</p> : null}
            <ul>
              {alerts.map((a, i) => (
                <li key={`${a.projectId}-${a.kind}-${i}`}>
                  <span className={`dot ${a.severity === "risk" ? "risk" : ""}`} />
                  <div>
                    <Link href={`/projects/${a.projectId}`} className="p tlink">
                      {a.projectName}
                    </Link>
                    <div className="t">{a.text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
