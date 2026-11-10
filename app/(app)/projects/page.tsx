import { ProjectsTable, type Row } from "@/components/ProjectsTable";
import { daysSince, finishScore } from "@/lib/metrics";
import { load } from "@/lib/page";
import { listProjects } from "@/lib/queries";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const { db, today } = await load();
  const projects = await listProjects(db);
  const rows: Row[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    repo: p.repo,
    category: p.category,
    status: p.status,
    pct: p.pct,
    hoursLeft: p.hoursLeft,
    score: finishScore(p),
    hostTags: p.hostTags,
    lastPush: p.lastPush,
    days: daysSince(p.lastPush, today),
  }));
  return (
    <section>
      <div className="page-head">
        <div>
          <h1>All projects</h1>
          <p>{projects.length} projects. Select one to see where it lives, its architecture and next steps.</p>
        </div>
      </div>
      <ProjectsTable rows={rows} />
    </section>
  );
}
