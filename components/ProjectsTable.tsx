"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Status } from "@/lib/db/schema";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/metrics";

export type Row = {
  id: string;
  name: string;
  repo: string;
  category: string;
  status: Status;
  pct: number | null;
  hoursLeft: number | null;
  score: number | null;
  hostTags: string[];
  lastPush: string | null;
  days: number | null;
};

const FILTERS = [
  ["all", "All"],
  ["live", "Live"],
  ["preview", "Preview"],
  ["building", "Building"],
  ["stalled", "Stalled"],
  ["saas", "SaaS"],
  ["game", "Games"],
  ["site", "Sites"],
  ["archive", "Archive and ideas"],
] as const;
type Filter = (typeof FILTERS)[number][0];
type SortKey = "name" | "status" | "pct" | "hoursLeft" | "score" | "lastPush";

function matches(p: Row, f: Filter, q: string) {
  if (q && !`${p.name} ${p.repo} ${p.hostTags.join(" ")} ${p.category}`.toLowerCase().includes(q)) return false;
  switch (f) {
    case "all":
      return true;
    case "live":
    case "preview":
    case "building":
    case "stalled":
      return p.status === f;
    case "archive":
      return p.status === "archive" || p.status === "idea" || p.status === "unknown";
    case "site":
      return /content|site|portfolio/i.test(p.category);
    case "saas":
      return p.category === "SaaS";
    case "game":
      return p.category === "Game";
  }
}

export function ProjectsTable({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "score", dir: -1 });

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((p) => matches(p, filter, needle))
      .sort((a, b) => {
        const x = sort.key === "status" ? STATUS_ORDER[a.status] : a[sort.key];
        const y = sort.key === "status" ? STATUS_ORDER[b.status] : b[sort.key];
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
      });
  }, [rows, filter, q, sort]);

  const head = (key: SortKey, label: string) => (
    <th aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
      <button
        onClick={() =>
          setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" || key === "status" || key === "hoursLeft" ? 1 : -1 }))
        }
      >
        {label}
        {sort.key === key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );

  return (
    <>
      <div className="filters">
        {FILTERS.map(([k, l]) => (
          <button key={k} className="fbtn" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
        <input
          id="project-search"
          className="search"
          type="search"
          placeholder="Search name, repo, host…"
          aria-label="Search projects"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginLeft: "auto" }}
        />
      </div>
      <div className="panel tscroll">
        <table>
          <thead>
            <tr>
              {head("name", "Project")}
              {head("status", "Status")}
              {head("pct", "Complete")}
              {head("hoursLeft", "Hours left")}
              {head("score", "Finish score")}
              <th>Hosting and data</th>
              {head("lastPush", "Last push")}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  No projects match. Clear the search or pick another filter.
                </td>
              </tr>
            ) : null}
            {shown.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/projects/${p.id}`} className="tlink">
                    <div className="pname">{p.name}</div>
                    <div className="prepo">{p.repo}</div>
                  </Link>
                </td>
                <td>
                  <span className={`pill s-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                </td>
                <td>
                  {p.pct == null ? (
                    <span className="muted">—</span>
                  ) : (
                    <div className="pct">
                      <span className="bar" style={{ width: 90 }}>
                        <i style={{ width: `${p.pct}%` }} />
                      </span>
                      <span className="n">{p.pct}%</span>
                    </div>
                  )}
                </td>
                <td className="num">{p.hoursLeft == null ? <span className="muted">—</span> : `${p.hoursLeft} h`}</td>
                <td className="num mono">{p.score == null ? <span className="muted">—</span> : p.score}</td>
                <td>
                  <div className="chips">
                    {p.hostTags.map((t) => (
                      <span key={t} className="chip">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="num">
                  {p.lastPush ? (
                    <>
                      <span className="mono" style={{ fontSize: 12 }}>{p.lastPush}</span>{" "}
                      <span className="muted" style={{ fontSize: 12 }}>{p.days}d</span>
                    </>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
