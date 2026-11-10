"use client";

import { useOptimistic, useTransition } from "react";
import { deleteStep, toggleStep } from "@/app/actions";

type S = { id: number; title: string; hours: number; done: boolean };

export function StepList({ steps }: { steps: S[] }) {
  const [, start] = useTransition();
  const [list, setOptimistic] = useOptimistic(steps, (cur: S[], u: { id: number; done?: boolean; remove?: boolean }) =>
    u.remove ? cur.filter((s) => s.id !== u.id) : cur.map((s) => (s.id === u.id ? { ...s, done: !!u.done } : s)),
  );
  if (!list.length) return <p className="muted" style={{ fontSize: 13 }}>No steps yet. Add the next thing to do below.</p>;
  return (
    <ul className="steps">
      {list.map((s) => (
        <li key={s.id} className={s.done ? "done" : ""}>
          <input
            type="checkbox"
            id={`step-${s.id}`}
            checked={s.done}
            onChange={(e) => {
              const done = e.target.checked;
              start(async () => {
                setOptimistic({ id: s.id, done });
                await toggleStep(s.id, done);
              });
            }}
          />
          <label htmlFor={`step-${s.id}`}>{s.title}</label>
          <span className="h">{s.hours} h</span>
          <button
            className="btn ghost sm del"
            aria-label={`Delete step: ${s.title}`}
            onClick={() =>
              start(async () => {
                setOptimistic({ id: s.id, remove: true });
                await deleteStep(s.id);
              })
            }
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
