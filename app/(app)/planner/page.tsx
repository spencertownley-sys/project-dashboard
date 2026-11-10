import { Planner } from "@/components/Planner";
import { isActive } from "@/lib/metrics";
import { load } from "@/lib/page";
import { getSetting, listProjects } from "@/lib/queries";

export const metadata = { title: "Planner" };

export default async function PlannerPage() {
  const { db, today } = await load();
  const [projects, hpw] = await Promise.all([listProjects(db), getSetting(db, "hours_per_week", 12)]);
  const pick = ({ id, name, hoursLeft }: (typeof projects)[number]) => ({ id, name, hoursLeft });
  const queued = projects
    .filter((p) => p.queuePosition != null)
    .sort((a, b) => a.queuePosition! - b.queuePosition!)
    .map(pick);
  const unqueued = projects.filter((p) => p.queuePosition == null && isActive(p) && (p.hoursLeft ?? 0) > 0).map(pick);
  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Capacity planner</h1>
          <p>Work the queue top to bottom. Reorder it and set your weekly hours to see finish dates.</p>
        </div>
      </div>
      <Planner queued={queued} unqueued={unqueued} hoursPerWeek={hpw} todayIso={today.toISOString()} />
    </section>
  );
}
