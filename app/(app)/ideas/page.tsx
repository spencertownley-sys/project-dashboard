import Link from "next/link";
import { addIdea, deleteIdea, toggleIdeaStar } from "@/app/actions";
import type { Idea } from "@/lib/db/schema";
import { isActive } from "@/lib/metrics";
import { load } from "@/lib/page";
import { listIdeas, listProjects } from "@/lib/queries";

export const metadata = { title: "Ideas" };

function IdeaRow({ i }: { i: Idea }) {
  return (
    <li>
      <div className="idea-row">
        <form action={toggleIdeaStar.bind(null, i.id, !i.starred)}>
          <button className="star" aria-pressed={i.starred} aria-label={i.starred ? `Unstar ${i.title}` : `Star ${i.title}`}>
            {i.starred ? "★" : "☆"}
          </button>
        </form>
        <div style={{ display: "grid", gap: 2 }}>
          <b style={{ fontWeight: 600 }}>{i.title}</b>
          {i.detail ? <span className="sub">{i.detail}</span> : null}
        </div>
        <form action={deleteIdea.bind(null, i.id)}>
          <button className="btn ghost sm" aria-label={`Delete ${i.title}`}>×</button>
        </form>
      </div>
    </li>
  );
}

export default async function IdeasPage() {
  const { db } = await load();
  const [ideas, projects] = await Promise.all([listIdeas(db), listProjects(db)]);
  const byProject = new Map<string, Idea[]>();
  for (const i of ideas) if (i.projectId) byProject.set(i.projectId, [...(byProject.get(i.projectId) ?? []), i]);
  const withIdeas = projects.filter((p) => byProject.has(p.id) && isActive(p)).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const high = withIdeas.filter((p) => (p.value ?? 0) >= 4);
  const rest = withIdeas.filter((p) => (p.value ?? 0) < 4);
  const fresh = ideas.filter((i) => !i.projectId);

  const block = (title: string, sub: string, list: typeof projects) => (
    <div className="panel">
      <div className="cardhead">
        <h3>{title}</h3>
        <span className="muted" style={{ fontSize: 12 }}>{sub}</span>
      </div>
      {list.length === 0 ? <p className="empty">No ideas yet.</p> : null}
      <ul className="list">
        {list.map((p) => (
          <li key={p.id}>
            <Link href={`/projects/${p.id}`} className="tlink">
              <b style={{ fontWeight: 600 }}>{p.name}</b>
            </Link>
            <span className="sub">
              {byProject
                .get(p.id)!
                .map((i) => `${i.starred ? "★ " : ""}${i.title}`)
                .join(" · ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Ideas backlog</h1>
          <p>Feature ideas live on each project page. New project ideas live here until they get a repo.</p>
        </div>
      </div>
      <div className="cols3">
        {block("Feature ideas: high-value projects", "value 4–5", high)}
        {block("Feature ideas: other projects", "value 1–3", rest)}
        <div className="panel">
          <div className="cardhead">
            <h3>New project ideas</h3>
            <span className="muted" style={{ fontSize: 12 }}>parking lot</span>
          </div>
          <ul className="list">
            {fresh.map((i) => (
              <IdeaRow key={i.id} i={i} />
            ))}
          </ul>
          <form action={addIdea} className="inline-form pad" style={{ borderTop: "1px solid var(--line)" }}>
            <label className="field" htmlFor="new-idea-title">
              Idea
              <input id="new-idea-title" name="title" required />
            </label>
            <label className="field" htmlFor="new-idea-detail">
              One-line description
              <input id="new-idea-detail" name="detail" />
            </label>
            <button className="btn sm">Add idea</button>
          </form>
        </div>
      </div>
    </section>
  );
}
