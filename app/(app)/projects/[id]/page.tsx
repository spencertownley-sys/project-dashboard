import Link from "next/link";
import { notFound } from "next/navigation";
import { addIdea, addSession, addStep, deleteIdea, deleteSession, toggleIdeaStar } from "@/app/actions";
import { EditProjectForm } from "@/components/EditProjectForm";
import { Signals } from "@/components/Signals";
import { StepList } from "@/components/StepList";
import { Bar, Pill } from "@/components/ui";
import { DOC_KEYS } from "@/lib/db/schema";
import { addWeeks, daysSince, finishScore, fmtDate } from "@/lib/metrics";
import { load } from "@/lib/page";
import { getProject, getSetting } from "@/lib/queries";

const ARCH_KEYS = ["Client", "Host", "Data", "Auth", "Services"] as const;

const DOC_LABEL: Record<(typeof DOC_KEYS)[number], string> = {
  prd: "PRD",
  tech: "Tech spec",
  api: "API design",
  ui: "UI/UX notes",
  launch: "Launch checklist",
  claude: "CLAUDE.md",
};

function href(u: string) {
  if (/\s|\(/.test(u)) return null;
  return u.startsWith("http") ? u : `https://${u}`;
}

export async function generateMetadata({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  return { title: id };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const { db, today } = await load();
  const data = await getProject(db, id);
  if (!data) notFound();
  const { project: p, steps, sessions, ideas, signals, components } = data;
  const hpw = await getSetting(db, "hours_per_week", 12);
  const eta = p.hoursLeft ? addWeeks(today, Math.ceil(p.hoursLeft / hpw)) : null;
  const score = finishScore(p);
  const days = daysSince(p.lastPush, today);

  return (
    <section>
      <Link href="/projects" className="back">← All projects</Link>
      <div className="panel detail">
        <div className="dhead">
          <div className="t">
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <h1>{p.name}</h1>
              <Pill status={p.status} />
              {p.category ? <span className="chip">{p.category}</span> : null}
            </div>
            <p className="muted">{p.summary}</p>
            {p.githubRepo ? (
              <a className="mono" href={`https://github.com/${p.githubRepo}`} target="_blank" rel="noopener noreferrer">
                github.com/{p.githubRepo}
              </a>
            ) : null}
          </div>
          <div className="meter">
            {p.pct == null ? (
              <span className="big muted">—</span>
            ) : (
              <>
                <span className="big">{p.pct}%</span>
                <Bar pct={p.pct} />
              </>
            )}
            <span className="muted" style={{ fontSize: 12.5 }}>
              {p.hoursLeft != null ? `${p.hoursLeft} h left` : "No estimate yet"}
              {eta ? ` · done around ${fmtDate(eta)} at ${hpw} h/week` : ""}
              {p.value ? ` · value ${p.value}/5` : ""}
              {score != null ? ` · score ${score}` : ""}
            </span>
          </div>
        </div>

        <div className="dgrid">
          <div>
            <span className="lbl">Where it lives</span>
            <dl className="kv">
              <dt>URLs</dt>
              <dd>
                {p.urls.length ? (
                  p.urls.map((u) => {
                    const h = href(u);
                    return (
                      <div key={u}>
                        {h ? (
                          <a href={h} target="_blank" rel="noopener noreferrer">{u}</a>
                        ) : (
                          u
                        )}
                      </div>
                    );
                  })
                ) : (
                  <span className="muted">None yet</span>
                )}
              </dd>
              <dt>Repo</dt>
              <dd className="mono">{p.repo || "—"}</dd>
              <dt>Last push</dt>
              <dd>{p.lastPush ? `${p.lastPush} (${days} days ago)` : "—"}</dd>
              <dt>Claude project</dt>
              <dd>
                {p.claudeProjectUrl ? (
                  <a href={p.claudeProjectUrl} target="_blank" rel="noopener noreferrer">Open in Claude</a>
                ) : (
                  <span className="muted">Not linked. Add it in Edit below.</span>
                )}
              </dd>
            </dl>
            <span className="lbl">Live signals</span>
            <Signals signals={signals} />
            <span className="lbl">Claude Code sessions</span>
            {sessions.length ? (
              <ul className="plain">
                {sessions.map((s) => (
                  <li key={s.id} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
                    ) : (
                      <span>{s.title}</span>
                    )}
                    <form action={deleteSession.bind(null, s.id)}>
                      <button className="btn ghost sm" aria-label={`Remove session ${s.title}`}>×</button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted" style={{ fontSize: 13 }}>No sessions linked.</p>
            )}
            <form action={addSession} className="inline-form">
              <input type="hidden" name="projectId" value={p.id} />
              <label className="field" htmlFor="session-title">
                Session title
                <input id="session-title" name="title" required />
              </label>
              <label className="field" htmlFor="session-url">
                Link (optional)
                <input id="session-url" name="url" type="url" placeholder="https://claude.ai/code/…" />
              </label>
              <button className="btn sm">Add</button>
            </form>
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <span className="lbl">Architecture</span>
            {p.arch ? (
              <div className="arch">
                {ARCH_KEYS.filter((k) => p.arch?.[k]).map((k) => [k, p.arch![k]] as const).map(([k, v]) => (
                  <div className="node" key={k}>
                    <b>{k}</b>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Not assessed.</p>
            )}
            {components.length ? (
              <>
                <span className="lbl">Infrastructure components</span>
                <div className="chips">
                  {components.map((c) => (
                    <span key={c.id} className="chip" title={c.note}>
                      {c.provider}: {c.resource}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
            <span className="lbl">Documents</span>
            {p.docs ? (
              <div className="docdots">
                {DOC_KEYS.map((k) => (
                  <span key={k} className={p.docs![k] ? "y" : ""}>{DOC_LABEL[k]}</span>
                ))}
              </div>
            ) : (
              <p className="muted">Not assessed.</p>
            )}
            {p.docNote ? <p className="muted" style={{ fontSize: 12 }}>{p.docNote}</p> : null}
          </div>

          <div>
            <span className="lbl">Next steps</span>
            <StepList steps={steps.map(({ id, title, hours, done }) => ({ id, title, hours, done }))} />
            <form action={addStep} className="inline-form">
              <input type="hidden" name="projectId" value={p.id} />
              <label className="field" htmlFor="step-title">
                New step
                <input id="step-title" name="title" required />
              </label>
              <label className="field narrow" htmlFor="step-hours">
                Hours
                <input id="step-hours" name="hours" type="number" min={0} step={0.5} defaultValue={1} />
              </label>
              <button className="btn sm">Add</button>
            </form>
          </div>

          <div>
            <span className="lbl">Ideas to build</span>
            {ideas.length ? (
              <ul className="plain">
                {ideas.map((i) => (
                  <li key={i.id} style={{ display: "flex", gap: 6, alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                      <form action={toggleIdeaStar.bind(null, i.id, !i.starred)}>
                        <button className="star" aria-pressed={i.starred} aria-label={i.starred ? `Unstar ${i.title}` : `Star ${i.title}`}>
                          {i.starred ? "★" : "☆"}
                        </button>
                      </form>
                      {i.title}
                    </span>
                    <form action={deleteIdea.bind(null, i.id)}>
                      <button className="btn ghost sm" aria-label={`Delete idea ${i.title}`}>×</button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted" style={{ fontSize: 13 }}>None yet.</p>
            )}
            <form action={addIdea} className="inline-form">
              <input type="hidden" name="projectId" value={p.id} />
              <label className="field" htmlFor="idea-title">
                New idea
                <input id="idea-title" name="title" required />
              </label>
              <button className="btn sm">Add</button>
            </form>
          </div>

          <div>
            <span className="lbl">Risks and blockers</span>
            {p.risks.length ? (
              <ul className="plain">
                {p.risks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="muted" style={{ fontSize: 13 }}>None noted.</p>
            )}
            {p.needs ? (
              <p style={{ fontSize: 13 }}>
                <span className="warn">Needs you:</span> {p.needs}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="cardhead">
          <h2>Edit project</h2>
          <span className="muted" style={{ fontSize: 12 }}>Your estimates drive the finish score and the planner</span>
        </div>
        <EditProjectForm p={p} />
      </div>
    </section>
  );
}
