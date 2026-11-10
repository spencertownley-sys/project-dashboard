"use client";

import { useState, useTransition } from "react";
import { addToQueue, removeFromQueue, saveQueue, setHoursPerWeek } from "@/app/actions";
import { fmtDate, planQueue } from "@/lib/metrics";

type Item = { id: string; name: string; hoursLeft: number | null };

export function Planner({ queued, unqueued, hoursPerWeek, todayIso }: { queued: Item[]; unqueued: Item[]; hoursPerWeek: number; todayIso: string }) {
  const today = new Date(todayIso);
  const [order, setOrder] = useState(queued);
  const [hpw, setHpw] = useState(hoursPerWeek);
  const [pending, start] = useTransition();
  const plan = planQueue(order, hpw, today);
  const weeks = Math.max(plan.weeks, 1);
  const step = weeks > 40 ? 8 : weeks > 20 ? 4 : 2;
  const ticks: number[] = [];
  for (let w = 0; w <= weeks; w += step) ticks.push(w);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    start(() => saveQueue(next.map((p) => p.id)));
  };
  const remove = (id: string) => {
    setOrder(order.filter((p) => p.id !== id));
    start(() => removeFromQueue([id]));
  };

  return (
    <div className="planner">
      <div className="panel">
        <div className="ctl">
          <label htmlFor="hpw">Hours per week</label>
          <input
            id="hpw"
            type="range"
            min={4}
            max={40}
            step={1}
            value={hpw}
            onChange={(e) => setHpw(+e.target.value)}
            onPointerUp={() => start(() => setHoursPerWeek(hpw))}
            onKeyUp={() => start(() => setHoursPerWeek(hpw))}
          />
          <span className="mono num">{hpw} h</span>
          <span className="muted" style={{ fontSize: 12, marginLeft: "auto" }}>
            {order.length ? `All done around ${fmtDate(plan.finish, true)}` : "Queue is empty"}
            {pending ? " · saving" : ""}
          </span>
        </div>
        <ol className="queue">
          {plan.rows.map(({ project: p, eta }, i) => (
            <li key={p.id}>
              <span className="ix">{String(i + 1).padStart(2, "0")}</span>
              <span>
                {p.name} <span className="muted mono" style={{ fontSize: 11.5 }}>{p.hoursLeft ?? 0} h</span>
              </span>
              <span className="eta">{fmtDate(eta)}</span>
              <span className="mv">
                <button onClick={() => move(i, -1)} aria-label={`Move ${p.name} up`}>▲</button>
                <button onClick={() => move(i, 1)} aria-label={`Move ${p.name} down`}>▼</button>
                <button onClick={() => remove(p.id)} aria-label={`Remove ${p.name} from the queue`}>×</button>
              </span>
            </li>
          ))}
        </ol>
        {unqueued.length ? (
          <form
            className="ctl"
            style={{ borderTop: "1px solid var(--line)", borderBottom: 0 }}
            action={(fd) => {
              const id = String(fd.get("project") ?? "");
              const item = unqueued.find((u) => u.id === id);
              if (!item) return;
              setOrder([...order, item]);
              start(() => addToQueue(id));
            }}
          >
            <label htmlFor="add-to-queue">Add to queue</label>
            <select id="add-to-queue" name="project" className="search" style={{ width: "auto", flex: 1 }}>
              {unqueued
                .filter((u) => !order.some((o) => o.id === u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.hoursLeft != null ? `(${u.hoursLeft} h)` : ""}
                  </option>
                ))}
            </select>
            <button className="btn sm">Add</button>
          </form>
        ) : null}
      </div>
      <div className="panel gantt">
        <div className="inner">
          <div className="ticks">
            {ticks.map((w) => (
              <span key={w} style={{ left: `${(w / weeks) * 100}%` }}>
                {fmtDate(new Date(today.getTime() + w * 7 * 86400000))}
              </span>
            ))}
          </div>
          {plan.rows.map(({ project: p, startHours, endHours }) => (
            <div className="grow" key={p.id}>
              <span className="nm">{p.name}</span>
              <div className="track">
                <i style={{ left: `${(startHours / hpw / weeks) * 100}%`, width: `${Math.max(((endHours - startHours) / hpw / weeks) * 100, 0.6)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
