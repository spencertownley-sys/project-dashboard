import { setHousekeepingDecision } from "@/app/actions";
import { load } from "@/lib/page";
import { listHousekeeping } from "@/lib/queries";

export const metadata = { title: "Housekeeping" };

const GROUPS = [
  ["archive", "Archive or merge"],
  ["overlap", "Overlaps to decide"],
  ["docs", "Docs coverage"],
] as const;

export default async function HousekeepingPage() {
  const { db } = await load();
  const items = await listHousekeeping(db);
  const pending = items.filter((i) => i.decision === "pending").length;
  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Housekeeping</h1>
          <p>
            Cleanup that makes the rest easier to manage. {pending} of {items.length} still need a decision. Approving here records your call; the change
            itself is done in a Claude session.
          </p>
        </div>
      </div>
      <div className="cols3">
        {GROUPS.map(([g, title]) => (
          <div className="panel" key={g}>
            <div className="cardhead">
              <h3>{title}</h3>
            </div>
            <ul className="list">
              {items
                .filter((i) => i.group === g)
                .map((i) => (
                  <li key={i.id} className={i.decision}>
                    <b style={{ fontWeight: 600 }}>{i.title}</b>
                    <span className="sub">{i.detail}</span>
                    <div className="decision">
                      {i.decision === "pending" ? (
                        <>
                          <form action={setHousekeepingDecision.bind(null, i.id, "approved")}>
                            <button className="btn sm">Approve</button>
                          </form>
                          <form action={setHousekeepingDecision.bind(null, i.id, "skipped")}>
                            <button className="btn sm ghost">Skip</button>
                          </form>
                        </>
                      ) : (
                        <>
                          <span className={`sig ${i.decision === "approved" ? "good" : ""}`}>{i.decision === "approved" ? "Approved" : "Skipped"}</span>
                          <form action={setHousekeepingDecision.bind(null, i.id, "pending")}>
                            <button className="btn sm ghost">Undo</button>
                          </form>
                        </>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
